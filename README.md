# Lumora AI - Tekstil Odaklı Chatbot Frontend

Modern, kullanıcı dostu bir chatbot arayüzü. Rasa backend ile entegre çalışır ve AWS S3 üzerinden görsel yükleme desteği sunar.

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
- **AWS S3 Hesabı** (görsel yükleme için)
- **Rasa Backend** (chatbot için - opsiyonel)

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
cd bediralvesil

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
# AWS S3 Yapılandırması
S3_BUCKET_NAME=your-bucket-name
S3_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Rasa Backend URL (Opsiyonel - varsayılan: http://localhost:5005)
# RASA_API_URL=http://localhost:5005/webhooks/rest/webhook
```

**Önemli:** 
- `your-bucket-name`, `your-access-key-id`, `your-secret-access-key` yerine kendi AWS bilgilerinizi yazın
- Bu dosya `.gitignore` içinde olduğu için Git'e commit edilmez (güvenlik için)

### AWS S3 Bilgilerini Nasıl Alırsınız?

1. [AWS Console](https://aws.amazon.com/console/)'a giriş yapın
2. IAM servisine gidin ve bir kullanıcı oluşturun
3. S3 erişim izinleri verin
4. Access Key ve Secret Key'i oluşturun
5. S3'te bir bucket oluşturun

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
bediralvesil/
├── app/                    # Next.js App Router dosyaları
│   ├── api/               # API rotaları (S3 upload)
│   ├── context/           # React Context (Auth)
│   ├── login/             # Giriş sayfası
│   ├── profile/           # Profil sayfası
│   ├── layout.tsx         # Ana layout
│   ├── page.tsx           # Ana sayfa (chat arayüzü)
│   └── globals.css        # Global stiller
├── components/            # React bileşenleri
│   ├── chat/             # Chat bileşenleri
│   └── sidebar/          # Sidebar bileşenleri
├── hooks/                # Custom React hooks
│   └── useChat.ts        # Chat mantığı
├── types/                # TypeScript tip tanımları
├── public/               # Statik dosyalar
├── .env.local            # Environment variables (siz oluşturmalısınız)
├── package.json          # Proje bağımlılıkları
└── README.md            # Bu dosya
```

## 🔌 Rasa Backend Entegrasyonu

Proje, Rasa chatbot backend'i ile çalışmak üzere tasarlanmıştır. Rasa backend'iniz `http://localhost:5005` adresinde çalışıyorsa otomatik olarak bağlanır.

Rasa backend'iniz farklı bir adreste çalışıyorsa, `hooks/useChat.ts` dosyasındaki URL'yi güncelleyin:

```typescript
const RASA_API_URL = 'http://your-rasa-server:5005/webhooks/rest/webhook';
```

**Not:** Rasa backend çalışmıyorsa bile görsel yükleme özelliği çalışır, sadece chatbot yanıtları gelmez.

## 🎨 Özellikler

- ✅ Modern, responsive arayüz
- ✅ Gerçek zamanlı chat
- ✅ Görsel yükleme (AWS S3)
- ✅ Markdown desteği
- ✅ Kullanıcı kimlik doğrulama
- ✅ Sohbet geçmişi
- ✅ Animasyonlar ve geçişler

## 🐛 Sorun Giderme

### "S3 yapılandırması eksik" Hatası

`.env.local` dosyasının doğru oluşturulduğundan ve içinde gerekli değişkenlerin olduğundan emin olun. Dosya proje kök dizininde olmalı.

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

### Rasa Bağlantı Hatası

- Rasa backend'inizin çalıştığından emin olun
- `http://localhost:5005` adresine tarayıcıdan erişebildiğinizi kontrol edin
- CORS ayarlarını kontrol edin

### Görsel Yükleme Çalışmıyor

1. AWS credentials'ların doğru olduğundan emin olun
2. S3 bucket'ın doğru region'da olduğunu kontrol edin
3. IAM kullanıcısının S3'e yazma izni olduğundan emin olun
4. Browser console'da hata mesajlarını kontrol edin

## 📚 Teknolojiler

- **Next.js 15** - React framework
- **React 19** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Stil framework'ü
- **AWS SDK** - S3 entegrasyonu
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
