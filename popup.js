const elements = {
  filename: document.getElementById('filename'),
  timestamp: document.getElementById('timestamp'),
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
  audioUrlStatus: document.getElementById('audio-url-status')
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

function refreshStatus() {
  chrome.runtime.sendMessage({ action: 'getStreams' }, (response) => {
    if (response && response.streams) {
      updateUI(response.streams);
    }
  });
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

document.addEventListener('DOMContentLoaded', () => {
  refreshStatus();
});
