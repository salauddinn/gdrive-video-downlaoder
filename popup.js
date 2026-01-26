async function shouldLog() {
  try {
    const result = await chrome.storage.local.get(['debugMode']);
    return result.debugMode === true;
  } catch (error) {
    return false;
  }
}

const elements = {
  filename: document.getElementById('filename'),
  timestamp: document.getElementById('timestamp'),
  monitoringIcon: document.getElementById('monitoring-icon'),
  monitoringText: document.getElementById('monitoring-text'),
  monitoringRequests: document.getElementById('monitoring-requests'),
  monitoringVideos: document.getElementById('monitoring-videos'),
  monitoringAudios: document.getElementById('monitoring-audios'),
  videoIcon: document.getElementById('video-icon'),
  audioIcon: document.getElementById('audio-icon'),
  downloadVideo: document.getElementById('download-video'),
  downloadAudio: document.getElementById('download-audio'),
  copyVideo: document.getElementById('copy-video'),
  copyAudio: document.getElementById('copy-audio'),
  openVideo: document.getElementById('open-video'),
  openAudio: document.getElementById('open-audio'),
  refresh: document.getElementById('refresh'),
  clear: document.getElementById('clear'),
  message: document.getElementById('message'),
  urlPreviewSection: document.getElementById('url-preview-section'),
  toggleUrls: document.getElementById('toggle-urls'),
  urlPreviewContent: document.getElementById('url-preview-content'),
  videoUrlItem: document.getElementById('video-url-item'),
  audioUrlItem: document.getElementById('audio-url-item'),
  videoUrlText: document.getElementById('video-url-text'),
  audioUrlText: document.getElementById('audio-url-text'),
  videoUrlStatus: document.getElementById('video-url-status'),
  audioUrlStatus: document.getElementById('audio-url-status'),
  toggleDebug: document.getElementById('toggle-debug'),
  debugContent: document.getElementById('debug-content'),
  debugSwStatus: document.getElementById('debug-sw-status'),
  debugUptime: document.getElementById('debug-uptime'),
  debugRequests: document.getElementById('debug-requests'),
  debugVideos: document.getElementById('debug-videos'),
  debugAudios: document.getElementById('debug-audios'),
  debugActivity: document.getElementById('debug-activity'),
  debugError: document.getElementById('debug-error'),
  debugErrorItem: document.getElementById('debug-error-item'),
  testConnection: document.getElementById('test-connection'),
  debugModeToggle: document.getElementById('debug-mode-toggle'),
  debugModeStatus: document.getElementById('debug-mode-status'),
  autoDetectionToggle: document.getElementById('auto-detection-toggle'),
  manualDetect: document.getElementById('manual-detect')
};

function showMessage(text, type = 'info') {
  elements.message.textContent = text;
  elements.message.className = `message message-${type}`;
  elements.message.style.display = 'block';

  setTimeout(() => {
    elements.message.style.display = 'none';
  }, 5000);
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '-';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    return 'Just now';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleString();
  }
}

function updateUI(streams) {
  if (!streams) {
    streams = {
      video: null,
      audio: null,
      videoOriginal: null,
      audioOriginal: null,
      filename: 'gdrive-video',
      timestamp: null
    };
  }

  elements.filename.textContent = streams.filename || '-';
  elements.timestamp.textContent = formatTimestamp(streams.timestamp);

  if (streams.video) {
    elements.videoIcon.textContent = '🟢';
    elements.downloadVideo.disabled = false;
    elements.copyVideo.disabled = false;
    elements.openVideo.disabled = false;
  } else {
    elements.videoIcon.textContent = '⚪';
    elements.downloadVideo.disabled = true;
    elements.copyVideo.disabled = true;
    elements.openVideo.disabled = true;
  }

  if (streams.audio) {
    elements.audioIcon.textContent = '🟢';
    elements.downloadAudio.disabled = false;
    elements.copyAudio.disabled = false;
    elements.openAudio.disabled = false;
  } else {
    elements.audioIcon.textContent = '⚪';
    elements.downloadAudio.disabled = true;
    elements.copyAudio.disabled = true;
    elements.openAudio.disabled = true;
  }

  if (streams.video || streams.audio) {
    elements.urlPreviewSection.style.display = 'block';
    updateURLPreview(streams);
  } else {
    elements.urlPreviewSection.style.display = 'none';
  }
}

