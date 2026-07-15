# 🛡️ AegisCert

AegisCert is an Enterprise Digital Trust Platform designed to secure the complete lifecycle of academic credentials—from **issuance** and **storage** to **verification** and **long-term authenticity**.

The platform integrates **Blockchain**, **Enterprise Security**, **Artificial Intelligence**, and **Biometric Authentication** to create a trusted environment for degree management.

---

## 🏗️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Environment Configuration
Copy the configuration template to create your local variables:
```bash
cp .env.example .env
```
Fill in the details:
- **`VITE_SUPABASE_URL`** & **`VITE_SUPABASE_ANON_KEY`**: Set these to connect to the production PostgreSQL layer.
- **`JWT_SECRET`**: Secure signing key for backend authorization tokens (Express).

---

## 🚀 Running the Application

### 1. Installation
Install project dependencies for both the frontend client and the Express backend:
```bash
npm install
```

### 2. Local Development Mode
Runs the concurrent Vite frontend server (port 5173) and Express SQLite backend gateway (port 5000):
```bash
npm run dev
```

### 3. Production Deployment Build
Compile TypeScript code and assemble optimized production assets:
```bash
npm run build
```

---

## 🧪 Testing and Linting

We use **Vitest** for unit testing core cryptographic services, and **ESLint** for code quality checks.

- **Run Unit Tests**:
  ```bash
  npm run test
  ```
- **Run Linting Rules**:
  ```bash
  npm run lint
  ```

---

## 🔒 Security Specifications

Refer to [ARCHITECTURE.md](file:///d:/Certificate_verification/ARCHITECTURE.md) for full descriptions of:
- AES-GCM at-rest database cache encryption.
- Multi-factor MPIN & biometric anchoring protocols.
- Server-side brute force lockout policies.
- Decoy honeytoken alert traps.
