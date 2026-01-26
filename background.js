async function shouldLog() {
  try {
    const result = await chrome.storage.local.get(['debugMode']);
    return result.debugMode === true;
  } catch (error) {
    return false;
  }
}

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

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Downloader] Installing webRequest listener for *.googlevideo.com');
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    diagnostics.totalRequestsMonitored++;
    diagnostics.lastActivity = Date.now();

    const url = details.url;
    const isVideoplayback = url.includes('videoplayback');
    const hasGooglevideo = url.includes('googlevideo.com');
    const hasMimeVideo = url.includes('mime=video');
    const hasMimeAudio = url.includes('mime=audio');

    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Downloader] 🔍 Network request #' + diagnostics.totalRequestsMonitored + ':', {
          method: details.method,
          type: details.type,
          initiator: details.initiator,
          urlPreview: url.substring(0, 150) + '...',
          checks: {
            hasVideoplayback: isVideoplayback,
            hasGooglevideo: hasGooglevideo,
            hasMimeVideo: hasMimeVideo,
            hasMimeAudio: hasMimeAudio
          }
        });
      }
    });

    if (isVideoplayback && hasGooglevideo) {
      if (hasMimeVideo) {
        diagnostics.videoRequestsCaptured++;
        capturedStreams.videoOriginal = url;
        capturedStreams.video = cleanURL(url);
        capturedStreams.timestamp = Date.now();
        console.log('[GDrive Downloader] ✅ VIDEO STREAM CAPTURED! (#' + diagnostics.videoRequestsCaptured + ')');
        shouldLog().then(debugMode => {
          if (debugMode) {
            console.log('[GDrive Downloader] Video URL (cleaned):', capturedStreams.video.substring(0, 100) + '...');
            console.log('[GDrive Downloader] Full original URL:', url);
            console.log('[GDrive Downloader] Total video streams captured:', diagnostics.videoRequestsCaptured);
          }
        });

        chrome.storage.local.set({ capturedStreams });

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Video Stream Detected',
          message: 'Video stream URL captured and cleaned. Open extension to download.'
        });
      } else if (hasMimeAudio) {
        diagnostics.audioRequestsCaptured++;
        capturedStreams.audioOriginal = url;
        capturedStreams.audio = cleanURL(url);
        capturedStreams.timestamp = Date.now();
        console.log('[GDrive Downloader] ✅ AUDIO STREAM CAPTURED! (#' + diagnostics.audioRequestsCaptured + ')');
        shouldLog().then(debugMode => {
          if (debugMode) {
            console.log('[GDrive Downloader] Audio URL (cleaned):', capturedStreams.audio.substring(0, 100) + '...');
            console.log('[GDrive Downloader] Full original URL:', url);
            console.log('[GDrive Downloader] Total audio streams captured:', diagnostics.audioRequestsCaptured);
          }
        });

        chrome.storage.local.set({ capturedStreams });

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Audio Stream Detected',
          message: 'Audio stream URL captured and cleaned. Open extension to download.'
        });
      } else {
        shouldLog().then(debugMode => {
          if (debugMode) {
            console.log('[GDrive Downloader] ⚠️ googlevideo.com + videoplayback detected but NO mime type match');
            console.log('[GDrive Downloader] URL analysis:', {
              hasMimeVideo: hasMimeVideo,
              hasMimeAudio: hasMimeAudio,
              hasMimeParameter: url.includes('mime='),
              urlFragment: url.substring(0, 300) + '...'
            });

            const mimeMatch = url.match(/mime=([^&]+)/);
            if (mimeMatch) {
              console.log('[GDrive Downloader] Found mime type:', decodeURIComponent(mimeMatch[1]));
            }
          }
        });
      }
    } else {
      shouldLog().then(debugMode => {
        if (debugMode && diagnostics.totalRequestsMonitored % 50 === 0) {
          console.log('[GDrive Downloader] 📊 Monitoring status: ' + diagnostics.totalRequestsMonitored + ' requests checked, ' + diagnostics.videoRequestsCaptured + ' videos, ' + diagnostics.audioRequestsCaptured + ' audios');
        }
      });
    }
  },
  { urls: ["https://*.googlevideo.com/*"] }
);

