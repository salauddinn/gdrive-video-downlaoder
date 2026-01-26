// ============================================================================
// GOOGLE DRIVE DOWNLOADER - BACKGROUND SERVICE WORKER
// ============================================================================

// 1. UTILITIES
// ============================================================================

// Helper to check if user enabled debug logging in the popup
async function shouldLog() {
  try {
    const result = await chrome.storage.local.get(['debugMode']);
    return result.debugMode === true;
  } catch (error) {
    return false;
  }
}

// Wrapper for console.log that respects the debug setting
async function logDebug(message, data = null) {
  if (await shouldLog()) {
    if (data) {
      console.log(`[GDrive SW] ${message}`, data);
    } else {
      console.log(`[GDrive SW] ${message}`);
    }
  }
}

function cleanURL(url) {
  if (!url) return null;
  // Remove range parameter to ensure we download the full file
  const rangeIndex = url.indexOf('&range=');
  if (rangeIndex !== -1) {
    return url.substring(0, rangeIndex);
  }
  return url;
}

// Helper to get data safely from storage (prevents data loss when SW sleeps)
const getStoredStreams = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['capturedStreams'], (result) => {
      resolve(result.capturedStreams || {
        video: null,
        audio: null,
        videoOriginal: null,
        audioOriginal: null,
        filename: 'gdrive-video',
        timestamp: null
      });
    });
  });
};

// ============================================================================
// 2. NETWORK LISTENER (Captures Video/Audio URLs)
// ============================================================================

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    // logDebug("URL details ${details}",url);
    // Filter: Must be a video playback URL
    // We check for "videoplayback" string, which is common across all Google video servers
    if (!url.includes('videoplayback')) return;

    // Detect Type
    const hasMimeVideo = url.includes('mime=video');
    const hasMimeAudio = url.includes('mime=audio');
    
    // Fallback: If no mime type in URL, treat as video if it's a playback URL
    const isGenericVideo = !hasMimeVideo && !hasMimeAudio;

    if (hasMimeVideo || hasMimeAudio || isGenericVideo) {
      
      // Log detection attempt
      logDebug('🔎 Network traffic detected:', url.substring(0, 100) + '...');

      getStoredStreams().then((currentData) => {
        const timestamp = Date.now();
        let updated = false;

        // --- CAPTURE VIDEO ---
        if ((hasMimeVideo || isGenericVideo) && currentData.videoOriginal !== url) {
          logDebug('🎥 NEW VIDEO STREAM FOUND!');
          currentData.videoOriginal = url;
          currentData.video = cleanURL(url);
          currentData.timestamp = timestamp;
          updated = true;
        } 
        
        // --- CAPTURE AUDIO ---
        if (hasMimeAudio && currentData.audioOriginal !== url) {
          logDebug('🎵 NEW AUDIO STREAM FOUND!');
          currentData.audioOriginal = url;
          currentData.audio = cleanURL(url);
          currentData.timestamp = timestamp;
          updated = true;
        }

        // --- SAVE IF NEW DATA FOUND ---
        if (updated) {
          chrome.storage.local.set({ capturedStreams: currentData }, () => {
             logDebug('✅ Data saved to storage.');
             // Flash badge to indicate success
             chrome.action.setBadgeText({ text: "ON" });
             chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
          });
        }
      });
    }
  },
  { urls: ["<all_urls>"] } // "All URLs" permission ensures we catch drive.google.com links
);

// ============================================================================
// 3. MESSAGE LISTENER (Handles Popup Actions)
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // --- ACTION: Update Filename ---
  if (request.action === 'updateFilename') {
    logDebug('📝 Filename update request:', request.filename);
    
    getStoredStreams().then((currentData) => {
      currentData.filename = request.filename;
      chrome.storage.local.set({ capturedStreams: currentData }, () => {
        sendResponse({ success: true });
      });
    });
    return true; 
  }

  // --- ACTION: Get Streams (UI Refresh) ---
  else if (request.action === 'getStreams') {
    getStoredStreams().then((streams) => {
      sendResponse({ streams: streams });
    });
    return true;
  }

  // --- ACTION: Download Video ---
  else if (request.action === 'downloadVideo') {
    logDebug('⬇️ Received request to download VIDEO');
    getStoredStreams().then((streams) => {
      if (streams && streams.video) {
        const finalFilename = `${streams.filename}_video.mp4`;
        
        chrome.downloads.download({
          url: streams.video,
          filename: finalFilename,
          saveAs: false
        }, (id) => {
           if (chrome.runtime.lastError) {
             console.error('[GDrive SW] Download Error:', chrome.runtime.lastError);
             sendResponse({ success: false, error: chrome.runtime.lastError.message });
           } else {
             logDebug('✅ Video download started. ID:', id);
             sendResponse({ success: true, downloadId: id });
           }
        });
      } else {
        logDebug('❌ Download failed: No video URL in storage');
        sendResponse({ success: false, error: 'No video captured. Play the video first.' });
      }
    });
    return true;
  } 
  
  // --- ACTION: Download Audio ---
  else if (request.action === 'downloadAudio') {
    logDebug('⬇️ Received request to download AUDIO');
    getStoredStreams().then((streams) => {
      if (streams && streams.audio) {
        const finalFilename = `${streams.filename}_audio.mp4`;
        
        chrome.downloads.download({
          url: streams.audio,
          filename: finalFilename,
          saveAs: false
        }, (id) => {
           if (chrome.runtime.lastError) {
             console.error('[GDrive SW] Download Error:', chrome.runtime.lastError);
             sendResponse({ success: false, error: chrome.runtime.lastError.message });
           } else {
             logDebug('✅ Audio download started. ID:', id);
             sendResponse({ success: true, downloadId: id });
           }
        });
      } else {
        logDebug('❌ Download failed: No audio URL in storage');
        sendResponse({ success: false, error: 'No audio captured.' });
      }
    });
    return true;
  }

  // --- ACTION: Clear Data ---
  else if (request.action === 'clearStreams') {
    logDebug('🧹 Clearing streams...');
    chrome.action.setBadgeText({ text: "" });
    const empty = {
        video: null, audio: null, videoOriginal: null, audioOriginal: null, 
        filename: 'gdrive-video', timestamp: null
    };
    chrome.storage.local.set({ capturedStreams: empty }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  // --- ACTION: Ping (Updated for Popup Compatibility) ---
  else if (request.action === 'ping') {
    getStoredStreams().then((streams) => {
        sendResponse({
            success: true,
            serviceWorkerAlive: true,
            monitoring: {
                active: true,
                totalRequests: "Auto", // We don't track raw count in storage
                videosCaptured: streams.video ? 1 : 0,
                audiosCaptured: streams.audio ? 1 : 0
            }
        });
    });
    return true;
  }

  // --- ACTION: Diagnostics (Updated for Popup Compatibility) ---
  else if (request.action === 'getDiagnostics') {
     getStoredStreams().then((streams) => {
        sendResponse({
            success: true,
            diagnostics: {
                serviceWorkerStartTime: Date.now(), // Mocked as we are stateless
                lastActivity: streams.timestamp || Date.now(),
                totalRequestsMonitored: "N/A",
                videoRequestsCaptured: streams.video ? 1 : 0,
                audioRequestsCaptured: streams.audio ? 1 : 0,
                webRequestListenerActive: true,
                lastError: null,
                uptime: 0
            }
        });
     });
     return true;
  }

  return true;
});

console.log('[GDrive SW] Service Worker Initialized');