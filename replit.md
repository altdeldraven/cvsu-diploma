# Diploma Issuance and Verification System

## Overview
A full-stack web application for **CvSU-Trece Martires City Campus** managing diploma issuance and verification. Features Admin (Registrar) and Student roles with **Ethereum blockchain integration** (Sepolia testnet) for tamper-proof diploma verification.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, wouter (routing), TanStack Query v5, framer-motion
- **Backend**: Express 5, Passport.js (local strategy), express-session
- **Database**: PostgreSQL with Drizzle ORM
- **Blockchain**: Ethereum (Sepolia testnet) via ethers.js — smart contract stores diploma hashes on-chain
- **Export**: jspdf + jspdf-autotable (PDF), exceljs (Excel)
- **QR Code**: qrcode.react

## Architecture
- `shared/schema.ts` — Drizzle table definitions, Zod schemas, TypeScript types
- `shared/routes.ts` — API contract with typed paths, methods, input/output schemas
- `server/routes.ts` — Express route handlers using storage interface
- `server/storage.ts` — Database CRUD operations via Drizzle
- `server/auth.ts` — Passport.js local auth with session
- `server/ethereum.ts` — Ethereum blockchain service (register & verify diplomas on Sepolia)
- `server/contracts/DiplomaRegistryABI.json` — Smart contract ABI
- `contracts/DiplomaRegistry.sol` — Solidity smart contract source
- `scripts/deploy.ts` — Contract deployment script
- `client/src/pages/` — Page components (admin dashboard, admin-students, admin-diplomas, student dashboard, profile, verification, auth, home, about)
- `client/src/components/` — Reusable UI (layout with sidebar, diploma-card)
- `client/src/hooks/` — TanStack Query hooks (use-auth, use-users, use-diplomas)

## Blockchain Integration
- **Smart Contract**: `DiplomaRegistry.sol` — stores diploma hashes (certificateId → SHA256 hash) on Ethereum
- **When issuing a diploma**: server generates SHA256 hash of diploma data, writes it to the smart contract, stores real Ethereum tx hash
- **Verification**: public verification page checks both database and on-chain records
- **Fallback**: if blockchain is not configured (no keys set), system works with local hashes only
- **Environment Variables**: `ETHEREUM_PRIVATE_KEY` (wallet), `DIPLOMA_CONTRACT_ADDRESS` (deployed contract)
- **Deployment**: run `npx tsx scripts/deploy.ts` with a funded Sepolia wallet to deploy the contract
- **Contract**: Current deployed address `0x12493750A7fbD31A1ae920e49Ef8D578Ef741e29` on Sepolia, owner wallet `0x275d4F74BdEAdF8232a386755571D41C7A4a7958`
- **ipfsHash field**: repurposed to store blockchain status ("confirmed", "local_only", "failed")
- **Both create and update paths** register diplomas on-chain when status is "issued"

## Key Pages
- `/admin` — Registrar dashboard with charts (graduates per year, per program, per sex, per program+sex) and summary cards
- `/admin/students` — Dedicated student directory with data table, profile/diploma view, export to PDF/Excel, create new student accounts
- `/admin/diplomas` — Diploma records with create/approve/issue actions and "View Diploma" showing full diploma card with QR code
- `/student` — Student dashboard (view own diplomas, status tracker)
- `/profile` — Profile page for both admin and student (personal info + sex editable; academic details read-only for students)
- `/about` — About page with campus info, system features, and role descriptions
- `/verify/:certificateId` — Public verification page with blockchain status + QR code
- `/auth` — Login page

## Database Schema
- **users**: id, username, password, role (admin|student), firstName, lastName, email, studentId, address, program, sex, latinHonor, graduationYear, isApproved (boolean), createdAt
- **diplomas**: id, studentId (FK users.id), course, issueDate, grade, status (pending_clearance|cleared|issued), txHash (Ethereum tx hash or local SHA256), ipfsHash (blockchain status), certificateId, createdAt

## Student Registration & Approval
- Students register using their CvSU email (@cvsu.edu.ph suffix required). The email is stored as both username and email.
- Login supports both email and username. Students can set a custom username in their profile page.
- Newly registered students have `isApproved = false` and require admin approval before diplomas can be created for them.
- Admin-created students are auto-approved.
- Only approved students appear in the diploma creation student dropdown.

## Available Courses (Diploma Creation)
- Bachelor of Science in Psychology (BSP)
- Bachelor of Science in Business Administration (BSBA)
- Bachelor of Science in Information Technology (BSIT)
- Bachelor of Science in Hospitality Management (BSHM)

## Seed Credentials
- Admin: `admin` / `admin123`
- Student: `student` / `student123`

## Workflow
- `npm run dev` — starts Express + Vite dev server on port 5000
