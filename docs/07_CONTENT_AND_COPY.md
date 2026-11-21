# 07 — Content and copy (EN / ID)

All visible text, in English (default) and Bahasa Indonesia. It lives in `src/i18n/en.js` and `src/i18n/id.js` as nested keys (e.g. `hero.b1.title`). Placeholders in `{braces}` are filled with values formatted by the calc formatters in the active language.

**`src/i18n/en.js` and `id.js` are the shipped source of truth.** This document mirrors them for review and translation. Rows added or rewritten in update U01 use the real key paths, shortened where the section heading gives the prefix; a few rows group several keys (`a / b`) or name an array item (`[0]`). Rows kept from the first build still use its shorthand names (e.g. `step1` for `next.steps[0]`, `handles.1` for `behomy.handles.items[0]`, `p.kos.size` for `calc.s2.p.kosSize`): find those strings in the code by their text. If the two disagree, the code is what visitors see: fix whichever is wrong and log it.

You may make small edits for fit (line length, rhythm) **without changing meaning or facts**. Log any rewording of facts-related lines in `docs/DECISIONS.md`. Never add claims.

Two more sources of visible text:
- **Funnel option labels** (chips and radio cards): `OPTION_LABELS` in `src/lib/leads/leads.ts` (§18), shared with the PDF report and the database values.
- **Image captions:** `src/content/projects.js` and `src/content/behomy.js` (`08` §5). **Alt text:** `alt.*` in the i18n files.

## 1. Rules
- Calm, warm, plain, confident. Address one owner: "you / your land" (ID: "Anda / lahan Anda").
- No exclamation marks in body copy. No hype words. Never say "USP" or "why choose us".
- HOMYVEST never "sells" anything. Use: helps, finds, shows, works out, connects, builds (HomyEight), runs (Behomy).
- Keep: HOMYVEST, HomyEight, Behomy, Behomy Group, Beefix, Athero, Kos-kosan, Ruko, KDB, KLB, KDH, KRK, PKKPR, PBG, Pemda.
- Numbers always use the active locale (`1,200` / `1.200`).
- Indonesian is written natively, not translated word for word. Use "Anda" and stay polite but not stiff.

---

## 2. Hero
### 2.1 Main page hero (`#top`: `hero.*`, `consult.*`)
| Key | EN | ID |
|---|---|---|
| hero.partner | In partnership with | Bekerja sama dengan |
| hero.title1 | Turn idle land into steady income. | Ubah lahan menganggur jadi penghasilan rutin. |
| hero.title2 | Built by HomyEight, operated by Behomy. | Dibangun oleh HomyEight, dioperasikan oleh Behomy. |
| hero.body | Have an empty plot or an unfinished building? Leave your number and we'll show you what it could become. | Punya lahan kosong atau bangunan mangkrak? Tinggalkan nomor Anda, kami tunjukkan bisa dijadikan apa. |
| hero.chip | 82% average occupancy across Behomy properties | Rata-rata okupansi 82% di properti Behomy |
| consult.label | Free consultation with the HomyEight team | Konsultasi gratis dengan tim HomyEight |
| consult.number | +62 821-1010-6088 | +62 821-1010-6088 |

`hero.title1` and `hero.title2` together are the page's `<h1>`. The chip's footnote marker ¹ is added by the markup (a link to footnote 1, §15), not written into the string. The phone card and the funnel are in §18.

### 2.2 The story (`/portofolio/` `#story`: `hero.*`)
| Key | EN | ID |
|---|---|---|
| scrollCue | Scroll | Scroll |
| b1.title | Your land is waiting. | Lahan Anda sedang menunggu. |
| b1.body | An empty plot or an unfinished building costs you every month it sits still. It could be earning instead. | Lahan kosong atau bangunan mangkrak tetap memakan biaya setiap bulan. Padahal, keduanya bisa menghasilkan. |
| b2.title | First, we build it right. | Pertama, kami bangun dengan benar. |
| b2.body | Designed and built by HomyEight, our construction and interior partner. | Dirancang dan dibangun oleh HomyEight, mitra konstruksi dan interior kami. |
| b3.title | It doesn't have to be a guesthouse. | Tidak harus jadi guesthouse. |
| b3.body | A stay, an office, a café, a sports court. We study your land and find what suits it best. | Penginapan, kantor, kafe, atau lapangan olahraga. Kami pelajari lahan Anda dan temukan yang paling cocok. |
| b3.labels | Hybrid stay · Office · Café · Sports court | Hunian hybrid · Kantor · Kafe · Lapangan olahraga |
| b4.title | Then we bring it to life. | Lalu kami hidupkan. |
| b4.body | The Behomy Group runs it every day: guests, marketing, maintenance and your monthly report. | Behomy Group mengelolanya setiap hari: tamu, pemasaran, perawatan, sampai laporan bulanan Anda. |
| b5.title | From idle to earning. | Dari menganggur jadi menghasilkan. |
| b5.stat1 | 82% · average occupancy across Behomy properties¹ | 82% · rata-rata okupansi properti Behomy¹ |
| b5.stat2 | 3,000+ · rooms under management | 3.000+ · kamar dalam pengelolaan |
| b5.cta1 | See what your land can do | Cek potensi lahan Anda |
| b5.cta2 | Chat on WhatsApp | Chat via WhatsApp |

On `/portofolio/`, `b5.cta1` links to `/#calculator` (the land check is on the main page). The story's beat headlines are `<h2>` there. Its skip labels are `pf.skipStory`, `homyeight.walk.skip` and `pf.skipPadel` (§19). The Beyond divider shows `pf.index[3]` ("Beyond stays") instead of a separate eyebrow.

## 3. What is HOMYVEST? (`#about`: `about.*`)
| Key | EN | ID |
|---|---|---|
| title | What is HOMYVEST? | Apa itu HOMYVEST? |
| body | HOMYVEST helps owners of idle land and unfinished buildings turn them into properties that earn. We look at what your land is allowed to hold and what would work best there, from a hybrid stay to an office or a sports court. Then HomyEight builds it and Behomy runs it, so you deal with one team from start to finish. | HOMYVEST membantu pemilik lahan menganggur dan bangunan mangkrak mengubahnya menjadi properti yang menghasilkan. Kami melihat seberapa besar bangunan yang boleh berdiri di lahan Anda dan usaha apa yang paling cocok, dari hunian hybrid sampai kantor atau lapangan olahraga. Setelah itu HomyEight membangunnya dan Behomy mengelolanya, jadi Anda cukup berurusan dengan satu tim dari awal sampai akhir. |
| note | We're not a developer and we don't sell property. We work on yours. | Kami bukan developer dan tidak menjual properti. Kami menggarap milik Anda. |

## 4. End-to-end (`#how`: `how.*`)
Replaces the old "Three names, one team" section. `how.steps` is an array of four `{ name, body, by }`; the "by" line is set in small italics.

