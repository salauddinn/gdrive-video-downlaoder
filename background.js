console.log('[GDrive Downloader] Service worker started at', new Date().toLocaleTimeString());

let capturedStreams = {
  video: null,
  audio: null,
  videoOriginal: null,
  audioOriginal: null,
  filename: 'gdrive-video',
  timestamp: null
};

let diagnostics = {
  serviceWorkerStartTime: Date.now(),
  lastActivity: Date.now(),
  totalRequestsMonitored: 0,
  videoRequestsCaptured: 0,
  audioRequestsCaptured: 0,
  webRequestListenerActive: true,
  lastError: null
};

function cleanURL(url) {
  if (!url) return null;

  const rangeIndex = url.indexOf('&range=');
  if (rangeIndex !== -1) {
    return url.substring(0, rangeIndex);
  }

  return url;
}

console.log('[GDrive Downloader] Installing webRequest listener for *.googlevideo.com');

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    diagnostics.totalRequestsMonitored++;
    diagnostics.lastActivity = Date.now();

    const url = details.url;
    console.log('[GDrive Downloader] Request intercepted:', {
      method: details.method,
      type: details.type,
      urlPreview: url.substring(0, 150) + '...',
      hasVideoplayback: url.includes('videoplayback'),
      hasGooglevideo: url.includes('googlevideo.com')
    });

    if (url.includes('videoplayback') && url.includes('googlevideo.com')) {
      if (url.includes('mime=video')) {
        diagnostics.videoRequestsCaptured++;
        capturedStreams.videoOriginal = url;
        capturedStreams.video = cleanURL(url);
        capturedStreams.timestamp = Date.now();
        console.log('[GDrive Downloader] ✅ VIDEO STREAM CAPTURED!');
        console.log('[GDrive Downloader] Video URL (cleaned):', capturedStreams.video.substring(0, 100) + '...');
        console.log('[GDrive Downloader] Total video streams captured:', diagnostics.videoRequestsCaptured);

        chrome.storage.local.set({ capturedStreams });

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Video Stream Detected',
          message: 'Video stream URL captured and cleaned. Open extension to download.'
        });
      } else if (url.includes('mime=audio')) {
        diagnostics.audioRequestsCaptured++;
        capturedStreams.audioOriginal = url;
        capturedStreams.audio = cleanURL(url);
        capturedStreams.timestamp = Date.now();
        console.log('[GDrive Downloader] ✅ AUDIO STREAM CAPTURED!');
        console.log('[GDrive Downloader] Audio URL (cleaned):', capturedStreams.audio.substring(0, 100) + '...');
        console.log('[GDrive Downloader] Total audio streams captured:', diagnostics.audioRequestsCaptured);

        chrome.storage.local.set({ capturedStreams });

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Audio Stream Detected',
          message: 'Audio stream URL captured and cleaned. Open extension to download.'
        });
      } else {
        console.log('[GDrive Downloader] ⚠️ googlevideo.com request detected but no mime type match');
        console.log('[GDrive Downloader] URL contains:', {
          hasMimeVideo: url.includes('mime=video'),
          hasMimeAudio: url.includes('mime=audio'),
          urlFragment: url.substring(0, 200)
        });
      }
    }
  },
  { urls: ["https://*.googlevideo.com/*"] }
);

