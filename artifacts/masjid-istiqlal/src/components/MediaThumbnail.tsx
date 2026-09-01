import { useState } from "react";
import { Film, Play } from "lucide-react";

interface MediaThumbnailProps {
  src: string;
  title: string;
  poster?: string | null;
  isExternalVideo?: boolean;
  className?: string;
}

export function MediaThumbnail({
  src,
  title,
  poster,
  isExternalVideo = false,
  className = "",
}: MediaThumbnailProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-muted ${className}`}>
      {isExternalVideo ? (
        poster && !failed ? (
          <img
            src={poster}
            alt={title}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Film size={30} />
            <span className="text-xs font-semibold">Video</span>
          </div>
        )
      ) : poster && !loaded && !failed ? (
        <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      {!isExternalVideo && !loaded && !poster && !failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Film size={30} />
          <span className="text-xs font-semibold">Video</span>
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Film size={30} />
          <span className="text-xs font-semibold">Video tidak dapat dimuat</span>
        </div>
      )}
      {!isExternalVideo && !failed && (
        <video
          src={src}
          poster={poster ?? undefined}
          aria-label={title}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          preload="auto"
          muted
          playsInline
          onLoadedData={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {!failed && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white shadow-lg">
            <Play size={18} fill="currentColor" />
          </span>
        </span>
      )}
    </div>
  );
}