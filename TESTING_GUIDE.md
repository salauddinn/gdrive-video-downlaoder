# Testing Guide for Google Drive Downloader

## Overview
This guide explains how to test the network-based video detection system and verify that the service worker is properly monitoring network requests.

## Prerequisites
1. Chrome browser with Developer mode enabled
2. A Google Drive video file to test with
3. Extension loaded in Chrome

## Step 1: Enable Debug Mode
1. Open the extension popup
2. Click "Show Debug"
3. Click "Enable Debug Logging"
4. Keep the popup open

## Step 2: Access Service Worker Console
1. Navigate to `chrome://extensions/`
2. Find "Google Drive Downloader" extension
3. Click "service worker" link (it will say "Inspect views service worker")
4. A DevTools window will open showing the service worker console

**What to look for:**
- `✅ webRequest listener installed successfully`
- `📡 Monitoring all requests to: https://*.googlevideo.com/*`
- `🔍 Looking for URLs with: videoplayback + mime=video OR mime=audio`
- `✅ All required permissions granted`

If you see errors about missing permissions, the extension won't work!

## Step 3: Open Google Drive Video
1. Go to Google Drive
2. Find a video file (any video)
3. Click to open the video player (but DON'T play yet)

**What to look for in Content Script:**
- Open the page's DevTools console (F12)
- Look for: `[GDrive Content] 📹 Video player opened`
- Look for: `[GDrive Content] ✅ Service worker is alive and monitoring network requests`
- Look for: `[GDrive Content] 🎬 PLAY THE VIDEO now to capture video/audio streams`

## Step 4: Play the Video
1. Click the play button on the video
2. Let it play for 2-3 seconds

**What to look for in Service Worker Console:**
- `🔍 Network request #X:` logs showing requests being monitored
- `✅ VIDEO STREAM CAPTURED! (#1)` when video stream is detected
- `✅ AUDIO STREAM CAPTURED! (#1)` when audio stream is detected
- Browser notification: "Video Stream Detected"
- Browser notification: "Audio Stream Detected"

**What to look for in Extension Popup:**
- Network Monitoring section should show:
  - Requests count increasing
  - Videos: 1 (or more)
  - Audios: 1 (or more)
- Video Stream icon should turn 🟢
- Audio Stream icon should turn 🟢
- Download buttons should become enabled

## Step 5: Verify Download Functionality
1. Click "Download" for video or audio
2. File should start downloading to your Downloads folder
3. Check the browser's download manager

## Common Issues and Solutions

### Issue: Service Worker Not Responding
**Symptoms:**
- Popup shows "Service Worker Not Responding"
- No logs in service worker console

**Solution:**
1. Reload the extension from `chrome://extensions/`
2. Click the service worker link again
3. Retry

### Issue: No Network Requests Being Captured
**Symptoms:**
- Total Requests stays at 0
- No `🔍 Network request` logs appear

**Solution:**
1. Check permissions in service worker console
2. Verify you see the startup logs
3. Make sure you're on `drive.google.com`
4. Try reloading the page

### Issue: Requests Captured but No Video/Audio
**Symptoms:**
- Total Requests increases
- But Videos/Audios stay at 0

**Solution:**
1. Check if the service worker console shows:
   - `⚠️ googlevideo.com + videoplayback detected but NO mime type match`
2. Look at the "Found mime type:" log to see what mime type is in the URL
3. The URL must contain `mime=video` or `mime=audio` in the query string

### Issue: Content Script Not Loading
**Symptoms:**
- No logs in page console about video player

**Solution:**
1. Make sure you're on `drive.google.com/file/...`
2. Reload the page
3. Check that content_scripts permission is granted

## Monitoring in Real-Time

### Extension Popup
- Shows live network monitoring statistics
- Updates every 2 seconds automatically
- Displays:
  - Total network requests monitored
  - Number of video streams captured
  - Number of audio streams captured

### Debug Panel
Click "Show Debug" to see:
- Service Worker status (Active/Inactive)
- Uptime
- Detailed request statistics
- Last error (if any)

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Service worker starts and shows startup logs
- [ ] Permissions are all granted
- [ ] Content script loads on Google Drive pages
- [ ] Video player open/close detection works
- [ ] Service worker ping responds when player opens
- [ ] Network requests are being monitored (count increases)
- [ ] Video stream is captured when playing video
- [ ] Audio stream is captured when playing video
- [ ] Notifications appear for captured streams
- [ ] Popup shows correct monitoring statistics
- [ ] Download buttons work
- [ ] Files download successfully
- [ ] URLs are cleaned (no &range= parameter)
- [ ] Debug mode shows detailed logs

## Expected Console Output

### Service Worker Console (with debug mode ON)
```
[GDrive Downloader] Service worker started at [time]
[GDrive Downloader] Installing webRequest listener for *.googlevideo.com
[GDrive Downloader] ✅ webRequest listener installed successfully
[GDrive Downloader] 📡 Monitoring all requests to: https://*.googlevideo.com/*
[GDrive Downloader] 🔍 Looking for URLs with: videoplayback + mime=video OR mime=audio
[GDrive Downloader] 💡 To test: Open a Google Drive video and PLAY it
[GDrive Downloader] ✅ All required permissions granted
[GDrive Downloader] 🚀 Extension fully initialized and ready!
...
[GDrive Downloader] 🔍 Network request #1: { method: "GET", ... }
[GDrive Downloader] 🔍 Network request #2: { method: "GET", ... }
[GDrive Downloader] ✅ VIDEO STREAM CAPTURED! (#1)
[GDrive Downloader] ✅ AUDIO STREAM CAPTURED! (#1)
```

### Page Console (with debug mode ON)
```
[GDrive Content] Script initializing...
[GDrive Content] Setting up MutationObserver for video player state
[GDrive Content] ✅ Content script fully loaded and initialized!
...
[GDrive Content] 📹 Video player opened
[GDrive Content] 📹 Notifying service worker that video player opened
[GDrive Content] ✅ Service worker is alive and monitoring network requests
[GDrive Content] 🎬 PLAY THE VIDEO now to capture video/audio streams
[GDrive Content] ✅ Filename updated to: [filename]
```

## Network Tab Verification

You can also manually verify in Chrome DevTools Network tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "googlevideo.com"
4. Play the video
5. Look for requests to `*.googlevideo.com/videoplayback?...`
6. Check if URL contains `mime=video` or `mime=audio`

## Success Criteria

The extension is working correctly if:
1. ✅ Service worker starts and stays alive
2. ✅ Network monitoring is active
3. ✅ Content script detects video player open/close
4. ✅ Playing video triggers network requests
5. ✅ Video and audio streams are captured
6. ✅ URLs are cleaned and stored
7. ✅ Downloads work successfully
8. ✅ Notifications appear when streams are captured
9. ✅ Popup shows real-time monitoring statistics
10. ✅ Debug logs provide clear troubleshooting info
