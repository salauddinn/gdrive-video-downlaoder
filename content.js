// State tracking
let videoPlayerOpen = false;
let detectionEnabled = true;

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
  let method = 'default';

  try {
    // Method 1: Extract from hidden JSON element (most reliable)
    const jsonElement = document.querySelector('#drive-active-item-info');
    if (jsonElement) {
      try {
        const data = JSON.parse(jsonElement.textContent);
        if (data && data.title) {
          filename = data.title;
          method = 'hidden JSON element (#drive-active-item-info)';
          shouldLog().then(debugMode => {
            if (debugMode) {
              console.log('[GDrive Content] ✅ Found filename from', method + ':', filename);
            }
          });
          return cleanFilename(filename);
        }
      } catch (e) {
        // JSON parse failed, continue to next method
      }
    }

    // Method 2: Search for aria-label starting with "Displaying"
    const displayingElement = document.querySelector('[aria-label^="Displaying"]');
    if (displayingElement) {
      const ariaLabel = displayingElement.getAttribute('aria-label');
      if (ariaLabel) {
        const match = ariaLabel.match(/Displaying\s+(.+?)(?:\s+online|\.|$)/);
        if (match && match[1]) {
          filename = match[1];
          method = 'aria-label (Displaying...)';
          shouldLog().then(debugMode => {
            if (debugMode) {
              console.log('[GDrive Content] ✅ Found filename from', method + ':', filename);
            }
          });
          return cleanFilename(filename);
        }
      }
    }

    // Method 3: Search within toolbar for title
    const toolbar = document.querySelector('[role="toolbar"]');
    if (toolbar) {
      // Try to find the title container within toolbar
      const titleContainers = toolbar.querySelectorAll('[class*="K-Jc"] [class*="K-T"], [class*="title"]');
      for (const container of titleContainers) {
        const text = container.textContent?.trim();
        if (text && text.length > 5 && !text.includes('Close') && !text.includes('Open')) {
          filename = text;
          method = 'toolbar title container';
          shouldLog().then(debugMode => {
            if (debugMode) {
              console.log('[GDrive Content] ✅ Found filename from', method + ':', filename);
            }
          });
          return cleanFilename(filename);
        }
      }
    }

    // Method 4: Look for any aria-label containing video extension
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv'];
    for (const ext of videoExtensions) {
      const elements = document.querySelectorAll(`[aria-label*="${ext}"]`);
      for (const element of elements) {
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.includes(ext)) {
          filename = ariaLabel;
          method = `aria-label containing ${ext}`;
          shouldLog().then(debugMode => {
            if (debugMode) {
              console.log('[GDrive Content] ✅ Found filename from', method + ':', filename);
            }
          });
          return cleanFilename(filename);
        }
      }
    }

    // Method 5: Try data-tooltip with video extensions
    for (const ext of videoExtensions) {
      const elements = document.querySelectorAll(`[data-tooltip*="${ext}"]`);
      for (const element of elements) {
        const tooltip = element.getAttribute('data-tooltip');
        if (tooltip && tooltip.includes(ext)) {
          filename = tooltip;
          method = `data-tooltip containing ${ext}`;
          shouldLog().then(debugMode => {
            if (debugMode) {
              console.log('[GDrive Content] ✅ Found filename from', method + ':', filename);
            }
          });
          return cleanFilename(filename);
        }
      }
    }

    // Method 6: Legacy fallbacks
    const titleElement = document.querySelector('[data-item-title]');
    if (titleElement && titleElement.textContent?.trim()) {
      filename = titleElement.textContent.trim();
      method = 'data-item-title attribute';
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Content] ✅ Found filename from', method + ':', filename);
        }
      });
      return cleanFilename(filename);
    }

    const h1Element = document.querySelector('h1');
    if (h1Element && h1Element.textContent?.trim()) {
      filename = h1Element.textContent.trim();
      method = 'h1 element';
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Content] ✅ Found filename from', method + ':', filename);
        }
      });
      return cleanFilename(filename);
    }

    // No filename found, use default
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] ⚠️ No filename found, using default:', filename);
      }
    });

  } catch (error) {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.error('[GDrive Content] ❌ Error in extractFilename:', error);
      }
    });
  }

  return cleanFilename(filename);
}

function cleanFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'gdrive-video';
  }

  // Remove file extension if present (we'll add our own)
  filename = filename.replace(/\.(mp4|mkv|avi|mov|webm|flv)$/i, '');

  // Replace special characters with underscores
  filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  // Remove consecutive underscores
  filename = filename.replace(/_+/g, '_');

  // Remove leading/trailing underscores
  filename = filename.replace(/^_+|_+$/g, '');

  // Limit length
  filename = filename.substring(0, 100);

  // Ensure we have something
  if (!filename || filename.length === 0) {
    return 'gdrive-video';
  }

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

