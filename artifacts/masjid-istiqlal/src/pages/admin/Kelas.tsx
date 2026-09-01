import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  getGetClassesQueryKey,
  getGetClassGalleryQueryKey,
  useCreateClass,
  useCreateClassGalleryItem,
  useDeleteClassGalleryItem,
  useUpdateClassGalleryItem,
  useDeleteClass,
  useGetClassGallery,
  useGetClasses,
  useUpdateClass,
} from "@workspace/api-client-react";
import type { Class as ClassItem, ClassGalleryItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, Clock3, Edit2, Eye, EyeOff, Image as ImageIcon, LockKeyhole, Plus, Save, Settings2, Trash2, Video, X } from "lucide-react";
import { toGDriveImageUrl } from "@/lib/gdrive";
import { useToast } from "@/hooks/use-toast";
import { MediaUploadInput } from "@/components/MediaUploadInput";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ClassForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  author: string;
  isPublished: boolean;
}

interface AccessForm {
  classesPageTitle: string;
  classesPageDescription: string;
  classesAccessPassword: string;
  hasPassword: boolean;
}

interface GalleryForm {
  title: string;
  imageUrl: string;
  mediaType: "image" | "video";
  isActive: boolean;
}

const defaultForm: ClassForm = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  imageUrl: "",
  author: "Admin",
  isPublished: true,
};

const defaultAccessForm: AccessForm = {
  classesPageTitle: "",
  classesPageDescription: "",
  classesAccessPassword: "",
  hasPassword: true,
};

const defaultGalleryForm: GalleryForm = {
  title: "",
  imageUrl: "",
  mediaType: "image",
  isActive: true,
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function getClassMedia(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith("/api/storage")) return `${BASE}${url}`;
  return toGDriveImageUrl(url);
}

