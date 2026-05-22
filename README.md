# WorkBee 🐝

**WorkBee** is a marketplace platform connecting clients with skilled contractors and influencers. Built for the Lithuanian market and beyond.

🌐 **Live:** [workbee.space](https://workbee.space)

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend / Auth | PocketBase (Railway) |
| API Server | Node.js + Express (Railway) |
| Hosting | Hostinger (web), Railway (API + DB) |
| Payments | Stripe (Checkout + Connect) |
| Email | Hostinger SMTP |
| Maps | Google Maps API |
| Security | Google reCAPTCHA Enterprise |

---

## Monorepo Structure

```
apps/
  web/          # React frontend
  api/          # Express API server
  pocketbase/   # PocketBase config, migrations, hooks
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start all services
docker compose up
```

Frontend runs on `http://localhost:5173`, PocketBase on `http://localhost:8090`, API on `http://localhost:3001`.

---

## Features

- **Contractor search** — browse and filter by profession, location, rating
- **Auction tickets** — clients post jobs, contractors bid
- **Influencer marketplace** — brand partnership listings
- **Stripe payments** — checkout + contractor payouts via Stripe Connect
- **Referral program** — earn €10 + free month per signup
- **Multi-language** — EN, LT, RU, PL, UK (auto-detected by country)
- **Email verification** — via Hostinger SMTP
- **reCAPTCHA Enterprise** — bot protection on login and registration

---

## Team

| | |
|---|---|
| **Tadas** | Co-founder |
| **Kristupas** | Co-founder |
| **Olek Suchodolski** | Mentor |
