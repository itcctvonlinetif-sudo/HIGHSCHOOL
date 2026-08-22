import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useGetClasses } from "@workspace/api-client-react";
import { Link } from "wouter";
import { AlertCircle, ArrowRight, BookOpen, Eye, EyeOff, ImageOff, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { toGDriveImageUrl } from "@/lib/gdrive";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION_KEY = "kelas_access_granted";
const DEFAULT_TITLE = "Kelas Warga";
const DEFAULT_DESCRIPTION = "Ruang belajar bersama untuk bertumbuh dalam ilmu, adab, dan kebersamaan.";
const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760">
    <rect width="1200" height="760" fill="#e7eee8"/>
    <path d="M0 620C220 535 355 660 575 570s390-115 625 4v186H0Z" fill="#cbdccc"/>
    <path d="M220 545V320l380-172 380 172v225H220Z" fill="#0a4d2e"/>
    <path d="m178 322 422-205 422 205-28 42-394-192-394 192Z" fill="#d4af37"/>
    <path d="M430 545V390c0-67 54-121 121-121s121 54 121 121v155Z" fill="#f7f2e6"/>
    <circle cx="551" cy="182" r="33" fill="#d4af37"/>
    <path d="M552 112v-40M521 88l31-28 31 28" stroke="#d4af37" stroke-width="12" fill="none"/>
    <path d="M275 394h70v151h-70zm582 0h70v151h-70z" fill="#f7f2e6"/>
  </svg>
`)}`;

interface AccessSettings {
  classesPageTitle: string;
  classesPageDescription: string;
  hasPassword: boolean;
}

function getMediaSrc(url: string | null | undefined) {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith("/api/storage")) return `${BASE}${url}`;
  return toGDriveImageUrl(url);
}