| Key | EN | ID |
|---|---|---|
| eyebrow | How it works | Cara kerja |
| title | From the first sketch to full rooms, we take care of it. | Dari sketsa pertama sampai kamar terisi, semuanya kami urus. |
| sub | You keep one contact. Behind it, three teams do the work. | Anda cukup punya satu kontak. Di baliknya, tiga tim yang bekerja. |
| steps[0] | **Plan.** We study your land, the local rules and the demand nearby, and work out what will earn best. *HOMYVEST, with Behomy's feasibility data* | **Rencana.** Kami pelajari lahan Anda, aturan setempat, dan permintaan di sekitarnya, lalu menghitung usaha yang paling menguntungkan. *HOMYVEST, dengan data kelayakan Behomy* |
| steps[1] | **Design.** HomyEight turns the plan into drawings and a clear cost estimate, free of charge. *HomyEight* | **Desain.** HomyEight mengubah rencana menjadi gambar desain dan estimasi biaya yang jelas, tanpa biaya. *HomyEight* |
| steps[2] | **Build.** HomyEight builds it, from the structure to the interiors and furniture from its own workshop. *HomyEight* | **Bangun.** HomyEight membangunnya, dari struktur sampai interior dan furnitur dari workshop sendiri. *HomyEight* |
| steps[3] | **Operate.** Behomy opens it, fills it and runs it every day. You follow it all on a live owner dashboard. *Behomy* | **Kelola.** Behomy membuka, mengisi, dan mengelolanya setiap hari. Anda memantau semuanya lewat dashboard pemilik secara langsung. *Behomy* |
| closing | HOMYVEST finds the potential, HomyEight builds it, and Behomy keeps it running. You only need to save one number. | HOMYVEST menemukan potensinya, HomyEight membangunnya, dan Behomy menjaganya tetap berjalan. Anda cukup menyimpan satu nomor. |

## 5. Maxone walkthrough (`/portofolio/` `#maxone`: `homyeight.*`)
The keys keep their `homyeight.` prefix; the HomyEight intro they used to sit under was removed in U01 (§20).

| Key | EN | ID |
|---|---|---|
| walk.title | Step inside one of our projects. | Masuk ke salah satu proyek kami. |
| walk.hint | Scroll to walk through | Scroll untuk menjelajah |
| walk.skip | Skip walkthrough | Lewati penjelajahan |
| walk.stops | Arrival · The welcome · The dining hall · The buffet and bar · Look up · By the windows · The whole floor | Kedatangan · Area sambutan · Ruang makan · Buffet dan bar · Lihat ke atas · Di dekat jendela · Seluruh lantai |
| walk.mapLabel | Floor plan, your position | Denah, posisi Anda |

