# HireSphere Monorepo

**HireSphere** is a modern, all-in-one hiring platform connecting companies with top talent.  
This monorepo uses [Turborepo](https://turborepo.dev/) to manage multiple apps and shared packages, enabling rapid development and consistent tooling.

---

## Table of Contents

- [About](#about)  
- [Monorepo Structure](#monorepo-structure)  
- [Getting Started](#getting-started)  
- [Running Apps](#running-apps)  
- [Building](#building)  
- [Remote Caching](#remote-caching)  
- [Contributing](#contributing)  
- [License](#license)  

---

## About

HireSphere is a **premium SaaS platform** for:

- Job posting and applicant tracking  
- Messaging and interview management  
- Coding tests and assessments  
- End-to-end hiring workflows  

The platform combines **all recruitment tools in one app** — no external emails, scheduling apps, or assessment tools required.

---

## Monorepo Structure

This Turborepo includes the following **apps** and **packages**:

### Apps

- `web` – The main [Next.js](https://nextjs.org/) app for candidates and companies  
- `docs` – Documentation site built with [Next.js](https://nextjs.org/)  

### Packages

- `@hireSphere/ui` – Shared React components library  
- `@hireSphere/eslint-config` – ESLint configuration with `eslint-config-next` & `prettier`  
- `@hireSphere/ts-config` – TypeScript configuration used across all apps  

---

## Getting Started

Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd hireSphere-monorepo
pnpm install

Running Apps
Develop All Apps
pnpm turbo dev
Develop a Specific App
pnpm turbo dev --filter=web
Build All Apps
pnpm turbo build
Build a Specific App
pnpm turbo build --filter=web

🔹 You can also use npx turbo or yarn dlx turbo if turbo is not installed globally.

Remote Caching

Turborepo supports remote caching to speed up builds and share cache artifacts between team members and CI/CD pipelines.

Login to Vercel:

pnpm turbo login

Link your repository to enable Remote Cache:

pnpm turbo link

Remote caching is optional but highly recommended for larger teams.

Contributing

We welcome contributions!

Follow commit conventions for clarity

Run pnpm turbo lint before submitting PRs

Ensure TypeScript checks pass with pnpm turbo typecheck

Useful Commands
Command	Description
pnpm turbo dev	Run all apps in development mode
pnpm turbo dev --filter=web	Run a single app
pnpm turbo build	Build all apps and packages
pnpm turbo build --filter=web	Build a single app
pnpm turbo lint	Run ESLint across all packages
pnpm turbo typecheck	Run TypeScript type checking
License

This repository is MIT licensed.