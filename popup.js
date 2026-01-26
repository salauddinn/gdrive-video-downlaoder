const elements = {
  filename: document.getElementById('filename'),
  timestamp: document.getElementById('timestamp'),
  videoIcon: document.getElementById('video-icon'),
  audioIcon: document.getElementById('audio-icon'),
  downloadVideo: document.getElementById('download-video'),
  downloadAudio: document.getElementById('download-audio'),
  refresh: document.getElementById('refresh'),
  clear: document.getElementById('clear'),
  message: document.getElementById('message')
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
      filename: 'gdrive-video',
      timestamp: null
    };
  }

  elements.filename.textContent = streams.filename || '-';
  elements.timestamp.textContent = formatTimestamp(streams.timestamp);

  if (streams.video) {
    elements.videoIcon.textContent = '🟢';
    elements.downloadVideo.disabled = false;
  } else {
    elements.videoIcon.textContent = '⚪';
    elements.downloadVideo.disabled = true;
  }

  if (streams.audio) {
    elements.audioIcon.textContent = '🟢';
    elements.downloadAudio.disabled = false;
  } else {
    elements.audioIcon.textContent = '⚪';
    elements.downloadAudio.disabled = true;
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

document.addEventListener('DOMContentLoaded', () => {
  refreshStatus();
});
