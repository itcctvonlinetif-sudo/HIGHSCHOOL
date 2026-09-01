import { useGetClassById, useGetClassGallery } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, BookOpen, Calendar, Image as ImageIcon, User, Video, X } from "lucide-react";
import { useState } from "react";
import { toGDriveImageUrl } from "@/lib/gdrive";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION_KEY = "kelas_access_granted";

function getMediaSrc(url: string | null | undefined, mediaType: "image" | "video" = "image") {
  if (!url) return null;
  if (url.startsWith("/api/storage")) return `${BASE}${url}`;
  return toGDriveImageUrl(url);
}

function getYtId(url: string): string | null {
  const match = url?.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isYoutubeShort(url: string) {
  return url?.includes("/shorts/");
}

function isLocalVideo(url: string) {
  return url?.startsWith("/api/storage") || url?.startsWith("blob:");
}

function getGDriveId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("drive.google.com")) return null;
    return parsed.searchParams.get("id") ?? parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function KelasDetail() {
  const [, params] = useRoute("/kelas/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const hasAccess = typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "true";
  const { data: item, isLoading, error } = useGetClassById(id, {
    query: { enabled: id > 0 },
  });
  const { data: gallery } = useGetClassGallery(id, { query: { enabled: hasAccess && id > 0 } });
  const activeGallery = Array.isArray(gallery) ? gallery.filter((photo) => photo.isActive) : [];
  const [galleryTab, setGalleryTab] = useState<"image" | "video">("image");
  const galleryPhotos = activeGallery.filter((photo) => photo.mediaType !== "video");
  const galleryVideos = activeGallery.filter((photo) => photo.mediaType === "video");
  const visibleGallery = galleryTab === "video" ? galleryVideos : galleryPhotos;
  const [activeMedia, setActiveMedia] = useState<any | null>(null);

  if (!hasAccess) {
    return (
      <main className="min-h-[60vh] bg-background px-4 py-20 text-center">
        <BookOpen className="mx-auto mb-4 text-secondary" size={32} />
        <h1 className="mb-2 text-2xl font-bold">Akses Kelas diperlukan</h1>
        <p className="mb-6 text-sm text-muted-foreground">Masukkan password warga terlebih dahulu untuk membaca materi ini.</p>
        <Link href="/kelas" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
          <ArrowLeft size={16} /> Buka Halaman Kelas
        </Link>
      </main>
    );
  }

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  if (error || !item || !item.isPublished) {
    return (
      <main className="min-h-[60vh] bg-background px-4 py-20 text-center">
        <BookOpen className="mx-auto mb-4 text-secondary" size={32} />
        <h1 className="mb-2 text-2xl font-bold">Kelas tidak ditemukan</h1>
        <p className="mb-6 text-sm text-muted-foreground">Materi ini mungkin belum diterbitkan atau sudah tidak tersedia.</p>
        <Link href="/kelas" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
          <ArrowLeft size={16} /> Kembali ke Kelas
        </Link>
      </main>
    );
  }

  const imageSrc = getMediaSrc(item.imageUrl);

  return (
    <article className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 md:pt-12">
        <Link href="/kelas" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-secondary">
          <ArrowLeft size={16} /> Semua Kelas
        </Link>
        <div className="mb-8 border-b border-border pb-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-secondary"><BookOpen size={15} /> Materi Kelas</p>
          <h1 className="text-4xl font-bold leading-tight text-primary md:text-5xl">{item.title}</h1>
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><User size={16} className="text-secondary" /> {item.author}</span>
            <span className="inline-flex items-center gap-2"><Calendar size={16} className="text-secondary" /> {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>
        {imageSrc && (
          <div className="mb-10 overflow-hidden rounded-3xl border border-border bg-muted shadow-xl">
            <img src={imageSrc} alt={item.title} className="max-h-[520px] w-full object-cover" />
          </div>
        )}
        <p className="mb-8 text-lg leading-8 text-muted-foreground">{item.excerpt}</p>
        <div className="prose prose-lg prose-green max-w-none prose-headings:font-display prose-headings:text-primary prose-p:text-muted-foreground prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content }} />
        {activeGallery.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <div className="mb-6 flex items-center gap-3"><ImageIcon className="text-secondary" size={22} /><div><h2 className="text-2xl font-bold text-primary">Galeri Kelas</h2><p className="text-sm text-muted-foreground">Dokumentasi untuk materi ini</p></div></div>
            <div className="mb-6 flex w-fit gap-1 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setGalleryTab("image")}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${galleryTab === "image" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <ImageIcon size={16} /> Foto <span className="ml-1 text-xs opacity-60">({galleryPhotos.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setGalleryTab("video")}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${galleryTab === "video" ? "bg-background text-red-600 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Video size={16} /> Video <span className="ml-1 text-xs opacity-60">({galleryVideos.length})</span>
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-5">
              {visibleGallery.map((photo) => {
                const isVideo = photo.mediaType === "video";
                const ytId = isVideo ? getYtId(photo.imageUrl) : null;
                const gdriveId = isVideo ? getGDriveId(photo.imageUrl) : null;
                const local = isVideo && isLocalVideo(photo.imageUrl);
                const thumbUrl = ytId
                  ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                  : gdriveId
                    ? `https://drive.google.com/thumbnail?id=${gdriveId}&sz=w1000`
                    : null;
                return (
                  <button key={photo.id} type="button" onClick={() => setActiveMedia(photo)} className={`group flex flex-col text-left ${isVideo ? "w-[200px]" : "w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-14px)]"}`}>
                    <div className={`relative overflow-hidden rounded-2xl bg-gray-900 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl ${isVideo ? "h-[320px] w-[200px]" : "aspect-square"}`}>
                      {isVideo ? local ? (
                        <video src={`${BASE}${photo.imageUrl}`} className="absolute inset-0 h-full w-full object-cover" muted preload="metadata" />
                      ) : thumbUrl ? (
                        <img src={thumbUrl} alt={photo.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800"><Video size={40} className="text-white/30" /></div>
                      ) : (
                        <img src={getMediaSrc(photo.imageUrl, "image") ?? ""} alt={photo.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      )}
                      {isVideo && <><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" /><div className="absolute inset-0 flex items-center justify-center"><span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-sm"><span className="ml-1 h-0 w-0 border-y-[8px] border-l-[14px] border-y-transparent border-l-white" /></span></div></>}
                    </div>
                    <p className="mt-2.5 text-sm font-semibold leading-snug text-foreground">{photo.title || (isVideo ? "Video" : "Foto")}</p>
                  </button>
                );
              })}
            </div>
            {visibleGallery.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">Belum ada {galleryTab === "video" ? "video" : "foto"} yang tersedia.</div>}
          </section>
        )}
      </div>
      {activeMedia && (() => {
        const activeYtId = getYtId(activeMedia.imageUrl);
        const activeIsShort = isYoutubeShort(activeMedia.imageUrl);
        const activeIsLocal = isLocalVideo(activeMedia.imageUrl);
        const activeGDriveId = getGDriveId(activeMedia.imageUrl);
        return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.88)" }} onClick={() => setActiveMedia(null)}>
          <div className={`relative ${activeIsShort || activeIsLocal ? "w-full max-w-xs" : "w-full max-w-3xl"}`} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setActiveMedia(null)} className="absolute -top-10 right-0 flex items-center gap-1 text-sm text-white/80 transition-colors hover:text-white"><X size={20} /> Tutup</button>
            {activeMedia.title && <p className="mb-3 line-clamp-1 text-lg font-semibold text-white">{activeMedia.title}</p>}
            <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl" style={{ paddingBottom: activeIsShort || activeIsLocal ? "177.78%" : "56.25%" }}>
              {activeIsLocal ? <video className="absolute inset-0 h-full w-full" src={getMediaSrc(activeMedia.imageUrl, "video") ?? undefined} controls autoPlay playsInline /> : activeYtId ? <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube.com/embed/${activeYtId}?autoplay=1&rel=0`} title={activeMedia.title || "Video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : activeGDriveId ? <iframe className="absolute inset-0 h-full w-full" src={`https://drive.google.com/file/d/${activeGDriveId}/preview`} title={activeMedia.title || "Video Google Drive"} allow="autoplay; fullscreen" allowFullScreen /> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 text-white"><p className="text-sm text-white/60">Tidak dapat memuat video</p><a href={activeMedia.imageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-white/80 underline hover:text-white">Buka di tab baru</a></div>}
            </div>
          </div>
        </div>;
      })()}
    </article>
  );
}