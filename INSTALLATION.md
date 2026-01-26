# Installation Guide

This guide will help you install the Google Drive Downloader Chrome extension.

## Prerequisites

- Google Chrome browser
- Basic familiarity with Chrome extensions

## Step-by-Step Installation

### 1. Prepare the Extension

First, make sure you have all the required files:

- manifest.json
- background.js
- content.js
- popup.html
- popup.js
- popup.css
- icons folder with icon files (see icons/README.md)

### 2. Add Icons

Before installing, you need to add three icon files to the `icons` folder:

1. Navigate to the `icons` folder
2. Add these three PNG files:
   - icon16.png (16x16 pixels)
   - icon48.png (48x48 pixels)
   - icon128.png (128x128 pixels)

See `icons/README.md` for detailed instructions on creating icons.

### 3. Load the Extension in Chrome

1. Open Google Chrome
2. Type `chrome://extensions/` in the address bar and press Enter
3. Enable **Developer mode** by clicking the toggle in the top right corner
4. Click the **Load unpacked** button
5. Navigate to and select the folder containing this extension
6. The extension should now appear in your list of installed extensions

### 4. Pin the Extension (Optional but Recommended)

1. Click the puzzle piece icon in the Chrome toolbar
2. Find "Google Drive Downloader" in the list
3. Click the pin icon next to it
4. The extension icon will now appear in your toolbar

## Verifying Installation

To verify the extension is working:

1. Navigate to [Google Drive](https://drive.google.com)
2. Open any video file
3. Play the video for a few seconds
4. Click the extension icon in the toolbar
5. You should see the extension popup with stream detection status

## Permissions

When you first load the extension, Chrome will request the following permissions:

- **Read and change your data on drive.google.com**: To detect and extract stream URLs
- **Download files**: To save video and audio files to your computer

These permissions are necessary for the extension to function.

## Troubleshooting Installation

### Extension Not Loading

- Make sure all files are in the correct location
- Check that Developer mode is enabled
- Try reloading the extension page

### Missing Icons Error

- Make sure you've added all three icon files (16, 48, 128 px)
- Verify the icon files are PNG format
- Check that icon filenames are exactly: icon16.png, icon48.png, icon128.png

### Permission Errors

- Make sure you're using the latest version of Chrome
- Try removing and reloading the extension
- Check Chrome's site settings for drive.google.com

## Updating the Extension

If you make changes to the extension:

1. Go to `chrome://extensions/`
2. Find the Google Drive Downloader extension
3. Click the refresh icon
4. The extension will reload with your changes

## Uninstalling

To remove the extension:

1. Go to `chrome://extensions/`
2. Find the Google Drive Downloader extension
3. Click **Remove**
4. Confirm the removal

## Next Steps

Once installed, check out the main README.md for usage instructions and tips on downloading and merging video files.
