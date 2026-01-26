# Google Drive Downloader Chrome Extension

Download audio and video streams separately from restricted Google Drive files.

## Overview

This Chrome extension intercepts video and audio streams from Google Drive and allows you to download them separately. Once downloaded, you can merge them using FFmpeg on your desktop.

## Features

- Automatically detects video and audio streams when playing Google Drive videos
- Downloads video and audio streams separately
- Visual notifications when streams are detected
- Simple one-click download interface
- Preserves original filenames from Google Drive

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right
4. Click "Load unpacked"
5. Select the folder containing this extension
6. The extension icon should appear in your Chrome toolbar

## Adding Extension Icons

For the extension to work properly, you need to add icon files to the `icons` folder:

1. Create an `icons` folder in the extension directory
2. Add three PNG images:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

You can create simple icons using any image editor or use online icon generators.

## Usage

### Step 1: Open Google Drive Video

1. Navigate to Google Drive
2. Open a video file that you want to download
3. Play the video for a few seconds

### Step 2: Download Streams

1. Click the extension icon in your Chrome toolbar
2. Wait for the video and audio streams to be detected (green indicators)
3. Click "Download Video" to download the video stream
4. Click "Download Audio" to download the audio stream
5. Both files will be saved to your Downloads folder

### Step 3: Merge with FFmpeg

After downloading both streams, use FFmpeg to merge them:

```bash
ffmpeg -i filename_video.mp4 -i filename_audio.mp4 -c copy filename_merged.mp4
```

Or use your existing batch script for merging.

## Extension Interface

The extension popup shows:

- **Filename**: Extracted from the Google Drive file name
- **Last Detected**: Timestamp of when streams were last captured
- **Video Stream**: Status and download button for video
- **Audio Stream**: Status and download button for audio
- **Refresh Status**: Manually refresh the stream status
- **Clear Streams**: Clear cached stream URLs

## How It Works

1. **Content Script**: Runs on Google Drive pages and extracts the file name
2. **Background Service Worker**: Intercepts network requests to capture stream URLs
3. **Popup Interface**: Displays status and provides download controls
4. **Chrome Downloads API**: Handles the actual file downloads

## Troubleshooting

### Streams Not Detected

- Make sure you played the video for at least 3-5 seconds
- Try refreshing the Google Drive page
- Check that the extension has proper permissions

### Download Fails

- The stream URLs expire after some time, try capturing fresh streams
- Make sure Chrome has permission to download files
- Check your Downloads folder for existing files with the same name

### Extension Not Working

- Make sure Developer mode is enabled in Chrome
- Check the Chrome DevTools console for any error messages
- Try reloading the extension from `chrome://extensions/`

## Permissions Explained

This extension requires the following permissions:

- **webRequest**: To intercept and capture stream URLs
- **downloads**: To save video and audio files to your computer
- **storage**: To remember captured streams between sessions
- **notifications**: To alert you when streams are detected
- **host_permissions**: To access Google Drive and video stream domains

## Privacy & Security

- This extension runs entirely in your browser
- No data is sent to external servers
- Stream URLs are stored locally in your browser
- All downloads are handled by Chrome's built-in download manager

## Development

### Files Structure

```
g-downloader/
├── manifest.json       # Extension configuration
├── background.js       # Service worker for network interception
├── content.js         # Script that runs on Google Drive pages
├── popup.html         # Extension popup interface
├── popup.js           # Popup logic and event handlers
├── popup.css          # Popup styling
├── icons/             # Extension icons (16, 48, 128 px)
└── README.md          # This file
```

### Testing

1. Load the extension in Chrome
2. Open a Google Drive video
3. Play the video
4. Open the extension popup
5. Verify streams are detected
6. Test download functionality

## License

See LICENSE file for details.

## Notes

- This tool is for personal use with your own Google Drive files
- Respect copyright and terms of service
- Stream URLs are temporary and will expire 
