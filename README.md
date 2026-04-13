# Lumora AI - Tekstil Odaklı Chatbot Frontend

Modern, kullanıcı dostu bir chatbot arayüzü. FastAPI backend ile entegre çalışır ve AI tarafından üretilen görselleri gösterir.

## 📋 İçindekiler

- [Gereksinimler](#gereksinimler)
- [Kurulum](#kurulum)
- [Yapılandırma](#yapılandırma)
- [Kullanım](#kullanım)
- [Proje Yapısı](#proje-yapısı)
- [Sorun Giderme](#sorun-giderme)

## 🔧 Gereksinimler

Projeyi çalıştırmak için aşağıdakilere ihtiyacınız var:

- **Node.js** (v18 veya üzeri) - [İndir](https://nodejs.org/)
- **npm** veya **yarn** paket yöneticisi
- **FastAPI Backend** (chatbot için - http://localhost:8000)

### Node.js Kurulumu Kontrolü

Terminal/komut satırında şu komutu çalıştırarak Node.js'in kurulu olup olmadığını kontrol edin:

```bash
node --version
```

Eğer hata alırsanız, [Node.js'i indirip kurun](https://nodejs.org/).

## 🚀 Kurulum

### 1. Projeyi İndirin

Projeyi bilgisayarınıza indirin veya klonlayın:

```bash
# Git kullanıyorsanız:
git clone <repository-url>
cd chatbot-frontend

# Veya ZIP olarak indirdiyseniz, klasörü açın
```

### 2. Bağımlılıkları Kurun

Proje klasörüne gidin ve bağımlılıkları kurun:

```bash
# npm kullanıyorsanız:
npm install

# veya yarn kullanıyorsanız:
yarn install
```

Bu işlem birkaç dakika sürebilir. Tüm paketler `node_modules` klasörüne yüklenecek.

### 3. Environment Variables (Çevre Değişkenleri) Ayarlayın

Proje klasörünün kök dizininde `.env.local` adında bir dosya oluşturun:

**Windows'ta:**
```bash
# Komut satırında:
type nul > .env.local

# Veya Notepad ile oluşturun
```

**Mac/Linux'ta:**
```bash
touch .env.local
```

`.env.local` dosyasını açın ve aşağıdaki bilgileri ekleyin:

```env
# Backend URL (varsayılan: http://localhost:8000)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Önemli:** 
- Bu dosya `.gitignore` içinde olduğu için Git'e commit edilmez (güvenlik için)
- Backend'iniz farklı bir adreste çalışıyorsa URL'yi güncelleyin

## 🎯 Kullanım

### Geliştirme Modunda Çalıştırma

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

### Production Build

```bash
# Build oluştur
npm run build

# Production modunda çalıştır
npm start
```

### Diğer Komutlar

```bash
# Lint kontrolü (kod kalitesi)
npm run lint
```

## 📁 Proje Yapısı

```
chatbot-frontend/
├── app/                    # Next.js App Router dosyaları
│   ├── layout.tsx         # Ana layout
│   ├── page.tsx           # Ana sayfa (chat arayüzü)
│   └── globals.css        # Global stiller
├── components/            # React bileşenleri
│   ├── auth/             # Authentication bileşenleri
│   ├── chat/             # Chat bileşenleri
│   └── sidebar/          # Sidebar bileşenleri
├── hooks/                # Custom React hooks
│   └── useChat.ts        # Chat mantığı
├── types/                # TypeScript tip tanımları
├── lib/                  # Utility fonksiyonlar
├── public/               # Statik dosyalar
├── .env.local            # Environment variables (siz oluşturmalısınız)
├── package.json          # Proje bağımlılıkları
└── README.md            # Bu dosya
```

## 🔌 Backend Entegrasyonu

Proje, FastAPI backend ile çalışmak üzere tasarlanmıştır. Backend'iniz `http://localhost:8000` adresinde çalışıyorsa otomatik olarak bağlanır.

Backend'iniz farklı bir adreste çalışıyorsa, `.env.local` dosyasındaki `NEXT_PUBLIC_BACKEND_URL` değerini güncelleyin.

## 🎨 Özellikler

- ✅ Modern, responsive arayüz
- ✅ Gerçek zamanlı chat (Socket.IO)
- ✅ AI tarafından üretilen görselleri gösterme
- ✅ Markdown desteği
- ✅ Kullanıcı kimlik doğrulama
- ✅ Misafir modu desteği
- ✅ Sohbet geçmişi
- ✅ Animasyonlar ve geçişler

## 🐛 Sorun Giderme

### "Module not found" Hatası

Bağımlılıkları yeniden kurun:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 Zaten Kullanılıyor

Farklı bir port kullanmak için:

```bash
PORT=3001 npm run dev
```

### Backend Bağlantı Hatası

- Backend'inizin çalıştığından emin olun (`http://localhost:8000`)
- `.env.local` dosyasındaki `NEXT_PUBLIC_BACKEND_URL` değerini kontrol edin
- Browser console'da hata mesajlarını kontrol edin
- CORS ayarlarını kontrol edin

## 📚 Teknolojiler

- **Next.js 16** - React framework
- **React 19** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Stil framework'ü
- **Socket.IO Client** - Gerçek zamanlı iletişim
- **React Markdown** - Markdown render

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje özel bir projedir.

## 📞 Destek

Sorularınız için issue açabilir veya proje sahibiyle iletişime geçebilirsiniz.

---

**Not:** Bu proje geliştirme aşamasındadır. Production kullanımı için ek güvenlik önlemleri alınmalıdır.
