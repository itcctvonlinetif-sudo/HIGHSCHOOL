# Zein Page — Bundle Self-Hosting

Dokumen ini adalah panduan deployment produksi di server Ubuntu/Debian atau CentOS Stream/Rocky/AlmaLinux. Arsitektur bundle:

- **Nginx** menyajikan frontend statis dari `artifacts/masjid-istiqlal/dist/public`.
- **Node.js API** berjalan hanya di `127.0.0.1:8080`.
- **PostgreSQL** menyimpan data aplikasi.
- **PM2** menjaga API tetap berjalan setelah restart atau crash.

Jangan menjalankan Vite development server untuk website produksi. Gunakan hasil build dan Nginx seperti di panduan ini.

## 1. Membuat bundle

Di komputer pengembang, jalankan:

```bash
bash scripts/create-self-hosting-bundle.sh
```

Script akan:

1. Membuild API.
2. Membuild frontend dengan `BASE_PATH=/`.
3. Menyalin source, hasil build, lockfile, deployment template, dan dokumentasi.
4. Mengecualikan `.env`, `node_modules`, `.git`, cache, dan folder Replit.
5. Membuat arsip `.tar.gz` serta checksum `.sha256` di `release/`.

Bundle tidak berisi database. Database dibuat di server dan diisi dengan `pnpm --filter @workspace/scripts run seed` hanya jika memang ingin memakai data awal.

## 2. Persiapan server

### Ubuntu/Debian

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx postgresql postgresql-contrib build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
sudo systemctl enable --now nginx postgresql
```

### CentOS Stream/Rocky/AlmaLinux

```bash
sudo dnf update -y
sudo dnf install -y curl git nginx postgresql-server postgresql-contrib gcc-c++ make tar gzip
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
sudo postgresql-setup --initdb
sudo systemctl enable --now nginx postgresql
sudo npm install -g pnpm pm2
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

Jika PostgreSQL sudah pernah diinisialisasi di CentOS/Rocky/AlmaLinux, abaikan pesan bahwa direktori data sudah ada.

## 3. Membuat database PostgreSQL

Jalankan:

```bash
sudo -u postgres psql
```

Di prompt PostgreSQL:

```sql
CREATE USER zeinpage_user WITH PASSWORD 'GANTI_DENGAN_PASSWORD_DATABASE_YANG_KUAT';
CREATE DATABASE zeinpage_db OWNER zeinpage_user;
GRANT ALL PRIVILEGES ON DATABASE zeinpage_db TO zeinpage_user;
\q
```

Gunakan password database yang berbeda dari password admin aplikasi.

## 4. Mengekstrak bundle

Contoh lokasi deployment:

```bash
sudo mkdir -p /var/www/zein-page
sudo tar -xzf zein-page-self-hosting-*.tar.gz \
  -C /var/www/zein-page \
  --strip-components=1
sudo chown -R "$USER":"$USER" /var/www/zein-page
cd /var/www/zein-page
```

Verifikasi checksum sebelum mengekstrak jika file checksum ikut disalin:

```bash
sha256sum -c zein-page-self-hosting-*.sha256
```

## 5. Environment dan dependensi

```bash
cp deploy/env.example .env
chmod 600 .env
nano .env
```

Isi minimum:

```env
DATABASE_URL=postgresql://zeinpage_user:PASSWORD_DATABASE@127.0.0.1:5432/zeinpage_db
SESSION_SECRET=GANTI_DENGAN_STRING_ACAK_MINIMAL_32_KARAKTER
PORT=8080
NODE_ENV=production
```

Install package dan terapkan skema:

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push
```

Untuk database baru yang ingin memakai data awal:

```bash
pnpm --filter @workspace/scripts run seed
```

Jangan jalankan `seed -- --force` pada database yang sudah berisi data produksi karena perintah tersebut menghapus dan mengisi ulang data.

## 6. Menjalankan API dengan PM2

```bash
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 status
pm2 logs zein-page-api
pm2 save
pm2 startup
```

Perintah `pm2 startup` menampilkan satu perintah tambahan. Jalankan perintah tersebut dengan `sudo` sesuai output server, lalu ulangi `pm2 save`.

Tes API dari server:

```bash
curl -i http://127.0.0.1:8080/api/health
```

Respons sukses harus memiliki status HTTP `200`.

## 7. Konfigurasi Nginx

Salin template:

```bash
sudo cp deploy/nginx/zein-page.conf.example /etc/nginx/conf.d/zein-page.conf
sudo nano /etc/nginx/conf.d/zein-page.conf
```

Ganti `server_name example.com;` dengan domain atau IP server. Pastikan `root` mengarah ke:

```text
/var/www/zein-page/artifacts/masjid-istiqlal/dist/public
```

Uji dan reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Nginx meneruskan `/api/` ke Node.js, sehingga frontend dan API menggunakan domain yang sama dan tidak memerlukan URL API khusus di browser.

## 8. HTTPS dengan Certbot

Setelah DNS domain sudah mengarah ke server:

### Ubuntu/Debian

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

### CentOS Stream/Rocky/AlmaLinux

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

Tes pembaruan sertifikat:

```bash
sudo certbot renew --dry-run
```

## 9. Update aplikasi

Buat bundle baru dari source terbaru, salin ke server, lalu:

```bash
cd /var/www/zein-page
tar -xzf /path/zein-page-self-hosting-TERBARU.tar.gz --strip-components=1
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push
pm2 restart zein-page-api
sudo nginx -t && sudo systemctl reload nginx
```

Backup `.env` sebelum mengekstrak jika arsip lama berisi file tersebut dari sumber lain. Bundle resmi yang dibuat script ini tidak menyertakan `.env`.

## 10. Troubleshooting

### API tidak berjalan

```bash
pm2 status
pm2 logs zein-page-api --lines 100
```

Pastikan `PORT`, `DATABASE_URL`, dan `SESSION_SECRET` tersedia di `.env`.

### Nginx menampilkan 502 untuk `/api`

```bash
curl -i http://127.0.0.1:8080/api/health
sudo ss -ltnp | grep -E ':80|:443|:8080'
sudo journalctl -u nginx -n 100 --no-pager
```

Jika curl ke port 8080 gagal, perbaiki API/PM2 terlebih dahulu.

### Database gagal terhubung

```bash
sudo systemctl status postgresql
psql "$DATABASE_URL" -c "SELECT 1;"
```

Periksa kembali username, password, nama database, port, dan alamat `127.0.0.1`.

### Upload file tidak tersedia

Fitur upload dapat memerlukan konfigurasi provider storage eksternal. Data URL gambar/video yang sudah ada tetap dapat ditampilkan, tetapi upload baru harus dikonfigurasi melalui Pengaturan Admin sesuai provider yang digunakan.