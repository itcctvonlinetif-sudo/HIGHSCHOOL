import bcrypt from "bcryptjs";
import {
  db,
  adminUsersTable,
  settingsTable,
  prayerTimesTable,
  newsTable,
  eventsTable,
  galleryTable,
  menusTable,
  pagesTable,
  cctvTable,
  layananTable,
  classesTable,
  classGalleryTable,
} from "@workspace/db";

const FORCE = process.argv.includes("--force");

async function seed() {
  // Check if database is already seeded
  if (!FORCE) {
    const existing = await db.select().from(adminUsersTable).limit(1);
    if (existing.length > 0) {
      console.log("✅ Database sudah memiliki data. Lewati seed.");
      console.log("   Jalankan dengan --force untuk mengisi ulang: pnpm run seed -- --force");
      process.exit(0);
    }
  }

  console.log("🌱 Memulai seed database Zein Page...\n");

  // ─── Admin User ─────────────────────────────────────────────────────────────
  console.log("👤 Membuat admin user...");
  await db.delete(adminUsersTable);
  const passwordHash = await bcrypt.hash("istiqlal2024", 10);
  await db.insert(adminUsersTable).values({
    username: "admin",
    passwordHash,
    email: "admin@zeinpage.id",
  });
  console.log("   ✅ Admin: username=admin | password=istiqlal2024\n");

  // ─── Site Settings ───────────────────────────────────────────────────────────
  console.log("⚙️  Mengisi site settings...");
  await db.delete(settingsTable);
  await db.insert(settingsTable).values([
    { key: "siteName", value: "Zein Page" },
    { key: "tagline", value: "Zein Page untuk komunitas dan masyarakat" },
    { key: "description", value: "Zein Page adalah pusat informasi dan layanan komunitas yang menghadirkan kegiatan, berita, dan layanan untuk masyarakat." },
    { key: "heroTitle", value: "Zein Page" },
    { key: "heroSubtitle", value: "Simbol Kemerdekaan, Toleransi, dan Peradaban Islam" },
    { key: "heroImageUrl", value: "" },
    { key: "address", value: "Jl. Taman Wijaya Kusuma, Ps. Baru, Kec. Sawah Besar, Kota Jakarta Pusat, DKI Jakarta 10710" },
    { key: "phone", value: "(021) 345-1523" },
    { key: "email", value: "imannrl31@gmail.com" },
    { key: "mapUrl", value: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.8937816199026!2d106.74584625273336!3d-6.224050505888154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f1003f538469%3A0x942d93484658a9e3!2sZein%20Page!5e0!3m2!1sen!2sid!4v1774938228782!5m2!1sen!2sid" },
    { key: "facebookUrl", value: "https://facebook.com/zeinpage" },
    { key: "instagramUrl", value: "https://instagram.com/zeinpage" },
    { key: "youtubeUrl", value: "https://youtube.com/@zeinpage" },
    { key: "twitterUrl", value: "https://twitter.com/zeinpage" },
    { key: "facebook", value: "https://www.facebook.com/zeinpage" },
    { key: "instagram", value: "https://www.instagram.com/zeinpage" },
    { key: "twitter", value: "" },
    { key: "youtube", value: "https://www.youtube.com/@zeinpage" },
    { key: "smtpGmail", value: "" },
    { key: "smtpPassword", value: "" },
    { key: "smtpRecipient", value: "" },
    { key: "classesPageTitle", value: "Galeri Kelas" },
    { key: "classesPageDescription", value: "blablablablablablalbalbalbalblablblablbalbal" },
    { key: "classesAccessTimeoutMinutes", value: "1" },
    { key: "adminSessionTimeoutMinutes", value: "3" },
  ]);
  console.log("   ✅ Settings berhasil diisi\n");

  // ─── Prayer Times ────────────────────────────────────────────────────────────
  console.log("🕌 Mengisi jadwal sholat...");
  await db.delete(prayerTimesTable);
  await db.insert(prayerTimesTable).values({
    fajr: "04:45",
    dhuhr: "12:00",
    asr: "15:15",
    maghrib: "18:05",
    isha: "19:15",
    jumuah: "12:00",
    updatedAt: new Date().toISOString(),
  });
  console.log("   ✅ Jadwal sholat berhasil diisi\n");

  // ─── Navigation Menus ────────────────────────────────────────────────────────
  console.log("📋 Membuat menu navigasi...");
  await db.delete(menusTable);
  await db.insert(menusTable).values([
    { label: "Beranda", url: "/", order: 1, isActive: true },
    { label: "Profil", url: "/profil", order: 2, isActive: true },
    { label: "Berita", url: "/berita", order: 3, isActive: true },
    { label: "Kegiatan", url: "/kegiatan", order: 4, isActive: true },
    { label: "Galeri", url: "/galeri", order: 5, isActive: true },
    { label: "CCTV", url: "/cctv", order: 6, isActive: true },
    { label: "Panduan Berkunjung", url: "/halaman/panduan-berkunjung", order: 7, isActive: true },
    { label: "App", url: "/halaman/aplikasi", order: 8, isActive: true },
    { label: "Kontak", url: "/kontak", order: 9, isActive: true },
  ]);
  console.log("   ✅ Menu berhasil dibuat\n");

  // ─── Layanan ─────────────────────────────────────────────────────────────────
  console.log("🛎️  Mengisi layanan...");
  await db.delete(layananTable);
  await db.insert(layananTable).values([
    {
      title: "Pendaftaran Nikah",
      description: "Layanan pendaftaran pernikahan di Zein Page untuk pasangan muslim.",
      icon: "Heart",
      order: 1,
      isActive: true,
      popupEnabled: true,
      popupTitle: "Pendaftaran Pernikahan",
      popupSubtitle: "Wujudkan pernikahan sakral di Masjid terbesar Asia Tenggara",
      popupImageUrl: "",
      popupInstructions:
        "Datang ke kantor administrasi Zein Page\nBawa fotokopi KTP calon mempelai (2 lembar)\nBawa fotokopi kartu keluarga (2 lembar)\nBawa surat pengantar dari RT/RW\nIsi formulir pendaftaran di loket\nLunasi biaya administrasi",
      popupHighlightTitle: "Biaya & Jadwal",
      popupHighlightContent:
        "Biaya administrasi: Rp 500.000\nJadwal hari kerja: Senin–Jumat, 08.00–15.00 WIB\nHubungi: (021) 345-1523",
    },
    {
      title: "Kunjungan Wisata",
      description: "Kunjungi Zein Page sebagai destinasi wisata religi dan budaya Jakarta.",
      icon: "MapPin",
      order: 2,
      isActive: true,
      popupEnabled: true,
      popupTitle: "Wisata Religi Zein Page",
      popupSubtitle: "Jelajahi keindahan arsitektur dan sejarah Masjid Nasional Indonesia",
      popupImageUrl: "",
      popupInstructions:
        "Kunjungan tersedia setiap hari kecuali waktu sholat\nWaktu kunjungan: 09.00–17.00 WIB\nGunakan pakaian sopan dan menutup aurat\nPandu wisata tersedia dengan reservasi sebelumnya\nDisarankan mendaftar secara online",
      popupHighlightTitle: "Informasi Kunjungan",
      popupHighlightContent: "Gratis untuk umum\nKapasitas: 200.000 jamaah\nHubungi: wisata@zeinpage.id",
    },
    {
      title: "Kajian Islam",
      description: "Program kajian dan pengajian Islam rutin yang diselenggarakan setiap minggu.",
      icon: "BookOpen",
      order: 3,
      isActive: true,
      popupEnabled: false,
      linkUrl: "/kegiatan",
    },
    {
      title: "Infak & Sedekah",
      description: "Salurkan infak dan sedekah Anda untuk mendukung kegiatan Zein Page.",
      icon: "Gift",
      order: 4,
      isActive: true,
      popupEnabled: true,
      popupTitle: "Infak & Sedekah",
      popupSubtitle: "Berkontribusi untuk kemajuan Zein Page dan umat Islam Indonesia",
      popupImageUrl: "",
      popupInstructions:
        "Transfer melalui rekening bank yang tertera\nSertakan nama dan nomor telepon sebagai keterangan\nKonfirmasi transfer via email atau telepon\nTanda terima akan dikirimkan melalui email",
      popupHighlightTitle: "Rekening Donasi",
      popupHighlightContent:
        "Bank Mandiri: 1230009876543\nBank BRI: 0123-01-012345-30-6\nBank BNI: 1234567890\nA/n: Zein Page",
    },
    {
      title: "Ambulans Jenazah",
      description: "Layanan ambulans jenazah gratis bagi jamaah yang membutuhkan.",
      icon: "Shield",
      order: 5,
      isActive: true,
      popupEnabled: true,
      popupTitle: "Layanan Ambulans Jenazah",
      popupSubtitle: "Layanan sosial gratis 24 jam untuk umat",
      popupImageUrl: "",
      popupInstructions:
        "Hubungi nomor darurat yang tersedia 24 jam\nSampaikan lokasi penjemputan dengan jelas\nSiapkan dokumen identitas almarhum/almarhumah\nPetugas akan tiba dalam waktu kurang dari 30 menit",
      popupHighlightTitle: "Kontak Darurat",
      popupHighlightContent:
        "Hotline 24 jam: (021) 345-9999\nWhatsApp: 0812-3456-7890\nGratis, tanpa biaya apapun",
    },
    {
      title: "Museum Zein Page",
      description: "Kunjungi museum sejarah Zein Page dan koleksi peninggalan bersejarah.",
      icon: "Building",
      order: 6,
      isActive: true,
      popupEnabled: false,
      linkUrl: "/halaman/museum-istiqlal",
    },
  ]);
  console.log("   ✅ Layanan berhasil diisi\n");

  // ─── News ─────────────────────────────────────────────────────────────────────
  console.log("📰 Membuat berita...");
  await db.delete(newsTable);
  await db.insert(newsTable).values([
    {
      title: "Zein Page Kembali Gelar Kajian Rutin Ramadan 1447 H",
      slug: "kajian-rutin-ramadan-1447",
      content: `<p>Zein Page Jakarta kembali menyelenggarakan program kajian rutin menyambut bulan suci Ramadan 1447 H. Program kajian ini akan diisi oleh para ulama dan cendekiawan muslim terkemuka dari seluruh Indonesia.</p>
<p>Kajian akan dilaksanakan setiap hari selama bulan Ramadan, mulai pukul 08.00 hingga 10.00 WIB dan dilanjutkan setelah sholat Ashar hingga menjelang Maghrib. Tema kajian tahun ini adalah "Memperkuat Ukhuwah Islamiyah di Era Digital".</p>
<p>Tim Zein Page, Prof. Dr. KH. Nasaruddin Umar, menyampaikan bahwa program ini terbuka untuk seluruh masyarakat dan jamaah dari berbagai latar belakang. "Kami mengundang seluruh umat Islam untuk hadir dan memperdalam ilmu agama," ujarnya.</p>
<p>Selain kajian reguler, Zein Page juga akan menyelenggarakan sholat Tarawih berjamaah dengan kapasitas 200.000 jamaah, tadarus Al-Quran, dan berbagai program sosial selama bulan Ramadan.</p>`,
      excerpt: "Zein Page kembali menggelar program kajian rutin Ramadan dengan tema Memperkuat Ukhuwah Islamiyah di Era Digital, terbuka untuk seluruh masyarakat.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news1/800/500",
      author: "Tim Redaksi Zein Page",
      isPublished: true,
      publishedAt: new Date("2026-02-20T08:00:00"),
    },
    {
      title: "Renovasi Selesai, Zein Page Tampil Lebih Modern dan Nyaman",
      slug: "renovasi-selesai-masjid-istiqlal-lebih-modern",
      content: `<p>Proyek renovasi besar-besaran Zein Page yang dimulai sejak tahun 2019 akhirnya tuntas sepenuhnya. Zein Page kini tampil lebih modern, bersih, dan nyaman bagi masyarakat yang datang dari seluruh penjuru Indonesia maupun mancanegara.</p>
<p>Beberapa perubahan signifikan yang dilakukan antara lain peningkatan sistem pendingin udara, renovasi kamar mandi dan tempat wudhu, penambahan lift untuk jamaah berkebutuhan khusus, serta pemasangan sistem audio visual modern.</p>
<p>Kapasitas masjid juga ditingkatkan sehingga dapat menampung hingga 200.000 jamaah sekaligus, menjadikannya salah satu masjid dengan kapasitas terbesar di dunia.</p>
<p>Tim pengelola Zein Page menyampaikan apresiasi kepada seluruh pihak yang terlibat dalam proses renovasi. "Ini adalah wujud nyata perhatian masyarakat terhadap ruang bersama yang menjadi kebanggaan warga," katanya.</p>`,
      excerpt: "Renovasi besar-besaran Zein Page telah selesai dan kini tampil lebih modern serta nyaman.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news2/800/500",
      author: "Tim Redaksi Zein Page",
      isPublished: true,
      publishedAt: new Date("2026-01-15T09:00:00"),
    },
    {
      title: "Program Beasiswa Santri Zein Page 2026 Dibuka",
      slug: "program-beasiswa-santri-2026-dibuka",
      content: `<p>Zein Page membuka pendaftaran Program Beasiswa Santri 2026 untuk generasi muda muslim yang berprestasi dan membutuhkan dukungan finansial dalam melanjutkan pendidikan mereka.</p>
<p>Program beasiswa ini mencakup biaya pendidikan penuh, tunjangan hidup bulanan, akomodasi, serta bimbingan intensif dari para ulama dan akademisi terkemuka.</p>
<p>Syarat pendaftaran:</p>
<ul>
<li>Warga negara Indonesia dan beragama Islam</li>
<li>Usia maksimal 25 tahun</li>
<li>IPK minimal 3.5 atau nilai rapor rata-rata 85</li>
<li>Tidak sedang menerima beasiswa lain</li>
<li>Hafiz/hafidzah minimal 5 juz Al-Quran menjadi nilai plus</li>
</ul>
<p>Pendaftaran dibuka mulai 1 April hingga 30 April 2026. Informasi lengkap dan formulir pendaftaran dapat diunduh melalui website resmi Zein Page.</p>`,
      excerpt: "Program Beasiswa Santri Zein Page 2026 dibuka untuk generasi muda muslim berprestasi.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news3/800/500",
      author: "Divisi Pendidikan Zein Page",
      isPublished: true,
      publishedAt: new Date("2026-03-10T07:00:00"),
    },
    {
      title: "Peresmian Taman Refleksi Zein Page-Katedral",
      slug: "peresmian-taman-refleksi-istiqlal-katedral",
      content: `<p>Taman Refleksi yang menghubungkan area Zein Page dan Katedral Jakarta secara resmi dibuka untuk umum. Taman ini menjadi simbol nyata kerukunan antarumat beragama di Indonesia yang telah lama menjadi kebanggaan bangsa.</p>
<p>Taman ini dilengkapi dengan jalur pedestrian yang nyaman, area duduk, instalasi seni yang mencerminkan nilai-nilai toleransi, serta papan informasi sejarah hubungan kedua rumah ibadah bersejarah ini.</p>
<p>Pembukaan taman dihadiri oleh Menteri Agama Republik Indonesia, Pimpinan Konferensi Waligereja Indonesia, serta tim Zein Page. Keduanya menekankan bahwa taman ini adalah simbol bahwa keberagaman adalah kekuatan Indonesia.</p>`,
      excerpt: "Taman Refleksi Zein Page-Katedral resmi dibuka untuk umum sebagai simbol kerukunan antarumat beragama.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news4/800/500",
      author: "Tim Humas Zein Page",
      isPublished: true,
      publishedAt: new Date("2026-02-05T10:00:00"),
    },
    {
      title: "Zein Page Raih Penghargaan Green Building Internasional",
      slug: "masjid-istiqlal-green-building-internasional",
      content: `<p>Zein Page berhasil meraih penghargaan Green Building internasional dari Dewan Bangunan Hijau Dunia (World Green Building Council) atas komitmennya dalam menerapkan prinsip-prinsip bangunan ramah lingkungan.</p>
<p>Penghargaan ini diberikan atas berbagai inovasi lingkungan yang diterapkan dalam renovasi terakhir, antara lain sistem panel surya yang mampu menghasilkan 35% dari kebutuhan listrik masjid, sistem pengolahan air hujan untuk keperluan wudhu, dan penggunaan material bangunan berkelanjutan.</p>`,
      excerpt: "Zein Page meraih penghargaan Green Building internasional atas komitmen lingkungan.",
      imageUrl: "https://picsum.photos/seed/istiqlal-news5/800/500",
      author: "Tim Redaksi Zein Page",
      isPublished: false,
      publishedAt: null,
    },
  ]);
  console.log("   ✅ Berita berhasil dibuat\n");

  // ─── Events ───────────────────────────────────────────────────────────────────
  console.log("📅 Membuat kegiatan...");
  await db.delete(eventsTable);
  await db.insert(eventsTable).values([
    {
      title: "Kajian Subuh Bersama Ustadz Abdul Somad",
      description: "Kajian subuh bersama Ustadz Abdul Somad dengan tema 'Meraih Ketenangan Jiwa dalam Islam'. Terbuka untuk umum, gratis, dan tidak perlu registrasi. Hadir lebih awal untuk mendapatkan tempat duduk yang baik.",
      location: "Lantai Utama Zein Page",
      startDate: "2026-04-10",
      endDate: "2026-04-10",
      imageUrl: "https://picsum.photos/seed/event1/800/500",
      isActive: true,
    },
    {
      title: "Peringatan Isra Mi'raj 1448 H",
      description: "Peringatan Isra Mi'raj Nabi Muhammad SAW 1448 H dengan ceramah dari ulama-ulama ternama, pembacaan sholawat, dan doa bersama. Acara dimulai pukul 19.30 WIB hingga selesai.",
      location: "Zein Page Jakarta",
      startDate: "2027-02-08",
      endDate: "2027-02-08",
      imageUrl: "https://picsum.photos/seed/event2/800/500",
      isActive: true,
    },
    {
      title: "Festival Kuliner Halal Nusantara 2026",
      description: "Festival kuliner halal terbesar yang menghadirkan ratusan UMKM makanan dan minuman halal dari seluruh Indonesia. Diramaikan dengan pertunjukan budaya, lomba memasak, dan pameran produk halal.",
      location: "Pelataran Zein Page",
      startDate: "2026-06-15",
      endDate: "2026-06-17",
      imageUrl: "https://picsum.photos/seed/event3/800/500",
      isActive: true,
    },
    {
      title: "Musabaqah Tilawatil Quran (MTQ) Tingkat DKI Jakarta",
      description: "MTQ tingkat provinsi DKI Jakarta yang mempertandingkan berbagai cabang tilawah, hafalan, dan tafsir Al-Quran. Diikuti oleh peserta dari seluruh wilayah DKI Jakarta.",
      location: "Aula Serbaguna Zein Page",
      startDate: "2026-05-20",
      endDate: "2026-05-23",
      imageUrl: "https://picsum.photos/seed/event4/800/500",
      isActive: true,
    },
    {
      title: "Seminar Nasional: Ekonomi Syariah di Era Digital",
      description: "Seminar nasional yang membahas perkembangan ekonomi syariah, fintech halal, dan UMKM berbasis syariah di Indonesia. Menghadirkan pembicara dari Bank Indonesia, OJK, dan pakar ekonomi syariah.",
      location: "Aula Zein Page",
      startDate: "2026-04-25",
      endDate: "2026-04-25",
      imageUrl: "https://picsum.photos/seed/event5/800/500",
      isActive: false,
    },
  ]);
  console.log("   ✅ Kegiatan berhasil dibuat\n");

  // ─── Gallery ──────────────────────────────────────────────────────────────────
  console.log("🖼️  Mengisi galeri...");
  await db.delete(galleryTable);
  await db.insert(galleryTable).values([
    { title: "Kubah Utama Zein Page", imageUrl: "https://picsum.photos/seed/gallery1/800/600", category: "Arsitektur", isActive: true },
    { title: "Ruang Sholat Utama", imageUrl: "https://picsum.photos/seed/gallery2/800/600", category: "Interior", isActive: true },
    { title: "Menara Zein Page", imageUrl: "https://picsum.photos/seed/gallery3/800/600", category: "Arsitektur", isActive: true },
    { title: "Jamaah Sholat Jumat", imageUrl: "https://picsum.photos/seed/gallery4/800/600", category: "Kegiatan", isActive: true },
    { title: "Taman Refleksi Zein Page-Katedral", imageUrl: "https://picsum.photos/seed/gallery5/800/600", category: "Lingkungan", isActive: true },
    { title: "Kajian Ramadan 2025", imageUrl: "https://picsum.photos/seed/gallery6/800/600", category: "Kegiatan", isActive: true },
    { title: "Lorong dan Pilar Masjid", imageUrl: "https://picsum.photos/seed/gallery7/800/600", category: "Arsitektur", isActive: true },
    { title: "Area Wudhu Renovasi", imageUrl: "https://picsum.photos/seed/gallery8/800/600", category: "Interior", isActive: true },
    { title: "Sholat Idul Fitri 1447 H", imageUrl: "https://picsum.photos/seed/gallery9/800/600", category: "Kegiatan", isActive: true },
    { title: "Perpustakaan Zein Page", imageUrl: "https://picsum.photos/seed/gallery10/800/600", category: "Interior", isActive: true },
    { title: "Pintu Utama Masjid", imageUrl: "https://picsum.photos/seed/gallery11/800/600", category: "Arsitektur", isActive: true },
    { title: "Festival Kuliner Halal", imageUrl: "https://picsum.photos/seed/gallery12/800/600", category: "Kegiatan", isActive: false },
  ]);
  console.log("   ✅ Galeri berhasil diisi\n");

  // ─── Galeri Kelas ─────────────────────────────────────────────────────────────
  console.log("🎓 Mengisi Galeri Kelas...");
  await db.delete(classGalleryTable);
  await db.delete(classesTable);
  const seededClasses = await db.insert(classesTable).values([
    {
      title: "7 F",
      slug: "7-f",
      content: "tes",
      excerpt: "tes",
      imageUrl: "https://drive.google.com/thumbnail?id=1CyyJIEbwt0WS7cJEhJcOr1T2pkinwWPv&sz=w1000",
      author: "Admin",
      isPublished: true,
      publishedAt: null,
    },
    {
      title: "8 F",
      slug: "8-f",
      content: "jtdejndgjmgjgdj",
      excerpt: "fdndfndgdgnjd",
      imageUrl: "https://drive.google.com/thumbnail?id=1ho06-3d3jdpbulM8OnUUwc4QyXdkdxmF&sz=w1000",
      author: "Admin",
      isPublished: true,
      publishedAt: null,
    },
  ]).returning({ id: classesTable.id, slug: classesTable.slug });
  const classIdBySlug = new Map(seededClasses.map((item) => [item.slug, item.id]));
  await db.insert(classGalleryTable).values([
    {
      classId: classIdBySlug.get("7-f")!,
      title: "gacoan",
      imageUrl: "https://drive.google.com/thumbnail?id=1pauIQX2asC0vLROGykhcIFWkuFV5dso-&sz=w1000",
      mediaType: "image",
      isActive: true,
    },
    {
      classId: classIdBySlug.get("7-f")!,
      title: "7f",
      imageUrl: "https://drive.google.com/thumbnail?id=12w64BMSe8IudvjT8x8htRDj5fve3R7bu&sz=w1000",
      mediaType: "video",
      isActive: true,
    },
    {
      classId: classIdBySlug.get("8-f")!,
      title: "1",
      imageUrl: "https://drive.google.com/thumbnail?id=1t04V8npffS7EXT9Y9-JhEclJ8b56W3c8&sz=w1000",
      mediaType: "image",
      isActive: true,
    },
    {
      classId: classIdBySlug.get("8-f")!,
      title: "sdgs",
      imageUrl: "https://drive.google.com/thumbnail?id=1thUy-OLspvS7ugoOtIdZB-8ThhMtpCSt&sz=w1000",
      mediaType: "video",
      isActive: true,
    },
  ]);
  console.log("   ✅ Galeri Kelas berhasil diisi\n");

  // ─── Pages ────────────────────────────────────────────────────────────────────
  console.log("📄 Membuat halaman statis...");
  await db.delete(pagesTable);
  await db.insert(pagesTable).values([
    {
      title: "Profil Zein Page",
      slug: "profil",
      isPublished: true,
      content: `<h2>Tentang Zein Page</h2>
<p>Zein Page adalah pusat informasi dan layanan komunitas yang menghadirkan kegiatan, berita, dan layanan untuk masyarakat.</p>
<p>Zein Page dibangun dengan semangat keterbukaan, kebersamaan, dan pelayanan yang mudah diakses oleh semua orang.</p>
<h2>Arsitektur</h2>
<p>Zein Page memadukan tampilan modern dengan nilai-nilai Islam dan budaya Indonesia.</p>
<p>Ruang dan fasilitasnya dirancang agar nyaman digunakan untuk kegiatan komunitas, edukasi, dan pelayanan masyarakat.</p>
<h2>Kapasitas dan Fasilitas</h2>
<p>Zein Page menyediakan fasilitas untuk mendukung kegiatan bersama. Fasilitas yang tersedia antara lain:</p>
<ul>
<li>Ruang sholat utama berlantai lima</li>
<li>Museum dan perpustakaan Islam</li>
<li>Kantor administrasi dan pelayanan jamaah</li>
<li>Area parkir yang luas</li>
<li>Taman refleksi bersama Katedral Jakarta</li>
</ul>`,
    },
    {
      title: "Museum Zein Page",
      slug: "museum-istiqlal",
      isPublished: true,
      content: `<h2>Museum Zein Page</h2>
<p>Museum Zein Page menyimpan berbagai koleksi bersejarah dan informasi edukatif yang dapat dipelajari oleh pengunjung.</p>
<h2>Koleksi Museum</h2>
<p>Koleksi museum mencakup:</p>
<ul>
<li>Dokumen dan foto pembangunan masjid dari era Presiden Soekarno</li>
<li>Maket asli rancangan Friedrich Silaban</li>
<li>Koleksi Al-Quran langka dan bersejarah</li>
<li>Peralatan dan ornamen masjid dari berbagai era</li>
<li>Diorama perjalanan sejarah Zein Page</li>
</ul>
<h2>Jam Operasional</h2>
<p>Museum buka setiap hari kecuali waktu sholat fardhu:<br>
Senin–Jumat: 09.00–16.00 WIB<br>
Sabtu–Ahad: 08.00–17.00 WIB</p>
<p>Kunjungan gratis untuk umum. Pemandu wisata tersedia untuk kunjungan grup dengan reservasi terlebih dahulu.</p>`,
    },
    {
      title: "Kontak Kami",
      slug: "kontak",
      isPublished: true,
      content: `<h2>Hubungi Kami</h2>
<p>Untuk informasi lebih lanjut tentang Zein Page, layanan, dan kegiatan kami, silakan hubungi kami melalui:</p>
<h3>Alamat</h3>
<p>Jl. Taman Wijaya Kusuma, Ps. Baru, Kec. Sawah Besar,<br>
Kota Jakarta Pusat, DKI Jakarta 10710</p>
<h3>Telepon</h3>
<p>(021) 345-1523</p>
<h3>Email</h3>
<p>info@zeinpage.id</p>
<h3>Jam Pelayanan Administrasi</h3>
<p>Senin – Jumat: 08.00 – 16.00 WIB<br>
Sabtu: 08.00 – 12.00 WIB<br>
Ahad & Hari Besar: Tutup</p>`,
    },
    {
      title: "Panduan Berkunjung",
      slug: "panduan-berkunjung",
      isPublished: true,
      content: `<h2>Informasi Kunjungan</h2>
<p>Zein Page terbuka untuk umum setiap hari. Berikut panduan untuk pengunjung yang ingin mengikuti kegiatan atau menggunakan layanan Zein Page.</p>

<h3>Jam Operasional</h3>
<ul>
  <li><strong>Senin – Minggu:</strong> 04.00 – 22.00 WIB</li>
  <li>Masjid tutup sementara saat pelaksanaan shalat fardhu (±30 menit)</li>
</ul>

<h3>Aturan Berpakaian</h3>
<ul>
  <li>Wajib berpakaian sopan dan menutup aurat</li>
  <li>Bagi wanita, disediakan jilbab di pintu masuk (gratis)</li>
  <li>Sandal/sepatu dititipkan di penitipan yang tersedia</li>
</ul>

<h3>Lokasi &amp; Akses</h3>
<p>Jl. Taman Wijaya Kusuma, Ps. Baru, Kecamatan Sawah Besar, Jakarta Pusat</p>
<ul>
  <li><strong>MRT:</strong> Stasiun Lebak Bulus → Bundaran HI, lalu naik bus ke Monas</li>
  <li><strong>KRL:</strong> Stasiun Juanda (jarak ±500m berjalan kaki)</li>
  <li><strong>Parkir:</strong> Tersedia di area parkir Zein Page</li>
</ul>

<h3>Fasilitas</h3>
<ul>
  <li>Tempat wudhu pria dan wanita</li>
  <li>Area shalat kapasitas 200.000 jamaah</li>
  <li>Museum Zein Page</li>
  <li>Pusat informasi wisata religi</li>
  <li>Toilet &amp; fasilitas disabilitas</li>
</ul>`,
    },
    {
      title: "Aplikasi",
      slug: "aplikasi",
      isPublished: true,
      content: `<h2>Link Aplikasi Di Bawah</h2>`,
      websiteUrls: JSON.stringify([{ label: "Aplikasi Penerimaan Hewan Qurban Dengan QRCODE & RFID", url: "https://dashboard.ngrok.com/login" }]),
    },
  ]);
  console.log("   ✅ Halaman berhasil dibuat\n");

  // ─── CCTV Cameras ─────────────────────────────────────────────────────────────
  console.log("📷 Mengisi data CCTV...");
  await db.delete(cctvTable);
  await db.insert(cctvTable).values([
    {
      name: "Ruang Sholat Utama",
      location: "Lantai 1 – Ruang Sholat Utama",
      streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCYfCbGfC8PGKuFMcj7iW7xw",
      embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCYfCbGfC8PGKuFMcj7iW7xw",
      isActive: true,
      order: 1,
      description: "Live streaming ruang utama Zein Page",
    },
    {
      name: "Halaman Depan Masjid",
      location: "Pintu Utama – Halaman Depan",
      streamUrl: "https://www.youtube.com/embed/live_stream?channel=UCYfCbGfC8PGKuFMcj7iW7xw&v=2",
      embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCYfCbGfC8PGKuFMcj7iW7xw&v=2",
      isActive: true,
      order: 2,
      description: "Pemantauan area halaman depan dan pintu utama masjid",
    },
    {
      name: "Area Parkir Utara",
      location: "Parkir Utara",
      streamUrl: "https://www.youtube.com/embed/live_stream?channel=example&v=3",
      embedUrl: "https://www.youtube.com/embed/live_stream?channel=example&v=3",
      isActive: false,
      order: 3,
      description: "Pemantauan area parkir sisi utara",
    },
  ]);
  console.log("   ✅ CCTV berhasil diisi\n");

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ Seed database selesai!");
  console.log("");
  console.log("📋 Kredensial Admin:");
  console.log("   Username : admin");
  console.log("   Password : istiqlal2024");
  console.log("═══════════════════════════════════════════════════════");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed gagal:", err);
  process.exit(1);
});
