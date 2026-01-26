let capturedStreams = {
  video: null,
  audio: null,
  videoOriginal: null,
  audioOriginal: null,
  filename: 'gdrive-video',
  timestamp: null
};

function cleanURL(url) {
  if (!url) return null;

  const rangeIndex = url.indexOf('&range=');
  if (rangeIndex !== -1) {
    return url.substring(0, rangeIndex);
  }

  return url;
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;

    if (url.includes('videoplayback') && url.includes('googlevideo.com')) {
      if (url.includes('mime=video')) {
        capturedStreams.videoOriginal = url;
        capturedStreams.video = cleanURL(url);
        capturedStreams.timestamp = Date.now();
        console.log('Video stream captured (cleaned):', capturedStreams.video.substring(0, 100) + '...');

        chrome.storage.local.set({ capturedStreams });

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Video Stream Detected',
          message: 'Video stream URL captured and cleaned. Open extension to download.'
        });
      } else if (url.includes('mime=audio')) {
        capturedStreams.audioOriginal = url;
        capturedStreams.audio = cleanURL(url);
        capturedStreams.timestamp = Date.now();
        console.log('Audio stream captured (cleaned):', capturedStreams.audio.substring(0, 100) + '...');

        chrome.storage.local.set({ capturedStreams });

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Audio Stream Detected',
          message: 'Audio stream URL captured and cleaned. Open extension to download.'
        });
      }
    }
  },
  { urls: ["https://*.googlevideo.com/*"] }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateFilename') {
    capturedStreams.filename = request.filename;
    chrome.storage.local.set({ capturedStreams });
    sendResponse({ success: true });
  } else if (request.action === 'getStreams') {
    sendResponse({ streams: capturedStreams });
  } else if (request.action === 'downloadVideo') {
    if (capturedStreams.video) {
      const filename = `${capturedStreams.filename}_video.mp4`;
      chrome.downloads.download({
        url: capturedStreams.video,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
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
      sendResponse({ success: false, error: 'No video stream captured' });
    }
  } else if (request.action === 'downloadAudio') {
    if (capturedStreams.audio) {
      const filename = `${capturedStreams.filename}_audio.mp4`;
      chrome.downloads.download({
        url: capturedStreams.audio,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
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
      sendResponse({ success: false, error: 'No audio stream captured' });
    }
  } else if (request.action === 'clearStreams') {
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
      chrome.tabs.create({ url: capturedStreams.video }, () => {
        sendResponse({ success: true });
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'No video stream captured' });
    }
  } else if (request.action === 'openAudioTab') {
    if (capturedStreams.audio) {
      chrome.tabs.create({ url: capturedStreams.audio }, () => {
        sendResponse({ success: true });
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'No audio stream captured' });
    }
  }

  return true;
});

chrome.storage.local.get(['capturedStreams'], (result) => {
  if (result.capturedStreams) {
    capturedStreams = result.capturedStreams;
  }
});
