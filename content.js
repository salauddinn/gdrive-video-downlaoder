shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] Script initializing...');
  }
});

function extractFilename() {
  let filename = 'gdrive-video';

  const titleElement = document.querySelector('[data-item-title]');
  if (titleElement) {
    filename = titleElement.textContent.trim();
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] Found filename from data-item-title:', filename);
      }
    });
  } else {
    const h1Element = document.querySelector('h1');
    if (h1Element) {
      filename = h1Element.textContent.trim();
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Content] Found filename from h1:', filename);
        }
      });
    } else {
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Content] No title element found, using default filename');
        }
      });
    }
  }

  filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  filename = filename.substring(0, 100);

  return filename;
}

async function shouldLog() {
  try {
    const result = await chrome.storage.local.get(['debugMode']);
    return result.debugMode === true;
  } catch (error) {
    return false;
  }
}

function checkForVideo() {
  let detectionMethod = null;
  let videoElement = null;

  const ariaLabelPlayer = document.querySelector('[aria-label="Video Player"]');
  if (ariaLabelPlayer) {
    detectionMethod = 'aria-label="Video Player"';
    videoElement = ariaLabelPlayer.querySelector('video') || ariaLabelPlayer;
  }

  if (!detectionMethod) {
    const youtubeIframe = document.querySelector('iframe[src*="youtube.googleapis.com/embed"]');
    if (youtubeIframe) {
      detectionMethod = 'YouTube embed iframe';
      videoElement = youtubeIframe;
    }
  }

  if (!detectionMethod) {
    const playerContainer = document.querySelector('.fP5mL, [id^="ucc-"], .a-b-ma');
    if (playerContainer) {
      detectionMethod = 'player container div';
      videoElement = playerContainer.querySelector('video') || playerContainer;
    }
  }

  if (!detectionMethod) {
    videoElement = document.querySelector('video');
    if (videoElement) {
      detectionMethod = 'video element';
    }
  }

  if (videoElement && detectionMethod) {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] ✅ Video player detected via:', detectionMethod);
        if (videoElement.tagName === 'VIDEO') {
          console.log('[GDrive Content] Video element:', {
            src: videoElement.src,
            currentSrc: videoElement.currentSrc,
            readyState: videoElement.readyState,
            networkState: videoElement.networkState,
            paused: videoElement.paused
          });
        }
      }
    });

    const filename = extractFilename();

    chrome.runtime.sendMessage({
      action: 'updateFilename',
      filename: filename
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[GDrive Content] ❌ Failed to send filename:', chrome.runtime.lastError.message);
      } else if (response && response.success) {
        shouldLog().then(debugMode => {
          if (debugMode) {
            console.log('[GDrive Content] ✅ Filename updated to:', filename);
          }
        });
      }
    });

    addDownloadIndicator();

    if (videoElement.tagName === 'VIDEO') {
      shouldLog().then(debugMode => {
        if (debugMode) {
          if (videoElement.paused) {
            console.log('[GDrive Content] ⚠️ Video is paused. PLAY THE VIDEO to capture streams!');
          } else {
            console.log('[GDrive Content] Video is playing - streams should be captured soon');
          }
        }
      });
    }
  } else {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] No video player found on page');
      }
    });
  }
}

function addDownloadIndicator() {
  if (document.getElementById('gdrive-downloader-indicator')) {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] Indicator already exists, skipping');
      }
    });
    return;
  }

  shouldLog().then(debugMode => {
    if (debugMode) {
      console.log('[GDrive Content] Adding download indicator to page');
    }
  });

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

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] Setting up MutationObserver for dynamic content');
  }
});

let lastCheckTime = 0;
const CHECK_THROTTLE = 500;

const observer = new MutationObserver((mutations) => {
  const now = Date.now();
  if (now - lastCheckTime >= CHECK_THROTTLE) {
    lastCheckTime = now;
    checkForVideo();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] Scheduling initial video checks');
  }
});

setTimeout(() => {
  shouldLog().then(debugMode => {
    if (debugMode) {
      console.log('[GDrive Content] Running first video check (2s delay)');
    }
  });
  checkForVideo();
}, 2000);

setTimeout(() => {
  shouldLog().then(debugMode => {
    if (debugMode) {
      console.log('[GDrive Content] Running second video check (5s delay)');
    }
  });
  checkForVideo();
}, 5000);

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] ✅ Content script fully loaded and initialized!');
    console.log('[GDrive Content] Waiting for video element to appear...');
    console.log('[GDrive Content] IMPORTANT: You must PLAY the video for streams to be captured!');
  }
});
