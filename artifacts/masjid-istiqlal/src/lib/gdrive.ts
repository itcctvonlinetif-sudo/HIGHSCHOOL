function getGDriveFileId(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (
      !parsed.hostname.includes("drive.google.com") &&
      !parsed.hostname.includes("docs.google.com")
    ) {
      return null;
    }

    return (
      parsed.searchParams.get("id") ??
      parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ??
      null
    );
  } catch {
    return null;
  }
}

export function isGDriveUrl(url: string | null | undefined): boolean {
  return !!url && !!getGDriveFileId(url);
}

/**
 * Converts any Google Drive URL to a thumbnail URL.
 * This works for both images and videos when the file is shared publicly.
 */
export function toGDriveImageUrl(url: string): string {
  const fileId = getGDriveFileId(url);
  return fileId
    ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`
    : url;
}

export function toGDriveVideoUrl(url: string): string {
  const fileId = getGDriveFileId(url);
  return fileId
    ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
    : url;
}

export function toGDrivePreviewUrl(url: string): string {
  const fileId = getGDriveFileId(url);
  return fileId
    ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`
    : url;
}
