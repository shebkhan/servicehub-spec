# ServiceHub API (Node.js/Express)

Multi-tenant services marketplace backend built with Node.js, Express, TypeScript, and PostgreSQL via Prisma ORM.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets
```

### 3. Setup database
```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed demo data
npx prisma db seed
```

### 4. Run development server
```bash
npm run dev
```

API will be available at `http://localhost:3001/api/v1`

## Demo Accounts

After seeding:
- **Admin:** admin@demo.com / password123
- **Customer:** customer@demo.com / password123
- **Provider:** provider@demo.com / password123

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database with demo data |

## API Documentation

Full API documentation is available in [API.md](./API.md)

## Project Structure

```
src/
├── index.ts           # Express app entry point
├── config/
│   └── index.ts       # Environment configuration
├── middleware/
│   └── auth.ts        # JWT authentication middleware
├── routes/
│   ├── index.ts       # Route exports
│   ├── auth.ts        # Auth endpoints
│   ├── services.ts    # Service catalog endpoints
│   ├── providers.ts   # Provider endpoints
│   ├── orders.ts      # Order management
│   ├── payments.ts    # Payments & wallet
│   ├── reviews.ts     # Reviews
│   ├── users.ts       # User profile
│   └── tenants.ts     # Tenant info
prisma/
├── schema.prisma      # Database schema
└── seed.ts            # Demo data seeder
```

## Features

- JWT authentication with access/refresh tokens
- Role-based authorization (Customer, Provider, Tenant Admin, Super Admin)
- Credit-based wallet system
- Stripe payment integration
- Promo code support
- Multi-tenant architecture
- Service booking with availability
- Review and rating system
