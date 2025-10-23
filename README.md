# 🛒 Crypto Shop - Anonymous Marketplace

> **БЪРЗО, ЛЕСНО, АНОНИМНО!** - Your Anonymous Cryptocurrency Marketplace

Модерен криптовалутен магазин с **OxaPay White Label** интеграция, **Product Variants System** и **Location-Based Stock Management**.

---

## 📖 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 📚 **ПЪЛНА ИНСТРУКЦИЯ** за deployment от нулата
- **README.md** (this file) - Бърз преглед на проекта

---

## ✨ Key Features

### ✅ ЗАВЪРШЕНИ МОДУЛИ:

#### 🔐 Authentication & User Management
- JWT-based authentication
- Role-based access (Admin/User)
- Profile management
- Ban system (temporary/permanent)
- Referral system with tracking

#### 📦 Product Variants System (NEW!)
- Multiple variants per product (5гр, 10гр, 25гр, etc.)
- Different prices per variant
- Stock management per variant per city
- Real-time stock availability

#### 📍 Location-Based System
- Product-specific cities & districts
- Stock tracking per location
- Delivery address collection

#### 💰 Stock Management (NEW!)
- Three-state tracking: `stock_amount`, `reserved_amount`, `available`
- **Reserve** stock on order creation
- **Finalize** stock on payment confirmation (paid)
- **Release** stock on expired/failed orders
- Prevents overselling

#### 💳 OxaPay White Label Payment
- Customer selects crypto currency (BTC, ETH, USDT, etc.)
- Customer selects network (TRC20, ERC20, BEP20, etc.)
- Generates unique payment address
- QR code + copy address
- Real-time payment status updates
- Webhook integration

#### 💬 Communication
- Admin-User chat system
- Real-time messaging
- Unread message counter

#### 🎫 Marketing Tools
- Promo codes (percentage & fixed)
- Referral system
- Minimum order amounts

#### 📊 Admin Panel
- Dashboard with statistics
- Product management (CRUD)
- Location assignment per product
- Order management (filters, status updates)
- Delivery tracking (map link, image link)
- User management (ban/unban)
- Chat conversations

---

## 🚧 В ПРОЦЕС (Roadmap):

### Етап 4: Admin Variants UI
- [ ] Visual variant management in admin panel
- [ ] Stock management interface per city
- [ ] Bulk stock updates
- [ ] Low stock alerts
- [ ] Variant sorting/reordering

### Етап 5: Design Overhaul
- [ ] Hero section with card design
- [ ] Product cards redesign
- [ ] Animations & transitions
- [ ] Mobile responsive improvements

---

## 🚀 Quick Start

### За пълна инструкция виж [DEPLOYMENT.md](./DEPLOYMENT.md)

### Кратък старт (ако вече имаш всичко настроено):

```bash
# 1. Clone проекта
git clone https://github.com/tumnatamreja/Crypto-shop.git
cd Crypto-shop

# 2. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Configure environment variables
# Edit backend/.env and frontend/.env.local

# 4. Setup database
psql -U postgres -c "CREATE DATABASE cryptoshop"
psql -U postgres -d cryptoshop -f backend/migrations/001_initial_schema.sql
psql -U postgres -d cryptoshop -f backend/migrations/002_product_variants.sql

# 5. Build backend
cd backend && npm run build && cd ..

# 6. Build frontend
cd frontend && npm run build && cd ..

# 7. Start with PM2
npx pm2 start ecosystem.config.js

# 8. Check status
npx pm2 status
```

**URLs:**
- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:3001
- **Admin Panel:** http://localhost:3002/admin/login

---

## 🔧 Tech Stack

### Backend:
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **OxaPay API** - Crypto payments

### Frontend:
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** - Cyberpunk red theme
- **Axios** - HTTP client

### DevOps:
- **PM2** - Process manager
- **Nginx** - Reverse proxy (production)
- **Let's Encrypt** - SSL/TLS

---

## 📊 Database Schema