function updateURLPreview(streams) {
  if (streams.video) {
    elements.videoUrlItem.style.display = 'block';
    const preview = streams.video.substring(0, 100) + '...';
    elements.videoUrlText.textContent = preview;

    if (streams.videoOriginal && streams.videoOriginal !== streams.video) {
      elements.videoUrlStatus.textContent = '✓ Cleaned (removed &range=)';
      elements.videoUrlStatus.className = 'url-status-cleaned';
    } else {
      elements.videoUrlStatus.textContent = 'Original URL';
      elements.videoUrlStatus.className = 'url-status-original';
    }
  } else {
    elements.videoUrlItem.style.display = 'none';
  }

  if (streams.audio) {
    elements.audioUrlItem.style.display = 'block';
    const preview = streams.audio.substring(0, 100) + '...';
    elements.audioUrlText.textContent = preview;

    if (streams.audioOriginal && streams.audioOriginal !== streams.audio) {
      elements.audioUrlStatus.textContent = '✓ Cleaned (removed &range=)';
      elements.audioUrlStatus.className = 'url-status-cleaned';
    } else {
      elements.audioUrlStatus.textContent = 'Original URL';
      elements.audioUrlStatus.className = 'url-status-original';
    }
  } else {
    elements.audioUrlItem.style.display = 'none';
  }
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function updateMonitoringStatus() {
  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    if (response && response.success && response.monitoring) {
      const mon = response.monitoring;

      elements.monitoringRequests.textContent = mon.totalRequests;
      elements.monitoringVideos.textContent = mon.videosCaptured;
      elements.monitoringAudios.textContent = mon.audiosCaptured;

      if (mon.active) {
        elements.monitoringIcon.textContent = '🔍';
        elements.monitoringText.textContent = 'Network Monitoring Active';
      } else {
        elements.monitoringIcon.textContent = '⚠️';
        elements.monitoringText.textContent = 'Network Monitoring Inactive!';
      }
    } else {
      elements.monitoringIcon.textContent = '❌';
      elements.monitoringText.textContent = 'Service Worker Not Responding';
      elements.monitoringRequests.textContent = '-';
      elements.monitoringVideos.textContent = '-';
      elements.monitoringAudios.textContent = '-';
    }
  });
}

function updateDebugInfo() {
  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    if (response && response.success) {
      elements.debugSwStatus.textContent = 'Active';
      elements.debugSwStatus.className = 'debug-value active';
    } else {
      elements.debugSwStatus.textContent = 'Inactive';
      elements.debugSwStatus.className = 'debug-value inactive';
    }
  });

  chrome.runtime.sendMessage({ action: 'getDiagnostics' }, (response) => {
    if (response && response.success && response.diagnostics) {
      const diag = response.diagnostics;

      elements.debugUptime.textContent = formatUptime(diag.uptime);
      elements.debugRequests.textContent = diag.totalRequestsMonitored;
      elements.debugVideos.textContent = diag.videoRequestsCaptured;
      elements.debugAudios.textContent = diag.audioRequestsCaptured;
      elements.debugActivity.textContent = formatTimestamp(diag.lastActivity);

      if (diag.lastError) {
        elements.debugError.textContent = diag.lastError;
        elements.debugErrorItem.style.display = 'flex';
      } else {
        elements.debugErrorItem.style.display = 'none';
      }
    }
  });
}

function refreshStatus() {
  chrome.runtime.sendMessage({ action: 'getStreams' }, (response) => {
    if (response && response.streams) {
      updateUI(response.streams);
    }
  });

  updateMonitoringStatus();
  updateDebugInfo();
}

elements.downloadVideo.addEventListener('click', () => {
  elements.downloadVideo.disabled = true;
  elements.downloadVideo.textContent = 'Downloading...';

  chrome.runtime.sendMessage({ action: 'downloadVideo' }, (response) => {
    if (response && response.success) {
      showMessage('Video download started successfully!', 'success');
      elements.downloadVideo.textContent = 'Download Video';
    } else {
      showMessage(`Error: ${response.error}`, 'error');
      elements.downloadVideo.textContent = 'Download Video';
      elements.downloadVideo.disabled = false;
    }

    setTimeout(() => {
      refreshStatus();
    }, 1000);
  });
});

