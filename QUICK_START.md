# 🚀 QUICK START - 3 Команди до работещ магазин!

## ✅ Какво ти трябва:
- Ubuntu (което вече имаш) ✓
- Интернет ✓
- **ТОЛКОВА!** Нищо друго!

## 🔥 Инсталация (5 минути)

### Стъпка 1: Инсталирай Docker (2 минути)

```bash
# Една команда инсталира всичко:
curl -fsSL https://get.docker.com | sudo sh

# Добави се в docker group:
sudo usermod -aG docker $USER

# Reload group (или logout/login):
newgrp docker

# Install Docker Compose:
sudo apt install docker-compose -y

# Провери дали работи:
docker --version
docker-compose --version
```

Трябва да видиш нещо като:
```
Docker version 24.0.7, build afdd53b
docker-compose version 1.29.2
```

✅ **Docker е готов!**

---

### Стъпка 2: Вземи кода (30 секунди)

```bash
# Отиди в home directory:
cd ~

# Clone repo:
git clone https://github.com/tumnatamreja/Crypto-shop.git oxamarket
cd oxamarket

# Checkout правилния branch:
git checkout claude/clean-up-shop-payments-011CUQrJQY5DP8Sa7r6rJof5
```

✅ **Кодът е готов!**

---

### Стъпка 3: Deploy! (2 минути)

```bash
# Провери че .env файлът е там:
cat .env

# Трябва да видиш:
# OXAPAY_API_KEY=7SV84N-IFZ6YE-EKJIZL-HV7TSI
# и други настройки

# Deploy с една команда:
chmod +x deploy.sh
./deploy.sh
```

Скриптът ще:
- ✅ Download PostgreSQL, Node.js, Nginx (всичко в Docker)
- ✅ Build backend & frontend
- ✅ Create database & run migrations
- ✅ Start всички services

Ще те попита: `Do you want to create an admin user? (y/n)`

**Натисни `y` и създай admin:**
- Username: `admin` (или каквото искаш)
- Password: нещо силно (запомни го!)

---

### Стъпка 4: Отвори в браузъра! 🎉

```
http://localhost
```

**Трябва да видиш CryptoShop homepage!**

---

## 🎯 Test че всичко работи:

### 1. Check containers:
```bash
docker-compose ps
```

Трябва да видиш 4 контейнера със статус `Up`:
```
NAME                   STATUS
cryptoshop-db          Up (healthy)
cryptoshop-backend     Up (healthy)
cryptoshop-frontend    Up (healthy)
cryptoshop-nginx       Up (healthy)
```

### 2. Влез в admin панела:
```
http://localhost/admin
```
Login с admin user-а, който си създал.

### 3. Добави продукт:
1. Admin → Products → Add Product
   - Name: Test Product
   - Price: 10
   - Description: Test
   - Picture link: https://via.placeholder.com/200
   - Save

2. Click "Variants" button
   - Add Variant
   - Name: 5гр
   - Type: гр
   - Amount: 5
   - Price: 10
   - Save

3. Click "Locations" button
   - Избери Sofia
   - Избери някой район
   - Save

### 4. Test като user:
1. Logout от admin
2. Register нов user
3. Browse продукти
4. Add to cart
5. Checkout
6. Трябва да видиш QR код за crypto плащане! 🎉

---

## 🔧 Полезни команди:

```bash
# Виж logs:
docker-compose logs -f

# Само backend logs:
docker-compose logs -f backend

# Restart всичко:
docker-compose restart

# Stop всичко:
docker-compose down

# Start отново:
docker-compose up -d

# Rebuild (ако промениш код):
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🌐 Deploy на публичен IP (след тестване):

Ако всичко работи на localhost, за да deploy-неш на публичен IP:

```bash
# 1. Stop containers:
docker-compose down

# 2. Edit .env:
nano .env

# Промени:
FRONTEND_URL=http://YOUR_PUBLIC_IP
BACKEND_URL=http://YOUR_PUBLIC_IP

# Save (Ctrl+X, Y, Enter)

# 3. Deploy отново:
./deploy.sh
```

Сега отвори: `http://YOUR_PUBLIC_IP` от всеки компютър!

---

## 🔐 OxaPay Webhook Setup:

За да работят плащанията на 100%:

1. Отиди на https://oxapay.com dashboard
2. Settings → Webhooks
3. Webhook URL: `http://YOUR_IP/api/webhook/oxapay`
4. Save

---

## 🐛 Troubleshooting:

### Port 80 е зает?
```bash
sudo lsof -i :80
# Ако видиш apache2 или nginx:
sudo systemctl stop apache2
sudo systemctl stop nginx
docker-compose restart nginx
```

### Containers не стартират?
```bash
docker-compose logs
# Виж къде е грешката и ми кажи
```

### Database грешки?
```bash
docker-compose restart postgres
docker-compose logs postgres
```

---

## 📞 Ако нещо не работи:

1. Copy пълния output/грешката
2. Изпрати я
3. Ще оправим заедно!

---

## 🎉 ГОТОВО!

Магазинът работи на: **http://localhost**

**Database е вътре в Docker** - не ти трябва PostgreSQL!

**Всичко е автоматично!** 🚀

---

## 📊 Quick Stats:

```bash
# Resource usage:
docker stats

# Disk space:
df -h

# Check database:
docker exec -it cryptoshop-db psql -U cryptoshop -d cryptoshop
\dt              # List tables
SELECT * FROM products;
\q               # Exit
```

---

**Готов за deployment? Започни от Стъпка 1!** 💪
