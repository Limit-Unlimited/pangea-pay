# Pangea Pay — Developer Guide

## Project Overview
Pangea Pay is a proprietary modular payments technology suite developed by Limit Unlimited Technologies Ltd. It consists of five applications: Pangea Backoffice, Pangea Web App, Pangea Mobile App (iOS & Android), Pangea Payment Rail (public API), and Pangea Commercial Management Portal.

See `requirements-v2.md` for full functional and non-functional requirements.

## Tech Stack
- **Database:** MySQL
- **Frontend:** React / Next.js
- **Styling:** Tailwind CSS
- **Component Library:** shadcn/ui (built on Radix UI primitives)

---

## Branding

### Color Palette

| Role | Name | Hex |
|---|---|---|
| Primary | Ocean Blue | `#1E4D8C` |
| Secondary | Teal | `#2A9D8F` |
| Accent / CTA | Warm Gold | `#E9A820` |
| Background | Soft White | `#F7F9FC` |
| Surface | White | `#FFFFFF` |
| Text Primary | Deep Charcoal | `#1A2332` |
| Text Secondary | Slate | `#64748B` |
| Success | Green | `#22C55E` |
| Warning | Amber | `#F59E0B` |
| Error | Red | `#EF4444` |

### Typography
- **Headings:** Lato Bold Italic
- **Body:** Inter (Regular)

### Logo
Not yet designed. Do not generate or assume logo assets.

---

## Tone & Voice

- **Trustworthy** — clear, transparent language; never obscure fees or steps
- **Plain and direct** — no financial jargon; assume end users are not finance experts
- **Warm but professional** — friendly, never casual; reassuring, never salesy
- **Action-oriented** — use clear, specific labels (e.g. "Send Money", "Confirm Transfer") not vague ones (e.g. "Proceed", "Continue")
- **Globally sensitive** — inclusive, culturally neutral language across all send/receive corridors

---

## UI Conventions

- Use `shadcn/ui` components throughout — do not introduce ad hoc HTML elements where a shadcn component exists
- Follow Tailwind utility classes for all styling; avoid inline styles
- Accessible by default — respect Radix UI ARIA patterns, do not override without reason
- The Backoffice and customer-facing apps share the same design system but may differ in layout density (Backoffice is data-heavy; Web/Mobile App prioritises simplicity)

---

## Key Audiences

| App | Primary Users |
|---|---|
| Pangea Backoffice | Internal operations, compliance, treasury, and admin teams |
| Pangea Web App | End users (retail customers sending remittances) |
| Pangea Mobile App | Same as Web App, mobile context |
| Pangea Payment Rail | Aggregator clients (technical, API consumers) |
| Pangea Commercial Management Portal | Limit Unlimited — institutional customer, subscription, and licence management |