# Auditly - Full-Stack Website Auditing Platform

Auditly is a web application that allows users to enter a website URL and receive a comprehensive audit report. This report includes Lighthouse performance scores, SEO checks, security header analysis, and more. Users can manage their scans, view past reports, and generate branded PDF summaries.

This project was built as a working MVP and demonstrates a modern full-stack architecture using Next.js and Supabase.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TailwindCSS
- **Backend/API:** Next.js API Routes
- **Database, Auth, Storage:** Supabase (Postgres, Auth, Storage)
- **Worker:** Node.js, Playwright, and Lighthouse for background jobs.
- **Deployment:** The app is designed to be deployed on Vercel (frontend + API) and the worker on a service like Railway.

## Features

- **User Authentication:** Secure login and signup functionality using Supabase Auth.
- **Website Scanning:** Asynchronous scanning jobs that run in the background.
- **Comprehensive Audits:**
  - Lighthouse performance, SEO, accessibility, and best practices scores.
  - Security header validation (CSP, HSTS, etc.).
  - Basic SEO checks (title, meta description, H1 tags).
  - Technology stack detection.
  - Broken link checker for the scanned page.
- **Dashboard:** A central place for users to view their scan history.
- **PDF Reports:** On-demand generation of PDF reports for each scan.

## Project Structure

- `/src`: The main Next.js application, including pages, API routes, and components.
- `/worker`: A separate Node.js application for the background worker that processes scan jobs.
- `/supabase`: Contains the database migration scripts.

## Getting Started

Follow these instructions to set up and run the project locally.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) account

### 2. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 3. Install Dependencies

Install the dependencies for both the main app and the worker.

```bash
npm install
```

### 4. Set Up Supabase

1.  **Create a new Supabase project.**
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Copy the entire content of `supabase/migrations/20250908020915_initial_schema.sql` and run it to set up your database tables and policies.
4.  In your Supabase project, go to **Storage** and create a new public bucket named `reports`. This is where the PDF reports will be stored.

### 5. Configure Environment Variables

1.  Create a `.env.local` file in the root of the project by copying the example file:
    ```bash
    cp .env.local.example .env.local
    ```
2.  Fill in the required values in `.env.local`:
    - `NEXT_PUBLIC_SUPABASE_URL`: Found in your Supabase project's **Settings > API**.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The `anon` key, also found in **Settings > API**.
    - `SUPABASE_SERVICE_ROLE_KEY`: The `service_role` key, also found in **Settings > API**.
    - `RESEND_API_KEY`: (Optional for now) Your API key from [Resend](https://resend.com/) if you plan to implement email features.

### 6. Run the Application

You need to run two processes in separate terminals: the Next.js app and the worker.

**Terminal 1: Run the Next.js Frontend**

```bash
npm run dev
```
Your app should now be running at [http://localhost:3000](http://localhost:3000).

**Terminal 2: Run the Worker**

The worker will automatically load the environment variables from the `.env.local` file in the project root.

```bash
cd worker
npm start
```
*Note: The `start` script uses `ts-node` to run the TypeScript file directly. `ts-node` is included as a dev dependency in the root `package.json`.*

The worker will now be running and will start polling for `pending` jobs in your database every 10 seconds.

### How to Use

1.  Open your browser to `http://localhost:3000`.
2.  Sign up for a new account.
3.  You will be redirected to the dashboard.
4.  Click "New Scan" and enter a valid URL (e.g., `https://www.vercel.com`).
5.  After submitting, you'll be redirected back to the dashboard. The scan will appear as `pending`.
6.  The worker will pick up the job, change the status to `running`, and then `done` once finished.
7.  Once the status is `done`, a "View Report" link will appear, allowing you to view the generated PDF.