elements.downloadAudio.addEventListener('click', () => {
  elements.downloadAudio.disabled = true;
  elements.downloadAudio.textContent = 'Downloading...';

  chrome.runtime.sendMessage({ action: 'downloadAudio' }, (response) => {
    if (response && response.success) {
      showMessage('Audio download started successfully!', 'success');
      elements.downloadAudio.textContent = 'Download Audio';
    } else {
      showMessage(`Error: ${response.error}`, 'error');
      elements.downloadAudio.textContent = 'Download Audio';
      elements.downloadAudio.disabled = false;
    }

    setTimeout(() => {
      refreshStatus();
    }, 1000);
  });
});

elements.refresh.addEventListener('click', () => {
  refreshStatus();
  showMessage('Status refreshed', 'info');
});

elements.clear.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'clearStreams' }, (response) => {
    if (response && response.success) {
      updateUI(null);
      showMessage('Streams cleared', 'info');
    }
  });
});

elements.copyVideo.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'getStreams' }, (response) => {
    if (response && response.streams && response.streams.video) {
      navigator.clipboard.writeText(response.streams.video).then(() => {
        showMessage('Video URL copied to clipboard!', 'success');
      }).catch(() => {
        showMessage('Failed to copy URL', 'error');
      });
    }
  });
});

elements.copyAudio.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'getStreams' }, (response) => {
    if (response && response.streams && response.streams.audio) {
      navigator.clipboard.writeText(response.streams.audio).then(() => {
        showMessage('Audio URL copied to clipboard!', 'success');
      }).catch(() => {
        showMessage('Failed to copy URL', 'error');
      });
    }
  });
});

elements.openVideo.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openVideoTab' }, (response) => {
    if (response && response.success) {
      showMessage('Video opened in new tab', 'success');
    } else {
      showMessage(`Error: ${response.error}`, 'error');
    }
  });
});

elements.openAudio.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openAudioTab' }, (response) => {
    if (response && response.success) {
      showMessage('Audio opened in new tab', 'success');
    } else {
      showMessage(`Error: ${response.error}`, 'error');
    }
  });
});

elements.toggleUrls.addEventListener('click', () => {
  if (elements.urlPreviewContent.style.display === 'none') {
    elements.urlPreviewContent.style.display = 'block';
    elements.toggleUrls.textContent = 'Hide Details';
  } else {
    elements.urlPreviewContent.style.display = 'none';
    elements.toggleUrls.textContent = 'Show Details';
  }
});

elements.toggleDebug.addEventListener('click', () => {
  if (elements.debugContent.style.display === 'none') {
    elements.debugContent.style.display = 'block';
    elements.toggleDebug.textContent = 'Hide Debug';
    updateDebugInfo();
  } else {
    elements.debugContent.style.display = 'none';
    elements.toggleDebug.textContent = 'Show Debug';
  }
});

elements.testConnection.addEventListener('click', () => {
  elements.testConnection.disabled = true;
  elements.testConnection.textContent = 'Testing...';

  const startTime = Date.now();
  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    const latency = Date.now() - startTime;

    if (response && response.success) {
      showMessage(`Connection OK! Latency: ${latency}ms`, 'success');
      updateDebugInfo();
    } else {
      showMessage('Connection failed! Service worker may be inactive.', 'error');
    }

    elements.testConnection.disabled = false;
    elements.testConnection.textContent = 'Test Connection';
  });
});

if (elements.debugModeToggle) {
  elements.debugModeToggle.addEventListener('click', async () => {
    const result = await chrome.storage.local.get(['debugMode']);
    const currentDebugMode = result.debugMode === true;
    const newDebugMode = !currentDebugMode;

    await chrome.storage.local.set({ debugMode: newDebugMode });
    await updateDebugModeUI();

    const message = newDebugMode
      ? 'Debug logging enabled. Check console for detailed logs.'
      : 'Debug logging disabled. Only essential logs will be shown.';

    showMessage(message, 'success');

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes('drive.google.com')) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'debugModeChanged',
            debugMode: newDebugMode
          }).catch(() => {});
        }
      });
    });
  });
}

async function verifyInstallation() {
  const debugMode = await shouldLog();
  if (debugMode) {
    console.log('[Popup] Verifying installation...');
  }

  const permissions = await chrome.permissions.getAll();
  if (debugMode) {
    console.log('[Popup] Granted permissions:', permissions);
  }

  if (!permissions.permissions.includes('webRequest')) {
    console.error('[Popup] ❌ webRequest permission missing!');
    showMessage('ERROR: webRequest permission missing! Extension will not work.', 'error');
    return false;
  }

  if (!permissions.permissions.includes('downloads')) {
    console.error('[Popup] ❌ downloads permission missing!');
    showMessage('ERROR: downloads permission missing! Downloads will not work.', 'error');
    return false;
  }

  const hasGooglevideoPermission = permissions.origins.some(origin =>
    origin.includes('googlevideo.com') || origin === '<all_urls>'
  );

  if (!hasGooglevideoPermission) {
    console.error('[Popup] ❌ googlevideo.com host permission missing!');
    showMessage('ERROR: googlevideo.com permission missing! Cannot capture streams.', 'error');
    return false;
  }

  if (debugMode) {
    console.log('[Popup] ✅ All required permissions granted');
  }
  return true;
}

