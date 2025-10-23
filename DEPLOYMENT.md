# 🚀 Crypto Shop - Deployment Guide

Пълна инструкция за deployment на проекта от нулата.

---

## 📋 Преди да започнеш

### Необходими инструменти:
- **Node.js** (v18+)
- **PostgreSQL** (v14+)
- **Git**
- **npm** или **yarn**

---

## 1️⃣ КЛОНИРАНЕ НА ПРОЕКТА

```bash
# Клонирай проекта
git clone https://github.com/tumnatamreja/Crypto-shop.git
cd Crypto-shop

# Смени на правилния бранч (ако е нужно)
git checkout claude/upload-privacy-project-011CUKLk8uC5a66QpcumRJ5Z
```

---

## 2️⃣ НАСТРОЙКА НА БАЗАТА ДАННИ

### Стъпка 1: Създай PostgreSQL база данни

```sql
-- Логни се в PostgreSQL
psql -U postgres

-- Създай база данни
CREATE DATABASE cryptoshop;

-- Създай потребител (optional)
CREATE USER cryptoshop_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cryptoshop TO cryptoshop_user;

-- Свържи се с базата
\c cryptoshop
```

### Стъпка 2: Изпълни миграциите

Копирай и изпълни SQL файловете по ред:

```bash
# 1. Основна схема
psql -U postgres -d cryptoshop -f backend/migrations/001_initial_schema.sql

# 2. Product Variants система
psql -U postgres -d cryptoshop -f backend/migrations/002_product_variants.sql

# (Ако имаш други миграционни файлове, изпълни ги по ред)
```

**Или** изпълни SQL-а директно в psql:

```sql
-- Виж backend/migrations/001_initial_schema.sql
-- Виж backend/migrations/002_product_variants.sql
```

---

## 3️⃣ КОНФИГУРАЦИЯ НА ENVIRONMENT VARIABLES

### Backend Environment (.env)

Създай файл `backend/.env`:

```bash
cd backend
nano .env
```