## 6. Behomy (`#behomy`: `behomy.*`)
The section opens with the Behomy hero (`behomy.hero.*`, its title is the section's `<h2>`); the older title follows as an `<h3>`. The old eyebrow "Run by Behomy" was removed (DECISIONS U01-D9).

| Key | EN | ID |
|---|---|---|
| hero.eyebrow | Operated by Behomy | Dioperasikan oleh Behomy |
| hero.title | Building it is half the story. Behomy keeps it full. | Selesai dibangun baru separuh cerita. Behomy memastikannya terisi. |
| hero.body | Indonesia's hybrid stay pioneer runs 3,000+ rooms across 100+ locations, mixing nightly guests with monthly tenants so rooms keep earning. | Pelopor hunian hybrid di Indonesia ini mengelola 3.000+ kamar di 100+ lokasi, memadukan tamu harian dengan penyewa bulanan agar kamar terus menghasilkan. |
| hero.more | See how it works | Lihat cara kerjanya |
| title | Daily guests and monthly tenants. One building, full all year. | Tamu harian dan penyewa bulanan. Satu bangunan, terisi sepanjang tahun. |
| body | Behomy is a hybrid stay operator. It mixes hotel-style daily stays with monthly kost living under one roof, so rooms keep earning in busy months and quiet ones. | Behomy adalah operator hunian hybrid. Behomy menggabungkan menginap harian ala hotel dengan sewa bulanan ala kos dalam satu bangunan, sehingga kamar tetap menghasilkan di musim ramai maupun sepi. |
| hybrid.daily | Daily stays | Menginap harian |
| hybrid.monthly | Monthly stays | Sewa bulanan |
| hybrid.caption | Daily guests in busy months, monthly tenants in quiet ones. The rooms keep earning. | Tamu harian saat musim ramai, penyewa bulanan saat musim sepi. Kamar tetap menghasilkan. |
| stats[0] | 82% · average occupancy¹ | 82% · rata-rata okupansi¹ |
| stats[1] | 65.4% · average gross operating profit margin² | 65,4% · rata-rata margin laba operasional kotor (GOP)² |
| stats[2] | < 3.5 yrs · estimated break-even on Behomy equity partnership projects⁴ | < 3,5 thn · perkiraan balik modal proyek kemitraan ekuitas Behomy⁴ |
| stats[3] | 3,000+ · rooms under management | 3.000+ · kamar dalam pengelolaan |
| stats[4] | 100+ · locations in 18 areas | 100+ · lokasi di 18 wilayah |
| handles.title | What Behomy takes off your hands | Yang Behomy urus untuk Anda |
| handles.1 | **Set-up and staff.** Permits, furnishing, hiring and training hospitality staff. | **Persiapan dan staf.** Perizinan, furnishing, rekrutmen, dan pelatihan staf hospitality. |
| handles.2 | **Getting guests.** Page-one local search, an official hotel-chain tag on Agoda, Traveloka, tiket.com and Trip.com, and a network of 500+ creators. | **Mendatangkan tamu.** Peringkat teratas di pencarian lokal, tag resmi "Hotel Chain" di Agoda, Traveloka, tiket.com, dan Trip.com, serta jaringan 500+ kreator. |
| handles.3 | **Care and repairs.** Beefix, Behomy's own maintenance team, handles repairs, air conditioning, plumbing and deep cleaning. | **Perawatan dan perbaikan.** Beefix, tim perawatan milik Behomy, menangani perbaikan, AC, plumbing, dan deep cleaning. |
| handles.4 | **Clear reporting.** A real-time owner dashboard for occupancy and finances, and 24-hour guest support. | **Laporan yang jelas.** Dashboard pemilik real-time untuk okupansi dan keuangan, serta layanan tamu 24 jam. |
| brands | Behomy Residence · Corvel · Purnava Village · Hoteru | Behomy Residence · Corvel · Purnava Village · Hoteru |
| uplift | Behomy's hybrid model can earn up to 2.5× a conventional kost. Results vary by property.³ | Model hybrid Behomy dapat menghasilkan hingga 2,5× kos konvensional. Hasil berbeda untuk setiap properti.³ |
| portfolio.title | Places Behomy runs today | Properti yang dikelola Behomy saat ini |
| portfolio.team | The Behomy team | Tim Behomy |
| portfolio.training | Front office and housekeeping training | Pelatihan front office dan housekeeping |
| ba.title | From idle to running | Dari menganggur jadi beroperasi |
| ba.sub | Real buildings, before and after Behomy and HomyEight took them on. | Bangunan nyata, sebelum dan sesudah ditangani Behomy dan HomyEight. |
| ba.before / ba.after | Before · After | Sebelum · Sesudah |
| ba.label | Before and after pairs | Pasangan foto sebelum dan sesudah |
| ba.pair | Pair {n} of {total} | Pasangan {n} dari {total} |
| bridge | Here are some of the places we've built and run. | Berikut beberapa tempat yang kami bangun dan kelola. |

The break-even figure is a fact from `02` §6: always "estimated", always with footnote 4. It's written "< 3.5 yrs" / "< 3,5 thn" with the unit on the baseline (DECISIONS U01-D12). The captions under the Behomy photos (brand names, places, types in both languages) are in `src/content/behomy.js` (`08` §5); `ba.label` and `ba.pair` name the phone carousel and its dots for screen readers.

## 7. Projects (`#projects`)
| Key | EN | ID |
|---|---|---|
| eyebrow | Projects | Proyek |
| title | Places we've built and run. | Tempat yang kami bangun dan kelola. |
| body | Kost, guesthouses, homestays and villas. | Kos, guesthouse, homestay, dan vila. |
| viewer.close / prev / next | Close · Previous · Next | Tutup · Sebelumnya · Berikutnya |
| bridge | Not every plot should be a place to stay. | Tidak semua lahan harus jadi tempat menginap. |

No filters since U01: every image shows, in one curated order (`04` §5). The bridge now leads into the land check.

Caption placeholders (three voices, `03` §2), identical in both languages until the owner fills them in:
**Project Name** · City, Province · *Type · Year*

## 8. Beyond stays and the padel hall (`/portofolio/` `#padel`, `#beyond`: `beyond.*`)
| Key | EN | ID |
|---|---|---|
| title | Some land earns more as something else. | Ada lahan yang lebih menguntungkan jika dijadikan hal lain. |
| body | A sports hall, a café, an office. If that suits your land and your area better, that's what we'll suggest. | Arena olahraga, kafe, atau kantor. Jika itu lebih cocok untuk lahan dan lingkungan Anda, itulah yang kami sarankan. |
| padel.stages[0] | Ground floor: the courts, a café and changing rooms. | Lantai dasar: lapangan, kafe, dan ruang ganti. |
| padel.stages[1] | Upper floor: a lounge above the café, and the structure rises. | Lantai atas: lounge di atas kafe, dan strukturnya mulai berdiri. |
| padel.stages[2] | Finished: one hall, ready to book. | Selesai: satu arena, siap dipesan. |
| padel.tag | Padel hall · Design by HomyEight | Arena padel · Desain oleh HomyEight |
| ways.soccer.title / body | Mini soccer · An open plot can become a busy weekend venue, with a café and stands beside the pitch. | Mini soccer · Lahan terbuka bisa menjadi tempat yang ramai setiap akhir pekan, lengkap dengan kafe dan tribun di samping lapangan. |
| ways.cafe.title / body | Café · A corner on a busy street can earn more serving coffee than housing tenants. | Kafe · Sudut di jalan yang ramai bisa lebih menguntungkan sebagai kedai kopi daripada hunian. |
| ways.office.title / body | Office · Close to business districts, flexible offices fill quickly. | Kantor · Di dekat kawasan bisnis, kantor yang fleksibel cepat terisi. |
| ways.open | Open {name} images | Buka gambar {name} |

The ground-floor line names no court count: the renders and the model show four courts (DECISIONS D18). The old closing line "So what could your land become?" was removed with the move to `/portofolio/` (§20); the page closes with §19 instead.

## 9. Calculator: intro and Step 1
| Key | EN | ID |
|---|---|---|
| eyebrow | Land check | Cek lahan |
| title | What can your land become? | Lahan Anda bisa jadi apa? |
| body | Enter your land's size and local building rules. You'll see how much you're allowed to build, what different uses could cost and earn, and what to plan for. | Masukkan ukuran lahan dan aturan bangunan setempat. Anda akan melihat seberapa besar bangunan yang boleh dibangun, berapa biaya dan potensi pendapatan berbagai pilihan, serta apa saja yang perlu disiapkan. |
| note | Takes about a minute. Nothing is sent anywhere unless you choose to share it. | Hanya sekitar satu menit. Tidak ada data yang dikirim kecuali Anda memilih untuk membagikannya. |
| tabs | 1 Your land · 2 Ideas for your land · 3 Already built? Add a floor | 1 Lahan Anda · 2 Ide untuk lahan Anda · 3 Sudah ada bangunan? Tambah lantai |
| example | Example | Contoh |
| reset | Reset to example values | Kembalikan ke nilai contoh |
| f.P / help | Front width (m) · The side facing the road. | Lebar depan (m) · Sisi yang menghadap jalan. |
| f.L / help | Depth (m) · From the road to the back of the land. | Kedalaman (m) · Dari sisi jalan sampai batas belakang lahan. |
| f.kdb / help | KDB (%) · Building coverage: how much of the land a building may cover. | KDB (%) · Koefisien Dasar Bangunan: berapa persen lahan yang boleh tertutup bangunan. |
| f.klb / help | KLB (×) · Floor area ratio: total floor area of all floors, as a multiple of the land area. | KLB (×) · Koefisien Lantai Bangunan: total luas semua lantai, sebagai kelipatan luas lahan. |
| f.kdh / help | KDH (%) · Green area: how much of the land must stay green or open soil. | KDH (%) · Koefisien Daerah Hijau: berapa persen lahan yang wajib tetap hijau atau berupa tanah terbuka. |
| f.maxFloors / help | Max floors (optional) · Some areas also limit building height. Leave empty if there's no limit. | Batas jumlah lantai (opsional) · Beberapa wilayah juga membatasi tinggi bangunan. Kosongkan jika tidak ada batas. |
| presets.title | Don't know your rules yet? Try an example: | Belum tahu aturannya? Coba contoh: |
| presets | Typical example · Quiet housing area · Busy commercial road | Contoh umum · Kawasan perumahan tenang · Jalan komersial ramai |
| presets.note | Examples only. Your real limits are in your KRK or PKKPR from the local government. | Hanya contoh. Batas yang berlaku ada di KRK atau PKKPR dari Pemda. |
| r.headline | Your land can hold up to {floorArea} of building. | Lahan Anda bisa menampung bangunan hingga {floorArea}. |
| r.floors.none | None allowed | Tidak diizinkan |
| r.floors.single | 1 floor of {partial} | 1 lantai seluas {partial} |
| r.floors.full | {full} floors / 1 floor | {full} lantai |
| r.floors.plusPartial | + a smaller top floor of {partial} | + 1 lantai atas yang lebih kecil, seluas {partial} |
| r.floors.capped | Limited by the max-floors rule. | Dibatasi oleh aturan jumlah lantai. |
| r.cover | Building may cover · {fp} ({pct} of the land) | Bangunan boleh menutup · {fp} ({pct} dari lahan) |
| r.area | Land area · {A} | Luas lahan · {A} |
| r.green | Must stay green · {greenMin} | Wajib tetap hijau · {greenMin} |
| r.parking | Room for parking · About {cars} cars ({open} open, rough estimate) | Ruang parkir · Sekitar {cars} mobil ({open} area terbuka, perkiraan kasar) |
| r.parkingTight | Very tight | Sangat terbatas |
| legend | Building · Green · Open (driveway, parking, service) | Bangunan · Hijau · Terbuka (akses, parkir, servis) |
| w.conflict | Your KDB and KDH add up to more than 100%, so the building area was reduced to {fp} to leave room for green. Please double-check these numbers. | Jika dijumlahkan, KDB dan KDH Anda lebih dari 100%, jadi luas bangunan dikurangi menjadi {fp} agar tetap ada ruang hijau. Mohon cek kembali angkanya. |
| w.klbLow | Your KLB is lower than your KDB, so even a single floor can't use the full footprint. The total floor area ({floorArea}) is the limit that counts. | KLB Anda lebih kecil dari KDB, jadi satu lantai pun tidak bisa memakai seluruh luas dasar. Yang berlaku adalah total luas lantai ({floorArea}). |
| w.empty | Enter the front width and depth of your land to begin. | Masukkan lebar depan dan kedalaman lahan Anda untuk memulai. |
| next.ideas | Next: see what this space could earn | Berikutnya: lihat potensi pendapatannya |
| next.addFloor | Already built? See if a floor fits | Sudah ada bangunan? Cek apakah bisa tambah lantai |
| view.reset | Reset view | Atur ulang tampilan |

`next.ideas` is always Step 1's primary button and `next.addFloor` its secondary link (`05` §2). The door-B variant ("Check my building") was removed in U01 (§20).

## 10. Calculator: Step 2 and Step 3
### Step 2
| Key | EN | ID |
|---|---|---|
| s2.title | Four ways this land could earn | Empat cara lahan ini bisa menghasilkan |
| s2.body | Each idea uses the space allowed in step 1. Rents and costs are examples, so replace them with prices from your area. | Setiap ide memakai luas yang diizinkan di langkah 1. Harga sewa dan biaya hanyalah contoh, jadi ganti dengan harga di daerah Anda. |
| landChip | Your land: {P} × {L} m · {A} · KDB {kdb}% · KLB {klb} · KDH {kdh}% · Edit | Lahan Anda: {P} × {L} m · {A} · KDB {kdb}% · KLB {klb} · KDH {kdh}% · Ubah |
| occ / help | Expected occupancy (%) · On average, how full you expect it to be. Applies to every idea. | Perkiraan tingkat hunian (%) · Rata-rata seberapa penuh yang Anda harapkan. Berlaku untuk semua ide. |
| names | Kos-kosan · Ruko · Rental houses · Warehouse | Kos-kosan · Ruko · Rumah sewa · Gudang |
| adjust | Adjust prices | Ubah harga |
| p.kos.size / help | Room size (m²) · Per room, including the bathroom and a share of corridors and stairs. | Luas per kamar (m²) · Per kamar, termasuk kamar mandi dan bagian koridor serta tangga. |
| p.kos.rent | Rent per room / month | Sewa per kamar / bulan |
| p.ruko.width | Width of one unit (m) | Lebar per unit (m) |
| p.ruko.rent | Rent per unit / year | Sewa per unit / tahun |
| p.rumah.land / help | Land per house (m²) · Including its yard. | Lahan per rumah (m²) · Termasuk halaman. |
| p.rumah.floor | Floor area per house (m²) | Luas bangunan per rumah (m²) |
| p.rumah.rent | Rent per house / month | Sewa per rumah / bulan |
| p.gudang.rent | Rent per m² / month | Sewa per m² / bulan |
| p.cost | Build cost per m² | Biaya bangun per m² |
| rows | What fits · Floor area to build · Build cost (approx.) · Rent per year (approx.) · Yearly return on build cost · Pays back the build cost in · Good to know | Yang muat · Luas yang dibangun · Biaya bangun (perkiraan) · Sewa per tahun (perkiraan) · Imbal hasil tahunan dari biaya bangun · Balik modal bangunan dalam · Perlu diketahui |
| fits.kos | {n} rooms | {n} kamar |
| fits.ruko | {n} units, {m} each | {n} unit, masing-masing {m} |
| fits.rumah | {n} houses | {n} rumah |
| fits.gudang | {m}, one floor | {m}, satu lantai |
| fits.none | Doesn't fit | Tidak muat |
| tip.kos | Many tenants means many motorbikes, so plan the parking. | Banyak penghuni berarti banyak motor, jadi siapkan parkirnya. |
| tip.ruko | Works best on a busy road. | Paling cocok di jalan yang ramai. |
| tip.rumah | Lower income, but steady and easy to manage. | Pendapatan lebih kecil, tetapi stabil dan mudah dikelola. |
| tip.gudang | Needs truck access and a wide road. One floor. | Butuh akses truk dan jalan yang lebar. Satu lantai. |
| badge | Fastest | Tercepat |
| select | Show in 3D | Tampilkan di 3D |
| sum.noLand | Fill in your land in step 1 to compare ideas. | Isi data lahan di langkah 1 untuk membandingkan ide. |
| sum.noPrices | Add rents and build costs to compare ideas. | Tambahkan harga sewa dan biaya bangun untuk membandingkan ide. |
| sum.best | {best} pays back fastest: about {payback} for {cost} of building, earning around {income} a year. | {best} paling cepat balik modal: sekitar {payback} dengan biaya bangun {cost}, dan pendapatan sekitar {income} per tahun. |
| sum.second | Next is {second}, at about {payback}. | Berikutnya {second}, sekitar {payback}. |
| sum.cheapest | If you have less to invest, {cheapest} costs the least to build ({cost}) and pays back in about {payback}. | Jika modal Anda lebih terbatas, {cheapest} paling murah dibangun ({cost}) dan balik modal dalam sekitar {payback}. |
| caveat | These are gross figures. They leave out running costs, tax, permits (PBG), financing, empty months beyond your occupancy figure, and the value of the land itself. Running costs and day-to-day operations are where most projects succeed or fail, and that's the part HomyEight and Behomy handle with you. | Ini angka kotor. Belum termasuk biaya operasional, pajak, perizinan (PBG), pembiayaan, bulan kosong di luar tingkat hunian yang Anda isi, dan nilai lahannya sendiri. Biaya operasional dan pengelolaan harian adalah penentu berhasil tidaknya sebuah proyek, dan bagian itulah yang ditangani HomyEight dan Behomy bersama Anda. |
| hybridNote | Thinking of a stay? These examples use plain monthly kost rent. Behomy's hybrid model mixes daily and monthly guests, so ask us what that could mean for your land. | Tertarik membuat penginapan? Contoh ini memakai sewa kos bulanan biasa. Model hybrid Behomy menggabungkan tamu harian dan bulanan, jadi tanyakan kepada kami apa artinya untuk lahan Anda. |

### Step 3
| Key | EN | ID |
|---|---|---|
| s3.title | Already have a building? See if you can add more. | Sudah punya bangunan? Lihat apakah bisa ditambah. |
| s3.body | Finished or not, enter what's there today. We'll check it against your land's rules and see whether another floor fits. | Sudah jadi atau belum, masukkan kondisinya saat ini. Kami cek terhadap aturan lahan Anda dan lihat apakah masih bisa tambah lantai. |
| f.fp / help | Building footprint (m²) · The ground area the building covers. | Luas dasar bangunan (m²) · Luas tanah yang tertutup bangunan. |
| f.tfa / help | Total floor area, all floors (m²) · Add up every floor, including unfinished ones. | Total luas lantai, semua lantai (m²) · Jumlahkan semua lantai, termasuk yang belum selesai. |
| f.green / help | Green area (m²) · Garden or open soil. | Luas area hijau (m²) · Taman atau tanah terbuka. |
| a.broken | Not yet. The building already breaks a rule, so that needs fixing first. | Belum bisa. Bangunan ini sudah melanggar aturan, jadi itu perlu dibereskan dulu. |
| a.needFp | Enter the building's footprint to check. | Masukkan luas dasar bangunan untuk mengecek. |
| a.many | Yes. You could add up to {extra} more floors of {fp}. | Bisa. Anda bisa menambah hingga {extra} lantai lagi seluas {fp}. |
| a.one | Yes. One more floor of {fp} fits. | Bisa. Masih muat satu lantai lagi seluas {fp}. |
| a.smaller | Only a smaller one: {faRoom} left, less than a full {fp} floor. | Hanya lantai yang lebih kecil: tersisa {faRoom}, kurang dari satu lantai penuh seluas {fp}. |
| a.none | No. You've used all the floor area the rules allow. | Tidak bisa. Seluruh luas lantai yang diizinkan sudah terpakai. |
| g.ok / over | Within the limit · Over the limit | Sesuai batas · Melebihi batas |
| g.kdb.ok / over | You can still spread {fpRoom} on the ground. · {over} over the limit. | Masih bisa melebar {fpRoom} di lantai dasar. · Melebihi batas {over}. |
| g.klb.ok / over | {faRoom} of floor area left. · {over} over the limit. | Sisa luas lantai {faRoom}. · Melebihi batas {over}. |
| g.kdh.ok / short | Enough green. · {greenShort} more green needed. | Area hijau cukup. · Perlu tambahan area hijau {greenShort}. |
| leftover | {leftover} ({pct}) left for driveway, parking and service. | {leftover} ({pct}) tersisa untuk akses, parkir, dan servis. |
| leftoverNeg | The building plus the green area is larger than the land. Please check your numbers. | Luas bangunan ditambah area hijau melebihi luas lahan. Mohon cek kembali angkanya. |
| needLand | Fill in your land in step 1 first. | Isi data lahan di langkah 1 terlebih dahulu. |
| floorsCap | Showing 40 of {n} floors | Menampilkan 40 dari {n} lantai |

### Results CTA (after Step 2 and Step 3)
| Key | EN | ID |
|---|---|---|
| cta.title | Want to turn this into a real plan? | Ingin menjadikannya rencana nyata? |
| cta.button | Send my results on WhatsApp | Kirim hasil saya via WhatsApp |
| cta.note | We'll reply with what we'd check first. | Kami akan membalas dengan hal-hal yang perlu dicek lebih dulu. |

## 11. "How this is calculated" (one disclosure per step)
**Step 1**
- EN: Land area = front width × depth. The building may cover land area × KDB, but never more than what's left after the required green area. The total floor area allowed = land area × KLB (or footprint × max floors, if that's smaller). Floors = total floor area ÷ footprint, and any remainder becomes a smaller top floor. Open area = land − footprint − green; about half of it is counted as parking at 12.5 m² per car.
- ID: Luas lahan = lebar depan × kedalaman. Bangunan boleh menutup luas lahan × KDB, tetapi tidak boleh melebihi sisa lahan setelah dikurangi area hijau wajib. Total luas lantai yang diizinkan = luas lahan × KLB (atau luas dasar × batas jumlah lantai, jika lebih kecil). Jumlah lantai = total luas lantai ÷ luas dasar, dan sisanya menjadi lantai atas yang lebih kecil. Area terbuka = lahan − luas dasar − area hijau; sekitar separuhnya dihitung sebagai parkir dengan 12,5 m² per mobil.

