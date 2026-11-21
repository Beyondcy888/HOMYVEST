// Bahasa Indonesia. Sumber: docs/07_CONTENT_AND_COPY.md. Fakta: docs/02_PROJECT_BRIEF.md §6.
// Struktur kunci harus sama persis dengan en.js.
export default {
  meta: {
    title: 'HOMYVEST: Ubah lahan menganggur jadi penghasilan',
    description:
      'Punya lahan kosong atau bangunan mangkrak? Lihat potensi bangunan dan pendapatannya, lalu biarkan HomyEight membangun dan Behomy mengelolanya.',
    ogAlt: 'Wordmark HOMYVEST di atas properti yang menyala saat senja',
  },
  pfMeta: {
    title: 'Portofolio: HOMYVEST',
    description:
      'Lihat cara HomyEight membangun dan Behomy mengelola: bangunan yang tersusun, menjelajahi Maxone, arena padel yang berdiri, dan lainnya.',
    ogAlt: 'Wordmark HOMYVEST di atas properti yang menyala saat senja',
  },
  nav: {
    label: 'Utama',
    how: 'Cara kerja',
    behomy: 'Behomy',
    projects: 'Proyek',
    calculator: 'Cek lahan',
    faq: 'FAQ',
    portfolio: 'Portofolio',
    home: 'Beranda',
    menu: 'Menu',
    close: 'Tutup',
    lang: 'Bahasa',
    skipToContent: 'Langsung ke konten',
    sections: 'Bagian halaman',
  },
  theme: { label: 'Tema', light: 'Terang', dark: 'Gelap', auto: 'Otomatis' },
  wa: {
    header: 'WhatsApp',
    hero: 'Chat via WhatsApp',
    calc: 'Kirim hasil saya via WhatsApp',
    next: 'Chat dengan kami via WhatsApp',
    floating: 'Chat via WhatsApp',
    newTab: 'membuka WhatsApp di tab baru',
  },
  wordmark: { aria: 'HOMYVEST — Homy Investasi, beranda' },

  hero: {
    partner: 'Bekerja sama dengan',
    title1: 'Ubah lahan menganggur jadi penghasilan rutin.',
    title2: 'Dibangun oleh HomyEight, dioperasikan oleh Behomy.',
    body: 'Punya lahan kosong atau bangunan mangkrak? Tinggalkan nomor Anda, kami tunjukkan bisa dijadikan apa.',
    chip: 'Rata-rata okupansi 82% di properti Behomy',
    scrollCue: 'Scroll',
    skip: 'Lewati intro',
    b1: {
      title: 'Lahan Anda sedang menunggu.',
      body: 'Lahan kosong atau bangunan mangkrak tetap memakan biaya setiap bulan. Padahal, keduanya bisa menghasilkan.',
    },
    b2: {
      title: 'Pertama, kami bangun dengan benar.',
      body: 'Dirancang dan dibangun oleh HomyEight, mitra konstruksi dan interior kami.',
    },
    b3: {
      title: 'Tidak harus jadi guesthouse.',
      body: 'Penginapan, kantor, kafe, atau lapangan olahraga. Kami pelajari lahan Anda dan temukan yang paling cocok.',
      labels: ['Hunian hybrid', 'Kantor', 'Kafe', 'Lapangan olahraga'],
    },
    b4: {
      title: 'Lalu kami hidupkan.',
      body: 'Behomy Group mengelolanya setiap hari: tamu, pemasaran, perawatan, sampai laporan bulanan Anda.',
    },
    b5: {
      title: 'Dari menganggur jadi menghasilkan.',
      stat1: { n: 82, suffix: '%', label: 'rata-rata okupansi properti Behomy', note: 1 },
      stat2: { n: 3000, suffix: '+', label: 'kamar dalam pengelolaan' },
      cta1: 'Cek potensi lahan Anda',
      cta2: 'Chat via WhatsApp',
    },
    sceneAlt:
      'Model animasi: lahan kosong di tepi jalan menjadi hunian hybrid, lalu lahan di sebelahnya menjadi kantor, kafe, dan lapangan olahraga, dan jalan itu pun menjadi hidup.',
    posterAlt: [
      'Model tanah liat putih berupa lahan kosong berumput tinggi di tepi jalan.',
      'Model tanah liat putih hunian hybrid empat lantai dengan lantai atas terbuka sehingga kamar-kamarnya terlihat.',
      'Model tanah liat putih kantor, kafe, dan lapangan padel di lahan yang bersebelahan.',
      'Empat bangunan tanah liat putih di satu jalan dengan jendela hangat, orang, dan mobil.',
    ],
  },

  consult: {
    label: 'Konsultasi gratis dengan tim HomyEight',
    number: '+62 821-1010-6088',
  },

  funnel: {
    phone: {
      label: 'Masukkan nomor telepon Anda agar kami bisa menghubungi Anda',
      placeholder: '812 3456 7890',
      continue: 'Lanjut',
      privacy: 'Nomor Anda hanya kami gunakan untuk membahas properti Anda.',
      error: 'Masukkan nomor HP Indonesia yang valid, contoh 0812 3456 7890.',
      done: 'Terima kasih, kami akan menghubungi Anda di {phone}.',
    },
    panel: {
      poweredBy: 'Didukung oleh',
      step: 'Langkah {n} dari 3',
      close: 'Tutup',
      recap: 'Kami akan menghubungi Anda di {phone}',
      change: 'Ubah',
      back: 'Kembali',
      continue: 'Lanjut',
      send: 'Kirim',
      sending: 'Mengirim…',
      chat: 'Lebih suka chat? Hubungi via WhatsApp',
    },
    funding: {
      title: 'Apa sumber dana untuk membangun atau merenovasi properti Anda?',
      help: 'Pilih yang paling sesuai.',
    },
    build: { title: 'Ceritakan tentang properti Anda' },
    f: {
      name: { label: 'Siapa nama Anda?', help: 'Agar kami tahu sedang berbicara dengan siapa.' },
      owned: { label: 'Properti atau lahan apa yang Anda miliki saat ini?', help: 'Boleh pilih lebih dari satu.' },
      build: { label: 'Apa yang ingin Anda bangun?', help: 'Boleh pilih lebih dari satu. "Belum yakin" juga tidak apa-apa.' },
      city: { label: 'Di mana lokasi propertinya?', help: 'Boleh pilih lebih dari satu.' },
      need: { label: 'Mana yang paling sesuai dengan Anda?' },
      otherPlaceholder: 'Ceritakan singkat',
    },
    needs: {
      title: 'Belum ada dana pembangunan? Tidak masalah.',
      body: 'Banyak pemilik memulai dari sini. Behomy dan HomyEight juga membantu properti yang sudah berdiri, mulai dari menyewakan dan mengelolanya setiap hari sampai mengisi lebih banyak kamar. Kami juga bisa mengecek properti di lokasi strategis bisa dijadikan apa sebelum Anda mengeluarkan biaya.',
    },
    consent:
      'Dengan mengirim ini, Anda setuju dihubungi oleh tim HOMYVEST, HomyEight, dan Behomy terkait properti Anda.',
    err: {
      required: 'Mohon diisi.',
      chooseOne: 'Pilih minimal satu.',
      chooseSingle: 'Pilih salah satu.',
      tooLong: 'Terlalu panjang. Mohon dipersingkat.',
      summary: 'Mohon periksa kolom yang ditandai.',
    },
    thanks: {
      title: 'Terima kasih, {firstName}. Data Anda sudah kami terima.',
      body: 'Tim HomyEight akan menghubungi Anda via WhatsApp di {phone} pada jam kerja. Ingin lebih cepat? Kirim pesan sekarang.',
      whatsapp: 'Chat via WhatsApp sekarang',
      calc: 'Coba cek lahan',
      portfolio: 'Lihat portofolio lengkap',
    },
    handoff: {
      title: 'Sedikit lagi: kirim data Anda lewat WhatsApp',
      body: 'Jawaban Anda sudah tertulis di pesan. Tinggal tekan kirim.',
      button: 'Kirim via WhatsApp',
    },
    error: {
      title: 'Data Anda belum berhasil terkirim',
      body: 'Kirim lewat WhatsApp saja, jawaban Anda sudah terisi otomatis. Atau coba lagi sebentar lagi.',
      retry: 'Coba lagi',
    },
    rate: {
      body: 'Anda sudah mengirim ini beberapa kali. Kami akan segera menghubungi Anda, atau kirim pesan via WhatsApp.',
    },
  },

  about: {
    title: 'Apa itu HOMYVEST?',
    body: 'HOMYVEST membantu pemilik lahan menganggur dan bangunan mangkrak mengubahnya menjadi properti yang menghasilkan. Kami melihat seberapa besar bangunan yang boleh berdiri di lahan Anda dan usaha apa yang paling cocok, dari hunian hybrid sampai kantor atau lapangan olahraga. Setelah itu HomyEight membangunnya dan Behomy mengelolanya, jadi Anda cukup berurusan dengan satu tim dari awal sampai akhir.',
    note: 'Kami bukan developer dan tidak menjual properti. Kami menggarap milik Anda.',
  },

  how: {
    eyebrow: 'Cara kerja',
    title: 'Dari sketsa pertama sampai kamar terisi, semuanya kami urus.',
    sub: 'Anda cukup punya satu kontak. Di baliknya, tiga tim yang bekerja.',
    steps: [
      {
        name: 'Rencana.',
        body: 'Kami pelajari lahan Anda, aturan setempat, dan permintaan di sekitarnya, lalu menghitung usaha yang paling menguntungkan.',
        by: 'HOMYVEST, dengan data kelayakan Behomy',
      },
      {
        name: 'Desain.',
        body: 'HomyEight mengubah rencana menjadi gambar desain dan estimasi biaya yang jelas, tanpa biaya.',
        by: 'HomyEight',
      },
      {
        name: 'Bangun.',
        body: 'HomyEight membangunnya, dari struktur sampai interior dan furnitur dari workshop sendiri.',
        by: 'HomyEight',
      },
      {
        name: 'Kelola.',
        body: 'Behomy membuka, mengisi, dan mengelolanya setiap hari. Anda memantau semuanya lewat dashboard pemilik secara langsung.',
        by: 'Behomy',
      },
    ],
    closing:
      'HOMYVEST menemukan potensinya, HomyEight membangunnya, dan Behomy menjaganya tetap berjalan. Anda cukup menyimpan satu nomor.',
  },

  homyeight: {
    walk: {
      title: 'Masuk ke salah satu proyek kami.',
      hint: 'Scroll untuk menjelajah',
      skip: 'Lewati penjelajahan',
      stops: [
        'Kedatangan',
        'Area sambutan',
        'Ruang makan',
        'Buffet dan bar',
        'Lihat ke atas',
        'Di dekat jendela',
        'Seluruh lantai',
      ],
      mapLabel: 'Denah, posisi Anda',
      goTo: 'Ke titik {n}: {name}',
      sceneAlt:
        'Penjelajahan lobi dan ruang makan hotel: dari pintu masuk di sisi jalan melewati resepsionis, melalui ruang makan ke buffet dan bar, menengadah ke void dua lantai, ke arah jendela, lalu naik untuk melihat seluruh lantai.',
    },
  },

  behomy: {
    hero: {
      eyebrow: 'Dioperasikan oleh Behomy',
      title: 'Selesai dibangun baru separuh cerita. Behomy memastikannya terisi.',
      body: 'Pelopor hunian hybrid di Indonesia ini mengelola 3.000+ kamar di 100+ lokasi, memadukan tamu harian dengan penyewa bulanan agar kamar terus menghasilkan.',
      more: 'Lihat cara kerjanya',
    },
    eyebrow: 'Dikelola oleh Behomy',
    title: 'Tamu harian dan penyewa bulanan. Satu bangunan, terisi sepanjang tahun.',
    body: 'Behomy adalah operator hunian hybrid. Behomy menggabungkan menginap harian ala hotel dengan sewa bulanan ala kos dalam satu bangunan, sehingga kamar tetap menghasilkan di musim ramai maupun sepi.',
    hybrid: {
      daily: 'Menginap harian',
      monthly: 'Sewa bulanan',
      caption: 'Tamu harian saat musim ramai, penyewa bulanan saat musim sepi. Kamar tetap menghasilkan.',
      illustration: 'Ilustrasi',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      alt: 'Diagram satu bangunan sepanjang tahun. Di bulan ramai lebih banyak kamar diisi tamu harian; di bulan sepi lebih banyak kamar diisi penyewa bulanan. Bangunan tetap terisi sepanjang tahun.',
    },
    stats: [
      { n: 82, suffix: '%', label: 'rata-rata okupansi', note: 1 },
      { n: 65.4, digits: 1, suffix: '%', label: 'rata-rata margin laba operasional kotor (GOP)', note: 2 },
      { text: '< 3,5', suffix: ' thn', label: 'perkiraan balik modal proyek kemitraan ekuitas Behomy', note: 4 },
      { n: 3000, suffix: '+', label: 'kamar dalam pengelolaan' },
      { n: 100, suffix: '+', label: 'lokasi di 18 wilayah' },
    ],
    handles: {
      title: 'Yang Behomy urus untuk Anda',
      items: [
        {
          title: 'Persiapan dan staf.',
          body: 'Perizinan, furnishing, rekrutmen, dan pelatihan staf hospitality.',
        },
        {
          title: 'Mendatangkan tamu.',
          body: 'Peringkat teratas di pencarian lokal, tag resmi "Hotel Chain" di Agoda, Traveloka, tiket.com, dan Trip.com, serta jaringan 500+ kreator.',
        },
        {
          title: 'Perawatan dan perbaikan.',
          body: 'Beefix, tim perawatan milik Behomy, menangani perbaikan, AC, plumbing, dan deep cleaning.',
        },
        {
          title: 'Laporan yang jelas.',
          body: 'Dashboard pemilik real-time untuk okupansi dan keuangan, serta layanan tamu 24 jam.',
        },
      ],
    },
    brands: ['Behomy Residence', 'Corvel', 'Purnava Village', 'Hoteru'],
    brandsLabel: 'Brand yang dikelola Behomy',
    uplift: 'Model hybrid Behomy dapat menghasilkan hingga 2,5× kos konvensional. Hasil berbeda untuk setiap properti.',
    upliftNote: 3,
    portfolio: {
      title: 'Properti yang dikelola Behomy saat ini',
      team: 'Tim Behomy',
      training: 'Pelatihan front office dan housekeeping',
    },
    ba: {
      title: 'Dari menganggur jadi beroperasi',
      sub: 'Bangunan nyata, sebelum dan sesudah ditangani Behomy dan HomyEight.',
      before: 'Sebelum',
      after: 'Sesudah',
      label: 'Pasangan foto sebelum dan sesudah',
      pair: 'Pasangan {n} dari {total}',
    },
    bridge: 'Berikut beberapa tempat yang kami bangun dan kelola.',
  },

  projects: {
    eyebrow: 'Proyek',
    title: 'Tempat yang kami bangun dan kelola.',
    body: 'Kos, guesthouse, homestay, dan vila.',
    viewer: {
      label: 'Penampil gambar proyek',
      close: 'Tutup',
      prev: 'Sebelumnya',
      next: 'Berikutnya',
      open: 'Buka gambar',
    },
    caption: { name: 'Project Name', place: 'City, Province', type: 'Type · Year' },
    bridge: 'Tidak semua lahan harus jadi tempat menginap.',
  },

  beyond: {
    eyebrow: 'Lebih dari penginapan',
    title: 'Ada lahan yang lebih menguntungkan jika dijadikan hal lain.',
    body: 'Arena olahraga, kafe, atau kantor. Jika itu lebih cocok untuk lahan dan lingkungan Anda, itulah yang kami sarankan.',
    padel: {
      stages: [
        'Lantai dasar: lapangan, kafe, dan ruang ganti.',
        'Lantai atas: lounge di atas kafe, dan strukturnya mulai berdiri.',
        'Selesai: satu arena, siap dipesan.',
      ],
      tag: 'Arena padel · Desain oleh HomyEight',
      skip: 'Lewati arena padel',
      sceneAlt:
        'Model animasi arena padel yang tersusun dalam tiga tahap: lantai dasar dengan lapangannya, lantai atas dan strukturnya, lalu arena yang selesai dengan atap melengkung.',
    },
    ways: {
      label: 'Tiga cara lain untuk menghasilkan',
      soccer: {
        title: 'Mini soccer',
        body: 'Lahan terbuka bisa menjadi tempat yang ramai setiap akhir pekan, lengkap dengan kafe dan tribun di samping lapangan.',
      },
      cafe: {
        title: 'Kafe',
        body: 'Sudut di jalan yang ramai bisa lebih menguntungkan sebagai kedai kopi daripada hunian.',
      },
      office: { title: 'Kantor', body: 'Di dekat kawasan bisnis, kantor yang fleksibel cepat terisi.' },
      open: 'Buka gambar {name}',
    },
  },

  pf: {
    eyebrow: 'Portofolio',
    title: 'Portofolio lengkap kami',
    intro: 'Tiga proyek, diceritakan lewat gerak. Santai saja: scroll perlahan dan setiap proyek akan tersusun di depan Anda.',
    begin: 'Scroll untuk mulai',
    index: ['Ceritanya', 'Masuk ke Maxone', 'Arena padel', 'Lebih dari penginapan'],
    indexLabel: 'Di halaman ini',
    skipStory: 'Lewati cerita',
    skipPadel: 'Lewati arena padel',
    close: {
      title: 'Suka dengan yang Anda lihat? Mari lihat lahan Anda.',
      back: '← Kembali ke beranda',
    },
  },

  calc: {
    eyebrow: 'Cek lahan',
    title: 'Lahan Anda bisa jadi apa?',
    body: 'Masukkan ukuran lahan dan aturan bangunan setempat. Anda akan melihat seberapa besar bangunan yang boleh dibangun, berapa biaya dan potensi pendapatan berbagai pilihan, serta apa saja yang perlu disiapkan.',
    note: 'Hanya sekitar satu menit. Tidak ada data yang dikirim kecuali Anda memilih untuk membagikannya.',
    stepsLabel: 'Langkah cek lahan',
    tabs: ['Lahan Anda', 'Ide untuk lahan Anda', 'Sudah ada bangunan? Tambah lantai'],
    tabsShort: ['Lahan Anda', 'Ide', 'Tambah lantai'],
    example: 'Contoh',
    reset: 'Kembalikan ke nilai contoh',
    how: 'Cara menghitungnya',
    resultsLabel: 'Hasil',
    f: {
      P: { label: 'Lebar depan', unit: 'm', help: 'Sisi yang menghadap jalan.' },
      L: { label: 'Kedalaman', unit: 'm', help: 'Dari sisi jalan sampai batas belakang lahan.' },
      kdb: {
        label: 'KDB',
        unit: '%',
        help: 'Koefisien Dasar Bangunan: berapa persen lahan yang boleh tertutup bangunan.',
      },
      klb: {
        label: 'KLB',
        unit: '×',
        help: 'Koefisien Lantai Bangunan: total luas semua lantai, sebagai kelipatan luas lahan.',
      },
      kdh: {
        label: 'KDH',
        unit: '%',
        help: 'Koefisien Daerah Hijau: berapa persen lahan yang wajib tetap hijau atau berupa tanah terbuka.',
      },
      maxFloors: {
        label: 'Batas jumlah lantai (opsional)',
        unit: '',
        help: 'Beberapa wilayah juga membatasi tinggi bangunan. Kosongkan jika tidak ada batas.',
      },
      fp: { label: 'Luas dasar bangunan', unit: 'm²', help: 'Luas tanah yang tertutup bangunan.' },
      tfa: {
        label: 'Total luas lantai, semua lantai',
        unit: 'm²',
        help: 'Jumlahkan semua lantai, termasuk yang belum selesai.',
      },
      green: { label: 'Luas area hijau', unit: 'm²', help: 'Taman atau tanah terbuka.' },
      occ: {
        label: 'Perkiraan tingkat hunian',
        unit: '%',
        help: 'Rata-rata seberapa penuh yang Anda harapkan. Berlaku untuk semua ide.',
      },
    },
    presets: {
      title: 'Belum tahu aturannya? Coba contoh:',
      template: 'Contoh umum',
      resid: 'Kawasan perumahan tenang',
      comm: 'Jalan komersial ramai',
      note: 'Hanya contoh. Batas yang berlaku ada di KRK atau PKKPR dari Pemda.',
    },
    r: {
      headline: 'Lahan Anda bisa menampung bangunan hingga {floorArea}.',
      floors: {
        label: 'Lantai',
        none: 'Tidak diizinkan',
        single: '1 lantai seluas {partial}',
        fullOne: '1 lantai',
        fullMany: '{full} lantai',
        plusPartial: '+ 1 lantai atas yang lebih kecil, seluas {partial}',
        capped: 'Dibatasi oleh aturan jumlah lantai.',
      },
      cover: { label: 'Bangunan boleh menutup', value: '{fp} ({pct} dari lahan)' },
      area: { label: 'Luas lahan' },
      green: { label: 'Wajib tetap hijau' },
      parking: {
        label: 'Ruang parkir',
        value: 'Sekitar {cars} mobil',
        detail: '{open} area terbuka, perkiraan kasar',
        tight: 'Sangat terbatas',
      },
    },
    legend: { building: 'Bangunan', green: 'Hijau', open: 'Terbuka (akses, parkir, servis)', title: 'Pembagian lahan' },
    w: {
      conflict:
        'Jika dijumlahkan, KDB dan KDH Anda lebih dari 100%, jadi luas bangunan dikurangi menjadi {fp} agar tetap ada ruang hijau. Mohon cek kembali angkanya.',
      klbLow:
        'KLB Anda lebih kecil dari KDB, jadi satu lantai pun tidak bisa memakai seluruh luas dasar. Yang berlaku adalah total luas lantai ({floorArea}).',
      empty: 'Masukkan lebar depan dan kedalaman lahan Anda untuk memulai.',
    },
    next: {
      ideas: 'Berikutnya: lihat potensi pendapatannya',
      ideasAlt: 'Atau bandingkan ide untuk lahan ini',
      addFloor: 'Sudah ada bangunan? Cek apakah bisa tambah lantai',
    },
    view: { reset: 'Atur ulang tampilan', hint: 'Geser untuk memutar, scroll atau cubit untuk zoom' },
    s2: {
      title: 'Empat cara lahan ini bisa menghasilkan',
      body: 'Setiap ide memakai luas yang diizinkan di langkah 1. Harga sewa dan biaya hanyalah contoh, jadi ganti dengan harga di daerah Anda.',
      landChip: 'Lahan Anda',
      edit: 'Ubah',
      ideasLabel: 'Ide untuk lahan Anda',
      names: { kos: 'Kos-kosan', ruko: 'Ruko', rumah: 'Rumah sewa', gudang: 'Gudang' },
      adjust: 'Ubah harga',
      p: {
        kosSize: {
          label: 'Luas per kamar',
          unit: 'm²',
          help: 'Per kamar, termasuk kamar mandi dan bagian koridor serta tangga.',
        },
        kosRent: { label: 'Sewa per kamar / bulan' },
        rukoWidth: { label: 'Lebar per unit', unit: 'm' },
        rukoRent: { label: 'Sewa per unit / tahun' },
        rumahLand: { label: 'Lahan per rumah', unit: 'm²', help: 'Termasuk halaman.' },
        rumahFloor: { label: 'Luas bangunan per rumah', unit: 'm²' },
        rumahRent: { label: 'Sewa per rumah / bulan' },
        gudangRent: { label: 'Sewa per m² / bulan' },
        cost: { label: 'Biaya bangun per m²' },
      },
      rows: {
        fits: 'Yang muat',
        built: 'Luas yang dibangun',
        cost: 'Biaya bangun (perkiraan)',
        income: 'Sewa per tahun (perkiraan)',
        yield: 'Imbal hasil tahunan dari biaya bangun',
        payback: 'Balik modal bangunan dalam',
        tip: 'Perlu diketahui',
      },
      fits: {
        kos: '{n} kamar',
        ruko: '{n} unit, masing-masing {m}',
        rumah: '{n} rumah',
        gudang: '{m}, satu lantai',
        none: 'Tidak muat',
      },
      tip: {
        kos: 'Banyak penghuni berarti banyak motor, jadi siapkan parkirnya.',
        ruko: 'Paling cocok di jalan yang ramai.',
        rumah: 'Pendapatan lebih kecil, tetapi stabil dan mudah dikelola.',
        gudang: 'Butuh akses truk dan jalan yang lebar. Satu lantai.',
      },
      badge: 'Tercepat',
      select: 'Tampilkan di 3D',
      showing: 'Ditampilkan di 3D',
      sum: {
        noLand: 'Isi data lahan di langkah 1 untuk membandingkan ide.',
        noPrices: 'Tambahkan harga sewa dan biaya bangun untuk membandingkan ide.',
        best: '{best} paling cepat balik modal: sekitar {payback} dengan biaya bangun {cost}, dan pendapatan sekitar {income} per tahun.',
        second: 'Berikutnya {second}, sekitar {payback}.',
        cheapest:
          'Jika modal Anda lebih terbatas, {cheapest} paling murah dibangun ({cost}) dan balik modal dalam sekitar {payback}.',
      },
      caveat:
        'Ini angka kotor. Belum termasuk biaya operasional, pajak, perizinan (PBG), pembiayaan, bulan kosong di luar tingkat hunian yang Anda isi, dan nilai lahannya sendiri. Biaya operasional dan pengelolaan harian adalah penentu berhasil tidaknya sebuah proyek, dan bagian itulah yang ditangani HomyEight dan Behomy bersama Anda.',
      hybridNote:
        'Tertarik membuat penginapan? Contoh ini memakai sewa kos bulanan biasa. Model hybrid Behomy menggabungkan tamu harian dan bulanan, jadi tanyakan kepada kami apa artinya untuk lahan Anda.',
    },
    s3: {
      title: 'Sudah punya bangunan? Lihat apakah bisa ditambah.',
      body: 'Sudah jadi atau belum, masukkan kondisinya saat ini. Kami cek terhadap aturan lahan Anda dan lihat apakah masih bisa tambah lantai.',
      a: {
        broken: 'Belum bisa. Bangunan ini sudah melanggar aturan, jadi itu perlu dibereskan dulu.',
        needFp: 'Masukkan luas dasar bangunan untuk mengecek.',
        many: 'Bisa. Anda bisa menambah hingga {extra} lantai lagi seluas {fp}.',
        one: 'Bisa. Masih muat satu lantai lagi seluas {fp}.',
        smaller: 'Hanya lantai yang lebih kecil: tersisa {faRoom}, kurang dari satu lantai penuh seluas {fp}.',
        none: 'Tidak bisa. Seluruh luas lantai yang diizinkan sudah terpakai.',
      },
      g: {
        ok: 'Sesuai batas',
        over: 'Melebihi batas',
        limit: 'Batas {v}',
        kdb: {
          name: 'KDB · cakupan bangunan',
          ok: 'Masih bisa melebar {fpRoom} di lantai dasar.',
          over: 'Melebihi batas {over}.',
        },
        klb: { name: 'KLB · rasio luas lantai', ok: 'Sisa luas lantai {faRoom}.', over: 'Melebihi batas {over}.' },
        kdh: { name: 'KDH · area hijau', ok: 'Area hijau cukup.', short: 'Perlu tambahan area hijau {greenShort}.' },
      },
      leftover: '{leftover} ({pct}) tersisa untuk akses, parkir, dan servis.',
      leftoverNeg: 'Luas bangunan ditambah area hijau melebihi luas lahan. Mohon cek kembali angkanya.',
      needLand: 'Isi data lahan di langkah 1 terlebih dahulu.',
      floorsCap: 'Menampilkan 40 dari {n} lantai',
      toIdeas: 'Bandingkan ide untuk lahan ini',
    },
    cta: {
      title: 'Ingin menjadikannya rencana nyata?',
      button: 'Kirim hasil saya via WhatsApp',
      note: 'Kami akan membalas dengan hal-hal yang perlu dicek lebih dulu.',
    },
    howText: [
      'Luas lahan = lebar depan × kedalaman. Bangunan boleh menutup luas lahan × KDB, tetapi tidak boleh melebihi sisa lahan setelah dikurangi area hijau wajib. Total luas lantai yang diizinkan = luas lahan × KLB (atau luas dasar × batas jumlah lantai, jika lebih kecil). Jumlah lantai = total luas lantai ÷ luas dasar, dan sisanya menjadi lantai atas yang lebih kecil. Area terbuka = lahan − luas dasar − area hijau; sekitar separuhnya dihitung sebagai parkir dengan 12,5 m² per mobil.',
      'Kos-kosan: jumlah kamar = total luas lantai ÷ luas per kamar, dibulatkan ke bawah. Ruko: jumlah unit = lebar depan ÷ lebar per unit, dibulatkan ke bawah; semua unit berbagi seluruh luas lantai yang diizinkan. Rumah sewa: nilai terkecil antara (luas lahan ÷ lahan per rumah) dan (luas lantai ÷ luas bangunan per rumah). Gudang: satu lantai, seluas yang diizinkan luas dasar. Pendapatan per tahun = sewa × 12 bulan (sewa ruko sudah per tahun) × tingkat hunian. Biaya bangun = luas yang dibangun × biaya per m². Balik modal = biaya bangun ÷ pendapatan per tahun. Imbal hasil tahunan = pendapatan per tahun ÷ biaya bangun.',
      'Cakupan bangunan = luas dasar ÷ luas lahan (dibandingkan dengan KDB). Rasio luas lantai = total luas lantai ÷ luas lahan (dibandingkan dengan KLB). Area hijau = luas area hijau ÷ luas lahan (dibandingkan dengan KDH). Tambahan lantai = sisa luas lantai yang diizinkan ÷ luas dasar, dibulatkan ke bawah. Lantai baru diasumsikan seluas luas dasar saat ini.',
    ],
    disclaimer:
      'Aturan, harga sewa, dan biaya yang ditampilkan hanyalah contoh. KDB, KLB, KDH, dan batas ketinggian yang berlaku untuk lahan Anda ditetapkan oleh Pemda (KRK/PKKPR). Angka pendapatan adalah perkiraan kasar dan kotor, bukan janji maupun persetujuan resmi. Pastikan kembali ke Pemda, perencana berlisensi, dan agen properti setempat sebelum memutuskan.',
    scene: {
      label: 'Model 3D lahan Anda',
      width: 'Depan {v}',
      depth: 'Kedalaman {v}',
      road: 'Jalan',
      ghost: 'Bisa ditambah',
      existing: 'Yang ada',
      fallbackTitle: 'Denah dan susunan lantai',
      alt: {
        land: 'Tampilan 3D: lahan {P} kali {L} meter.',
        max: 'Luas dasar bangunan {fp}, {floors}, total {floorArea}.',
        green: 'Area hijau {green}. Ruang untuk sekitar {cars} mobil.',
        idea: 'Menampilkan {name}: {fits}, luas lantai {built}.',
        existing: 'Bangunan yang ada: luas dasar {fp}, total luas lantai {tfa}. {answer}',
        empty: 'Tampilan 3D: isi data lahan Anda untuk melihatnya di sini.',
      },
    },
    short: { million: 'juta', billion: 'miliar', trillion: 'triliun' },
  },

  next: {
    eyebrow: 'Langkah selanjutnya',
    title: 'Dari obrolan sampai properti yang beroperasi.',
    steps: [
      {
        title: 'Chat dengan kami.',
        body: 'Ceritakan lahan atau bangunan Anda lewat WhatsApp. Hasil kalkulator ikut terkirim, jadi kita mulai dari angka Anda.',
        who: 'HOMYVEST',
      },
      {
        title: 'Survei lokasi dan studi kelayakan.',
        body: 'Kami datang ke lokasi, mengecek aturan dan lingkungannya, lalu memakai data kelayakan Behomy untuk melihat apa yang benar-benar cocok.',
        who: 'HOMYVEST · Behomy',
      },
      {
        title: 'Desain dan estimasi biaya.',
        body: 'HomyEight menyiapkan desain dan estimasi biaya, tanpa dipungut biaya.',
        who: 'HomyEight',
      },
      {
        title: 'Pembangunan.',
        body: 'HomyEight membangunnya, dari struktur sampai interior dan furnitur.',
        who: 'HomyEight',
      },
      {
        title: 'Operasional.',
        body: 'Behomy meluncurkan, mengisi, dan mengelolanya setiap hari.',
        who: 'Behomy',
      },
      {
        title: 'Laporan.',
        body: 'Pantau okupansi dan pendapatan lewat dashboard pemilik secara real-time.',
        who: 'Behomy',
      },
    ],
    close: {
      title: 'Kami siap saat Anda siap.',
      body: 'Ceritakan lahan atau bangunan Anda. Kami akan membalas dengan hal-hal yang perlu dicek lebih dulu.',
      withResults: 'Hasil cek lahan Anda akan ikut terkirim.',
    },
    leaveNumber: 'Tinggalkan nomor Anda',
    pf: {
      title: 'Lihat portofolio lengkap',
      body: 'Saksikan bangunan tersusun, jelajahi Maxone, dan lihat arena padel berdiri, bagian demi bagian.',
      list: 'Cerita · Masuk ke Maxone · Arena padel · Lebih dari penginapan',
    },
  },

  faq: {
    title: 'Pertanyaan yang sering ditanyakan pemilik',
    items: [
      {
        q: 'Apakah HOMYVEST developer? Apakah menjual bangunan?',
        a: 'Bukan. Kami tidak menjual bangunan maupun lahan. HOMYVEST membantu pemilik memahami lahan atau bangunannya bisa dijadikan apa dan bisa menghasilkan berapa. Saat Anda memutuskan untuk lanjut, HomyEight yang membangun dan Behomy yang mengelola.',
      },
      {
        q: 'Saya belum punya dana pembangunan. Tetap bisa menghubungi?',
        a: 'Bisa. Tinggalkan nomor Anda dan pilih "Saat ini belum memiliki dana untuk pembangunan". Banyak pemilik memulai dengan menyewakan, mengelola, atau membenahi properti yang sudah ada, dan kami bisa mengecek lahan Anda bisa dijadikan apa sebelum Anda mengeluarkan biaya.',
      },
      {
        q: 'Seberapa akurat kalkulatornya?',
        a: 'Ini gambaran awal, bukan penawaran harga. Hitungannya memakai data Anda dan harga contoh, serta menampilkan angka kotor sebelum biaya operasional, pajak, perizinan, dan pembiayaan. Survei lokasi dan studi kelayakan akan memberi angka yang sebenarnya.',
      },
      {
        q: 'Di mana saya bisa tahu KDB, KLB, dan KDH lahan saya?',
        a: 'Angka ini ditetapkan Pemda dan tercantum di dokumen seperti KRK (Keterangan Rencana Kota) atau PKKPR. Jika belum punya, coba contoh di kalkulator, dan kami bisa membantu mengeceknya.',
      },
      {
        q: 'Bangunan saya mangkrak. Bisa dilanjutkan?',
        a: 'Sering kali bisa. HomyEight akan mengecek struktur yang ada di lokasi lebih dulu, lalu mengusulkan cara melanjutkannya dan usaha yang cocok.',
      },
      {
        q: 'Apakah harus jadi guesthouse atau kos?',
        a: 'Tidak. Tim kami juga pernah merancang dan membangun kantor, kafe, dan arena olahraga. Kami menyarankan yang paling cocok dengan lahan, lokasi, dan tujuan Anda.',
      },
      {
        q: 'Berapa biaya desain dan estimasi biayanya?',
        a: 'Gratis. Konsep desain dan estimasi biaya tidak dipungut biaya.',
      },
      {
        q: 'Siapa yang mengelola properti setelah selesai dibangun?',
        a: 'Behomy, mitra operator hospitality kami: staf, tamu, pemasaran, perawatan, dan laporan. Anda bisa memantau semuanya lewat dashboard pemilik secara real-time.',
      },
      {
        q: 'Wilayah mana saja yang dilayani?',
        a: 'Saat ini Behomy mengelola 100+ lokasi di 18 wilayah, termasuk Jabodetabek, Bandung, Surabaya, Malang, Solo, Yogyakarta, Bandar Lampung, dan Bali. Di luar itu? Tanyakan saja.',
      },
      {
        q: 'Berapa lama prosesnya?',
        a: 'Tergantung besar proyek dan perizinan yang dibutuhkan. Setelah survei lokasi, kami akan memberikan jadwal yang jelas.',
      },
      {
        q: 'Saya tidak punya lahan tetapi ingin berinvestasi. Bisa?',
        a: 'Behomy juga menawarkan kemitraan ekuitas pada proyek hunian hybrid. Chat dengan kami dan kami akan menghubungkan Anda.',
      },
      {
        q: 'Bagaimana data yang saya kirim digunakan?',
        a: 'Data Anda disimpan dengan aman dan hanya digunakan oleh tim HOMYVEST, HomyEight, dan Behomy untuk menghubungi Anda terkait properti Anda. Kami tidak menjual atau membagikannya.',
      },
    ],
  },

  footer: {
    powered: 'Didukung oleh HomyEight · Dioperasikan oleh Behomy',
    rights: '© {year} HOMYVEST.',
    disclaimer:
      'Angka kalkulator adalah contoh dan perkiraan kasar yang masih kotor, bukan janji maupun persetujuan resmi. Pastikan batas yang berlaku ke Pemda (KRK/PKKPR) sebelum memutuskan.',
    contact: 'WhatsApp',
    settings: 'Tampilan',
  },

  notes: {
    label: 'Catatan',
    1: 'Rata-rata okupansi seluruh properti yang dikelola Behomy, Agu 2025–Mar 2026.',
    2: 'Rata-rata margin laba operasional kotor seluruh properti yang dikelola Behomy selama 8 bulan, Agu 2025–Mar 2026.',
    3: 'Berdasarkan company profile Behomy 2026. Hasil berbeda untuk setiap properti dan lokasi.',
    4: 'Perkiraan Behomy untuk proyek kemitraan ekuitasnya (durasi 10 tahun), dari company profile Behomy 2026. Ini perkiraan, bukan jaminan; hasil berbeda untuk setiap properti.',
  },

  glossary: {
    KDB: 'Koefisien Dasar Bangunan: porsi lahan yang boleh tertutup bangunan.',
    KLB: 'Koefisien Lantai Bangunan: total luas lantai yang diizinkan, sebagai kelipatan luas lahan.',
    KDH: 'Koefisien Daerah Hijau: porsi lahan yang wajib tetap hijau.',
    KRK: 'Dokumen dari Pemda yang memuat aturan untuk lahan Anda.',
    PBG: 'Persetujuan Bangunan Gedung (izin bangunan).',
    GOP: 'Gross operating profit: pendapatan dikurangi biaya operasional, sebelum biaya di tingkat pemilik.',
    hybrid: 'Satu bangunan yang disewakan harian sekaligus bulanan.',
  },

  alt: {
    'facades/best': 'Bangunan sudut saat senja dengan pelapis kayu dan batu gelap, semua jendela menyala.',
    'facades/facade-1': 'Bangunan lima lantai di sudut jalan dengan sirip vertikal oranye.',
    'facades/facade-2': 'Hunian bertingkat rendah dengan panel oranye dan pagar putih, pesepeda melintas.',
    'facades/benhil-1': 'Menara tujuh lantai dengan kolom roster bata oranye, dilihat dari jalan.',
    'facades/benhil-2': 'Menara tujuh lantai yang sama dilihat dari depan, di antara rumah-rumah tetangga.',
    'interiors/interior-1': 'Ruang makan memanjang dengan dinding beton, meja kayu, dan ceruk melengkung.',
    'interiors/interior-2': 'Kamar tidur dengan headboard hijau sage dan meja di dekat jendela besar.',
    'interiors/interior-3': 'Lobi dengan meja resepsionis, dinding glass block, dan tangga kayu.',
    'interiors/interior-4': 'Kamar tidur dengan headboard bilah hijau sage, televisi, dan lemari.',
    'interiors/interior-5': 'Ruang keluarga dua lantai dengan lampu gantung dan dinding kaca.',
    'interiors/interior-6': 'Lounge dan meja makan di bawah plafon kayu.',
    'interiors/interior-7': 'Kamar tidur dengan walk-in wardrobe dan pemandangan taman.',
    'interiors/interior-8': 'Dapur dan ruang makan dengan dinding beton dan meja kayu.',
    'maxone/1': 'Resepsionis hotel dengan mural stempel paspor, kursi bar kuning, dan kursi berlengan merah.',
    'maxone/2': 'Ruang makan dengan kursi biru tua di meja bundar, menghadap ke buffet.',
    'maxone/3': 'Rak bar melengkung di atas konter laci kuning dan kabinet hijau sage.',
    'maxone/4': 'Lantai ruang makan menghadap kaca di sisi jalan, dengan mezanin di atasnya.',
    'maxone/5': 'Buffet dan bar dilihat dari meja makan.',
    'maxone/6': 'Rangka pergola hijau sage di atas meja di samping jendela tinggi.',
    'maxone/7': 'Menengadah ke void dua lantai dengan tanaman gantung.',
    'maxone/layout': 'Denah lobi dan ruang makan hotel.',
    'office/office-1': 'Kantor dengan balok merah, skylight, dan meja panjang.',
    'office/office-2': 'Kantor dengan lantai herringbone, rak dinding, dan tanaman.',
    'office/office-3': 'Sudut lounge kantor dengan meja bundar.',
    'cafe/cafe': 'Kafe dengan ubin merah, meja kayu, dan tanaman gantung.',
    'others/athero-1': 'Tampak udara lapangan mini soccer dengan tribun dan area parkir.',
    'others/athero-2': 'Kafe kontainer dan tribun di samping lapangan mini soccer.',
    'others/athero-3': 'Pintu masuk arena dengan mobil terparkir dan pagar tinggi di sekeliling lapangan.',
    'others/athero-4': 'Pemandangan lapangan mini soccer dengan lampu sorot dan jaring.',
    'padel-clean/padel-1': 'Model potongan lantai dasar arena padel dengan empat lapangan dan kafe.',
    'padel-clean/padel-2': 'Model potongan arena padel dengan lantai atas, pepohonan, dan strukturnya.',
    'padel-clean/padel-3': 'Model arena padel yang selesai dengan atap melengkung.',
  },
};
