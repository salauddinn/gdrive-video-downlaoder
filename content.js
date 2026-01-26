function extractFilename() {
  let filename = 'gdrive-video';

  const titleElement = document.querySelector('[data-item-title]');
  if (titleElement) {
    filename = titleElement.textContent.trim();
  } else {
    const h1Element = document.querySelector('h1');
    if (h1Element) {
      filename = h1Element.textContent.trim();
    }
  }

  filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  filename = filename.substring(0, 100);

  return filename;
}

function checkForVideo() {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    const filename = extractFilename();

    chrome.runtime.sendMessage({
      action: 'updateFilename',
      filename: filename
    }, (response) => {
      if (response && response.success) {
        console.log('Google Drive Downloader: Filename updated to', filename);
      }
    });

    addDownloadIndicator();
  }
}

function addDownloadIndicator() {
  if (document.getElementById('gdrive-downloader-indicator')) {
    return;
  }

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

const observer = new MutationObserver((mutations) => {
  checkForVideo();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

setTimeout(() => {
  checkForVideo();
}, 2000);

setTimeout(() => {
  checkForVideo();
}, 5000);

console.log('Google Drive Downloader: Content script loaded');
