# FastAPI Backend (MSSQL)

Bu servis, Lumora frontend'i için kimlik doğrulama, kullanıcı profili ve sohbet geçmişi API'lerini sağlayan bağımsız bir FastAPI uygulamasıdır. MSSQL veritabanına bağlanır ve JWT tabanlı auth kullanır.

## Özellikler

- FastAPI + SQLAlchemy 2
- MSSQL (pyodbc) desteği
- Kullanıcı kayıt / giriş / profil
- Konuşma oluşturma ve listeleme
- Mesaj kaydetme ve listeleme
- JWT access token

## Kurulum

1. **Gereksinimler**
   - Python 3.10+
   - MSSQL için [ODBC Driver 17](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)

2. **Yükleme**

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

3. **Ortam değişkenleri**

`.env.example` dosyasını `.env` olarak kopyalayın ve değerleri güncelleyin.

```bash
cp .env.example .env
```

4. **Veritabanı tablolarını oluşturma**

```bash
python -m app.init_db
```

5. **Sunucuyu çalıştırma**

```bash
uvicorn app.main:app --reload --port 8000
```

Frontend `.env.local` dosyanıza `NEXT_PUBLIC_BACKEND_URL` değerini (`http://localhost:8000`) eklemeyi unutmayın.

