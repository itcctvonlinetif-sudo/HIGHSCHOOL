---
name: Google Drive video playback
description: Reliable display and playback behavior for videos stored in Google Drive.
---

Google Drive download URLs are not reliable as an HTML5 video source because Drive may return a confirmation/download page instead of a media stream. Use the Drive thumbnail endpoint for gallery cards and the Drive `/file/d/{id}/preview` URL in an iframe for playback. Files must be shared publicly for these URLs to work.

**Why:** Google Drive is optimized for its own preview player, not direct browser video streaming; direct `uc?export=download` URLs can fail even when the file exists.

**How to apply:** Detect Drive file IDs from stored URLs, render thumbnails with `thumbnail?id=...`, and open Drive videos with the preview embed. Keep native `<video>` for Replit Object Storage, whose endpoint supports byte ranges.