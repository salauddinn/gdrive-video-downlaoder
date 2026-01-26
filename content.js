// State tracking
let videoPlayerOpen = false;
let detectionEnabled = true;
let manualButton = null;

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] Script initializing...');
  }
});

// Load automatic detection preference
chrome.storage.local.get(['autoDetection'], (result) => {
  detectionEnabled = result.autoDetection !== false; // default to true
  shouldLog().then(debugMode => {
    if (debugMode) {
      console.log('[GDrive Content] Auto-detection:', detectionEnabled ? 'enabled' : 'disabled');
    }
  });
});

function extractFilename() {
  let filename = 'gdrive-video';

  // Try the toolbar title element first (from the provided HTML structure)
  const toolbarTitle = document.querySelector('.a-b-K-T.a-b-cg-Zf');
  if (toolbarTitle) {
    filename = toolbarTitle.textContent.trim();
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] Found filename from toolbar (.a-b-K-T.a-b-cg-Zf):', filename);
      }
    });
  } else {
    // Fallback to alternative toolbar title
    const toolbarTitleAlt = document.querySelector('.a-b-K-T.a-b-K-T-Ef');
    if (toolbarTitleAlt) {
      filename = toolbarTitleAlt.textContent.trim();
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Content] Found filename from toolbar alt (.a-b-K-T-Ef):', filename);
        }
      });
    } else {
      // Original fallbacks
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

function addManualDetectionButton() {
  // Remove existing button if present
  if (manualButton && manualButton.parentNode) {
    manualButton.parentNode.removeChild(manualButton);
  }

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'gdrive-manual-detection';
  buttonContainer.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  // Manual detection button
  const detectButton = document.createElement('button');
  detectButton.textContent = '🔍 Detect Video';
  detectButton.style.cssText = `
    background: #1a73e8;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 4px;
    font-family: 'Google Sans', Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    transition: background 0.2s, box-shadow 0.2s;
  `;

  detectButton.onmouseover = () => {
    detectButton.style.background = '#1557b0';
    detectButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.4)';
  };

  detectButton.onmouseout = () => {
    detectButton.style.background = '#1a73e8';
    detectButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
  };

  detectButton.onclick = () => {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] Manual detection triggered');
      }
    });
    checkForVideo();

    // Visual feedback
    detectButton.textContent = '✅ Detected!';
    setTimeout(() => {
      detectButton.textContent = '🔍 Detect Video';
    }, 1500);
  };

  // Auto-detection toggle button
  const autoToggle = document.createElement('button');
  autoToggle.textContent = detectionEnabled ? '🔄 Auto: ON' : '⏸️ Auto: OFF';
  autoToggle.style.cssText = `
    background: ${detectionEnabled ? '#34a853' : '#5f6368'};
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: 'Google Sans', Arial, sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    transition: background 0.2s;
  `;

  autoToggle.onclick = () => {
    detectionEnabled = !detectionEnabled;
    chrome.storage.local.set({ autoDetection: detectionEnabled }, () => {
      autoToggle.textContent = detectionEnabled ? '🔄 Auto: ON' : '⏸️ Auto: OFF';
      autoToggle.style.background = detectionEnabled ? '#34a853' : '#5f6368';

      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Content] Auto-detection:', detectionEnabled ? 'enabled' : 'disabled');
        }
      });
    });
  };

  buttonContainer.appendChild(detectButton);
  buttonContainer.appendChild(autoToggle);
  document.body.appendChild(buttonContainer);

  manualButton = buttonContainer;
}

function checkVideoPlayerState() {
  // Check if video player toolbar is present
  const toolbar = document.querySelector('.a-b-K[role="toolbar"]');
  const isPlayerOpen = toolbar !== null;

  // Player state changed
  if (isPlayerOpen !== videoPlayerOpen) {
    videoPlayerOpen = isPlayerOpen;

    if (isPlayerOpen) {
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Content] 📹 Video player opened');
        }
      });

      // Add manual button when player opens
      addManualDetectionButton();

      // Run detection if auto-detection is enabled
      if (detectionEnabled) {
        setTimeout(() => checkForVideo(), 1000);
      }
    } else {
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Content] ❌ Video player closed');
        }
      });

      // Remove manual button when player closes
      if (manualButton && manualButton.parentNode) {
        manualButton.parentNode.removeChild(manualButton);
        manualButton = null;
      }
    }
  }
}

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] Setting up MutationObserver for video player state');
  }
});

// Observer specifically watches for video player toolbar changes
const observer = new MutationObserver(() => {
  checkVideoPlayerState();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] Scheduling initial state check');
  }
});

// Initial checks
setTimeout(() => {
  shouldLog().then(debugMode => {
    if (debugMode) {
      console.log('[GDrive Content] Running initial player state check (2s delay)');
    }
  });
  checkVideoPlayerState();
}, 2000);

setTimeout(() => {
  shouldLog().then(debugMode => {
    if (debugMode) {
      console.log('[GDrive Content] Running secondary player state check (5s delay)');
    }
  });
  checkVideoPlayerState();
}, 5000);

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] ✅ Content script fully loaded and initialized!');
    console.log('[GDrive Content] Watching for video player open/close events...');
    console.log('[GDrive Content] IMPORTANT: You must PLAY the video for streams to be captured!');
  }
});
