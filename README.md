# Game Recharge Platform

<div align="center">

A modern, full-stack game recharge platform built with TypeScript, featuring multi-merchant support, internationalization, and integrated payment processing.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

</div>

## 📋 Overview

Game Recharge Platform is a comprehensive, production-ready solution for managing in-game currency purchases and virtual goods. The platform provides a seamless experience for end users, merchants, and administrators with robust support for multiple payment providers, multi-language interfaces, and role-based access control.

Built with modern web technologies and best practices, this platform demonstrates enterprise-grade architecture with clean code separation, type safety, and scalable design patterns.

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#️-architecture)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Getting Started](#-getting-started)
- [Environment Configuration](#️-environment-configuration)
- [API Documentation](#-api-documentation)
- [Database Schema](#️-database-schema)
- [Security Features](#-security-features)
- [Development](#-development)
- [Internationalization](#-internationalization)
- [Deployment](#-deployment)
- [FAQ](#-frequently-asked-questions-faq)
- [Roadmap](#️-roadmap)
- [License](#-license)
- [Contributing](#-contributing)

## ✨ Features

### Core Functionality
- **Game Management**: Browse and search games with detailed information
- **SKU Management**: Product catalog with pricing, discounts, and bonuses
- **Order Processing**: Complete order lifecycle management (Pending → Paid/Failed/Canceled)
- **Multi-Merchant Support**: Multiple merchants can manage their games independently
- **Merchant Application System**: Users can apply to become merchants with admin approval workflow

### Payment Integration
- **Stripe**: Full integration with Stripe payment processing
- **PayPal**: Complete PayPal checkout flow support
- **Webhook Support**: Secure payment status updates via webhooks

### User Experience
- **Internationalization**: Support for Chinese (中文), Japanese (日本語), and English
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Authentication**: Auth0 SSO integration with OAuth 2.0 / OpenID Connect
- **Role-Based Access**: USER, MERCHANT, and ADMIN roles with appropriate permissions
- **Demo Mode**: Development-friendly demo authentication system

### Admin & Merchant Features
- **Admin Dashboard**: Comprehensive statistics, merchant management, and order oversight
- **Merchant Portal**: Game and SKU management for merchants
- **Order Analytics**: Revenue trends, order statistics, and performance metrics

## 🏗️ Architecture

The platform follows a **frontend-backend separation** architecture:

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)          │
│  React 18 + TypeScript + Tailwind CSS   │
└──────────────────┬──────────────────────┘
                   │ HTTP/REST API
                   │ (CORS Enabled)
┌──────────────────▼──────────────────────┐
│      Backend (Node.js + Express)        │
│  Express + TypeScript + Prisma ORM      │
└──────────────────┬──────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼──────┐  ┌───▼──────┐  ┌───▼──────┐
│PostgreSQL│  │  Redis   │  │  Auth0   │
│          │  │ (Cache)  │  │   SSO    │
└──────────┘  └──────────┘  └──────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI library
- **TypeScript 5.2.2** - Type safety
- **Vite 5.1.0** - Build tool and dev server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **React Router DOM 6.22.0** - Client-side routing
- **Zustand 4.5.0** - State management
- **i18next 23.8.0** - Internationalization
- **@auth0/auth0-react 2.11.0** - Authentication
- **@stripe/react-stripe-js** - Stripe integration
- **@paypal/react-paypal-js** - PayPal integration

### Backend
- **Node.js** - Runtime environment
- **Express 4.18.2** - Web framework
- **TypeScript 5.2.2** - Type safety
- **Prisma 5.8.1** - Modern ORM
- **PostgreSQL 16** - Primary database
- **Redis 7** - Caching layer
- **express-oauth2-jwt-bearer 1.6.0** - Auth0 JWT validation
- **Stripe 14.15.0** - Payment processing
- **@paypal/checkout-server-sdk** - PayPal server SDK
- **Pino 9.0.0** - High-performance logging
- **Helmet 7.1.0** - Security headers
- **Zod 3.22.4** - Runtime validation

## 📁 Project Structure

```
game-recharge-platform/
├── frontend/                    # Frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── store/               # Zustand state management
│   │   ├── types/               # TypeScript types
│   │   ├── auth/                # Authentication logic
│   │   ├── i18n/                # Internationalization
│   │   │   └── locales/         # Translation files (zh, ja, en)
│   │   ├── App.tsx              # Root component
│   │   └── main.tsx             # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                     # Backend application
│   ├── src/
│   │   ├── routes/              # API routes
│   │   │   ├── health.ts
│   │   │   ├── games.ts
│   │   │   ├── skus.ts
│   │   │   ├── orders.ts
│   │   │   ├── merchant.ts
│   │   │   ├── merchantApply.ts
│   │   │   ├── adminMerchants.ts
│   │   │   ├── paymentsStripe.ts
│   │   │   └── paymentsPaypal.ts
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts          # Authentication
│   │   │   ├── demoAuth.ts      # Demo mode auth
│   │   │   └── error.ts         # Error handling
│   │   ├── payments/            # Payment services
│   │   │   ├── stripe.ts
│   │   │   └── paypal.ts
│   │   ├── app.ts               # Express app config
│   │   ├── index.ts             # Entry point
│   │   ├── config.ts            # Configuration
│   │   ├── db.ts                # Database connection
│   │   └── logger.ts            # Logging setup
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # Database migrations
│   │   └── seed.ts              # Seed data
│   └── package.json
│
├── database/                    # Database configuration
│   └── docker-compose.yml       # Docker Compose setup
│
└── docs/                        # Documentation
    ├── TECHNICAL_ARCHITECTURE.md
    └── AUTH0_SSO_SETUP.md
```

## 🚀 Quick Start

For a quick overview, here's the minimal setup to get the platform running:

```bash
# 1. Start databases
cd database && docker-compose up -d

# 2. Setup backend
cd ../backend
npm install
cp env.example .env  # Configure your .env file
npm run prisma:generate
npm run prisma:migrate
npm run dev

# 3. Setup frontend (in a new terminal)
cd ../frontend
npm install
cp env.example .env  # Configure your .env file
npm run dev
```

Visit `http://localhost:5173` to see the application.

> **Note**: Make sure to configure Auth0, Stripe, and PayPal credentials in the `.env` files before running.

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **Docker** and **Docker Compose** (for database)
- **Auth0 Account** (for authentication)
- **Stripe Account** (for payments)
- **PayPal Developer Account** (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gamepay/game-recharge-platform
   ```
   
   > **Note**: Replace `<repository-url>` with your actual repository URL.

2. **Set up the database**
   ```bash
   cd database
   docker-compose up -d
   ```
   This will start PostgreSQL and Redis containers.

3. **Set up the backend**
   ```bash
   cd backend
   npm install
   
   # Copy environment variables
   cp env.example .env
   # Edit .env with your configuration
   
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # (Optional) Seed the database
   npm run prisma:seed
   ```

4. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   
   # Copy environment variables template
   cp env.example .env
   
   # Edit .env file with your configuration:
   # VITE_API_BASE_URL=http://localhost:8080
   # VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
   # VITE_AUTH0_CLIENT_ID=your-client-id
   # VITE_AUTH0_AUDIENCE=https://api.waffogamepay.local
   ```

### Running the Application

1. **Start the backend** (from `backend/` directory)
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:8080`

2. **Start the frontend** (from `frontend/` directory)
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=8080
NODE_ENV=development

# CORS
WEB_ORIGIN=http://localhost:5173

# Auth0
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://api.waffogamepay.local
AUTH0_NAMESPACE=https://waffogamepay.example

# Database
DATABASE_URL=postgresql://gamepay:gamepay@localhost:5432/gamepay?schema=public

# Payments
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENV=sandbox  # or 'live'
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.waffogamepay.local
```

## 📚 API Documentation

### Core Endpoints

#### Health Check
- `GET /health` - Service health status

#### Games
- `GET /api/games` - List all games
- `GET /api/games/:id` - Get game details

#### SKUs
- `GET /api/skus` - List SKUs (with optional filters)
- `GET /api/skus/:id` - Get SKU details

#### Orders
- `GET /api/orders` - List orders (user-specific or admin view)
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details

#### Merchant
- `GET /api/merchant` - Get merchant information
- `POST /api/merchant/apply` - Submit merchant application

#### Payments
- **Stripe**:
  - `POST /api/payments/stripe/create-intent` - Create payment intent
  - `POST /api/webhooks/stripe` - Stripe webhook handler
- **PayPal**:
  - `POST /api/payments/paypal/create-order` - Create PayPal order
  - `POST /api/payments/paypal/capture` - Capture payment

#### Admin
- `GET /api/admin/merchants` - List all merchants (admin only)
- `GET /api/users` - List all users (admin only)

### Authentication

The API supports two authentication modes:

1. **Production Mode**: Auth0 JWT Bearer Token
   ```
   Authorization: Bearer <jwt-token>
   ```

2. **Demo Mode** (for development):
   ```
   X-Demo-Role: visitor|user|merchant|admin
   X-Demo-Merchant-Id: <merchant-id> (optional)
   ```

## 🗄️ Database Schema

### Core Models

- **User**: User accounts with roles (USER, MERCHANT, ADMIN)
- **Merchant**: Merchant entities with status (ACTIVE, SUSPENDED)
- **Game**: Games with multi-language support (nameZh, nameJa, nameEn)
- **SKU**: Product units with pricing, discounts, and bonuses
- **Order**: Order records with status tracking (PENDING, PAID, FAILED, CANCELED)
- **MerchantApplication**: Merchant application workflow

### Relationships

- Many-to-Many: Merchant ↔ User, Merchant ↔ Game
- One-to-Many: User → Orders, Merchant → Games → SKUs

## 🔐 Security Features

The platform implements multiple layers of security:

- **HTTP Security Headers** (Helmet) - XSS protection, Content Security Policy (CSP), HSTS
- **CORS Configuration** - Restricted origins with credential support
- **JWT Authentication** - Secure token-based authentication via Auth0
- **Role-Based Access Control (RBAC)** - Fine-grained permissions for USER, MERCHANT, and ADMIN roles
- **Webhook Signature Verification** - Secure payment webhook handling (Stripe webhook secret validation)
- **Input Validation** - Zod schema validation for all API endpoints
- **SQL Injection Prevention** - Prisma ORM with parameterized queries
- **Environment Variable Protection** - Sensitive data stored in environment variables, never in code
- **HTTPS Enforcement** - Production-ready SSL/TLS configuration

### Security Best Practices

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Regularly update dependencies for security patches
- Implement rate limiting for API endpoints
- Monitor and log security events

## 🧪 Development

### Available Scripts

#### Frontend
```bash
cd frontend

npm run dev        # Start development server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint for code quality checks
```

#### Backend
```bash
cd backend

npm run dev              # Start development server with hot reload (http://localhost:8080)
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production server (requires build first)
npm run prisma:generate  # Generate Prisma Client from schema
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (database GUI at http://localhost:5555)
```

### Development Tips

- **Hot Reload**: Both frontend and backend support hot reload during development
- **Database GUI**: Use `npm run prisma:studio` to visually inspect and edit database records
- **Type Safety**: TypeScript ensures type safety across the entire stack
- **Environment Variables**: Always use `.env` files (never commit them to version control)

### Database Management

```bash
# Start database services
cd database
docker-compose up -d

# Stop database services
docker-compose down

# View database logs
docker-compose logs -f postgres
```

## 🌍 Internationalization

The platform supports three languages with full i18n implementation:
- **Chinese (中文)** - `zh`
- **Japanese (日本語)** - `ja`
- **English** - `en` (default)

Translation files are located in `frontend/src/i18n/locales/`. The language is automatically detected from the user's browser settings, and users can manually switch languages via the UI.

### Adding New Languages

1. Create a new translation file in `frontend/src/i18n/locales/{lang}.json`
2. Add the language code to the i18n configuration
3. Update the language switcher component

## 🚢 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```
   Output will be in `frontend/dist/`

2. **Build the backend**
   ```bash
   cd backend
   npm run build
   ```
   Output will be in `backend/dist/`

3. **Run migrations**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

4. **Start the backend**
   ```bash
   npm start
   ```

### Environment Considerations

Before deploying to production, ensure:

- ✅ Set `NODE_ENV=production`
- ✅ Use production database credentials with connection pooling
- ✅ Configure production Auth0 settings and API audiences
- ✅ Set up production payment provider keys (Stripe Live keys, PayPal Live credentials)
- ✅ Configure proper CORS origins (remove localhost origins)
- ✅ Set up webhook endpoints for payment providers (Stripe, PayPal)
- ✅ Enable HTTPS/SSL certificates
- ✅ Set up proper logging and monitoring
- ✅ Configure backup strategies for database
- ✅ Review and update security headers
- ✅ Set up rate limiting for API endpoints
- ✅ Configure proper error tracking (e.g., Sentry)

### Docker Deployment (Optional)

You can containerize the application using Docker:

```bash
# Build backend image
cd backend
docker build -t game-recharge-backend .

# Build frontend image
cd frontend
docker build -t game-recharge-frontend .

# Run with docker-compose
docker-compose up -d
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Follow TypeScript best practices and maintain type safety
2. Write clear, self-documenting code with meaningful variable names
3. Add appropriate error handling and validation
4. Update documentation for any API or feature changes
5. Ensure all tests pass before submitting PRs

### Code Style

- Use ESLint for code linting
- Follow the existing code structure and patterns
- Use meaningful commit messages

## 📧 Support

For support, please open an issue in the repository or contact the development team.

## ❓ Frequently Asked Questions (FAQ)

### General Questions

**Q: Do I need to set up Auth0, Stripe, and PayPal to run the application?**  
A: For full functionality, yes. However, you can use the demo authentication mode for development without Auth0. Payment providers are required for actual payment processing.

**Q: Can I use this platform for production?**  
A: Yes, the platform is production-ready. However, ensure you configure all security settings, use production credentials, and follow the deployment checklist.

**Q: How do I add a new payment provider?**  
A: Create a new payment service in `backend/src/payments/`, add the provider enum to the schema, and create corresponding API routes.

**Q: How do I customize the UI?**  
A: The frontend uses Tailwind CSS. You can modify components in `frontend/src/components/` and update styles using Tailwind utility classes.

**Q: Can I deploy the frontend and backend separately?**  
A: Yes, they are completely decoupled. You can deploy the frontend to a CDN (e.g., Vercel, Netlify) and the backend to any Node.js hosting service.

### Technical Questions

**Q: Why Prisma instead of other ORMs?**  
A: Prisma provides excellent TypeScript support, type safety, and a great developer experience with migrations and Prisma Studio.

**Q: How do I reset the database?**  
A: You can drop and recreate the database, then run `npm run prisma:migrate` to apply all migrations.

**Q: How do I enable Redis caching?**  
A: Redis is configured in Docker Compose. You'll need to implement caching logic in your API routes using the Redis client.

**Q: What's the difference between demo mode and production auth?**  
A: Demo mode uses headers (`X-Demo-Role`) for development/testing. Production mode uses Auth0 JWT tokens for secure authentication.

## 🗺️ Roadmap

- [ ] Enhanced caching with Redis implementation
- [ ] Real-time order status updates via WebSocket
- [ ] Additional payment providers integration (e.g., Alipay, WeChat Pay)
- [ ] Advanced analytics and reporting dashboard
- [ ] Mobile app support (React Native)
- [ ] Enhanced admin dashboard features
- [ ] Automated testing suite (unit, integration, e2e)
- [ ] CI/CD pipeline configuration
- [ ] API rate limiting and throttling
- [ ] Email notifications for order status

## 🙏 Acknowledgments

This project is built with the help of excellent open-source technologies and services:

- [Auth0](https://auth0.com/) - Enterprise-grade authentication and authorization
- [Stripe](https://stripe.com/) - Payment processing infrastructure
- [PayPal](https://www.paypal.com/) - Global payment solutions
- [Prisma](https://www.prisma.io/) - Next-generation ORM for TypeScript
- [React](https://reactjs.org/) - UI library
- [Express](https://expressjs.com/) - Web framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Next-generation frontend tooling

Special thanks to all open-source contributors and the communities behind these amazing tools.

---

<div align="center">

**Built with ❤️ using TypeScript, React, and Node.js**

Made with modern web technologies and best practices

</div>