Добави следното съдържание:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cryptoshop
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Secret (генерирай сигурен random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3001
NODE_ENV=production

# OxaPay API Configuration (White Label)
OXAPAY_API_KEY=your_oxapay_api_key
OXAPAY_MERCHANT_API_KEY=your_oxapay_merchant_key
OXAPAY_WEBHOOK_SECRET=your_webhook_secret

# OxaPay Webhook URL (вашият публичен URL)
OXAPAY_CALLBACK_URL=https://yourdomain.com/api/webhook/oxapay
```

**⚠️ ВАЖНО:** Смени всички `your_*` стойности с реалните ти данни!

**Как да получиш OxaPay ключове:**
1. Отиди на https://oxapay.com
2. Регистрирай се / Влез
3. Отиди в Settings → API Keys
4. Копирай: API Key, Merchant Key, Webhook Secret

### Frontend Environment (.env.local)

Създай файл `frontend/.env.local`:

```bash
cd ../frontend
nano .env.local
```

Добави:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**За production сървър:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 4️⃣ ИНСТАЛАЦИЯ НА DEPENDENCIES

### Backend Dependencies

```bash
cd backend
npm install
```

### Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## 5️⃣ BUILD НА ПРОЕКТА

### Build Backend (TypeScript → JavaScript)

```bash
cd backend
npm run build
```

**Проверка:** Трябва да се създаде `backend/dist/` папка с compiled JS файлове.

```bash
ls -la dist/
# Трябва да видиш: server.js, controllers/, config/, etc.
```

### Build Frontend (Next.js)

```bash
cd ../frontend
npm run build
```

**Проверка:** Трябва да видиш success build message:

```
✓ Compiled successfully
✓ Generating static pages
```

---

## 6️⃣ СТАРТИРАНЕ НА СЪРВЪРИТЕ

### Метод 1: PM2 (Препоръчително за Production)

```bash
# Върни се в root директорията
cd ..

# Стартирай с PM2
npx pm2 start ecosystem.config.js

# Провери статуса
npx pm2 status

# Виж логовете
npx pm2 logs

# Спри всички
npx pm2 stop all

# Рестартирай
npx pm2 restart all
```

**PM2 ще стартира:**
- Backend на порт 3001
- Frontend на порт 3002

### Метод 2: Ръчно (За Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Или за production:
# npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Или за production:
# npm start
```

---

## 7️⃣ ПРОВЕРКА

### Test Backend

```bash
# Health check
curl http://localhost:3001/health

# Очакван отговор:
# {"status":"ok","message":"CryptoShop API is running"}
```

### Test Frontend

Отвори в браузър:
```
http://localhost:3002
```

Трябва да видиш SinHuella Corp landing page.

### Test Admin Login

```
http://localhost:3002/admin/login
```

**Първоначален admin акаунт:**
Няма default admin. Трябва да създадеш ръчно:

```sql
-- Влез в PostgreSQL
psql -U postgres -d cryptoshop

-- Създай admin потребител (паролата е хеширана "admin123")
INSERT INTO users (username, password_hash, is_admin, telegram, referral_code)
VALUES (
  'admin',
  '$2a$10$xYz...', -- използвай bcrypt hash на паролата
  true,
  '@admin_telegram',
  'ADMIN001'
);
```

**Или** регистрирай се през UI и промени is_admin на true в базата:

```sql
UPDATE users SET is_admin = true WHERE username = 'твоето_username';
```

---

## 8️⃣ ПЪРВОНАЧАЛНА НАСТРОЙКА

### 1. Добави Градове и Квартали

```sql
-- Добави градове
INSERT INTO cities (name, name_en, sort_order, is_active) VALUES
('София', 'Sofia', 1, true),
('Пловдив', 'Plovdiv', 2, true),
('Варна', 'Varna', 3, true);

-- Вземи ID на София
-- Да речем е '123e4567-e89b-12d3-a456-426614174000'

-- Добави квартали за София
INSERT INTO districts (city_id, name, name_en, sort_order, is_active) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'Център', 'Center', 1, true),
('123e4567-e89b-12d3-a456-426614174000', 'Люлин', 'Lyulin', 2, true),
('123e4567-e89b-12d3-a456-426614174000', 'Младост', 'Mladost', 3, true);
```

### 2. Създай Тестов Продукт

**Чрез Admin Panel:**
1. Login: http://localhost:3002/admin/login
2. Отиди в Products tab
3. Натисни "Add Product"
4. Попълни: Name, Description, Price (базова цена), Picture URL
5. Save

### 3. Добави Locations към продукта

1. В Products list, натисни "Locations"
2. Избери градовете където продукта е наличен
3. Избери кварталите
4. Save

### 4. Добави Variants (Временно чрез SQL - докато направим Admin UI)

```sql
-- Вземи product_id на продукта от admin панела
-- Да речем е 'prod-123-456-789'

-- Добави варианти
INSERT INTO product_variants (product_id, variant_name, variant_type, amount, price, sort_order, is_active)
VALUES
  ('prod-123-456-789', '5гр', 'гр', 5, 45.00, 1, true),
  ('prod-123-456-789', '10гр', 'гр', 10, 85.00, 2, true),
  ('prod-123-456-789', '25гр', 'гр', 25, 200.00, 3, true);

-- Вземи variant IDs
SELECT id, variant_name FROM product_variants WHERE product_id = 'prod-123-456-789';

-- Да речем:
-- variant_5gr_id = 'var-111'
-- variant_10gr_id = 'var-222'
-- variant_25gr_id = 'var-333'

-- Добави stock за всеки вариант в София
INSERT INTO variant_stock (variant_id, city_id, stock_amount, reserved_amount, low_stock_threshold)
VALUES
  ('var-111', '123e4567-e89b-12d3-a456-426614174000', 100, 0, 10),
  ('var-222', '123e4567-e89b-12d3-a456-426614174000', 50, 0, 5),
  ('var-333', '123e4567-e89b-12d3-a456-426614174000', 20, 0, 3);
```

---

## 9️⃣ ТЕСТВАНЕ НА ПЪЛНИЯ FLOW

### Customer Flow:

1. **Отвори продукт:**
   ```
   http://localhost:3002/order/[product-id]
   ```

2. **Избери локация:**
   - Избери Град (напр. София)
   - Избери Квартал (напр. Младост)

3. **Избери вариант:**
   - Ще се появят налични варианти с цени и stock
   - Избери например "5гр - €45.00"

4. **Избери количество:**
   - Виждаш общата цена

5. **Proceed to Payment:**
   - Създава се order
   - Stock се резервира
   - Препраща те на payment страница

6. **Payment страница:**
   ```
   http://localhost:3002/payment/[order-id]
   ```
   - Избери криpto валута (BTC, ETH, USDT, etc.)
   - Генерира се payment address
   - Скенирай QR кода или копирай адреса
   - Изпрати плащането

7. **Webhook обработка:**
   - При успешно плащане → Stock се финализира
   - При изтекъл order → Stock се освобождава

### Проверка на Stock:

```sql
-- Виж stock levels
SELECT
  p.name as product,
  pv.variant_name,
  c.name as city,
  vs.stock_amount,
  vs.reserved_amount,
  (vs.stock_amount - vs.reserved_amount) as available
FROM variant_stock vs
JOIN product_variants pv ON vs.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
JOIN cities c ON vs.city_id = c.id
ORDER BY p.name, pv.sort_order, c.name;
```

---

## 🔟 PRODUCTION DEPLOYMENT

### Nginx Configuration (Reverse Proxy)

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Получи SSL certificates
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### PM2 Startup (Auto-start on reboot)

```bash
# Генерирай startup script
npx pm2 startup

# Save current PM2 process list
npx pm2 save

# Проверка след reboot
npx pm2 resurrect
```

---

## 🛠️ TROUBLESHOOTING

### Backend не стартира:

```bash
# Провери логовете
npx pm2 logs backend

# Чести проблеми:
# 1. Database connection failed
#    → Провери DB_HOST, DB_PASSWORD в backend/.env
#    → psql -U postgres -d cryptoshop (test connection)

# 2. Port already in use
#    → lsof -i :3001
#    → kill -9 [PID]

# 3. dist/ folder missing
#    → cd backend && npm run build
```

### Frontend не стартира:

```bash
# Провери логовете
npx pm2 logs frontend

# Чести проблеми:
# 1. Build failed
#    → cd frontend && npm run build

# 2. Port already in use
#    → lsof -i :3002
#    → kill -9 [PID]

# 3. API connection failed
#    → Провери NEXT_PUBLIC_API_URL в frontend/.env.local
```

### Database грешки:

```bash
# Провери дали PostgreSQL работи
sudo systemctl status postgresql

# Рестартирай PostgreSQL
sudo systemctl restart postgresql

# Провери connection
psql -U postgres -d cryptoshop -c "SELECT version();"

# Виж активни connections
SELECT * FROM pg_stat_activity WHERE datname = 'cryptoshop';
```

### OxaPay webhook не работи:

1. **Локално тестване:**
   - Използвай ngrok за публичен URL:
   ```bash
   ngrok http 3001
   # Копирай URL: https://xxxx.ngrok.io
   # Webhook URL: https://xxxx.ngrok.io/api/webhook/oxapay
   ```

2. **Production:**
   - Webhook URL: https://api.yourdomain.com/api/webhook/oxapay
   - Добави в OxaPay dashboard

3. **Debug webhook:**
   ```bash
   # Виж логове
   npx pm2 logs backend | grep webhook
   ```

---

## 📊 ПОЛЕЗНИ КОМАНДИ

```bash
# PM2
npx pm2 status              # Виж статус
npx pm2 logs                # Виж всички логове
npx pm2 logs backend        # Backend логове
npx pm2 logs frontend       # Frontend логове
npx pm2 restart all         # Рестартирай всички
npx pm2 stop all            # Спри всички
npx pm2 delete all          # Изтрий от PM2

# Database
psql -U postgres -d cryptoshop                    # Влез в DB
psql -U postgres -d cryptoshop -f migration.sql   # Изпълни SQL file
pg_dump -U postgres cryptoshop > backup.sql       # Backup
psql -U postgres -d cryptoshop < backup.sql       # Restore

# Git
git pull origin main                # Обнови от GitHub
git status                          # Виж промени
git log --oneline -10              # Последни 10 commits

# Node/NPM
npm install                         # Инсталирай dependencies
npm run build                       # Build проекта
npm start                          # Стартирай production
npm run dev                        # Стартирай development

# System
lsof -i :3001                      # Виж какво използва порт 3001
kill -9 [PID]                      # Убий процес
df -h                              # Disk space
free -h                            # Memory usage
```

---

## 📚 ФАЙЛОВА СТРУКТУРА

```
Crypto-shop/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth, validation
│   │   ├── services/           # OxaPay, business logic
│   │   ├── config/             # Database config
│   │   ├── types/              # TypeScript types
│   │   └── server.ts           # Express app
│   ├── dist/                   # Compiled JS (generated)
│   ├── migrations/             # SQL migration files
│   ├── .env                    # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── admin/             # Admin panel
│   │   ├── order/             # Order pages
│   │   ├── payment/           # Payment pages
│   │   └── profile/           # User profile
│   ├── lib/
│   │   └── api.ts             # API client
│   ├── .env.local             # Environment variables
│   ├── package.json
│   └── next.config.js
│
├── ecosystem.config.js         # PM2 configuration
├── DEPLOYMENT.md              # Това ръководство
└── README.md                  # Project README
```

---

## ✅ CHECKLIST ЗА DEPLOYMENT

- [ ] PostgreSQL инсталиран и работи
- [ ] База данни създадена
- [ ] Миграции изпълнени
- [ ] Backend .env конфигуриран
- [ ] Frontend .env.local конфигуриран
- [ ] Backend dependencies инсталирани
- [ ] Frontend dependencies инсталирани
- [ ] Backend build успешен (dist/ created)
- [ ] Frontend build успешен
- [ ] PM2 стартирани процеси
- [ ] Backend health check отговаря
- [ ] Frontend се зарежда в браузър
- [ ] Admin акаунт създаден
- [ ] Градове и квартали добавени
- [ ] Тестов продукт създаден
- [ ] Варианти добавени
- [ ] Stock наличен
- [ ] OxaPay ключове добавени
- [ ] Test order flow работи
- [ ] Payment flow работи
- [ ] Webhook тестван

---

## 🆘 SUPPORT

Ако имаш проблеми:

1. **Провери логовете:**
   ```bash
   npx pm2 logs
   ```

2. **Провери базата данни:**
   ```bash
   psql -U postgres -d cryptoshop
   SELECT * FROM users LIMIT 1;
   ```

3. **Тествай API:**
   ```bash
   curl http://localhost:3001/health
   ```

4. **Рестартирай всичко:**
   ```bash
   npx pm2 restart all
   ```

---

**Готово! Проектът трябва да работи.** 🎉
