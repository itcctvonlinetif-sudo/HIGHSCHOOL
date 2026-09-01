import { useGetClassById, useGetClassGallery } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, BookOpen, Calendar, Image as ImageIcon, User, X } from "lucide-react";
import { useState } from "react";
import { toGDriveImageUrl, toGDriveVideoUrl } from "@/lib/gdrive";
import { MediaThumbnail } from "@/components/MediaThumbnail";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION_KEY = "kelas_access_granted";

function getMediaSrc(url: string | null | undefined, mediaType: "image" | "video" = "image") {
  if (!url) return null;
  if (url.startsWith("/api/storage")) return `${BASE}${url}`;
  return mediaType === "video" ? toGDriveVideoUrl(url) : toGDriveImageUrl(url);
}

function getMediaPoster(url: string | null | undefined, mediaType: "image" | "video") {
  if (!url || mediaType !== "video" || url.startsWith("/api/storage")) return null;
  return toGDriveImageUrl(url);
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
  const [activeMedia, setActiveMedia] = useState<{ src: string; type: "image" | "video" } | null>(null);

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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {activeGallery.map((photo) => <button key={photo.id} type="button" onClick={() => { const type = photo.mediaType === "video" ? "video" : "image"; const src = getMediaSrc(photo.imageUrl, type); if (src) setActiveMedia({ src, type }); }} className="group relative aspect-square overflow-hidden rounded-2xl bg-muted text-left shadow-sm">
                {photo.mediaType === "video" ? <MediaThumbnail src={getMediaSrc(photo.imageUrl, "video") ?? ""} title={photo.title} poster={getMediaPoster(photo.imageUrl, "video")} className="transition duration-500 group-hover:scale-105" /> : <img src={getMediaSrc(photo.imageUrl, "image") ?? ""} alt={photo.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                <span className="sr-only">{photo.title}</span>
              </button>)}
            </div>
          </section>
        )}
      </div>
      {activeMedia && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setActiveMedia(null)}><div className="relative max-h-[90vh] max-w-5xl" onClick={(event) => event.stopPropagation()}>{activeMedia.type === "video" ? <video src={activeMedia.src} controls autoPlay className="max-h-[85vh] max-w-full rounded-2xl object-contain" /> : <img src={activeMedia.src} alt="Foto galeri kelas" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />}<button type="button" onClick={() => setActiveMedia(null)} className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white"><X size={18} /></button></div></div>}
    </article>
  );
}