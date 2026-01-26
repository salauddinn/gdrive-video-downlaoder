console.log('[GDrive Content] Script initializing...');

function extractFilename() {
  let filename = 'gdrive-video';

  const titleElement = document.querySelector('[data-item-title]');
  if (titleElement) {
    filename = titleElement.textContent.trim();
    console.log('[GDrive Content] Found filename from data-item-title:', filename);
  } else {
    const h1Element = document.querySelector('h1');
    if (h1Element) {
      filename = h1Element.textContent.trim();
      console.log('[GDrive Content] Found filename from h1:', filename);
    } else {
      console.log('[GDrive Content] No title element found, using default filename');
    }
  }

  filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  filename = filename.substring(0, 100);

  return filename;
}

function checkForVideo() {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    console.log('[GDrive Content] ✅ Video element detected on page!');
    console.log('[GDrive Content] Video element:', {
      src: videoElement.src,
      currentSrc: videoElement.currentSrc,
      readyState: videoElement.readyState,
      networkState: videoElement.networkState,
      paused: videoElement.paused
    });

    const filename = extractFilename();

    chrome.runtime.sendMessage({
      action: 'updateFilename',
      filename: filename
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[GDrive Content] ❌ Failed to send filename:', chrome.runtime.lastError.message);
      } else if (response && response.success) {
        console.log('[GDrive Content] ✅ Filename updated to:', filename);
      }
    });

    addDownloadIndicator();

    if (videoElement.paused) {
      console.log('[GDrive Content] ⚠️ Video is paused. PLAY THE VIDEO to capture streams!');
    } else {
      console.log('[GDrive Content] Video is playing - streams should be captured soon');
    }
  } else {
    console.log('[GDrive Content] No video element found on page');
  }
}

function addDownloadIndicator() {
  if (document.getElementById('gdrive-downloader-indicator')) {
    console.log('[GDrive Content] Indicator already exists, skipping');
    return;
  }

  console.log('[GDrive Content] Adding download indicator to page');

  const indicator = document.createElement('div');
  indicator.id = 'gdrive-downloader-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  indicator.textContent = 'Stream detected - Open extension to download';

  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.style.transition = 'opacity 0.5s';
    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 500);
  }, 5000);
}

console.log('[GDrive Content] Setting up MutationObserver for dynamic content');

const observer = new MutationObserver((mutations) => {
  checkForVideo();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('[GDrive Content] Scheduling initial video checks');

setTimeout(() => {
  console.log('[GDrive Content] Running first video check (2s delay)');
  checkForVideo();
}, 2000);

setTimeout(() => {
  console.log('[GDrive Content] Running second video check (5s delay)');
  checkForVideo();
}, 5000);

console.log('[GDrive Content] ✅ Content script fully loaded and initialized!');
console.log('[GDrive Content] Waiting for video element to appear...');
console.log('[GDrive Content] IMPORTANT: You must PLAY the video for streams to be captured!');