async function updateDebugModeUI() {
  const result = await chrome.storage.local.get(['debugMode']);
  const debugMode = result.debugMode === true;

  if (elements.debugModeStatus) {
    elements.debugModeStatus.textContent = debugMode ? 'ON' : 'OFF';
    elements.debugModeStatus.className = debugMode ? 'debug-mode-on' : 'debug-mode-off';
  }

  if (elements.debugModeToggle) {
    elements.debugModeToggle.textContent = debugMode ? 'Disable Debug Logging' : 'Enable Debug Logging';
  }
}

async function updateAutoDetectionUI() {
  const result = await chrome.storage.local.get(['autoDetection']);
  const autoDetection = result.autoDetection !== false;

  if (elements.autoDetectionToggle) {
    elements.autoDetectionToggle.textContent = autoDetection ? 'Auto: ON' : 'Auto: OFF';
    elements.autoDetectionToggle.style.background = autoDetection ? '#4CAF50' : '#757575';
    elements.autoDetectionToggle.style.color = 'white';
  }
}

if (elements.autoDetectionToggle) {
  elements.autoDetectionToggle.addEventListener('click', async () => {
    const result = await chrome.storage.local.get(['autoDetection']);
    const currentAutoDetection = result.autoDetection !== false;
    const newAutoDetection = !currentAutoDetection;

    await chrome.storage.local.set({ autoDetection: newAutoDetection });
    await updateAutoDetectionUI();

    const message = newAutoDetection
      ? 'Automatic detection enabled'
      : 'Automatic detection disabled - use "Detect Now" button';

    showMessage(message, 'success');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('drive.google.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'autoDetectionChanged',
          autoDetection: newAutoDetection
        }).catch(() => {});
      }
    });
  });
}

if (elements.manualDetect) {
  elements.manualDetect.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('drive.google.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'manualDetect'
        }, (response) => {
          if (chrome.runtime.lastError) {
            showMessage('Error: Make sure you are on a Google Drive page with a video', 'error');
          } else if (response && response.success) {
            showMessage('Manual detection triggered - check if video was found', 'success');
            setTimeout(() => {
              refreshStatus();
            }, 1000);
          } else {
            showMessage('Detection triggered - wait a moment for results', 'info');
            setTimeout(() => {
              refreshStatus();
            }, 1000);
          }
        });
      } else {
        showMessage('Please open a Google Drive video page first', 'error');
      }
    });
  });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.capturedStreams) {
    shouldLog().then(debugMode => {
      if (debugMode) {
        console.log('[Popup] Streams updated in storage, refreshing UI');
      }
    });

    const newStreams = changes.capturedStreams.newValue;
    const oldStreams = changes.capturedStreams.oldValue;

    if (newStreams && (newStreams.video || newStreams.audio)) {
      if (!oldStreams || (!oldStreams.video && newStreams.video)) {
        showMessage('Video stream detected and ready to download!', 'success');
      } else if (!oldStreams || (!oldStreams.audio && newStreams.audio)) {
        showMessage('Audio stream detected and ready to download!', 'success');
      }
    }

    refreshStatus();
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const debugMode = await shouldLog();
  if (debugMode) {
    console.log('[Popup] Extension popup opened');
  }

  await verifyInstallation();

  refreshStatus();
  updateMonitoringStatus();
  updateDebugInfo();
  await updateDebugModeUI();
  await updateAutoDetectionUI();

  setInterval(() => {
    updateMonitoringStatus();
  }, 2000);

  if (debugMode) {
    console.log('[Popup] Check the browser console (F12) for detailed logs from background.js');
    console.log('[Popup] To see background logs:');
    console.log('[Popup] 1. Open chrome://extensions/');
    console.log('[Popup] 2. Enable "Developer mode"');
    console.log('[Popup] 3. Click "service worker" or "background page" link');
    console.log('[Popup] 4. Play a video on Google Drive to see stream capture logs');
  }
});
