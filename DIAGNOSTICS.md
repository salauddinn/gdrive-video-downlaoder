# Diagnostics Guide

This guide will help you troubleshoot issues with the Google Drive Downloader extension.

## Quick Diagnostic Steps

### Step 1: Check Console Logs

The extension now has comprehensive logging. Follow these steps:

1. **Open Chrome DevTools** (Press F12)
2. **Go to the Console tab**
3. **Look for messages starting with `[GDrive Downloader]`, `[GDrive Content]`, or `[Popup]`**

### Step 2: Check Service Worker Status

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Find **Google Drive Downloader**
4. Click on **"service worker"** link (it will open a new DevTools window)
5. Check the console for logs

You should see:
```
[GDrive Downloader] Service worker started at [time]
[GDrive Downloader] Installing webRequest listener for *.googlevideo.com
[GDrive Downloader] ✅ webRequest listener installed successfully
[GDrive Downloader] 🚀 Extension fully initialized and ready!
```

### Step 3: Use Debug Mode in Extension Popup

1. Open the extension popup
2. Click **"Show Debug"** button
3. Check the following:
   - **Service Worker**: Should say "Active" (green)
   - **Total Requests**: Should increase when you play a video
   - **Videos/Audios Captured**: Should increase when streams are detected
4. Click **"Test Connection"** to verify the service worker is responsive

## Common Issues and Solutions

### Issue 1: "Content script loaded" but nothing happens

**Symptoms:**
- Console shows `[GDrive Content] ✅ Content script fully loaded`
- No streams captured
- Buttons remain disabled

**Diagnosis:**
Open the page console (F12) and check:
- Is there a video element? Look for: `[GDrive Content] ✅ Video element detected on page!`
- Did you play the video? Look for: `[GDrive Content] ⚠️ Video is paused. PLAY THE VIDEO to capture streams!`

**Solution:**
1. Make sure you're on a Google Drive video page (not just the file list)
2. **PLAY THE VIDEO** - The extension only captures streams when video is actively playing
3. Wait 2-3 seconds after playing
4. Open the extension popup - buttons should now be enabled

### Issue 2: Service Worker Not Capturing Requests

**Symptoms:**
- Debug info shows "Total Requests: 0"
- No notifications appear
- Service worker console shows no `[GDrive Downloader] Request intercepted` messages

**Diagnosis:**
1. Check if service worker is running:
   - Go to `chrome://extensions/`
   - Look for the service worker link
   - If you see "Inspect views: service worker (inactive)", click it to wake it up

2. Check permissions:
   - Open extension popup
   - Console should show: `[Popup] ✅ All required permissions granted`
   - If not, you'll see error messages about missing permissions

**Solution:**
1. Reload the extension:
   - Go to `chrome://extensions/`
   - Click reload button on the extension
2. Reload the Google Drive page
3. Play the video again

### Issue 3: Requests Intercepted but No Streams Captured

**Symptoms:**
- Service worker shows: `[GDrive Downloader] Request intercepted`
- But no `✅ VIDEO STREAM CAPTURED!` or `✅ AUDIO STREAM CAPTURED!`

**Diagnosis:**
Check the service worker console for messages like:
```
[GDrive Downloader] ⚠️ googlevideo.com request detected but no mime type match
```

This means the extension is monitoring requests, but they don't contain `mime=video` or `mime=audio`.

**Solution:**
1. This might be a non-video file or a different streaming format
2. Try a different video file on Google Drive
3. Make sure the file is actually a video (not a document or image)

### Issue 4: Extension Popup Shows Errors

**Error: "webRequest permission missing!"**
- The extension wasn't installed correctly
- Solution: Reinstall the extension

**Error: "Connection failed! Service worker may be inactive."**
- The service worker has crashed or is sleeping
- Solution:
  1. Go to `chrome://extensions/`
  2. Click reload on the extension
  3. Click "Test Connection" again

## Detailed Logging Reference

### Content Script Logs (`[GDrive Content]`)

| Log Message | Meaning |
|------------|---------|
| `✅ Content script fully loaded and initialized!` | Content script is running |
| `✅ Video element detected on page!` | Found a video player |
| `⚠️ Video is paused. PLAY THE VIDEO to capture streams!` | You need to play the video |
| `Video is playing - streams should be captured soon` | Video is playing, waiting for network requests |
| `✅ Filename updated to: [name]` | Successfully extracted and sent filename |

### Background/Service Worker Logs (`[GDrive Downloader]`)

| Log Message | Meaning |
|------------|---------|
| `🚀 Extension fully initialized and ready!` | Service worker is ready |
| `Request intercepted` | Detected a network request to googlevideo.com |
| `✅ VIDEO STREAM CAPTURED!` | Successfully captured video URL |
| `✅ AUDIO STREAM CAPTURED!` | Successfully captured audio URL |
| `⚠️ googlevideo.com request detected but no mime type match` | Request didn't contain video/audio mime type |
| `Service worker keep-alive ping` | Service worker is still alive (every 20s) |

### Popup Logs (`[Popup]`)

| Log Message | Meaning |
|------------|---------|
| `Extension popup opened` | Popup was opened |
| `✅ All required permissions granted` | Permissions are correct |
| `❌ [permission] permission missing!` | Missing required permission |

## Testing Procedure

Follow these steps to test if the extension is working:

1. **Install/Reload Extension**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked or reload the extension

2. **Open Service Worker Console**
   - Click "service worker" link in extension details
   - Keep this console open

3. **Open Google Drive Video**
   - Navigate to a video file on Google Drive
   - Open the video in preview/player mode

4. **Open Page Console**
   - Press F12 on the Google Drive page
   - Go to Console tab

5. **Play the Video**
   - Click play on the video
   - Watch both consoles (page and service worker)

6. **Expected Results**
   - Page console: `[GDrive Content] Video is playing`
   - Service worker console: `[GDrive Downloader] Request intercepted`
   - Service worker console: `✅ VIDEO STREAM CAPTURED!`
   - Service worker console: `✅ AUDIO STREAM CAPTURED!`
   - Notification: "Video Stream Detected"

7. **Open Extension Popup**
   - Click extension icon
   - Video and Audio indicators should be green (🟢)
   - Download buttons should be enabled

8. **Use Debug Mode**
   - Click "Show Debug"
   - Verify all counters are updating
   - Click "Test Connection" - should show success

## Still Having Issues?

If you've followed all the steps above and it's still not working:

1. **Collect the following information:**
   - All console logs from service worker
   - All console logs from Google Drive page
   - Screenshot of extension popup (with Debug mode open)
   - Chrome version: Go to `chrome://version/`
   - Extension manifest version (check manifest.json)

2. **Try these final steps:**
   - Restart Chrome completely
   - Test with a different Google Drive video
   - Test on a different Google account
   - Disable other extensions temporarily

3. **Common external causes:**
   - Corporate/School network blocking googlevideo.com
   - VPN interfering with requests
   - Chrome enterprise policies
   - Antivirus blocking extension permissions