**Step 2**
- EN: Kos-kosan: rooms = total floor area ÷ room size, rounded down. Ruko: units = front width ÷ unit width, rounded down; the units share all the allowed floor area. Rental houses: the smaller of (land ÷ land per house) and (floor area ÷ floor area per house). Warehouse: one floor, as large as the footprint allows. Yearly income = rent × 12 months (ruko rent is already yearly) × occupancy. Build cost = floor area built × cost per m². Payback = build cost ÷ yearly income. Yearly return = yearly income ÷ build cost.
- ID: Kos-kosan: jumlah kamar = total luas lantai ÷ luas per kamar, dibulatkan ke bawah. Ruko: jumlah unit = lebar depan ÷ lebar per unit, dibulatkan ke bawah; semua unit berbagi seluruh luas lantai yang diizinkan. Rumah sewa: nilai terkecil antara (luas lahan ÷ lahan per rumah) dan (luas lantai ÷ luas bangunan per rumah). Gudang: satu lantai, seluas yang diizinkan luas dasar. Pendapatan per tahun = sewa × 12 bulan (sewa ruko sudah per tahun) × tingkat hunian. Biaya bangun = luas yang dibangun × biaya per m². Balik modal = biaya bangun ÷ pendapatan per tahun. Imbal hasil tahunan = pendapatan per tahun ÷ biaya bangun.