console.log('[GDrive Downloader] ✅ webRequest listener installed successfully');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[GDrive Downloader] Message received:', request.action);

  if (request.action === 'ping') {
    console.log('[GDrive Downloader] Ping received - service worker is alive!');
    sendResponse({
      success: true,
      timestamp: Date.now(),
      serviceWorkerAlive: true
    });
  } else if (request.action === 'getDiagnostics') {
    const uptime = Date.now() - diagnostics.serviceWorkerStartTime;
    const timeSinceLastActivity = Date.now() - diagnostics.lastActivity;

    console.log('[GDrive Downloader] Sending diagnostics:', {
      uptime: Math.floor(uptime / 1000) + 's',
      totalRequestsMonitored: diagnostics.totalRequestsMonitored,
      videosCaptured: diagnostics.videoRequestsCaptured,
      audiosCaptured: diagnostics.audioRequestsCaptured
    });

    sendResponse({
      success: true,
      diagnostics: {
        ...diagnostics,
        uptime,
        timeSinceLastActivity
      }
    });
  } else if (request.action === 'updateFilename') {
    capturedStreams.filename = request.filename;
    chrome.storage.local.set({ capturedStreams });
    console.log('[GDrive Downloader] Filename updated to:', request.filename);
    sendResponse({ success: true });
  } else if (request.action === 'getStreams') {
    console.log('[GDrive Downloader] Sending streams:', {
      hasVideo: !!capturedStreams.video,
      hasAudio: !!capturedStreams.audio,
      filename: capturedStreams.filename
    });
    sendResponse({ streams: capturedStreams });
  } else if (request.action === 'downloadVideo') {
    if (capturedStreams.video) {
      const filename = `${capturedStreams.filename}_video.mp4`;
      console.log('[GDrive Downloader] Initiating video download:', filename);

      chrome.downloads.download({
        url: capturedStreams.video,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          console.error('[GDrive Downloader] ❌ Video download failed:', error);
          diagnostics.lastError = `Video download: ${error}`;
          sendResponse({ success: false, error });
        } else {
          console.log('[GDrive Downloader] ✅ Video download started, ID:', downloadId);
          sendResponse({ success: true, downloadId: downloadId });
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Video Download Started',
            message: `Downloading ${filename}`
          });
        }
      });
      return true;
    } else {
      console.warn('[GDrive Downloader] ⚠️ Download attempted but no video stream captured');
      sendResponse({ success: false, error: 'No video stream captured' });
    }
  } else if (request.action === 'downloadAudio') {
    if (capturedStreams.audio) {
      const filename = `${capturedStreams.filename}_audio.mp4`;
      console.log('[GDrive Downloader] Initiating audio download:', filename);

      chrome.downloads.download({
        url: capturedStreams.audio,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          console.error('[GDrive Downloader] ❌ Audio download failed:', error);
          diagnostics.lastError = `Audio download: ${error}`;
          sendResponse({ success: false, error });
        } else {
          console.log('[GDrive Downloader] ✅ Audio download started, ID:', downloadId);
          sendResponse({ success: true, downloadId: downloadId });
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Audio Download Started',
            message: `Downloading ${filename}`
          });
        }
      });
      return true;
    } else {
      console.warn('[GDrive Downloader] ⚠️ Download attempted but no audio stream captured');
      sendResponse({ success: false, error: 'No audio stream captured' });
    }
  } else if (request.action === 'clearStreams') {
    console.log('[GDrive Downloader] Clearing all streams');
    capturedStreams = {
      video: null,
      audio: null,
      videoOriginal: null,
      audioOriginal: null,
      filename: 'gdrive-video',
      timestamp: null
    };
    chrome.storage.local.set({ capturedStreams });
    sendResponse({ success: true });
  } else if (request.action === 'openVideoTab') {
    if (capturedStreams.video) {
      console.log('[GDrive Downloader] Opening video in new tab');
      chrome.tabs.create({ url: capturedStreams.video }, () => {
        sendResponse({ success: true });
      });
      return true;
    } else {
      console.warn('[GDrive Downloader] ⚠️ No video stream to open');
      sendResponse({ success: false, error: 'No video stream captured' });
    }
  } else if (request.action === 'openAudioTab') {
    if (capturedStreams.audio) {
      console.log('[GDrive Downloader] Opening audio in new tab');
      chrome.tabs.create({ url: capturedStreams.audio }, () => {
        sendResponse({ success: true });
      });
      return true;
    } else {
      console.warn('[GDrive Downloader] ⚠️ No audio stream to open');
      sendResponse({ success: false, error: 'No audio stream captured' });
    }
  }

  return true;
});

chrome.storage.local.get(['capturedStreams'], (result) => {
  if (result.capturedStreams) {
    capturedStreams = result.capturedStreams;
    console.log('[GDrive Downloader] Restored streams from storage:', {
      hasVideo: !!capturedStreams.video,
      hasAudio: !!capturedStreams.audio,
      filename: capturedStreams.filename
    });
  } else {
    console.log('[GDrive Downloader] No streams found in storage');
  }
});

setInterval(() => {
  console.log('[GDrive Downloader] Service worker keep-alive ping');
}, 20000);

console.log('[GDrive Downloader] 🚀 Extension fully initialized and ready!');
