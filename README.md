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

## Security & Privacy Notice

**IMPORTANT: This extension currently requires `<all_urls>` permission**, which allows it to monitor network requests across all websites you visit. Here's what you need to know:

**Why this permission is needed:**
- Google Drive serves video streams from multiple dynamic domains that cannot be predicted in advance
- The exact domain patterns vary and are not publicly documented
- Without broad permissions, the extension cannot reliably capture video streams

**What the extension actually does:**
- Only processes URLs containing `videoplayback` (Google video streams)
- Ignores all other network traffic
- Does not collect, store, or transmit any personal data
- Runs entirely in your browser with no external servers

**Privacy guarantee:**
- All code is open-source and auditable
- No analytics or tracking
- No data leaves your computer
- Only video stream URLs are temporarily stored locally

**Future plans:**
- We are working to identify the specific Google domains used for video streaming
- Once identified, permissions will be restricted to only those domains
- This improvement is planned for a future version

If you have concerns about this permission, you can review all the source code in this repository to verify what the extension does.

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
- **Debug Info**: Toggle to show detailed diagnostics
  - Service worker status
  - Network requests monitored
  - Streams captured count
  - Last activity timestamp
  - Test connection button

## How It Works

This extension uses a **network-based detection strategy** for maximum reliability:

1. **Content Script**:
   - Detects when the Google Drive video player opens
   - Extracts the filename from the page
   - Pings the service worker to ensure it's active

2. **Background Service Worker**:
   - Monitors network requests across all URLs (see Known Issues section)
   - Filters and intercepts only requests containing `videoplayback` in the URL
   - Captures URLs with `mime=video` or `mime=audio` parameters
   - Automatically cleans URLs by removing `&range=` parameters
   - Persists captured streams in Chrome storage
   - Note: Despite broad monitoring, only Google video streams are processed

3. **Network Monitoring**:
   - Real-time monitoring of all Google video requests
   - Live statistics display in popup (updates every 2 seconds)
   - Detailed request logging in debug mode
   - Permission verification on startup

4. **Popup Interface**:
   - Displays captured stream status with visual indicators
   - Shows live network monitoring statistics
   - Provides download, copy, and open controls
   - Comprehensive debug panel for troubleshooting

5. **Chrome Downloads API**:
   - Handles secure file downloads
   - Saves files with descriptive names
   - Provides download notifications

## Troubleshooting

### Quick Diagnostics

The extension now includes comprehensive diagnostic tools:

1. **Open the extension popup**
2. **Click "Show Debug"** to see:
   - Service worker status (should be "Active")
   - Total network requests monitored
   - Number of streams captured
   - Last activity timestamp
3. **Click "Test Connection"** to verify the background service is responsive

### Detailed Troubleshooting

For comprehensive troubleshooting steps, see **[DIAGNOSTICS.md](DIAGNOSTICS.md)**.

The extension now includes extensive console logging:
- Open Chrome DevTools (F12) on the Google Drive page
- Look for messages prefixed with `[GDrive Content]`, `[GDrive Downloader]`, or `[Popup]`
- These logs will tell you exactly what the extension is doing

### Common Issues

**Streams Not Detected**
- Make sure you **PLAY the video** (not just open the file)
- Wait 3-5 seconds after playing
- Check Debug Info - "Total Requests" should be increasing
- See [DIAGNOSTICS.md](DIAGNOSTICS.md) for detailed steps

**Download Fails**
- Stream URLs expire after some time, capture fresh streams
- Make sure Chrome has permission to download files
- Check your Downloads folder for existing files with the same name

**Extension Not Working**
- Open Debug Info and check service worker status
- Click "Test Connection" to verify communication
- Check console logs for error messages
- See [DIAGNOSTICS.md](DIAGNOSTICS.md) for complete diagnostic procedure

**Buttons Stay Disabled**
- This means streams haven't been captured yet
- Make sure you're **playing the video**, not just viewing the file
- Check the console logs to see what's happening
- Open Debug Info to see request counts

## Known Issues

### Broad Permission Scope (`<all_urls>`)

**Current Status:**
The extension currently requires `<all_urls>` host permission, which allows it to monitor network requests across all websites.

**Why this is necessary:**
- Google Drive serves video content from multiple dynamic domains
- These domains are not predictable and vary based on:
  - Geographic location
  - Content delivery network (CDN) routing
  - Load balancing across Google's infrastructure
  - Individual file characteristics
- Attempts to use specific domain patterns like `*.googlevideo.com` have proven unreliable

**What this means for you:**
- The extension technically has permission to see all network traffic
- However, the code only processes URLs containing the string `videoplayback`
- All other requests are immediately ignored
- You can verify this by reviewing the open-source code in `background.js`

**Performance impact:**
- Minimal: The extension performs a simple string check on each URL
- No data processing occurs for non-Google-video requests
- Network requests are not blocked or delayed

**Privacy assurance:**
- The extension does not log, store, or transmit any data except video stream URLs
- No personal information is collected
- No external servers are contacted
- All functionality runs locally in your browser

**Future improvements:**
- We are actively monitoring to identify the specific domain patterns used by Google Drive
- Once patterns are confirmed, permissions will be restricted to only those domains
- This is a high priority for future versions
- If you can help identify consistent domain patterns, please contribute to the project

**Workaround:**
If you're uncomfortable with the broad permission:
- Only enable the extension when downloading from Google Drive
- Disable it immediately after downloading
- Chrome allows you to enable/disable extensions with a single click

## Permissions Explained

This extension requires the following permissions:

- **webRequest**: To intercept and capture stream URLs from the network
- **downloads**: To save video and audio files to your computer
- **storage**: To remember captured streams between sessions
- **notifications**: To alert you when streams are detected
- **host_permissions (`<all_urls>`)**:
  - **WARNING:** This is a broad permission that allows monitoring all network requests
  - Required because Google Drive uses unpredictable dynamic domains for video streaming
  - The extension filters requests and only processes those containing `videoplayback`
  - All other traffic is ignored - see the Known Issues section above for full details
  - This will be optimized to specific domains in future versions once patterns are identified

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

## Future Improvements

**Version Roadmap:**

**Planned for v2.0:**
- Restrict `<all_urls>` permission to specific Google domains only
- Reduce permission scope once domain patterns are identified
- Improve performance by targeting specific domains

**Help Wanted:**
- If you can identify consistent domain patterns for Google Drive video streams, please open an issue or pull request
- We're collecting data to determine the exact domains used across different regions and scenarios

**Contributing:**
- This is an open-source project and contributions are welcome
- Review the code, suggest improvements, or help identify domain patterns
- All contributions help make this extension more secure and privacy-friendly 