console.log('[GDrive Downloader] ✅ webRequest listener installed successfully');
console.log('[GDrive Downloader] 📡 Monitoring all requests to: https://*.googlevideo.com/*');
console.log('[GDrive Downloader] 🔍 Looking for URLs with: videoplayback + mime=video OR mime=audio');
console.log('[GDrive Downloader] 💡 To test: Open a Google Drive video and PLAY it');

chrome.permissions.getAll((permissions) => {
  const hasWebRequest = permissions.permissions.includes('webRequest');
  const hasGooglevideoPermission = permissions.origins.some(origin =>
    origin.includes('googlevideo.com') || origin === '<all_urls>'
  );

  if (!hasWebRequest) {
    console.error('[GDrive Downloader] ❌❌❌ CRITICAL: webRequest permission NOT GRANTED!');
    diagnostics.lastError = 'webRequest permission missing';
    diagnostics.webRequestListenerActive = false;
  } else if (!hasGooglevideoPermission) {
    console.error('[GDrive Downloader] ❌❌❌ CRITICAL: googlevideo.com host permission NOT GRANTED!');
    diagnostics.lastError = 'googlevideo.com permission missing';
    diagnostics.webRequestListenerActive = false;
  } else {
    console.log('[GDrive Downloader] ✅ All required permissions granted');
    console.log('[GDrive Downloader] ✅ Permissions:', {
      webRequest: hasWebRequest,
      googlevideoHost: hasGooglevideoPermission,
      allPermissions: permissions.permissions,
      origins: permissions.origins
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  shouldLog().then(debugMode => {
    if (debugMode) {
      console.log('[GDrive Downloader] Message received:', request.action);
    }
  });

  if (request.action === 'ping') {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Downloader] Ping received - service worker is alive!');
        console.log('[GDrive Downloader] Monitoring status:', {
          requestsMonitored: diagnostics.totalRequestsMonitored,
          videosCaptured: diagnostics.videoRequestsCaptured,
          audiosCaptured: diagnostics.audioRequestsCaptured,
          listenerActive: diagnostics.webRequestListenerActive
        });
      }
    });
    sendResponse({
      success: true,
      timestamp: Date.now(),
      serviceWorkerAlive: true,
      monitoring: {
        active: diagnostics.webRequestListenerActive,
        totalRequests: diagnostics.totalRequestsMonitored,
        videosCaptured: diagnostics.videoRequestsCaptured,
        audiosCaptured: diagnostics.audioRequestsCaptured
      }
    });
  } else if (request.action === 'getDiagnostics') {
    const uptime = Date.now() - diagnostics.serviceWorkerStartTime;
    const timeSinceLastActivity = Date.now() - diagnostics.lastActivity;

    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Downloader] Sending diagnostics:', {
          uptime: Math.floor(uptime / 1000) + 's',
          totalRequestsMonitored: diagnostics.totalRequestsMonitored,
          videosCaptured: diagnostics.videoRequestsCaptured,
          audiosCaptured: diagnostics.audioRequestsCaptured
        });
      }
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
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Downloader] Filename updated to:', request.filename);
      }
    });
    sendResponse({ success: true });
  } else if (request.action === 'getStreams') {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Downloader] Sending streams:', {
          hasVideo: !!capturedStreams.video,
          hasAudio: !!capturedStreams.audio,
          filename: capturedStreams.filename
        });
      }
    });
    sendResponse({ streams: capturedStreams });
  } else if (request.action === 'downloadVideo') {
    if (capturedStreams.video) {
      const filename = `${capturedStreams.filename}_video.mp4`;
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Downloader] Initiating video download:', filename);
        }
      });

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
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Downloader] Initiating audio download:', filename);
        }
      });

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
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Downloader] Clearing all streams');
      }
    });
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
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Downloader] Opening video in new tab');
        }
      });
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
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Downloader] Opening audio in new tab');
        }
      });
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
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Downloader] Restored streams from storage:', {
          hasVideo: !!capturedStreams.video,
          hasAudio: !!capturedStreams.audio,
          filename: capturedStreams.filename
        });
      }
    });
  } else {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Downloader] No streams found in storage');
      }
    });
  }
});

setInterval(() => {
  shouldLog().then(debugMode => {
    if (debugMode) {
      console.log('[GDrive Downloader] Service worker keep-alive ping');
    }
  });
}, 20000);

console.log('[GDrive Downloader] 🚀 Extension fully initialized and ready!');