### Core Tables:
```
users
products
cities
districts
product_cities         (M2M: products ↔ cities)
product_districts      (M2M: products ↔ districts)

product_variants       (1:N from products)
variant_stock          (stock per variant per city)

orders
order_items            (with variant_id, variant_name)
promo_codes
referrals
chat_messages
```

### Product Variants Flow:

```
Product (Cocaine)
  ↓
Variants:
  - 5гр  → €45.00
  - 10гр → €85.00
  - 25гр → €200.00
  ↓
Stock per City:
  Sofia:
    - 5гр:  100 units (10 reserved = 90 available)
    - 10гр: 50 units (5 reserved = 45 available)
  Plovdiv:
    - 5гр:  75 units (0 reserved = 75 available)
```

---

## 💳 Payment Flow

### Customer Experience:

1. **Select Product** → Choose variant → Select quantity
2. **Choose Location** → City + District
3. **Create Order** → Stock gets **reserved**
4. **Payment Page:**
   - Select crypto (BTC, ETH, USDT, etc.)
   - Select network (TRC20, ERC20, etc.)
   - Get payment address + QR code
5. **Send Payment** → Customer sends crypto
6. **Webhook Processes:**
   - Status `paid` → Stock **finalized** (deducted)
   - Status `expired`/`failed` → Stock **released**

### Supported Cryptocurrencies:

| Crypto | Networks |
|--------|----------|
| USDT | TRC20, ERC20, BEP20, Polygon, TON |
| USDC | ERC20, TRC20, BEP20, Polygon |
| BTC | Bitcoin Network |
| ETH | ERC20 |
| TRX | TRC20 |
| BNB | BEP20, BEP2 |
| LTC, DOGE, BCH, XRP, ADA, SOL, TON, MATIC, DAI, SHIB |

---

## 📁 Project Structure

```
Crypto-shop/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── productController.ts       # getProductById with variants
│   │   │   ├── paymentController.ts       # Checkout + webhook with stock
│   │   │   ├── orderController.ts
│   │   │   ├── adminController.ts
│   │   │   ├── productVariantController.ts # Variant CRUD
│   │   │   ├── locationController.ts       # Cities/Districts
│   │   │   ├── chatController.ts
│   │   │   ├── referralController.ts
│   │   │   └── promoCodeController.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── services/
│   │   │   └── oxapayService.ts
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_product_variants.sql
│   ├── dist/                    # Built JS (generated)
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Home page
│   │   ├── login/
│   │   ├── register/
│   │   ├── order/[productId]/   # Variant selection UI
│   │   ├── payment/[orderId]/   # White-label payment
│   │   ├── profile/             # User orders
│   │   └── admin/               # Admin panel
│   ├── lib/
│   │   └── api.ts               # API client
│   ├── .env.local
│   ├── package.json
│   └── next.config.js
│
├── ecosystem.config.js          # PM2 config
├── DEPLOYMENT.md               # Full deployment guide
└── README.md                   # This file
```

---

## 🎨 Design System

### Cyberpunk Red Theme:

```css
/* Primary Colors */
--neon-red: #ff3b3b;
--neon-orange: #ff6b35;
--neon-cyan: #00ffff;
--neon-green: #39ff14;

/* Backgrounds */
--bg-primary: #0a0a0a;
--bg-card: #1f1515;
```

### Components:
- `.cyber-card` - Card with neon border
- `.cyber-button` - Button with glow effect
- `.cyber-input` - Input field styling
- `.neon-glow` - Text glow effect
- `.text-gradient` - Gradient text

---

## 🔐 API Endpoints

### Public:
```
GET    /api/products                    # List products
GET    /api/products/:id                # Product + variants
POST   /api/auth/register               # Register
POST   /api/auth/login                  # Login
POST   /api/checkout                    # Create order (with variantId)
POST   /api/webhook/oxapay              # Payment webhook
```

### Protected (User):
```
GET    /api/auth/profile                # User profile
GET    /api/orders                      # User orders
GET    /api/orders/:id                  # Order details
POST   /api/chat/send                   # Send message
GET    /api/referral/stats              # Referral stats
```