**Step 3**
- EN: Coverage = footprint ÷ land area (compared with KDB). Floor area ratio = total floor area ÷ land area (compared with KLB). Green = green area ÷ land area (compared with KDH). Extra floors = remaining allowed floor area ÷ footprint, rounded down. A new floor is assumed to be the same size as the current footprint.
- ID: Cakupan bangunan = luas dasar ÷ luas lahan (dibandingkan dengan KDB). Rasio luas lantai = total luas lantai ÷ luas lahan (dibandingkan dengan KLB). Area hijau = luas area hijau ÷ luas lahan (dibandingkan dengan KDH). Tambahan lantai = sisa luas lantai yang diizinkan ÷ luas dasar, dibulatkan ke bawah. Lantai baru diasumsikan seluas luas dasar saat ini.

## 12. WhatsApp
- Number: +62 821-1010-6088 · link base `https://wa.me/6282110106088?text=`
- Message builder: `src/lib/calc/whatsapp.ts` (`05` §12). Its English and Indonesian templates are the source of truth. Keep them in sync if you edit wording here.
- Generic message (no land entered): EN *"Hi HOMYVEST! I have land or a building that isn't earning yet, and I'd like to know what it could become. Can we talk?"* · ID *"Halo HOMYVEST! Saya punya lahan/bangunan yang belum produktif dan ingin tahu bisa dijadikan apa. Bisa kita ngobrol?"*
- Button labels (`wa.*`): header **WhatsApp** · mobile menu (`wa.hero`) **Chat on WhatsApp** / **Chat via WhatsApp** (the story's beat 5 uses the same words from `hero.b5.cta2`) · calculator **Send my results on WhatsApp** / **Kirim hasil saya via WhatsApp** · `#next` **Chat with us on WhatsApp** / **Chat dengan kami via WhatsApp** · floating button `aria-label` "Chat on WhatsApp" / "Chat via WhatsApp".
- The main hero shows the number itself as the link, after "Free consultation with the HomyEight team" (§2.1), with the generic message.
- **Funnel messages** (§18): Step 2's "Prefer to chat?" link uses the generic message. From Step 3 on (the Step 3 link, the thank-you button, the handoff and error screens) the message is built by `buildLeadWhatsAppMessage()` in `src/lib/leads/leads.ts` from the visitor's answers: EN opens *"Hi HOMYVEST! I just filled in the form on your website."*, lists name, funding, what they own and want to build (or their need) and city, and ends *"Please get in touch for a consultation."* · ID opens *"Halo HOMYVEST! Saya baru mengisi formulir di website Anda."* and ends *"Mohon hubungi saya untuk konsultasi."* Option labels come from `OPTION_LABELS`.

## 13. FAQ (`#faq`)
| # | EN question · answer | ID question · answer |
|---|---|---|
| 1 | **Is HOMYVEST a developer? Do you sell buildings?** No. We don't sell buildings or land. HOMYVEST helps owners understand what their land or building could become and what it could earn. When you decide to go ahead, HomyEight builds it and Behomy runs it. | **Apakah HOMYVEST developer? Apakah menjual bangunan?** Bukan. Kami tidak menjual bangunan maupun lahan. HOMYVEST membantu pemilik memahami lahan atau bangunannya bisa dijadikan apa dan bisa menghasilkan berapa. Saat Anda memutuskan untuk lanjut, HomyEight yang membangun dan Behomy yang mengelola. |
| 2 | **I don't have construction funds yet. Should I still get in touch?** Yes. Leave your number and choose "Currently do not have funds for construction". Many owners start by renting out, running or improving a property they already have, and we can check what your land could become before you spend anything. | **Saya belum punya dana pembangunan. Tetap bisa menghubungi?** Bisa. Tinggalkan nomor Anda dan pilih "Saat ini belum memiliki dana untuk pembangunan". Banyak pemilik memulai dengan menyewakan, mengelola, atau membenahi properti yang sudah ada, dan kami bisa mengecek lahan Anda bisa dijadikan apa sebelum Anda mengeluarkan biaya. |
| 3 | **How accurate is the calculator?** It's a first look, not a quote. It uses your inputs and example prices, and shows gross figures before running costs, tax, permits and financing. A site survey and feasibility study give you the real numbers. | **Seberapa akurat kalkulatornya?** Ini gambaran awal, bukan penawaran harga. Hitungannya memakai data Anda dan harga contoh, serta menampilkan angka kotor sebelum biaya operasional, pajak, perizinan, dan pembiayaan. Survei lokasi dan studi kelayakan akan memberi angka yang sebenarnya. |
| 4 | **Where do I find my KDB, KLB and KDH?** They're set by your local government and stated in documents such as the KRK (Keterangan Rencana Kota) or your PKKPR. If you don't have them yet, try an example in the calculator, and we can help you check. | **Di mana saya bisa tahu KDB, KLB, dan KDH lahan saya?** Angka ini ditetapkan Pemda dan tercantum di dokumen seperti KRK (Keterangan Rencana Kota) atau PKKPR. Jika belum punya, coba contoh di kalkulator, dan kami bisa membantu mengeceknya. |
| 5 | **My building is unfinished. Can you continue it?** Often, yes. HomyEight first checks the existing structure on site, then proposes how to continue it and what business it could become. | **Bangunan saya mangkrak. Bisa dilanjutkan?** Sering kali bisa. HomyEight akan mengecek struktur yang ada di lokasi lebih dulu, lalu mengusulkan cara melanjutkannya dan usaha yang cocok. |
| 6 | **Does it have to be a guesthouse or kost?** No. Our team has also designed and built offices, cafés and sports venues. We suggest whatever fits your land, location and goals best. | **Apakah harus jadi guesthouse atau kos?** Tidak. Tim kami juga pernah merancang dan membangun kantor, kafe, dan arena olahraga. Kami menyarankan yang paling cocok dengan lahan, lokasi, dan tujuan Anda. |
| 7 | **What does the design and cost estimate cost?** Nothing. Design concepts and cost estimates are free. | **Berapa biaya desain dan estimasi biayanya?** Gratis. Konsep desain dan estimasi biaya tidak dipungut biaya. |
| 8 | **Who runs the property after it's built?** Behomy, our hospitality operating partner: staff, guests, marketing, maintenance and reporting. You follow everything on a real-time owner dashboard. | **Siapa yang mengelola properti setelah selesai dibangun?** Behomy, mitra operator hospitality kami: staf, tamu, pemasaran, perawatan, dan laporan. Anda bisa memantau semuanya lewat dashboard pemilik secara real-time. |
| 9 | **Which areas do you cover?** Behomy currently runs 100+ locations in 18 areas, including Greater Jakarta, Bandung, Surabaya, Malang, Solo, Yogyakarta, Bandar Lampung and Bali. Somewhere else? Ask us. | **Wilayah mana saja yang dilayani?** Saat ini Behomy mengelola 100+ lokasi di 18 wilayah, termasuk Jabodetabek, Bandung, Surabaya, Malang, Solo, Yogyakarta, Bandar Lampung, dan Bali. Di luar itu? Tanyakan saja. |
| 10 | **How long does it take?** It depends on the size of the project and the permits needed. After the site survey, we'll give you a clear timeline. | **Berapa lama prosesnya?** Tergantung besar proyek dan perizinan yang dibutuhkan. Setelah survei lokasi, kami akan memberikan jadwal yang jelas. |
| 11 | **I don't own land, but I'd like to invest. Is that possible?** Behomy also offers equity partnerships in hybrid stay projects. Chat with us and we'll connect you. | **Saya tidak punya lahan tetapi ingin berinvestasi. Bisa?** Behomy juga menawarkan kemitraan ekuitas pada proyek hunian hybrid. Chat dengan kami dan kami akan menghubungkan Anda. |
| 12 | **What happens to the details I send?** They're stored securely and used only by the HOMYVEST, HomyEight and Behomy team to contact you about your property. We don't sell or share them. | **Bagaimana data yang saya kirim digunakan?** Data Anda disimpan dengan aman dan hanya digunakan oleh tim HOMYVEST, HomyEight, dan Behomy untuk menghubungi Anda terkait properti Anda. Kami tidak menjual atau membagikannya. |

Q2 was replaced and Q12 added in update U01; the others are unchanged.

## 14. What happens next (`#next`) and site-wide UI
| Key | EN | ID |
|---|---|---|
| next.eyebrow | What happens next | Langkah selanjutnya |
| next.title | From a chat to a running property. | Dari obrolan sampai properti yang beroperasi. |
| step1 | **Chat with us.** Tell us about your land or building on WhatsApp. Your calculator results come along, so we start from your numbers. *HOMYVEST* | **Chat dengan kami.** Ceritakan lahan atau bangunan Anda lewat WhatsApp. Hasil kalkulator ikut terkirim, jadi kita mulai dari angka Anda. *HOMYVEST* |
| step2 | **Site survey and feasibility.** We visit, check the rules and the area, and use Behomy's feasibility data to see what really works there. *HOMYVEST · Behomy* | **Survei lokasi dan studi kelayakan.** Kami datang ke lokasi, mengecek aturan dan lingkungannya, lalu memakai data kelayakan Behomy untuk melihat apa yang benar-benar cocok. *HOMYVEST · Behomy* |
| step3 | **Design and cost estimate.** HomyEight prepares the design and a cost estimate, free of charge. *HomyEight* | **Desain dan estimasi biaya.** HomyEight menyiapkan desain dan estimasi biaya, tanpa dipungut biaya. *HomyEight* |
| step4 | **Build.** HomyEight builds it, from structure to interior and furniture. *HomyEight* | **Pembangunan.** HomyEight membangunnya, dari struktur sampai interior dan furnitur. *HomyEight* |
| step5 | **Operate.** Behomy launches it, fills it and runs it day to day. *Behomy* | **Operasional.** Behomy meluncurkan, mengisi, dan mengelolanya setiap hari. *Behomy* |
| step6 | **Report.** You follow occupancy and income on a real-time owner dashboard. *Behomy* | **Laporan.** Pantau okupansi dan pendapatan lewat dashboard pemilik secara real-time. *Behomy* |
| close.title | Ready when you are. | Kami siap saat Anda siap. |
| close.body | Tell us about your land or building. We'll reply with what we'd check first. | Ceritakan lahan atau bangunan Anda. Kami akan membalas dengan hal-hal yang perlu dicek lebih dulu. |
| close.withResults | Your land check results will be included. | Hasil cek lahan Anda akan ikut terkirim. |
| next.leaveNumber | Leave your number | Tinggalkan nomor Anda |
| next.pf.title | See our full portfolio | Lihat portofolio lengkap |
| next.pf.body | Watch a building come together, walk through Maxone and see a padel hall rise, piece by piece. | Saksikan bangunan tersusun, jelajahi Maxone, dan lihat arena padel berdiri, bagian demi bagian. |
| next.pf.list | Story · Step inside Maxone · Padel hall · Beyond stays | Cerita · Masuk ke Maxone · Arena padel · Lebih dari penginapan |
| nav.how / behomy / projects / calculator / faq / portfolio | How it works · Behomy · Projects · Land check · FAQ · Portfolio | Cara kerja · Behomy · Proyek · Cek lahan · FAQ · Portofolio |
| nav.home | Home | Beranda |
| menu / close | Menu · Close | Menu · Tutup |
| lang | EN · ID (aria: "Language") | EN · ID (aria: "Bahasa") |
| theme | Light · Dark · Auto | Terang · Gelap · Otomatis |
| footer.powered | Powered by HomyEight · Operated by Behomy | Didukung oleh HomyEight · Dioperasikan oleh Behomy |
| footer.rights | © {year} HOMYVEST. | © {year} HOMYVEST. |
| skipToContent | Skip to content | Langsung ke konten |
| faq.title | Questions owners ask us | Pertanyaan yang sering ditanyakan pemilik |

## 15. Disclaimer and footnotes
**Calculator disclaimer** (under the calculator, and in the footer in short form):
- EN: The rules, rents and costs shown are examples for illustration. Your real KDB, KLB, KDH and height limits come from your local government (KRK/PKKPR). Income figures are rough gross estimates, not a promise or an official approval. Confirm with the local government, a licensed planner and local agents before you decide.
- ID: Aturan, harga sewa, dan biaya yang ditampilkan hanyalah contoh. KDB, KLB, KDH, dan batas ketinggian yang berlaku untuk lahan Anda ditetapkan oleh Pemda (KRK/PKKPR). Angka pendapatan adalah perkiraan kasar dan kotor, bukan janji maupun persetujuan resmi. Pastikan kembali ke Pemda, perencana berlisensi, dan agen properti setempat sebelum memutuskan.

**Footnotes** (small, near the stats they belong to):
1. EN: Average occupancy across all Behomy-managed properties, Aug 2025–Mar 2026. · ID: Rata-rata okupansi seluruh properti yang dikelola Behomy, Agu 2025–Mar 2026.
2. EN: Average gross operating profit margin across Behomy-managed properties over 8 months, Aug 2025–Mar 2026. · ID: Rata-rata margin laba operasional kotor seluruh properti yang dikelola Behomy selama 8 bulan, Agu 2025–Mar 2026.
3. EN: Based on Behomy's 2026 company profile. Results vary by property and location. · ID: Berdasarkan company profile Behomy 2026. Hasil berbeda untuk setiap properti dan lokasi.
4. EN: Behomy's own estimates for its equity partnership projects (10-year terms), from its 2026 company profile. Estimates, not guarantees; results vary by property. · ID: Perkiraan Behomy untuk proyek kemitraan ekuitasnya (durasi 10 tahun), dari company profile Behomy 2026. Ini perkiraan, bukan jaminan; hasil berbeda untuk setiap properti.

Keys `notes.1` … `notes.4`. All four sit under the Behomy stats band (`#note-1` … `#note-4`); the hero's occupancy chip links to footnote 1.

## 16. SEO and sharing
| Key | EN | ID |
|---|---|---|
| title | HOMYVEST: Turn idle land into income | HOMYVEST: Ubah lahan menganggur jadi penghasilan |
| description | Have empty land or an unfinished building? See what it can hold and earn, then let HomyEight build it and Behomy run it. | Punya lahan kosong atau bangunan mangkrak? Lihat potensi bangunan dan pendapatannya, lalu biarkan HomyEight membangun dan Behomy mengelolanya. |
| ogAlt | HOMYVEST wordmark over a lit-up property at dusk | Wordmark HOMYVEST di atas properti yang menyala saat senja |

These are `meta.*`, used on `/`. The portfolio page has its own (`pfMeta.*`), so switching language there never shows the main page's title (DECISIONS U01-D4):

| Key | EN | ID |
|---|---|---|
| pfMeta.title | Portfolio: HOMYVEST | Portofolio: HOMYVEST |
| pfMeta.description | See how HomyEight builds and Behomy runs: a building assembling, a walk through Maxone, a padel hall rising, and more. | Lihat cara HomyEight membangun dan Behomy mengelola: bangunan yang tersusun, menjelajahi Maxone, arena padel yang berdiri, dan lainnya. |
| pfMeta.ogAlt | HOMYVEST wordmark over a lit-up property at dusk | Wordmark HOMYVEST di atas properti yang menyala saat senja |

## 17. Glossary shown as tooltips (first appearance of each term)
| Term | EN | ID |
|---|---|---|
| KDB | Building coverage ratio: the share of land a building may cover. | Koefisien Dasar Bangunan: porsi lahan yang boleh tertutup bangunan. |
| KLB | Floor area ratio: total floor area allowed, as a multiple of land area. | Koefisien Lantai Bangunan: total luas lantai yang diizinkan, sebagai kelipatan luas lahan. |
| KDH | Green area ratio: the share of land that must stay green. | Koefisien Daerah Hijau: porsi lahan yang wajib tetap hijau. |
| KRK / PKKPR | Local government documents that state the rules for your plot. | Dokumen dari Pemda yang memuat aturan untuk lahan Anda. |
| PBG | Building permit (Persetujuan Bangunan Gedung). | Persetujuan Bangunan Gedung (izin bangunan). |
| GOP | Gross operating profit: income minus operating costs, before owner-level costs. | Gross operating profit: pendapatan dikurangi biaya operasional, sebelum biaya di tingkat pemilik. |
| Hybrid stay | One building rented both by the night and by the month. | Satu bangunan yang disewakan harian sekaligus bulanan. |

## 18. Lead funnel (`funnel.*`)
The phone card in the hero and the panel (`04` §1).

### Phone card and panel
| Key | EN | ID |
|---|---|---|
| phone.label | Enter your phone number so we can contact you | Masukkan nomor telepon Anda agar kami bisa menghubungi Anda |
| phone.placeholder | 812 3456 7890 | 812 3456 7890 |
| phone.continue | Continue | Lanjut |
| phone.privacy | We'll only use it to talk to you about your property. | Nomor Anda hanya kami gunakan untuk membahas properti Anda. |
| phone.error | Please enter a valid Indonesian mobile number, for example 0812 3456 7890. | Masukkan nomor HP Indonesia yang valid, contoh 0812 3456 7890. |
| phone.done | Thanks, we'll be in touch at {phone}. | Terima kasih, kami akan menghubungi Anda di {phone}. |
| panel.poweredBy | Powered by | Didukung oleh |
| panel.step | Step {n} of 3 | Langkah {n} dari 3 |
| panel.close | Close | Tutup |
| panel.recap | We'll contact you at {phone} | Kami akan menghubungi Anda di {phone} |
| panel.change | Change | Ubah |
| panel.back | Back | Kembali |
| panel.continue | Continue | Lanjut |
| panel.send | Send | Kirim |
| panel.sending | Sending… | Mengirim… |
| panel.chat | Prefer to chat? WhatsApp us | Lebih suka chat? Hubungi via WhatsApp |

### Steps 2 and 3
| Key | EN | ID |
|---|---|---|
| funding.title | What is your funding source for building or renovating your property? | Apa sumber dana untuk membangun atau merenovasi properti Anda? |
| funding.help | Choose the option that fits best. | Pilih yang paling sesuai. |
| build.title | Tell us about your property | Ceritakan tentang properti Anda |
| f.name.label / help | What's your name? · So we know who we're talking to. | Siapa nama Anda? · Agar kami tahu sedang berbicara dengan siapa. |
| f.owned.label / help | What property or land do you own now? · Choose all that apply. | Properti atau lahan apa yang Anda miliki saat ini? · Boleh pilih lebih dari satu. |
| f.build.label / help | What would you like to build? · Choose all that apply. "Not sure yet" is a fine answer. | Apa yang ingin Anda bangun? · Boleh pilih lebih dari satu. "Belum yakin" juga tidak apa-apa. |
| f.city.label / help | Where is the property? · Choose all that apply. | Di mana lokasi propertinya? · Boleh pilih lebih dari satu. |
| f.need.label | Which of these fits you best? | Mana yang paling sesuai dengan Anda? |
| f.otherPlaceholder | Tell us briefly | Ceritakan singkat |
| needs.title | No construction budget yet? That's okay. | Belum ada dana pembangunan? Tidak masalah. |
| needs.body | Plenty of owners start here. Behomy and HomyEight also help with properties that are already standing, from renting them out and running them day to day to filling more rooms. We can also check what a well-located property could become before you spend anything. | Banyak pemilik memulai dari sini. Behomy dan HomyEight juga membantu properti yang sudah berdiri, mulai dari menyewakan dan mengelolanya setiap hari sampai mengisi lebih banyak kamar. Kami juga bisa mengecek properti di lokasi strategis bisa dijadikan apa sebelum Anda mengeluarkan biaya. |
| consent | By sending this, you agree that the HOMYVEST, HomyEight and Behomy team may contact you about your property. | Dengan mengirim ini, Anda setuju dihubungi oleh tim HOMYVEST, HomyEight, dan Behomy terkait properti Anda. |
| err.required | Please fill this in. | Mohon diisi. |
| err.chooseOne | Please choose at least one. | Pilih minimal satu. |
| err.chooseSingle | Please choose one. | Pilih salah satu. |
| err.tooLong | That's a little long. Please shorten it. | Terlalu panjang. Mohon dipersingkat. |
| err.summary | Please check the highlighted fields. | Mohon periksa kolom yang ditandai. |

### Result screens
| Key | EN | ID |
|---|---|---|
| thanks.title | Thank you, {firstName}. We've got your details. | Terima kasih, {firstName}. Data Anda sudah kami terima. |
| thanks.body | The HomyEight team will reach out on WhatsApp at {phone} during working hours. Want to talk sooner? Message us now. | Tim HomyEight akan menghubungi Anda via WhatsApp di {phone} pada jam kerja. Ingin lebih cepat? Kirim pesan sekarang. |
| thanks.whatsapp | Chat on WhatsApp now | Chat via WhatsApp sekarang |
| thanks.calc | Try the land check | Coba cek lahan |
| thanks.portfolio | See our full portfolio | Lihat portofolio lengkap |
| handoff.title | Almost there: send your details on WhatsApp | Sedikit lagi: kirim data Anda lewat WhatsApp |
| handoff.body | Your answers are already written into the message. Just press send. | Jawaban Anda sudah tertulis di pesan. Tinggal tekan kirim. |
| handoff.button | Send on WhatsApp | Kirim via WhatsApp |
| error.title | We couldn't send your details just now | Data Anda belum berhasil terkirim |
| error.body | Send them on WhatsApp instead; your answers are already filled in. Or try again in a moment. | Kirim lewat WhatsApp saja, jawaban Anda sudah terisi otomatis. Atau coba lagi sebentar lagi. |
| error.retry | Try again | Coba lagi |
| rate.body | You've already sent this a few times. We'll be in touch soon, or message us on WhatsApp. | Anda sudah mengirim ini beberapa kali. Kami akan segera menghubungi Anda, atau kirim pesan via WhatsApp. |

The rate-limit screen has no separate title; its one sentence is the heading (DECISIONS U01-D11).

### Option labels (`OPTION_LABELS` in `src/lib/leads/leads.ts`)
The funding labels are the owner's exact wording. The stored values (in brackets) must match the database enums; `leads.test.ts` checks that.

| Group | EN | ID |
|---|---|---|
| Funding (radio) | Loan from bank / financial institution (`bank_loan`) · Personal funds (`personal_funds`) · Currently do not have funds for construction (`no_funds`) | Pinjaman bank / lembaga keuangan · Dana pribadi · Saat ini belum memiliki dana untuk pembangunan |
| Owned (chips) | Kost / coliving · Apartment · House · Shophouse (ruko) · Hotel / guesthouse · Vacant land · Unfinished building · Other | Kos / coliving · Apartemen · Rumah · Ruko · Hotel / guesthouse · Lahan kosong · Bangunan belum selesai · Lainnya |
| Build (chips) | Kost / coliving · Hybrid stay / guesthouse · Apartment · Rental houses / townhouses · Mixed-use · Café, office or sports venue · Not sure yet, help me decide · Other | Kos / coliving · Hunian hybrid / guesthouse · Apartemen · Rumah sewa / townhouse · Mixed-use · Kafe, kantor, atau arena olahraga · Belum yakin, bantu saya memilih · Lainnya |
| Need (radio) | I want to rent out my apartment or house · I need help running my boarding house · I want more of my rooms filled · I have a property in a good location and want to know what it could become · Something else | Saya ingin menyewakan apartemen atau rumah saya · Saya butuh bantuan mengelola kos · Saya ingin kamar saya lebih banyak terisi · Saya punya properti di lokasi strategis dan ingin tahu bisa dijadikan apa · Hal lain |
| City (chips) | Jakarta · Bodetabek · Bandung · Semarang · Yogyakarta · Solo · Surabaya · Malang · Bali · Bandar Lampung · Medan · Other | the same, with "Lainnya" |

## 19. Portfolio page (`/portofolio/`: `pf.*`)
| Key | EN | ID |
|---|---|---|
| pf.eyebrow | Portfolio | Portofolio |
| pf.title | Our full portfolio | Portofolio lengkap kami |
| pf.intro | Three projects, told in motion. Take your time: scroll slowly and each one builds itself in front of you. | Tiga proyek, diceritakan lewat gerak. Santai saja: scroll perlahan dan setiap proyek akan tersusun di depan Anda. |
| pf.begin | Scroll to begin | Scroll untuk mulai |
| pf.index | The story · Step inside Maxone · The padel hall · Beyond stays | Ceritanya · Masuk ke Maxone · Arena padel · Lebih dari penginapan |
| pf.indexLabel | On this page | Di halaman ini |
| pf.skipStory | Skip the story | Lewati cerita |
| pf.skipPadel | Skip padel hall | Lewati arena padel |
| pf.close.title | Like what you see? Let's look at your land. | Suka dengan yang Anda lihat? Mari lihat lahan Anda. |
| pf.close.back | ← Back to home | ← Kembali ke beranda |

The closing's "Leave your number" reuses `next.leaveNumber` (§14). `pf.title` is the page's `<h1>`. Where each string sits on the page: `04` §10 and `06`.

## 20. Removed copy (update U01)
Deleted from both language files with the sections they belonged to. Don't bring them back:
- the doors: `about.eyebrow`, the old `about.title` and `about.body`, `about.doorsTitle`, `about.doorA.*`, `about.doorB.*`, `about.bridge`
- the Team section: `team.*`
- the HomyEight intro: `homyeight.eyebrow`, `homyeight.title`, `homyeight.body`, `homyeight.stats`, `homyeight.bridge` (the `homyeight.walk.*` keys stay, §5)
- the Projects filters: `projects.filters`, `projects.filterLabel`
- the calculator's door-B entry: `calc.doorBNote`, `calc.next.building`, `calc.next.ideasAlt`
- `behomy.eyebrow` ("Run by Behomy"), `beyond.bridge`, and the unused `movements` list
- after the portfolio page was built: `hero.skip`, `beyond.eyebrow`, `beyond.padel.skip` and `beyond.ways.label` (the page uses `pf.skipStory`, `pf.skipPadel` and its dividers instead)

Details: DECISIONS U01-D12.
