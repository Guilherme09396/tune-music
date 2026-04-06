// components/OfflineAwareImage.tsx
import { useState, useEffect } from "react";
import { Music } from "lucide-react";

interface Props {
  src: string;
  trackId: string;
  getOfflineThumbnailUrl: (id: string) => Promise<string | null>;
  className?: string;
  alt?: string;
}

export default function OfflineAwareImage({ src, trackId, getOfflineThumbnailUrl, className, alt }: Props) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(src);

  useEffect(() => {
    if (!navigator.onLine) {
      getOfflineThumbnailUrl(trackId).then(url => {
        setResolvedSrc(url); // null se não tiver salvo
      });
    } else {
      setResolvedSrc(src);
    }
  }, [src, trackId, navigator.onLine]);

  if (!resolvedSrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <Music className="h-6 w-6 text-muted-foreground/40" />
      </div>
    );
  }

  return <img src={resolvedSrc} alt={alt || ""} className={className} />;
}