function getYtId(url: string): string | null {
  const match = url?.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
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

function ClassGalleryPanel({
  classId,
  items,
  isLoading,
  form,
  setForm,
  onAdd,
  editingGalleryId,
  onEdit,
  isSaving,
  onDelete,
  isDeleting,
}: {
  classId: number;
  items: ClassGalleryItem[] | undefined;
  isLoading: boolean;
  form: GalleryForm;
  setForm: React.Dispatch<React.SetStateAction<GalleryForm>>;
  onAdd: () => void;
  editingGalleryId: number | null;
  onEdit: (item: ClassGalleryItem) => void;
  isSaving: boolean;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const [galleryTab, setGalleryTab] = useState<"image" | "video">("image");
  const photos = items?.filter((item) => item.mediaType !== "video") ?? [];
  const videos = items?.filter((item) => item.mediaType === "video") ?? [];
  const visibleItems = galleryTab === "video" ? videos : photos;

  return (
    <section className="space-y-5 border-t border-border pt-6" aria-labelledby={`class-gallery-heading-${classId}`}>
      <div>
        <p className="mb-1 text-xs font-bold tracking-[0.14em] text-secondary uppercase">Dokumentasi</p>
        <h3 id={`class-gallery-heading-${classId}`} className="text-xl font-bold text-foreground">Galeri Kelas</h3>
        <p className="mt-1 text-sm text-muted-foreground">Tambahkan banyak foto untuk ditampilkan di halaman detail kelas.</p>
      </div>
                     <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="gallery-title" className="mb-2 block text-sm font-semibold">Judul media</label>
            <input id="gallery-title" type="text" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Contoh: Sesi pembukaan" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" required />
          </div>
          <label className="flex cursor-pointer items-end gap-3 pb-3 text-sm font-semibold">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-input accent-primary" />
            Tampilkan di detail kelas
          </label>
        </div>
        <div className="mt-4">
          <label htmlFor="gallery-media-type" className="mb-2 block text-sm font-semibold">Jenis media</label>
          <select id="gallery-media-type" value={form.mediaType} onChange={(event) => setForm((current) => ({ ...current, mediaType: event.target.value as GalleryForm["mediaType"] }))} className="mb-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10">
            <option value="image">Foto</option>
            <option value="video">Video</option>
          </select>
          <MediaUploadInput label="Sumber media" value={form.imageUrl} onChange={(imageUrl) => setForm((current) => ({ ...current, imageUrl }))} onMediaTypeChange={(mediaType) => setForm((current) => ({ ...current, mediaType }))} accept="image/*,video/*" placeholder="https://... atau link Google Drive" />
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onAdd} disabled={isSaving || !form.imageUrl || !form.title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60">
            <Plus size={16} /> {isSaving ? "Menyimpan..." : "Tambah ke Galeri"}
          </button>
        </div>
      </div>
      {!isLoading && items && items.length > 0 && (
        <div className="mb-5 flex w-fit gap-1 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setGalleryTab("image")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${galleryTab === "image" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ImageIcon size={16} /> Foto <span className="text-xs opacity-60">({photos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setGalleryTab("video")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${galleryTab === "video" ? "bg-background text-red-600 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Video size={16} /> Video <span className="text-xs opacity-60">({videos.length})</span>
          </button>
        </div>
      )}
      {isLoading ? <div className="py-8 text-center text-sm text-muted-foreground">Memuat galeri...</div> : items && items.length > 0 ? (
        visibleItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibleItems.map((photo) => {
              const src = getClassMedia(photo.imageUrl);
              const ytId = photo.mediaType === "video" ? getYtId(photo.imageUrl) : null;
              const gdriveId = photo.mediaType === "video" ? getGDriveId(photo.imageUrl) : null;
              const localVideo = photo.mediaType === "video" && isLocalVideo(photo.imageUrl);
            return (
               <div key={photo.id} className={`group relative ${photo.mediaType === "video" ? "aspect-[5/8]" : "aspect-square"} overflow-hidden rounded-xl border border-border bg-muted`}>
                 {photo.mediaType === "video" ? (
                   localVideo ? <video src={`${BASE}${photo.imageUrl}`} className="h-full w-full object-cover" muted preload="metadata" /> :
                   ytId ? <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={photo.title} className="h-full w-full object-cover" /> :
                   gdriveId ? <img src={`https://drive.google.com/thumbnail?id=${gdriveId}&sz=w1000`} alt={photo.title} className="h-full w-full object-cover" /> :
                   <div className="flex h-full items-center justify-center text-muted-foreground"><Video size={30} /></div>
                 ) : src ? <img src={src} alt={photo.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="text-muted-foreground/50" size={26} /></div>}
                 {photo.mediaType === "video" && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"><span className="ml-1 h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-white" /></span></div>}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-8">
                  <p className="truncate text-sm font-semibold text-white">{photo.title}</p>
                  <div className="mt-2 flex gap-1.5">
                    <button type="button" onClick={() => onEdit(photo)} className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs font-semibold text-white hover:bg-primary" disabled={isSaving}>
                      <Edit2 size={12} /> {editingGalleryId === photo.id ? "Mengedit" : "Edit"}
                    </button>
                    <button type="button" onClick={() => { if (window.confirm(`Hapus foto "${photo.title}"?`)) onDelete(photo.id); }} className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs font-semibold text-white hover:bg-destructive" disabled={isDeleting}>
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        ) : <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">Belum ada {galleryTab === "video" ? "video" : "foto"} di galeri kelas ini.</div>
      ) : <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">Belum ada media di galeri kelas ini.</div>}
    </section>
  );
}

export function AdminKelas() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: classes, isLoading, isError } = useGetClasses();
  const [activeTab, setActiveTab] = useState<"classes" | "access">("classes");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ClassForm>(defaultForm);
  const [accessForm, setAccessForm] = useState<AccessForm>(defaultAccessForm);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [accessSaving, setAccessSaving] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");
  const [galleryForm, setGalleryForm] = useState<GalleryForm>(defaultGalleryForm);
  const [editingGalleryId, setEditingGalleryId] = useState<number | null>(null);
  const { data: classGallery, isLoading: galleryLoading } = useGetClassGallery(editingId ?? 0, {
    query: { enabled: editingId !== null },
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
    setGalleryForm(defaultGalleryForm);
    setEditingGalleryId(null);
  };

  const invalidateClasses = () => {
    queryClient.invalidateQueries({ queryKey: getGetClassesQueryKey() });
  };

  const createMutation = useCreateClass({
    mutation: {
      onSuccess: () => {
        invalidateClasses();
        toast({ title: "Kelas ditambahkan", description: "Materi baru berhasil disimpan." });
        closeForm();
      },
      onError: () => toast({ variant: "destructive", title: "Gagal menyimpan", description: "Kelas belum berhasil ditambahkan." }),
    },
  });

  const updateMutation = useUpdateClass({
    mutation: {
      onSuccess: () => {
        invalidateClasses();
        toast({ title: "Kelas diperbarui", description: "Perubahan materi sudah disimpan." });
        closeForm();
      },
      onError: () => toast({ variant: "destructive", title: "Gagal menyimpan", description: "Perubahan kelas belum berhasil disimpan." }),
    },
  });

  const deleteMutation = useDeleteClass({
    mutation: {
      onSuccess: () => {
        invalidateClasses();
        toast({ title: "Kelas dihapus", description: "Materi telah dihapus dari daftar." });
      },
      onError: () => toast({ variant: "destructive", title: "Gagal menghapus", description: "Kelas belum berhasil dihapus." }),
    },
  });

  const createGalleryMutation = useCreateClassGalleryItem({
    mutation: {
      onSuccess: () => {
        if (editingId !== null) queryClient.invalidateQueries({ queryKey: getGetClassGalleryQueryKey(editingId) });
        setGalleryForm(defaultGalleryForm);
        setEditingGalleryId(null);
        toast({ title: "Foto galeri ditambahkan", description: "Foto sudah tersimpan di kelas ini." });
      },
      onError: () => toast({ variant: "destructive", title: "Gagal menambahkan foto", description: "Foto galeri belum berhasil disimpan." }),
    },
  });

  const updateGalleryMutation = useUpdateClassGalleryItem({
    mutation: {
      onSuccess: () => {
        if (editingId !== null) queryClient.invalidateQueries({ queryKey: getGetClassGalleryQueryKey(editingId) });
        setGalleryForm(defaultGalleryForm);
        setEditingGalleryId(null);
        toast({ title: "Foto galeri diperbarui" });
      },
      onError: () => toast({ variant: "destructive", title: "Gagal memperbarui foto", description: "Perubahan foto belum berhasil disimpan." }),
    },
  });

  const deleteGalleryMutation = useDeleteClassGalleryItem({
    mutation: {
      onSuccess: () => {
        if (editingId !== null) queryClient.invalidateQueries({ queryKey: getGetClassGalleryQueryKey(editingId) });
        toast({ title: "Foto galeri dihapus" });
      },
      onError: () => toast({ variant: "destructive", title: "Gagal menghapus foto", description: "Foto galeri belum berhasil dihapus." }),
    },
  });

  useEffect(() => {
    let cancelled = false;
    setAccessLoading(true);
    setAccessError("");

    fetch(`${BASE}/api/admin/classes-access`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Pengaturan akses tidak dapat dimuat");
        return response.json() as Promise<Partial<AccessForm>>;
      })
      .then((data) => {
        if (cancelled) return;
        setAccessForm({
          classesPageTitle: data.classesPageTitle || "Kelas Warga",
          classesPageDescription: data.classesPageDescription || "Ruang belajar bersama untuk warga.",
          classesAccessPassword: "",
          hasPassword: data.hasPassword !== false,
        });
      })
      .catch(() => {
        if (!cancelled) setAccessError("Pengaturan akses belum dapat dimuat.");
      })
      .finally(() => {
        if (!cancelled) setAccessLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsFormOpen(true);
  };

  const openEdit = (item: ClassItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      slug: item.slug,
      content: item.content,
      excerpt: item.excerpt,
      imageUrl: item.imageUrl || "",
      author: item.author,
      isPublished: item.isPublished,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = { ...formData, imageUrl: formData.imageUrl || null };
    if (editingId !== null) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate({ data });
  };

  const handleGalleryAdd = () => {
    if (editingId === null || !galleryForm.title.trim() || !galleryForm.imageUrl.trim()) return;
    const data = { title: galleryForm.title.trim(), imageUrl: galleryForm.imageUrl.trim(), mediaType: galleryForm.mediaType, isActive: galleryForm.isActive };
    if (editingGalleryId !== null) updateGalleryMutation.mutate({ classId: editingId, id: editingGalleryId, data });
    else createGalleryMutation.mutate({ id: editingId, data });
  };

  const handleGalleryEdit = (photo: ClassGalleryItem) => {
    setEditingGalleryId(photo.id);
    setGalleryForm({ title: photo.title, imageUrl: photo.imageUrl, mediaType: photo.mediaType === "video" ? "video" : "image", isActive: photo.isActive });
  };

  const handleSaveAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccessSaving(true);
    try {
      const body: Record<string, string> = {
        classesPageTitle: accessForm.classesPageTitle,
        classesPageDescription: accessForm.classesPageDescription,
      };
      if (accessForm.classesAccessPassword.trim()) body.classesAccessPassword = accessForm.classesAccessPassword;

      const response = await fetch(`${BASE}/api/admin/classes-access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Pengaturan belum berhasil disimpan.");

      toast({ title: "Pengaturan disimpan", description: data.message || "Halaman Kelas berhasil diperbarui." });
      setAccessForm((current) => ({ ...current, classesAccessPassword: "", hasPassword: true }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan pengaturan",
        description: error instanceof Error ? error.message : "Koneksi ke server gagal.",
      });
    } finally {
      setAccessSaving(false);
    }
  };

  const items = Array.isArray(classes) ? classes : [];
  const formBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-secondary uppercase"><BookOpen size={15} /> Galeri Siswa </div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Galeri Kelas</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">Kelola Galeri Kelas dan Utility </p>
        </div>
        {activeTab === "classes" && (
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:bg-primary/90">
            <Plus size={18} /> Tambah Galeri Kelas
          </button>
        )}
      </header>

      <div className="flex w-fit gap-1 rounded-xl border border-border bg-muted p-1">
        <button type="button" onClick={() => setActiveTab("classes")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === "classes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          Daftar Kelas
        </button>
        <button type="button" onClick={() => setActiveTab("access")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === "access" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Settings2 size={15} /> Pengaturan Akses
        </button>
      </div>

      {activeTab === "classes" && (
        <>
          <div className="flex w-fit gap-1 rounded-xl border border-border bg-muted p-1">
            <button type="button" onClick={() => setViewMode("list")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Daftar Galeri</button>
            <button type="button" onClick={() => setViewMode("gallery")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${viewMode === "gallery" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><ImageIcon size={15} /> Galeri Kelas</button>
          </div>
          {viewMode === "gallery" && (
            <section aria-label="Galeri Kelas">
              {isLoading ? <div className="py-12 text-center text-sm text-muted-foreground">Memuat galeri kelas...</div> : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center"><ImageIcon className="mx-auto mb-3 text-secondary" size={28} /><p className="text-sm text-muted-foreground">Belum ada galeri kelas untuk ditampilkan.</p></div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {items.map((item) => {
                    const src = getClassImage(item.imageUrl);
                    return <button type="button" key={item.id} onClick={() => openEdit(item)} className="group relative aspect-square overflow-hidden rounded-2xl bg-muted text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                      {src ? <img src={src} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="flex h-full w-full items-center justify-center"><ImageIcon className="text-muted-foreground/50" size={30} /></div>}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 pt-12"><p className="font-semibold text-white">{item.title}</p><p className="mt-1 text-xs text-white/70">{item.isPublished ? "Terbit" : "Draft"}</p></div>
                    </button>;
                  })}
                </div>
              )}
            </section>
          )}
          {viewMode === "list" && (
          <>
          {isFormOpen && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-primary/5 md:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold tracking-[0.14em] text-secondary uppercase">{editingId !== null ? "Perbarui materi" : "Materi baru"}</p>
                  <h2 className="text-2xl font-bold text-foreground">{editingId !== null ? "Edit Kelas" : "Tambah Kelas"}</h2>
                </div>
                <button type="button" onClick={closeForm} aria-label="Tutup formulir" className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><X size={19} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="class-title" className="mb-2 block text-sm font-semibold">Judul Galeri</label>
                    <input id="class-title" type="text" value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value, slug: editingId === null ? slugify(event.target.value) : current.slug }))} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" required />
                  </div>
                  <div>
                    <label htmlFor="class-author" className="mb-2 block text-sm font-semibold">Penulis</label>
                    <input id="class-author" type="text" value={formData.author} onChange={(event) => setFormData((current) => ({ ...current, author: event.target.value }))} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="class-slug" className="mb-2 block text-sm font-semibold">Slug</label>
                  <input id="class-slug" type="text" value={formData.slug} onChange={(event) => setFormData((current) => ({ ...current, slug: slugify(event.target.value) }))} className="w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" required />
                </div>
                <MediaUploadInput label="Gambar Kelas (Opsional)" value={formData.imageUrl} onChange={(imageUrl) => setFormData((current) => ({ ...current, imageUrl }))} accept="image/*" placeholder="https://..." />
                <div>
                  <label htmlFor="class-excerpt" className="mb-2 block text-sm font-semibold">Ringkasan</label>
                  <textarea id="class-excerpt" value={formData.excerpt} onChange={(event) => setFormData((current) => ({ ...current, excerpt: event.target.value }))} rows={3} className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" required />
                </div>
                <div>
                  <label htmlFor="class-content" className="mb-2 block text-sm font-semibold">Konten Galeri Kelas (HTML)</label>
                  <textarea id="class-content" value={formData.content} onChange={(event) => setFormData((current) => ({ ...current, content: event.target.value }))} rows={9} className="w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" required />
                </div>
                 {editingId !== null && (
                   <ClassGalleryPanel
                     classId={editingId}
                     items={classGallery}
                     isLoading={galleryLoading}
                     form={galleryForm}
                     setForm={setGalleryForm}
                     onAdd={handleGalleryAdd}
                     isSaving={createGalleryMutation.isPending || updateGalleryMutation.isPending}
                     editingGalleryId={editingGalleryId}
                     onEdit={handleGalleryEdit}
                     onDelete={(id) => deleteGalleryMutation.mutate({ classId: editingId, id })}
                     isDeleting={deleteGalleryMutation.isPending}
                   />
                 )}
                 <label className="flex cursor-pointer items-center gap-3 border-t border-border pt-5 text-sm font-semibold">
                  <input type="checkbox" checked={formData.isPublished} onChange={(event) => setFormData((current) => ({ ...current, isPublished: event.target.checked }))} className="h-4 w-4 rounded border-input text-primary accent-primary" />
                  Terbitkan Galeri kelas ini
                </label>
                <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
                  <button type="button" onClick={closeForm} className="rounded-xl px-5 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">Batal</button>
                  <button type="submit" disabled={formBusy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                    <Save size={16} /> {formBusy ? "Menyimpan..." : editingId !== null ? "Simpan Perubahan" : "Simpan Kelas"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-border bg-muted/60 text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">
                  <tr><th className="px-6 py-4">Kelas</th><th className="px-6 py-4">Penulis</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                </thead>
                <tbody>
                  {isLoading && <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">Memuat daftar kelas...</td></tr>}
                  {isError && <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-destructive">Daftar kelas belum dapat dimuat.</td></tr>}
                  {!isLoading && !isError && items.length === 0 && <tr><td colSpan={4} className="px-6 py-16 text-center"><BookOpen className="mx-auto mb-3 text-secondary" size={26} /><p className="text-sm text-muted-foreground">Belum ada materi kelas.</p></td></tr>}
                  {!isLoading && !isError && items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 transition hover:bg-muted/30">
                      <td className="max-w-sm px-6 py-4"><p className="font-semibold text-foreground">{item.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.excerpt}</p></td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.author}</td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${item.isPublished ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary-foreground"}`}>{item.isPublished ? <Eye size={13} /> : <Clock3 size={13} />}{item.isPublished ? "Terbit" : "Draft"}</span></td>
                      <td className="px-6 py-4 text-right"><button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className="mr-1 rounded-lg p-2 text-primary transition hover:bg-primary/10"><Edit2 size={17} /></button><button type="button" onClick={() => { if (window.confirm("Hapus kelas ini?")) deleteMutation.mutate({ id: item.id }); }} aria-label={`Hapus ${item.title}`} className="rounded-lg p-2 text-destructive transition hover:bg-destructive/10"><Trash2 size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-border md:hidden">
              {isLoading && <div className="px-5 py-12 text-center text-sm text-muted-foreground">Memuat daftar kelas...</div>}
              {isError && <div className="px-5 py-12 text-center text-sm text-destructive">Daftar kelas belum dapat dimuat.</div>}
              {!isLoading && !isError && items.length === 0 && <div className="px-5 py-14 text-center text-sm text-muted-foreground">Belum ada materi kelas.</div>}
              {!isLoading && !isError && items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0"><p className="truncate font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.author}</p><span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.isPublished ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary-foreground"}`}>{item.isPublished ? "Terbit" : "Draft"}</span></div>
                  <div className="flex shrink-0 gap-1"><button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Edit2 size={17} /></button><button type="button" onClick={() => { if (window.confirm("Hapus kelas ini?")) deleteMutation.mutate({ id: item.id }); }} aria-label={`Hapus ${item.title}`} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 size={17} /></button></div>
                </div>
              ))}
            </div>
          </section>
          </>
          )}
        </>
      )}

      {activeTab === "access" && (
        <section className="max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"><LockKeyhole size={22} /></div>
            <div><h2 className="text-2xl font-bold text-foreground">Pengaturan akses</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Atur identitas halaman Galeri Kelas dan password yang digunakan untuk login . Password tersimpan tidak ditampilkan.</p></div>
          </div>
          {accessLoading ? <div className="space-y-4"><div className="h-12 animate-pulse rounded-xl bg-muted" /><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="h-12 animate-pulse rounded-xl bg-muted" /></div> : accessError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive"><div className="flex items-center gap-2"><AlertCircle size={17} /> {accessError}</div><p className="mt-2 text-xs text-muted-foreground">Segarkan halaman untuk mencoba kembali.</p></div>
          ) : (
            <form onSubmit={handleSaveAccess} className="space-y-5">
              <div><label htmlFor="access-title" className="mb-2 block text-sm font-semibold">Judul halaman</label><input id="access-title" type="text" value={accessForm.classesPageTitle} onChange={(event) => setAccessForm((current) => ({ ...current, classesPageTitle: event.target.value }))} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" required /></div>
              <div><label htmlFor="access-description" className="mb-2 block text-sm font-semibold">Deskripsi halaman</label><textarea id="access-description" value={accessForm.classesPageDescription} onChange={(event) => setAccessForm((current) => ({ ...current, classesPageDescription: event.target.value }))} rows={4} className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" required /></div>
              <div className="border-t border-border pt-5"><div className="mb-2 flex items-center gap-2"><label htmlFor="access-password" className="text-sm font-semibold">Password warga</label><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{accessForm.hasPassword ? "Aktif" : "Belum diset"}</span></div><p className="mb-3 text-xs leading-5 text-muted-foreground">Isi hanya jika ingin membuat password baru. Nilai password tersimpan tidak pernah ditampilkan.</p><div className="relative"><input id="access-password" type={showNewPassword ? "text" : "password"} value={accessForm.classesAccessPassword} onChange={(event) => setAccessForm((current) => ({ ...current, classesAccessPassword: event.target.value }))} placeholder="Password baru (opsional)" className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" /><button type="button" aria-label={showNewPassword ? "Sembunyikan password baru" : "Tampilkan password baru"} onClick={() => setShowNewPassword((value) => !value)} className="absolute inset-y-0 right-0 px-4 text-muted-foreground hover:text-primary">{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <div className="flex justify-end border-t border-border pt-5"><button type="submit" disabled={accessSaving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} /> {accessSaving ? "Menyimpan..." : "Simpan Pengaturan"}</button></div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}