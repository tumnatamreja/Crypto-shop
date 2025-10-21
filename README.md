# 🚀 CryptoShop - Complete Crypto Marketplace

A fully-featured anonymous cryptocurrency marketplace with OxaPay payment integration.

## ✨ Features

✅ **Authentication**
- Username + Password (no email required)
- Optional Telegram contact
- JWT-based authentication
- Admin role system

✅ **Product Management**
- Full CRUD operations
- Name, Price, Currency support
- Map Link & Image Link per product
- Soft delete (products become inactive)

✅ **Shopping & Payments**
- Product catalog
- Shopping cart
- Crypto payments via OxaPay
- Multiple cryptocurrency support
- Webhook integration

✅ **Order Management**
- Order history
- Payment tracking
- **Map Link & Image Link revealed ONLY after successful payment**

✅ **Admin Panel**
- 📊 Dashboard with statistics
- 📝 Product management (Create, Edit, Delete)
- 📦 Order management
- 👥 User management
- ⚙️ Settings panel

✅ **Design**
- Dark/Cyber/Hacker theme
- Neon green/cyan colors
- Terminal aesthetic
- Fully responsive

---

## 📋 Prerequisites

- **Ubuntu/Debian** Linux server
- **Node.js 18+** and npm
- **PostgreSQL 14+**
- Domain (optional, for production)

---

## 🗄️ Step 1: Database Setup

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE cryptoshop;
CREATE USER cryptoshop_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE cryptoshop TO cryptoshop_user;
\q

# Import schema
cd ~/Crypto-shop
sudo -u postgres psql -d cryptoshop < database/schema.sql
```

---

## 🔧 Step 2: Backend Setup

```bash
cd ~/Crypto-shop/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
nano .env
```

**Edit .env and add:**

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://cryptoshop_user:your_strong_password@localhost:5432/cryptoshop
JWT_SECRET=your_super_secret_jwt_key_change_this_NOW
OXAPAY_API_KEY=your_merchant_api_key_here
OXAPAY_CALLBACK_URL=http://your-domain.com:5000/api/webhook/oxapay
FRONTEND_URL=http://localhost:3000
```

```bash
# Build TypeScript
npm run build

# Start backend
npm run dev
# Or for production:
npm start
```

**Backend should run on http://localhost:5000**

---

## 🎨 Step 3: Frontend Setup

```bash
cd ~/Crypto-shop/frontend

# Install dependencies
npm install

# Create .env.local
cp .env.local.example .env.local
nano .env.local
```

**Edit .env.local and add:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
# Build for production
npm run build

# Start frontend
npm run dev
# Or for production:
npm start
```

**Frontend should run on http://localhost:3000**

---

## 🔑 Step 4: Create Admin Account

### Option 1: Via Database

```bash
# Connect to database
sudo -u postgres psql -d cryptoshop

# Create admin user with password: admin123
# (Password hash for "admin123")
INSERT INTO users (username, password_hash, is_admin)
VALUES ('admin', '$2a$10$8Z5q3Z5q3Z5q3Z5q3Z5q3.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567', TRUE);

\q
```

### Option 2: Register Then Promote

1. Register via website: http://localhost:3000/register
2. Then promote to admin:

```bash
sudo -u postgres psql -d cryptoshop
UPDATE users SET is_admin = TRUE WHERE username = 'your_username';
\q
```

**⚠️ IMPORTANT: Change admin password after first login!**

---

## 💳 Step 5: OxaPay Setup

1. Go to https://oxapay.com
2. Register merchant account
3. Go to Dashboard → API section
4. Get your **Merchant API Key**
5. Add to `backend/.env` file:
   ```env
   OXAPAY_API_KEY=your_merchant_api_key_here
   OXAPAY_CALLBACK_URL=http://your-domain.com:5000/api/webhook/oxapay
   ```
6. Set webhook URL in OxaPay dashboard:
   ```
   http://your-domain.com:5000/api/webhook/oxapay
   ```
7. (Optional) Enable sandbox mode for testing before going live

---

## 🔒 Step 6: Production Setup (Optional)

### Using PM2 (Process Manager)

```bash
# Install PM2
sudo npm install -g pm2

# Backend
cd ~/Crypto-shop/backend
pm2 start npm --name "crypto-backend" -- start
pm2 save

# Frontend
cd ~/Crypto-shop/frontend
pm2 start npm --name "crypto-frontend" -- start
pm2 save

# Auto-start on boot
pm2 startup
```

### Using Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/cryptoshop
```

**Add:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cryptoshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🧪 Step 7: Testing

### Test Backend:

```bash
curl http://localhost:5000/health
```

Should return: `{"status":"ok","message":"CryptoShop API is running"}`

### Test Frontend:

Open browser: `http://localhost:3000`

### Test Full Flow:

1. ✅ Register account at `/register`
2. ✅ Browse products on home page
3. ✅ Add products to cart
4. ✅ Checkout (redirects to OxaPay)
5. ✅ Complete payment
6. ✅ Check `/profile` - **Map Link & Image Link now visible!**

---

## 📁 Project Structure

```
Crypto-shop/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── productController.ts
│   │   │   ├── orderController.ts
│   │   │   ├── paymentController.ts
│   │   │   └── adminController.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── services/
│   │   │   └── oxapayService.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── lib/
│   │   └── api.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.local.example
└── database/
    └── schema.sql
```

---

## 🎯 Admin Panel Features

### Dashboard
- Total users, products, orders
- Total revenue
- Recent orders table

### Products Management
- ➕ Create new product
- ✏️ Edit existing product
- 🗑️ Delete product (soft delete)
- 📋 View all products in table

**Product form fields:**
- Name (required)
- Price (required)
- Currency (USD, EUR, BTC, ETH)
- Description (optional)
- Map Link (required) - Revealed after payment
- Image Link (required) - Revealed after payment

### Orders Management
- View all orders
- Update order status
- See order items
- Filter by status

### Users Management
- View all users
- Grant/revoke admin privileges
- See registration dates

### Settings
- Environment configuration
- Payment provider info
- Database status

---

## 🐛 Troubleshooting

### Backend won't start:
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify DATABASE_URL in .env
- Check port 5000 is free: `sudo lsof -i :5000`

### Frontend build fails:
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)

### Database errors:
- Check connection: `sudo -u postgres psql -d cryptoshop`
- Verify user permissions
- Re-import schema if needed

### OxaPay not working:
- Verify API keys in .env
- Check webhook URL is accessible
- Test with OxaPay sandbox mode first

---

## 🔐 Security Notes

**⚠️ PRODUCTION CHECKLIST:**

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Set up firewall rules
- [ ] Regular database backups
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for your domain

---

## 🚀 Done!

Your CryptoShop is now live!

- **Shop:** http://your-domain.com
- **Admin:** http://your-domain.com/admin
- **API:** http://your-domain.com/api

**Happy selling! 💎**

---

## 📞 Support

For issues:
1. Check console logs (browser F12 for frontend)
2. Check backend logs (`pm2 logs crypto-backend`)
3. Verify all .env variables are set correctly

---

## 📝 License

MIT License - Free to use and modify

---

**Built with:**
- Backend: Node.js, Express, TypeScript, PostgreSQL
- Frontend: Next.js 14, React, TailwindCSS
- Payments: OxaPay API
- Theme: Cyberpunk/Hacker Dark
