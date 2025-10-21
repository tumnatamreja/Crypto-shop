# 🔥 SinHuella Corp - CryptoShop v2.1

> **БЪРЗО, ЛЕСНО, АНОНИМНО!** - Your Anonymous Cryptocurrency Marketplace

A modern, simplified cryptocurrency marketplace with **white-label OxaPay payment integration** and a sleek **red-themed cyberpunk design**.

---

## ✨ Key Features

### 🎨 Modern Red-Themed Design
- **Professional red/orange gradient color scheme** matching SinHuella Corp branding
- Dark cyberpunk aesthetic with neon red accents
- Fully responsive mobile-first design
- Smooth animations and hover effects
- Clean, simplified user interface

### 🛍️ Simplified Shopping Experience
- Beautiful product showcase with grid layout
- Simple click-to-order flow (no complex cart system)
- One product at a time ordering for better control
- Quantity selector with price tiers support
- Location-based delivery (city + district)
- Optional promo code support

### 💳 White-Label OxaPay Payment System
- **14+ Cryptocurrencies supported** (BTC, ETH, USDT, USDC, TRX, BNB, LTC, DOGE, and more)
- **Multiple networks** for each crypto (TRC20, ERC20, BEP20, etc.)
- Beautiful currency selection interface
- QR code payment with copy address function
- Real-time payment status updates
- Completely branded payment page (no external redirects)
- Automated webhook payment confirmation

### 🛡️ Anti-Spam Protection System
- Maximum 1 active pending order per user
- Rate limiting: 3 orders per 30 minutes
- Automatic 24-hour ban for spam attempts
- Ban status checking on all order attempts
- Protection against order flooding

### 📦 Delivery Tracking
- City and district-based delivery
- Admin adds delivery info after payment confirmation
- Map link and image link per order
- Delivery status tracking
- Timeline of order events

### 👤 User Features
- Simple registration (username + password)
- Optional Telegram contact
- Order history with delivery tracking
- Profile management
- Secure JWT authentication

### 👨‍💼 Admin Panel
- Dashboard with statistics
- Product management (CRUD)
- Order management with filters
- User management with ban controls
- Delivery info management
- Promo code system
- Price tier management (quantity-based pricing)

---

## 📋 Prerequisites

Before installation, ensure you have:

- **Node.js 18+** and npm
- **PostgreSQL 14+**
- **Git**
- **OxaPay Merchant Account** (free at https://oxapay.com)
- Linux/Mac/Windows with terminal access

---

## 🚀 Step-by-Step Installation Guide

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/tumnatamreja/Crypto-shop.git
cd Crypto-shop

# Switch to the correct branch
git checkout claude/upload-privacy-project-011CUKLk8uC5a66QpcumRJ5Z
```

---

### Step 2: Install and Setup PostgreSQL

#### On Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

#### On macOS:
```bash
# Install via Homebrew
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14
```

#### On Windows:
Download and install from: https://www.postgresql.org/download/windows/

---

### Step 3: Create Database

```bash
# Access PostgreSQL as postgres user
sudo -u postgres psql
```

In the PostgreSQL prompt, run:
```sql
-- Create database
CREATE DATABASE cryptoshop;

-- Create user with password
CREATE USER cryptoshop_user WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cryptoshop TO cryptoshop_user;

-- Connect to database
\c cryptoshop

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO cryptoshop_user;

-- Exit
\q
```

**⚠️ Important:** Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password!

---

### Step 4: Import Database Schema

```bash
# Import the database schema
psql -U cryptoshop_user -d cryptoshop -f database/schema.sql

# Verify tables were created
psql -U cryptoshop_user -d cryptoshop -c "\dt"
```

You should see tables: users, products, orders, order_items, product_price_tiers, promo_codes, referrals, chat_messages

---

### Step 5: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# OR
nano .env
```

**Edit the `.env` file:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://cryptoshop_user:YOUR_SECURE_PASSWORD_HERE@localhost:5432/cryptoshop

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your_super_secret_random_jwt_key_change_this_NOW_min_32_chars

# OxaPay API Configuration
OXAPAY_API_KEY=your_oxapay_merchant_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**⚠️ Security Notes:**
- Generate a strong JWT_SECRET: `openssl rand -hex 32`
- Use the database password you created in Step 3
- Get OxaPay API key from https://oxapay.com dashboard

---

### Step 6: Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# You should see:
# 🚀 Server running on port 5000
# 📡 Health check: http://localhost:5000/health
```

**Test backend:**
```bash
# Open new terminal
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","message":"CryptoShop API is running"}
```

**✅ Backend is ready!** Keep this terminal running.

---

### Step 7: Setup Frontend

Open a **new terminal window:**

```bash
# Navigate to frontend folder
cd Crypto-shop/frontend

# Install dependencies
npm install

# Create environment file
nano .env.local
```

**Edit the `.env.local` file:**
```env
# API URL (backend server)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### Step 8: Start Frontend Server

```bash
# Development mode
npm run dev

# You should see:
# ▲ Next.js 14.x
# - Local: http://localhost:3000
```

**✅ Frontend is ready!** Open http://localhost:3000 in your browser.

---

### Step 9: Create Admin Account

Open a **new terminal:**

```bash
# Navigate to backend folder
cd Crypto-shop/backend

# Generate password hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
```

**Copy the generated hash**, then:

```bash
# Access database
psql -U cryptoshop_user -d cryptoshop
```

Run this SQL (replace `PASTE_HASH_HERE` with the hash you copied):
```sql
INSERT INTO users (username, password_hash, telegram, is_admin)
VALUES ('admin', 'PASTE_HASH_HERE', '@admin', true);

-- Verify admin was created
SELECT id, username, is_admin FROM users;

-- Exit
\q
```

**✅ Admin account created!**
- Username: `admin`
- Password: `admin123`
- **⚠️ Change this password after first login!**

---

### Step 10: Setup OxaPay Integration

#### 10.1 Create OxaPay Merchant Account

1. Go to https://oxapay.com
2. Click **"Sign Up"** → Select **"Merchant Account"**
3. Complete registration
4. Verify your email

#### 10.2 Get API Credentials

1. Login to OxaPay Dashboard
2. Go to **Settings** → **API**
3. Copy your **Merchant API Key**
4. Paste it in `backend/.env`:
   ```env
   OXAPAY_API_KEY=your_merchant_api_key_here
   ```

#### 10.3 Configure Webhook (For Production)

**For Local Development:**
```bash
# Install ngrok (if not installed)
# Download from https://ngrok.com

# Expose local backend
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**In OxaPay Dashboard:**
1. Go to **Settings** → **Webhooks**
2. Set webhook URL:
   - Development: `https://your-ngrok-url.ngrok.io/api/webhook/oxapay`
   - Production: `https://your-domain.com/api/webhook/oxapay`
3. Save webhook URL

**Restart backend** to apply changes.

---

### Step 11: Test the Application

#### 11.1 Test User Registration

1. Open http://localhost:3000
2. Click **"Създай Акаунт"** (Create Account)
3. Register with:
   - Username: `testuser`
   - Password: `test123`
   - Telegram: `@testuser` (optional)

#### 11.2 Test Product Viewing

1. Home page should show products grid
2. Products should have red-themed cards
3. Hover effects should work

#### 11.3 Test Admin Panel

1. Logout from test user
2. Login with admin credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click **"Admin"** in header
4. Verify dashboard loads with stats

#### 11.4 Create Test Product

1. In Admin Panel, go to **"Products"** tab
2. Click **"Add Product"**
3. Fill in:
   - Name: `Test Product`
   - Description: `This is a test product`
   - Price: `10.00`
   - Currency: `EUR`
   - Picture Link: `https://via.placeholder.com/200`
   - Quantity: `1`
4. Click **"Create Product"**
5. Go to home page → Product should appear

#### 11.5 Test Order Flow

1. Logout and login as `testuser`
2. Click on the test product
3. Fill in order form:
   - Quantity: `1`
   - City: `Sofia`
   - District: `Center`
   - Promo Code: (leave empty)
4. Click **"Proceed to Payment"**
5. Select cryptocurrency (e.g., USDT)
6. Select network (e.g., TRC20)
7. Payment page should show:
   - QR code
   - Payment address
   - Amount in EUR
   - Copy address button

**✅ All systems working!**

---

## 🏗️ Project Structure

```
Crypto-shop/
├── database/
│   └── schema.sql                    # Complete database schema with all tables
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts           # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.ts      # Registration, login, JWT
│   │   │   ├── productController.ts   # Product CRUD operations
│   │   │   ├── orderController.ts     # Order management
│   │   │   ├── paymentController.ts   # OxaPay integration & checkout
│   │   │   ├── adminController.ts     # Admin panel APIs
│   │   │   ├── chatController.ts      # Admin-user chat system
│   │   │   ├── referralController.ts  # Referral system
│   │   │   └── promoCodeController.ts # Promo code management
│   │   ├── middleware/
│   │   │   ├── auth.ts                # JWT verification, admin check
│   │   │   └── antiSpam.ts            # Anti-spam protection middleware
│   │   ├── services/
│   │   │   └── oxapayService.ts       # OxaPay API client
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   └── server.ts                  # Express app entry point
│   ├── .env                           # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                   # Home page (red theme, product showcase)
│   │   ├── layout.tsx                 # Root layout
│   │   ├── globals.css                # Global styles (red theme)
│   │   ├── login/
│   │   │   └── page.tsx               # Login page
│   │   ├── register/
│   │   │   └── page.tsx               # Registration page
│   │   ├── order/
│   │   │   └── [productId]/
│   │   │       └── page.tsx           # Single product order page
│   │   ├── payment/
│   │   │   └── [orderId]/
│   │   │       └── page.tsx           # White-label payment page
│   │   ├── profile/
│   │   │   └── page.tsx               # User profile + order history
│   │   └── admin/
│   │       └── page.tsx               # Admin panel
│   ├── components/
│   │   ├── Header.tsx                 # Navigation header
│   │   └── Footer.tsx                 # Footer component
│   ├── lib/
│   │   └── api.ts                     # API client functions
│   ├── .env.local                     # Frontend environment variables
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.js
│
└── README.md                          # This file
```

---

## 🎨 Design System

### Color Palette (Red Theme)

```css
/* Primary Colors */
--neon-red: #ff3b3b        /* Main accent color */
--neon-orange: #ff6b35     /* Secondary accent */
--neon-pink: #ff5e78       /* Tertiary accent */
--neon-dark-red: #c41e3a   /* Dark accent */

/* Background Colors */
--bg-primary: #0a0a0a      /* Main background */
--bg-secondary: #1a0f0f    /* Secondary background */
--bg-card: #1f1515         /* Card background */
--bg-card-hover: #2a1a1a   /* Card hover state */

/* Text Colors */
--text-primary: #e5e7eb    /* Main text */
--text-secondary: #9ca3af  /* Secondary text */
--text-accent: #ff3b3b     /* Accent text */
```

### Component Styles

- **Buttons:** Red/orange gradient with hover animations
- **Cards:** Dark background with red borders and glow effects
- **Inputs:** Dark with red focus borders
- **Product Cards:** Hover lift effect with red glow
- **Price Tags:** Gradient text with monospace font

---

## 🔐 Security Features

### Authentication
- ✅ JWT-based token authentication
- ✅ bcrypt password hashing (10 rounds)
- ✅ Admin role verification
- ✅ Secure cookie handling

### Database
- ✅ Prepared statements (SQL injection protection)
- ✅ UUID primary keys
- ✅ Password never stored in plain text
- ✅ Foreign key constraints

### Anti-Spam Protection
- ✅ One active order limit per user
- ✅ Rate limiting (3 orders / 30 minutes)
- ✅ Automatic 24-hour ban for spam
- ✅ Ban checking on all protected routes

### Payment Security
- ✅ OxaPay HMAC signature verification
- ✅ Webhook payload validation
- ✅ Environment variable secrets
- ✅ CORS protection

---

## 🚀 Production Deployment

### Environment Configuration

**Backend `.env` for production:**
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://cryptoshop_user:STRONG_PASSWORD@localhost:5432/cryptoshop
JWT_SECRET=RANDOM_64_CHAR_STRING_GENERATED_SECURELY
OXAPAY_API_KEY=your_production_api_key
FRONTEND_URL=https://your-domain.com
```

**Frontend `.env.local` for production:**
```env
NEXT_PUBLIC_API_URL=https://your-domain.com
```

---

### Using PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Build and start backend
cd ~/Crypto-shop/backend
npm run build
pm2 start npm --name "cryptoshop-backend" -- start

# Build and start frontend
cd ~/Crypto-shop/frontend
npm run build
pm2 start npm --name "cryptoshop-frontend" -- start

# Save process list
pm2 save

# Setup auto-start on system reboot
pm2 startup
# Follow the command that PM2 outputs

# View process status
pm2 status

# View logs
pm2 logs cryptoshop-backend
pm2 logs cryptoshop-frontend
```

---

### Nginx Configuration

```bash
# Install Nginx
sudo apt install nginx -y

# Create site configuration
sudo nano /etc/nginx/sites-available/cryptoshop
```

**Nginx config file:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Increase max upload size
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cryptoshop /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certificate auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

---

### Firewall Setup

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

### Database Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Manual backup
pg_dump -U cryptoshop_user cryptoshop > ~/backups/cryptoshop_$(date +%Y%m%d_%H%M%S).sql

# Setup automated daily backup (cron)
crontab -e

# Add this line (backup at 3 AM daily):
0 3 * * * pg_dump -U cryptoshop_user cryptoshop > ~/backups/cryptoshop_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if port 5000 is already in use
sudo lsof -i :5000

# Kill process on port 5000 if needed
sudo kill -9 $(sudo lsof -t -i:5000)

# Check backend logs
cd backend
npm run dev
# Read the error message
```

### Database connection error

```bash
# Test database connection
psql -U cryptoshop_user -d cryptoshop

# If password error, reset it:
sudo -u postgres psql
ALTER USER cryptoshop_user WITH PASSWORD 'new_password';
\q

# Update backend/.env with new password
```

### Frontend build fails

```bash
# Clear cache and rebuild
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### OxaPay webhook not working

1. **Check webhook URL in OxaPay dashboard**
   - Must be publicly accessible (use ngrok for local testing)
   - Must end with `/api/webhook/oxapay`

2. **Test webhook manually:**
   ```bash
   curl -X POST http://localhost:5000/api/webhook/oxapay \
     -H "Content-Type: application/json" \
     -d '{"trackId":"test123","orderid":"test-order","status":"Paid"}'
   ```

3. **Check backend logs:**
   ```bash
   pm2 logs cryptoshop-backend
   # Look for "OxaPay Webhook received"
   ```

### Payment not confirming

- ✅ Verify OXAPAY_API_KEY is correct
- ✅ Check OxaPay dashboard for payment status
- ✅ Ensure webhook URL is publicly accessible
- ✅ Check backend logs for webhook callbacks
- ✅ Verify HMAC signature if enabled

---

## 📊 Supported Cryptocurrencies

The white-label payment page supports **14+ cryptocurrencies** with multiple networks:

| Cryptocurrency | Symbol | Networks |
|----------------|--------|----------|
| Tether | USDT | TRC20, ERC20, BEP20, Polygon, TON |
| USD Coin | USDC | ERC20, TRC20, BEP20, Polygon, TON |
| Bitcoin | BTC | Bitcoin Network |
| Ethereum | ETH | ERC20 |
| Tron | TRX | TRC20 |
| Binance Coin | BNB | BEP20, BEP2 |
| Litecoin | LTC | Litecoin Network |
| Dogecoin | DOGE | Dogecoin Network |
| Bitcoin Cash | BCH | Bitcoin Cash Network |
| Ripple | XRP | XRP Ledger |
| Cardano | ADA | Cardano Network |
| Solana | SOL | Solana Network |
| Toncoin | TON | TON Network |
| Polygon | MATIC | Polygon Network |
| Dai | DAI | ERC20, BEP20, Polygon |
| Shiba Inu | SHIB | ERC20 |
| Binance USD | BUSD | BEP20, ERC20 |

---

## 📞 Support

### View Logs

**PM2 Logs:**
```bash
pm2 logs cryptoshop-backend --lines 100
pm2 logs cryptoshop-frontend --lines 100
```

**Nginx Logs:**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**PostgreSQL Logs:**
```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### PM2 Commands

```bash
# Process status
pm2 status

# Restart services
pm2 restart cryptoshop-backend
pm2 restart cryptoshop-frontend

# Stop services
pm2 stop all

# Monitor CPU/RAM
pm2 monit

# Delete process
pm2 delete cryptoshop-backend
```

---

## 🔒 Production Security Checklist

Before going live, ensure:

- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET (min 64 characters)
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall (UFW)
- [ ] Setup automated database backups
- [ ] Update OxaPay webhook URL to production domain
- [ ] Restrict CORS to your domain only
- [ ] Use strong PostgreSQL passwords
- [ ] Keep npm dependencies updated
- [ ] Configure fail2ban for SSH protection
- [ ] Setup monitoring (PM2, uptime robot)
- [ ] Review PostgreSQL pg_hba.conf for access restrictions
- [ ] Test anti-spam protection
- [ ] Verify webhook HMAC signatures
- [ ] Setup error logging and alerts

---

## 🎯 What's New in v2.1

### Simplified Design
- ✅ Removed complex cart system
- ✅ One-product-at-a-time ordering
- ✅ Cleaner user interface
- ✅ Simplified checkout flow

### Red Theme Redesign
- ✅ Changed from green/cyan to red/orange
- ✅ Matches SinHuella Corp branding
- ✅ Professional gradient color scheme
- ✅ Updated all UI components

### White-Label Payment Page
- ✅ No external redirects to OxaPay
- ✅ Fully branded payment interface
- ✅ Beautiful currency/network selector
- ✅ QR code and address display
- ✅ Real-time payment status

### Anti-Spam System
- ✅ One active order limit
- ✅ Rate limiting (3/30min)
- ✅ Automatic ban system
- ✅ Protection against order spam

### Enhanced User Experience
- ✅ Modern navigation header
- ✅ Professional footer
- ✅ Responsive mobile design
- ✅ Smooth animations
- ✅ Better error messages

---

## 📝 License

MIT License - Free to use and modify.

---

## 🏆 Built With

- **Backend:** Node.js, Express, TypeScript, PostgreSQL
- **Frontend:** Next.js 14, React 18, TailwindCSS
- **Payments:** OxaPay API (White-Label Integration)
- **Design:** Cyberpunk Red Theme
- **Deployment:** PM2, Nginx, Let's Encrypt
- **Security:** JWT, bcrypt, Anti-Spam Middleware

---

**Version:** 2.1
**Theme:** SinHuella Corp Red
**Status:** Production Ready

**🔥 БЪРЗО, ЛЕСНО, АНОНИМНО! 🔥**