export function Kelas() {
  const { data: classes, isLoading: classesLoading, isError: classesError, refetch } = useGetClasses({ published: true });
  const [accessSettings, setAccessSettings] = useState<AccessSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [settingsRetry, setSettingsRetry] = useState(0);
  const [accessGranted, setAccessGranted] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSettingsLoading(true);
    setSettingsError(false);

    fetch(`${BASE}/api/classes/access-settings`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Gagal memuat pengaturan akses");
        return response.json() as Promise<AccessSettings>;
      })
      .then((data) => {
        if (cancelled) return;
        const settings = {
          classesPageTitle: data.classesPageTitle || DEFAULT_TITLE,
          classesPageDescription: data.classesPageDescription || DEFAULT_DESCRIPTION,
          hasPassword: data.hasPassword !== false,
        };
        setAccessSettings(settings);
        if (!settings.hasPassword || sessionStorage.getItem(SESSION_KEY) === "true") {
          if (!settings.hasPassword) sessionStorage.setItem(SESSION_KEY, "true");
          setAccessGranted(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSettingsError(true);
        setAccessSettings(null);
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [settingsRetry]);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVerifying(true);
    setVerifyError("");

    try {
      const response = await fetch(`${BASE}/api/classes/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setVerifyError(data.message || "Password yang dimasukkan belum tepat.");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "true");
      setAccessGranted(true);
      setPassword("");
    } catch {
      setVerifyError("Koneksi ke server gagal. Silakan coba lagi.");
    } finally {
      setVerifying(false);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAccessGranted(false);
    setPassword("");
    setVerifyError("");
  };

  const pageTitle = accessSettings?.classesPageTitle || DEFAULT_TITLE;
  const pageDescription = accessSettings?.classesPageDescription || DEFAULT_DESCRIPTION;

  if (settingsLoading) {
    return (
      <main className="min-h-[70dvh] bg-background px-4 py-16">
        <div className="mx-auto max-w-6xl animate-pulse space-y-10">
          <div className="h-44 rounded-[2rem] bg-primary/10" />
          <div className="mx-auto h-72 max-w-md rounded-[2rem] bg-muted" />
        </div>
      </main>
    );
  }

  if (settingsError || !accessSettings) {
    return (
      <main className="flex min-h-[70dvh] items-center justify-center bg-background px-4 py-16">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-xl shadow-primary/5">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle size={26} />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Halaman belum siap</h1>
          <p className="mb-6 text-sm leading-6 text-muted-foreground">Pengaturan akses Kelas belum dapat dimuat. Coba segarkan halaman ini.</p>
          <button
            type="button"
            onClick={() => setSettingsRetry((value) => value + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90"
          >
            <RefreshCw size={16} /> Coba lagi
          </button>
        </div>
      </main>
    );
  }

  if (!accessGranted) {
    return (
      <main className="min-h-[calc(100dvh-4rem)] bg-background">
        <section className="relative overflow-hidden bg-primary px-4 pb-24 pt-16 text-primary-foreground md:pt-24">
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border border-secondary/30" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full border border-secondary/20" />
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-5 flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-secondary uppercase">
              <span className="h-px w-10 bg-secondary" /> Ruang belajar warga
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">{pageTitle}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-primary-foreground/75 md:text-lg">{pageDescription}</p>
          </div>
        </section>

        <section className="relative mx-auto -mt-12 max-w-6xl px-4 pb-20">
          <div className="mx-auto max-w-md rounded-[2rem] border border-border bg-card p-7 shadow-2xl shadow-primary/10 md:p-9">
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
              <LockKeyhole size={26} />
            </div>
            <p className="mb-2 text-xs font-bold tracking-[0.16em] text-secondary uppercase">Akses warga</p>
            <h2 className="text-3xl font-bold">Materi untuk dipelajari bersama.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Masukkan password warga untuk membuka kumpulan Kelas Musholla Nurul Iman.</p>

            <form onSubmit={handleVerify} className="mt-7 space-y-4">
              <div>
                <label htmlFor="kelas-password" className="mb-2 block text-sm font-semibold text-foreground">Password akses</label>
                <div className="relative">
                  <input
                    id="kelas-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setVerifyError(""); }}
                    placeholder="Masukkan password"
                    autoFocus
                    required
                    className="w-full rounded-xl border border-input bg-background px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground transition hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {verifyError && <p className="mt-2 flex items-center gap-2 text-sm text-destructive"><AlertCircle size={15} /> {verifyError}</p>}
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying ? "Memeriksa akses..." : "Buka Kelas"} {!verifying && <ArrowRight size={17} />}
              </button>
            </form>
            <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
              <ShieldCheck size={15} className="text-primary" /> Akses tersimpan selama sesi ini.
            </div>
          </div>
        </section>
      </main>
    );
  }

  const publishedClasses = Array.isArray(classes) ? classes : [];

  return (
    <main className="min-h-screen bg-background pb-20">
      <section className="relative overflow-hidden bg-primary px-4 pb-16 pt-14 text-primary-foreground md:pb-24 md:pt-20">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-secondary/5 [clip-path:polygon(40%_0,100%_0,100%_100%,0_100%)]" />
        <div className="relative mx-auto flex max-w-6xl items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-secondary uppercase">
              <BookOpen size={17} /> Ruang belajar warga
            </div>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">{pageTitle}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/75 md:text-lg">{pageDescription}</p>
          </div>
          {accessSettings.hasPassword && (
            <button
              type="button"
              onClick={handleLock}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2.5 text-sm font-semibold text-primary-foreground backdrop-blur-sm transition hover:bg-primary-foreground/20"
            >
              <LockKeyhole size={16} /> <span className="hidden sm:inline">Kunci</span>
            </button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-10 md:px-6 md:pt-14">
        {classesLoading ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-[25rem] animate-pulse rounded-[1.5rem] bg-muted" />)}
          </div>
        ) : classesError ? (
          <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
            <AlertCircle className="mx-auto mb-4 text-destructive" size={26} />
            <h2 className="mb-2 text-xl font-bold">Materi belum dapat dimuat</h2>
            <p className="mb-5 text-sm text-muted-foreground">Periksa koneksi Anda, lalu coba lagi.</p>
            <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">
              <RefreshCw size={16} /> Muat ulang
            </button>
          </div>
        ) : publishedClasses.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-card px-6 py-20 text-center">
            <BookOpen className="mx-auto mb-4 text-secondary" size={30} />
            <h2 className="mb-2 text-2xl font-bold">Kelas sedang disiapkan</h2>
            <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">Belum ada materi yang diterbitkan. Silakan kembali lagi untuk menemukan kelas baru dari musholla.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {publishedClasses.map((item) => (
              <Link href={`/kelas/${item.id}`} key={item.id} className="group relative block aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm" aria-label={`Buka kelas ${item.title}`}>
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={getMediaSrc(item.imageUrl)}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    onError={(event) => {
                      if (event.currentTarget.dataset.fallbackApplied) return;
                      event.currentTarget.dataset.fallbackApplied = "true";
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-12">
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-white/75">{item.excerpt}</p>
                </div>
                {!item.imageUrl && <span className="absolute right-3 top-3 rounded-full bg-background/80 p-2 text-muted-foreground backdrop-blur-sm" title="Gambar belum tersedia"><ImageOff size={15} /></span>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}