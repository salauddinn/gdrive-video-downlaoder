# Quick Start Guide

Get started with Google Drive Downloader in just a few minutes!

## 1. Install the Extension

1. Add icon files to the `icons` folder (see icons/README.md)
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select this folder
5. Pin the extension to your toolbar

## 2. Download a Video

1. Go to Google Drive and open a video
2. Play the video for 3-5 seconds
3. Click the extension icon in your toolbar
4. Wait for green indicators (video and audio detected)
5. Click "Download Video" button
6. Click "Download Audio" button
7. Both files will be in your Downloads folder

## 3. Merge the Files

Use FFmpeg to combine the video and audio:

```bash
ffmpeg -i filename_video.mp4 -i filename_audio.mp4 -c copy filename_merged.mp4
```

Done! You now have the complete video file.

## Common Issues

**Streams not detected?**
- Play the video for at least 5 seconds
- Refresh the Google Drive page and try again

**Download button disabled?**
- Make sure the stream indicator shows green
- Try clicking "Refresh Status" in the extension

**Files not merging?**
- Make sure you have FFmpeg installed
- Verify both video and audio files downloaded successfully
- Check that file names match in your FFmpeg command

## Tips

- The extension remembers captured streams between browser sessions
- You can download from multiple videos before merging
- Use descriptive filenames in Google Drive for easier organization
- Stream URLs expire after some time, download soon after capturing

## Need More Help?

See the full README.md for detailed documentation and troubleshooting.