function notifyVideoPlayerOpened() {
  try {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] 📹 Notifying service worker that video player opened');
      }
    });

    chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[GDrive Content] ❌ Service worker not responding:', chrome.runtime.lastError.message);
      } else if (response && response.success) {
        shouldLog().then(debugMode => {
          if (debugMode) {
            console.log('[GDrive Content] ✅ Service worker is alive and monitoring network requests');
            console.log('[GDrive Content] 🎬 PLAY THE VIDEO now to capture video/audio streams');
          }
        });
      }
    });

    const filename = extractFilename();
    if (filename && typeof filename === 'string' && filename.length > 0) {
      try {
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
      } catch (e) {
        shouldLog().then(debugMode => {
          if (debugMode) {
            console.error('[GDrive Content] ❌ Error sending filename:', e);
          }
        });
      }
    }
  } catch (error) {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.error('[GDrive Content] ❌ Error in notifyVideoPlayerOpened:', error);
      }
    });
  }
}


function checkVideoPlayerState() {
  try {
    const viewer = document.querySelector('div[role="dialog"][aria-label="Showing viewer."]');
    const videoPlayer = document.querySelector('section[aria-label="Video Player"]');

    const isPlayerOpen = viewer && videoPlayer && viewer.getAttribute('aria-hidden') !== "true";

    if (isPlayerOpen !== videoPlayerOpen) {
      videoPlayerOpen = isPlayerOpen;

      if (isPlayerOpen) {
        shouldLog().then(debugMode => {
          if (debugMode) {
            console.log('[GDrive Content] 📹 Video player opened');
            console.log('[GDrive Content] Viewer dialog found:', !!viewer);
            console.log('[GDrive Content] Video player section found:', !!videoPlayer);
            console.log('[GDrive Content] Viewer aria-hidden:', viewer?.getAttribute('aria-hidden'));
          }
        });

        if (detectionEnabled) {
          setTimeout(() => {
            try {
              notifyVideoPlayerOpened();
            } catch (e) {
              shouldLog().then(debugMode => {
                if (debugMode) {
                  console.error('[GDrive Content] ❌ Error in notification:', e);
                }
              });
            }
          }, 1000);
        }
      } else {
        shouldLog().then(debugMode => {
          if (debugMode) {
            console.log('[GDrive Content] ❌ Video player closed');
          }
        });
      }
    }
  } catch (error) {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.error('[GDrive Content] ❌ Error in checkVideoPlayerState:', error);
      }
    });
  }
}

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] Setting up MutationObserver for video player state');
  }
});

// Observer specifically watches for video player toolbar changes
const observer = new MutationObserver(() => {
  try {
    checkVideoPlayerState();
  } catch (error) {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.error('[GDrive Content] ❌ Error in MutationObserver callback:', error);
      }
    });
  }
});

// Wait for document.body to be available before observing
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
} else {
  // If body doesn't exist yet, wait for DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.log('[GDrive Content] MutationObserver started after DOMContentLoaded');
        }
      });
    }
  });
}

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] Scheduling initial state check');
  }
});

// Initial checks
setTimeout(() => {
  try {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] Running initial player state check (2s delay)');
      }
    });
    checkVideoPlayerState();
  } catch (error) {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.error('[GDrive Content] ❌ Error in initial check (2s):', error);
      }
    });
  }
}, 2000);

setTimeout(() => {
  try {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] Running secondary player state check (5s delay)');
      }
    });
    checkVideoPlayerState();
  } catch (error) {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.error('[GDrive Content] ❌ Error in secondary check (5s):', error);
      }
    });
  }
}, 5000);

shouldLog().then(debugMode => {
  if (debugMode) {
    console.log('[GDrive Content] ✅ Content script fully loaded and initialized!');
    console.log('[GDrive Content] Watching for video player open/close events...');
    console.log('[GDrive Content] IMPORTANT: You must PLAY the video for streams to be captured!');
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'manualDetect') {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] Manual detection triggered from popup');
      }
    });
    try {
      notifyVideoPlayerOpened();
      sendResponse({ success: true });
    } catch (e) {
      shouldLog().then(debugMode => {
        if (debugMode) {
          console.error('[GDrive Content] ❌ Error in manual detection:', e);
        }
      });
      sendResponse({ success: false, error: e.message });
    }
    return true;
  } else if (request.action === 'autoDetectionChanged') {
    detectionEnabled = request.autoDetection;
    chrome.storage.local.set({ autoDetection: detectionEnabled });
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[GDrive Content] Auto-detection changed to:', detectionEnabled ? 'enabled' : 'disabled');
      }
    });
    sendResponse({ success: true });
    return true;
  }
});