### Admin:
```
GET    /api/admin/dashboard             # Statistics
GET    /api/admin/products              # All products
POST   /api/admin/products              # Create product
PUT    /api/admin/products/:id          # Update product
DELETE /api/admin/products/:id          # Delete product
GET    /api/admin/orders                # All orders
PUT    /api/admin/orders/:id            # Update order
GET    /api/admin/users                 # All users
POST   /api/admin/users/:id/ban         # Ban user
```

---

## 🧪 Testing

### Test Order Flow:

1. **Register/Login:**
   ```
   http://localhost:3002/register
   ```

2. **Create Product (Admin):**
   - Login to admin panel
   - Create product
   - Assign locations

3. **Add Variants (SQL for now):**
   ```sql
   INSERT INTO product_variants (product_id, variant_name, variant_type, amount, price)
   VALUES ('prod-id', '5гр', 'гр', 5, 45.00);

   INSERT INTO variant_stock (variant_id, city_id, stock_amount, reserved_amount)
   VALUES ('variant-id', 'city-id', 100, 0);
   ```

4. **Customer Order:**
   - Visit product page
   - Select city → Variants load
   - Select district
   - Select variant
   - Checkout → Stock reserves
   - Pay → Stock finalizes

5. **Verify Stock:**
   ```sql
   SELECT * FROM variant_stock;
   ```

---

## 🛠️ Полезни Команди

### PM2:
```bash
npx pm2 status          # Status
npx pm2 logs            # View logs
npx pm2 restart all     # Restart services
npx pm2 stop all        # Stop services
```

### Database:
```bash
psql -U postgres -d cryptoshop                     # Connect
pg_dump -U postgres cryptoshop > backup.sql        # Backup
psql -U postgres -d cryptoshop < backup.sql        # Restore
```

### Development:
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Production:
```bash
cd backend && npm run build
cd frontend && npm run build
npx pm2 start ecosystem.config.js
```

---

## 🔒 Security Features

- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection
- ✅ CORS configured
- ✅ Environment variables for secrets
- ✅ Webhook signature verification
- ✅ Stock race condition handling

---

## 📚 Environment Variables

### Backend (.env):
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cryptoshop
DB_USER=postgres
DB_PASSWORD=your_password

# Auth
JWT_SECRET=your_jwt_secret_min_32_chars

# OxaPay
OXAPAY_API_KEY=your_oxapay_api_key
OXAPAY_MERCHANT_API_KEY=your_merchant_key
OXAPAY_WEBHOOK_SECRET=your_webhook_secret
OXAPAY_CALLBACK_URL=https://yourdomain.com/api/webhook/oxapay

# Server
PORT=3001
NODE_ENV=production
```

### Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🐛 Troubleshooting

### Backend не стартира:
```bash
# Check logs
npx pm2 logs backend

# Check database connection
psql -U postgres -d cryptoshop

# Check port
lsof -i :3001
```

### Frontend не се зарежда:
```bash
# Check logs
npx pm2 logs frontend

# Rebuild
cd frontend && npm run build

# Check port
lsof -i :3002
```

### Pълни решения в [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

---

## 🆘 Support

- 📧 Email: support@sinhuella.com
- 💬 Telegram: @your_telegram
- 🐛 GitHub Issues: [Create Issue](https://github.com/tumnatamreja/Crypto-shop/issues)

---

## 📝 License

MIT License

---

## 🏆 Built With

- Node.js, Express, TypeScript, PostgreSQL
- Next.js 14, React 18, TailwindCSS
- OxaPay API (White-Label)
- PM2, Nginx, Let's Encrypt

---

## 📅 Version History

**v3.0** (Current - October 2025)
- ✅ Product Variants System
- ✅ Location-Based Stock Management
- ✅ Stock Reservation/Finalization
- ✅ Enhanced checkout flow
- ✅ TypeScript improvements

**v2.1** (Previous)
- White-label payment page
- Red cyberpunk theme
- Anti-spam system

---

**Status:** ✅ Production Ready (Етап 1-3 Complete)
**Next:** 🚧 Етап 4 - Admin Variants UI

**🔥 БЪРЗО, ЛЕСНО, АНОНИМНО! 🔥**
