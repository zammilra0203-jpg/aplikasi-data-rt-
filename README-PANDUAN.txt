RT SMART — PANDUAN INSTALASI DAN PUBLIKASI
==========================================

ISI FILE
index.html            aplikasi admin, tanpa login, database IndexedDB lokal
sw.js                 cache offline PWA
manifest.webmanifest  informasi instalasi
icon.svg              ikon aplikasi
worker.js             layanan publikasi dashboard warga (Cloudflare Worker)

A. MEMASANG APLIKASI DI GITHUB PAGES
1. Buat repository GitHub (contoh rt-smart).
2. Upload index.html, sw.js, manifest.webmanifest, icon.svg ke ROOT repository.
   Jangan upload worker.js sebagai bagian wajib aplikasi; itu untuk Cloudflare.
3. Settings > Pages > Build and deployment > Deploy from a branch > main > /(root).
4. Buka https://USERNAME.github.io/rt-smart/ melalui Chrome atau Edge.
5. Pada HP, pilih Tambahkan ke Layar Utama/Install App.
   Pada desktop, gunakan tombol Install di address bar browser (jika tersedia).
6. Buka sekali saat internet aktif, kemudian fitur administrasi dapat berjalan offline.

B. MENYIAPKAN DASHBOARD PUBLIK DENGAN CLOUDFLARE
1. Buat akun Cloudflare (hanya diperlukan oleh orang yang menyiapkan layanan,
   BUKAN Ketua RT saat menggunakan aplikasi).
2. Di Workers & Pages, buat Worker baru dan tempel seluruh kode worker.js.
3. Buat KV namespace bernama, misalnya RT_PUBLIC_KV.
4. Pada Worker > Settings > Bindings, tambahkan KV namespace dengan variable
   bernama PUBLIC_DASHBOARD dan pilih namespace yang dibuat tadi.
5. Pada Worker > Settings > Variables and Secrets, tambahkan SECRET bernama
   PUBLISH_TOKEN dengan nilai acak yang panjang (minimal 32 karakter).
   Jangan tulis secret ini di repository GitHub.
6. Deploy Worker. Salin URL Worker, misalnya https://rt-publik.akun.workers.dev
7. Di aplikasi RT SMART > Publikasi, isi URL Worker dan PUBLISH_TOKEN.
8. Tekan Publikasikan Sekarang saat internet tersedia.
9. Bagikan URL Worker kepada warga. Mereka hanya dapat melihat data publik.

C. PENGGUNAAN
- Data warga dan keluarga: nomor KK menghubungkan anggota dengan keluarga.
- Kas RT: ketik 5000000 untuk Rp 5.000.000; dashboard menghitung saldo.
- Surat: nama warga diisi sama persis dengan data warga agar NIK/alamat terisi.
- Pengaturan: upload logo dan gambar kop surat; nama samping logo opsional.
- Backup: lakukan secara berkala ke penyimpanan yang aman, bukan folder publik.
- Restore: menggantikan seluruh database lokal, gunakan hati-hati.

D. BATASAN DAN KEAMANAN
- IndexedDB tetap berada di browser/perangkat yang digunakan, bukan GitHub.
- Data lokal dapat hilang jika data situs dibersihkan, browser dihapus, atau
  perangkat rusak. Backup manual sangat penting.
- Tanpa login, siapa pun yang memegang perangkat dan membuka aplikasi admin
  dapat mengakses data. Gunakan kunci layar HP/laptop dan jangan bagikan URL
  aplikasi sebagai pengganti perlindungan perangkat.
- Kunci publikasi disimpan di localStorage browser. Jika perangkat tidak aman,
  orang lain dapat memublikasikan perubahan. Jika bocor, ganti secret di Worker.
- Data lokal TIDAK tersinkron antarperangkat. Pemindahan menggunakan backup/restore.
- Backup JSON berisi data pribadi dan TIDAK terenkripsi pada versi ini.
- Ukuran lampiran maksimum 5 MB per berkas; penyimpanan browser terbatas.
- Surat diekspor dalam format .doc (Word-kompatibel), bukan .docx asli.
- Worker menyimpan satu snapshot publik terbaru; tidak menyimpan arsip transaksi.
- Jangan masukkan data pribadi warga ke isi pengumuman publik.
- Lakukan uji pada data contoh sebelum menggunakan dokumen warga sungguhan.

E. MEMPERBARUI VERSI
Ganti file di GitHub, tetapi jangan hapus data situs browser. Backup terlebih dahulu.
Pastikan cache PWA memperbarui setelah halaman dimuat saat online.

FITUR TEMPLATE SURAT (V5)
- Menu Surat > Kelola Template Surat. Tempel isi template atau unggah .txt/.html sederhana.
- Placeholder: {{nama}}, {{nik}}, {{alamat}}, {{keperluan}}, {{tanggal}}, {{rt}}, {{rw}}, {{desa}}, {{kecamatan}}, {{kabupaten}}, {{ketua}}, {{jenis}}.
- Pilih template pada formulir Buat Surat, lalu unduh .doc (Word-kompatibel).
- Template tersimpan di IndexedDB bersama pengaturan dan ikut backup JSON.
- Impor langsung .docx belum didukung.
