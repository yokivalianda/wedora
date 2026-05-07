import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle, Calendar, DollarSign, ListTodo, Users, FolderKanban } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1E1E] selection:bg-[#EFD6D2]">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-[#ECE7E1] bg-[#FAF7F2]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-heading text-2xl font-semibold tracking-wide text-[#1E1E1E]">
              Wed<span className="text-[#D4AF37]">ora</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-[#666666]">
            <a href="#fitur" className="transition-colors hover:text-[#1E1E1E]">Fitur</a>
            <a href="#aliran-kerja" className="transition-colors hover:text-[#1E1E1E]">Aliran Kerja</a>
            <a href="#harga" className="transition-colors hover:text-[#1E1E1E]">Harga</a>
            <a href="#faq" className="transition-colors hover:text-[#1E1E1E]">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-[#666666] transition-colors hover:text-[#1E1E1E]"
            >
              Masuk
            </Link>
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center rounded-full bg-[#1E1E1E] px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 lg:pt-36">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-3xl">
            {/* Tag / Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#EFD6D2] bg-white px-3.5 py-1 text-xs font-semibold tracking-wide text-[#607870] uppercase">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              Workspace Premium Wedding Organizer
            </div>
            
            <h1 className="mt-8 font-heading text-4xl font-semibold tracking-tight text-[#1E1E1E] sm:text-6xl lg:text-7xl">
              Kelola Proyek Pernikahan <br />
              <span className="text-[#D4AF37] font-serif italic">Dengan Anggun & Tenang</span>
            </h1>
            
            <p className="mt-8 text-lg leading-8 text-[#666666] max-w-2xl mx-auto font-sans">
              Selamat tinggal tumpukan berkas dan lembar kerja yang membingungkan. 
              <strong> Wedora</strong> menghadirkan ruang kerja modern untuk mengelola proyek, 
              klien, anggaran, vendor, dan timeline pernikahan dalam satu platform terpadu yang sangat mewah.
            </p>

            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#1E1E1E] px-6 py-3.5 text-base font-semibold text-white shadow-md transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Mulai Workspace Gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full border border-[#ECE7E1] bg-white px-6 py-3.5 text-base font-semibold text-[#1E1E1E] shadow-sm transition-colors hover:bg-[#FAF7F2]"
              >
                Masuk ke Dashboard
              </Link>
            </div>
          </div>

          {/* Elegant Dashboard Mockup Image Preview */}
          <div className="mt-16 sm:mt-24 lg:mt-32">
            <div className="relative rounded-2xl border border-[#ECE7E1] bg-white p-4 shadow-card">
              <div className="rounded-xl border border-[#FAF7F2] bg-[#FAF7F2]/50 p-6 sm:p-10">
                {/* Simulated Premium Interface */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#ECE7E1] pb-6">
                  <div className="text-left">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Aktifitas Hari Ini</span>
                    <h3 className="font-heading text-2xl font-semibold text-[#1E1E1E]">Amara Wedding Organizer</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-[#EFD6D2] px-3.5 py-1 text-xs font-semibold text-[#1E1E1E]">Plan Profesional</span>
                    <span className="rounded-full bg-[#FAF7F2] border border-[#ECE7E1] px-3.5 py-1 text-xs font-medium text-[#666666]">5 Proyek Aktif</span>
                  </div>
                </div>

                {/* Dashboard grid layout */}
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#FAF7F2] p-2 text-[#D4AF37]">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-[#666666]">Pernikahan Terdekat</span>
                    </div>
                    <p className="mt-4 font-heading text-xl font-semibold text-[#1E1E1E]">Anisa & Reza</p>
                    <p className="mt-1 text-xs text-[#666666]">14 Juni 2026 • Ritz-Carlton Jakarta</p>
                  </div>

                  <div className="rounded-xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#FAF7F2] p-2 text-[#607870]">
                        <DollarSign className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                      <span className="text-sm font-medium text-[#666666]">Total Pendapatan</span>
                    </div>
                    <p className="mt-4 font-heading text-xl font-semibold text-[#1E1E1E]">Rp 604.000.000</p>
                    <p className="mt-1 text-xs text-emerald-600">Pelunasan Aman</p>
                  </div>

                  <div className="rounded-xl border border-[#ECE7E1] bg-white p-5 text-left shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#FAF7F2] p-2 text-[#D4AF37]">
                        <ListTodo className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-[#666666]">Tugas Hari Ini</span>
                    </div>
                    <p className="mt-4 font-heading text-xl font-semibold text-[#1E1E1E]">2 Tugas Jatuh Tempo</p>
                    <p className="mt-1 text-xs text-[#666666]">Menu katering & fitting gaun</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="fitur" className="border-t border-[#ECE7E1] bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1E1E1E] sm:text-4xl">
              Dirancang Khusus untuk Wedding Planner Profesional
            </h2>
            <p className="mt-4 text-base text-[#666666]">
              Setiap alat yang Anda butuhkan untuk menyukseskan hari paling bahagia klien Anda dengan presisi tinggi.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              
              <div className="flex flex-col text-left">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-[#1E1E1E]">
                  <FolderKanban className="h-5 w-5 text-[#D4AF37]" />
                  Kelola Proyek Pernikahan
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-[#666666]">
                  <p className="flex-auto">
                    Simpan seluruh detail calon pengantin, data venue, paket pernikahan, dan catatan penting dalam satu ruang kerja yang rapi.
                  </p>
                </dd>
              </div>

              <div className="flex flex-col text-left">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-[#1E1E1E]">
                  <ListTodo className="h-5 w-5 text-[#D4AF37]" />
                  Checklist & Manajemen Tugas
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-[#666666]">
                  <p className="flex-auto">
                    Kelola ribuan tugas pernikahan tanpa stres. Atur prioritas, delegasikan ke tim coordinator lapangan, dan lacak progresnya.
                  </p>
                </dd>
              </div>

              <div className="flex flex-col text-left">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-[#1E1E1E]">
                  <DollarSign className="h-5 w-5 text-[#D4AF37]" />
                  Pelacak Anggaran & DP
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-[#666666]">
                  <p className="flex-auto">
                    Catat riwayat pembayaran dari klien (DP hingga Pelunasan) serta rincian pembayaran ke vendor katering, dekorasi, atau dokumentasi.
                  </p>
                </dd>
              </div>

              <div className="flex flex-col text-left">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-[#1E1E1E]">
                  <Users className="h-5 w-5 text-[#D4AF37]" />
                  Portal Klien Mewah
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-[#666666]">
                  <p className="flex-auto">
                    Berikan pengalaman premium bagi calon pengantin Anda untuk memantau persiapan pernikahan, anggaran, dan menyetujui timeline secara langsung.
                  </p>
                </dd>
              </div>

            </dl>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="border-t border-[#ECE7E1] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#1E1E1E] sm:text-4xl">
              Harga Sederhana untuk Bisnis Berkelanjutan
            </h2>
            <p className="mt-4 text-base text-[#666666]">
              Semua paket dilengkapi dengan masa uji coba gratis 14 hari tanpa kartu kredit.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
            
            {/* Starter Plan */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#ECE7E1] bg-white p-8 shadow-soft">
              <div>
                <h3 className="text-lg font-semibold leading-8 text-[#1E1E1E]">Starter</h3>
                <p className="mt-4 text-sm leading-6 text-[#666666]">Cocok untuk WO perorangan yang baru memulai bisnis.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-[#1E1E1E]">Gratis</span>
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-[#666666]">
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> Maksimal 3 proyek pernikahan aktif
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> 2 pengguna dalam tim (Staff)
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> Checklist tugas standar
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 block rounded-full border border-[#ECE7E1] bg-[#FAF7F2] px-3 py-2.5 text-center text-sm font-semibold leading-6 text-[#1E1E1E] transition-colors hover:bg-[#ECE7E1]"
              >
                Mulai Gratis
              </Link>
            </div>

            {/* Professional Plan (Highlighted) */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-[#D4AF37] bg-white p-8 shadow-gold relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#D4AF37] px-4 py-1 text-xs font-semibold text-white uppercase tracking-wider">
                Paling Populer
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-8 text-[#1E1E1E]">Professional</h3>
                <p className="mt-4 text-sm leading-6 text-[#666666]">Sempurna untuk tim WO yang berkembang dengan banyak proyek.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-[#1E1E1E]">Rp 299rb</span>
                  <span className="text-sm font-semibold leading-6 text-[#666666]">/bulan</span>
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-[#666666]">
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> Proyek pernikahan aktif tanpa batas
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> Maksimal 5 pengguna dalam tim
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> Laporan anggaran & grafik keuangan
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> Portal klien interaktif
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 block rounded-full bg-[#1E1E1E] px-3 py-2.5 text-center text-sm font-semibold leading-6 text-white shadow-sm transition-transform duration-200 hover:scale-[1.01]"
              >
                Coba 14 Hari Gratis
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#ECE7E1] bg-white p-8 shadow-soft">
              <div>
                <h3 className="text-lg font-semibold leading-8 text-[#1E1E1E]">Agency</h3>
                <p className="mt-4 text-sm leading-6 text-[#666666]">Untuk agensi pernikahan besar yang butuh kustomisasi brand.</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-[#1E1E1E]">Rp 699rb</span>
                  <span className="text-sm font-semibold leading-6 text-[#666666]">/bulan</span>
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-[#666666]">
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> Tim pengguna tanpa batas
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> White-label domain klien Anda sendiri
                  </li>
                  <li className="flex gap-x-3">
                    <CheckCircle className="h-5 w-5 flex-none text-[#D4AF37]" /> Prioritas dukungan pelanggan 24/7
                  </li>
                </ul>
              </div>
              <Link
                href="/register"
                className="mt-8 block rounded-full border border-[#ECE7E1] bg-[#FAF7F2] px-3 py-2.5 text-center text-sm font-semibold leading-6 text-[#1E1E1E] transition-colors hover:bg-[#ECE7E1]"
              >
                Mulai Berlangganan
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ECE7E1] bg-[#FAF7F2]">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <span className="font-heading text-xl font-semibold tracking-wide text-[#1E1E1E]">
              Wed<span className="text-[#D4AF37]">ora</span>
            </span>
            <p className="mt-2 text-xs text-[#666666]">© 2026 Wedora SaaS. Hak Cipta Dilindungi Undang-Undang.</p>
          </div>
          <div className="flex gap-6 text-xs text-[#666666]">
            <a href="#" className="hover:text-[#1E1E1E]">Kebijakan Privasi</a>
            <a href="#" className="hover:text-[#1E1E1E]">Ketentuan Layanan</a>
            <a href="#" className="hover:text-[#1E1E1E]">Hubungi Kami</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
