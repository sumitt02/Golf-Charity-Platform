# GolfGives — Golf Charity Subscription Platform

A subscription-based golf platform combining performance tracking, charity fundraising, and a monthly draw-based reward engine. Built as a full-stack development assignment for Digital Heroes.

**Live URL:** https://golf-charity-platform-steel.vercel.app

---

## Test Credentials

### User Account
- **Email:** testuser@golfgives.com
- **Password:** Test@1234

### Admin Account
- **Email:** admin@golfgives.com
- **Password:** 123456

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Payments | Stripe (mock, ready for live keys) |
| Deployment | Vercel |

---

## Features Built

### Subscription System
- Monthly (£9.99/month) and yearly (£99/year) plans
- Mock Stripe checkout — ready for real Stripe keys
- Subscription status gating on all protected routes
- Automatic charity contribution calculation on subscribe

### Score Management
- Stableford score entry (range 1–45) with date
- Rolling 5-score logic — oldest score auto-replaced when 6th entered
- Scores displayed reverse-chronological order
- Score validation with error handling

### Draw & Prize Engine
- Random draw mode — pure lottery-style number generation
- Weighted draw mode — numbers weighted by most frequent user scores
- Admin simulation mode — preview draw results before publishing
- Prize pool auto-split: 40% jackpot (5-match), 35% (4-match), 25% (3-match)
- Jackpot rollover if no 5-match winner
- Draw entries recorded with score snapshots

### Charity System
- Charity selection during signup onboarding flow (Step 2 of 3)
- Charity directory with search and filter
- Individual charity profile pages
- Featured charity spotlight on homepage (pulled from DB)
- Minimum 10% contribution, user can increase up to 50%
- Independent donation option (not tied to subscription)
- Charity contributions saved to database on each subscription

### Winner Verification
- Proof upload via Supabase Storage (screenshot of scores)
- Admin approve / reject submissions
- Payout tracking: pending → paid
- Winner notifications stored in DB

### User Dashboard
- Subscription status display
- Score entry and management
- Charity selection and contribution % display
- Participation summary with past draws and upcoming draw date
- Winnings overview with payment status
- Direct link to proof upload when winnings pending
- Notification bell for draw results and winner alerts

### Admin Panel (5 tabs)
- **Draws** — configure draw type, simulate, run and publish draws
- **Users** — view all users with subscription status
- **Winners** — verify submissions, approve/reject, mark as paid
- **Charities** — add, edit, delete, feature charities
- **Analytics** — total users, active subscribers, prize pool estimates, charity contributions

### UI / UX
- Modern non-golf aesthetic — black, green, minimal
- Framer Motion animations throughout all pages
- Page load animations, stagger effects, hover interactions
- Mobile-first fully responsive design
- Featured charity on homepage from database

---

## Project Structure
```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── login/page.tsx        # Login
│   ├── signup/page.tsx       # Signup
│   ├── dashboard/page.tsx    # User dashboard
│   ├── admin/page.tsx        # Admin panel
│   ├── pricing/page.tsx      # Subscription plans
│   ├── charities/
│   │   ├── page.tsx          # Charity directory
│   │   └── [id]/page.tsx     # Individual charity profile
│   └── winner/page.tsx       # Winner proof upload
├── components/
│   └── HomeClient.tsx        # Animated homepage client component
└── lib/
    ├── supabase.ts           # Browser Supabase client
    ├── supabase-server.ts    # Server Supabase client
    ├── draw.ts               # Draw engine logic
    ├── score.ts              # Score management logic
    └── animations.ts         # Framer Motion animation variants
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User profiles linked to Supabase Auth |
| `subscriptions` | Subscription plans and status |
| `scores` | Stableford scores with rolling 5-score logic |
| `charities` | Charity listings with featured flag |
| `draws` | Monthly draw records with winning numbers |
| `draw_entries` | User participation per draw with score snapshots |
| `winners` | Winners per draw with prize amounts |
| `payouts` | Payout tracking per winner |
| `charity_contributions` | Contribution amounts per user per subscription |
| `notifications` | In-app notifications for draw results and wins |

---

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
```

---

## Local Development
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/golf-charity-platform.git

# Install dependencies
cd golf-charity-platform
npm install

# Add environment variables
cp .env.example .env.local
# Fill in your Supabase and Stripe keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

Deployed on Vercel. To redeploy:
```bash
npm run build
vercel --prod
```

---

## PRD Checklist

- [x] User signup & login
- [x] Subscription flow (monthly and yearly)
- [x] Score entry — 5-score rolling logic
- [x] Draw system logic and simulation
- [x] Charity selection at signup and contribution calculation
- [x] Winner verification flow and payout tracking
- [x] User Dashboard — all modules functional
- [x] Admin Panel — full control and usability
- [x] Responsive design on mobile and desktop
- [x] Error handling and edge cases
- [x] Live deployment on Vercel
- [x] Supabase backend with proper schema and RLS

---

## Built By
Sumit Singh
