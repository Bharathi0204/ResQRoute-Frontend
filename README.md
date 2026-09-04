# ResQRoute-Frontend

**SIH26002 | Ministry of Development of North Eastern Region (MDoNER)**  
*Resilient Logistics & Route Intelligence Platform*

## Overview
Angular Progressive Web Application (PWA) featuring dual-form sliding authentication, native-feeling mobile touch controls, role-based dashboards (Customer, Driver, Admin), and Vercel deployment readiness.

## Features
- **Sliding Authentication UI:** Smooth dual-panel transition with curved gradient overlay.
- **Mobile Touch Native UX:** Segmented controller and touch-optimized input layout for invigilator/judge evaluation on mobile devices.
- **Role-Based Access Control (RBAC):** Customer Requisition Portal, Driver Field PWA, and Admin Control Center.
- **PWA Ready:** Installable web application (`manifest.webmanifest`) for offline corridor operation.
- **Fast Demo Logins:** 1-tap evaluator logins for `driver1` (`TR-102`), `customer1`, and `admin`.

## Technology Stack
- **Framework:** Angular 19+ (Standalone API)
- **Styling:** Vanilla CSS with custom micro-animations & responsive breakpoints
- **State & Auth:** Signals, Reactive Forms, Functional JWT Interceptor, Role Route Guards
- **Deployment:** Vercel SPA routing (`vercel.json`)

## Quick Start (Local Development)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm start
   ```
3. Open `http://localhost:4200` in your browser.
