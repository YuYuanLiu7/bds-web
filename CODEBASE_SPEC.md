# BDS (By Doing So) Codebase Technical Specification & Architecture Document

This document provides a highly detailed technical specification of the BDS Next.js-based learning platform. It serves as a comprehensive reference guide for developers, AI assistants, and automated CLIs (like `claude-cli`) to understand the architecture, database structure, authentication flow, payment integrations, visual settings mechanism, and email notifications.

---

## 1. Project Overview & Objectives
* **Goal**: Migrating the BDS learning platform from Teachify to a self-hosted, custom Next.js application.
* **Core Value**: Drastically reduce annual maintenance costs from **NT$ 50,000/year** to **less than NT$ 1,000/year** by utilizing free/low-cost serverless tools (Vercel Hobby Plan, Supabase Free Tier, and Resend Free Tier).
* **Architecture**: Next.js 15+ (App Router) + TypeScript + PostgreSQL (Supabase) + PayUni Payment Gateway + NextAuth.js + Tailwind CSS.

---

## 2. Directory Structure Map

```text
/
├── db/                                # SQL migration and table setup files
│   ├── schema.sql                     # Core schema definition
│   ├── initialize_site_settings.sql   # site_settings initialization & defaults
│   ├── create_membership_tables.sql   # Membership-related schema setup
│   └── add_course_custom_settings.sql # Course detail configuration updates
├── src/
│   ├── app/                           # Next.js App Router root
│   │   ├── admin/                     # Administrative panel routes
│   │   │   ├── comments/              # Comment moderation pages (local storage synced)
│   │   │   ├── courses/               # Course management routes
│   │   │   ├── finance/               # Financial order reports
│   │   │   ├── membership/            # Membership plan creators
│   │   │   ├── rewards/               # Referral commissions configuration (Fixed 5%)
│   │   │   ├── settings/              # Settings panel
│   │   │   └── page.tsx               # Admin dashboard entry
│   │   ├── api/                       # REST API Endpoints
│   │   │   ├── auth/                  # Credentials registration & authentication
│   │   │   │   ├── [...nextauth]/     # NextAuth configurations (GET/POST handlers)
│   │   │   │   └── signup/            # User registration endpoint
│   │   │   ├── checkout/              # PayUni Integration Endpoints
│   │   │   │   ├── callback/          # PayUni payment verification & access grants
│   │   │   │   └── simulate/          # Local sandbox one-click test subscription
│   │   │   │   └── route.ts           # Checkout encryption & parameters provider
│   │   │   └── admin/                 # Admin operations APIs
│   │   │       └── site-settings/     # Visual config editor API
│   │   ├── courses/                   # Student-facing course detail & player pages
│   │   │   ├── [id]/
│   │   │   │   ├── learn/
│   │   │   │   │   ├── [chapterId]/   # Chapter video player & comment board page
│   │   │   │   │   └── page.tsx       # Auto-redirects to first chapter of course
│   │   │   │   └── page.tsx           # Course landing page & Buy button
│   │   │   └── page.tsx               # Course list catalogue
│   │   ├── login/                     # NextAuth login interface
│   │   ├── signup/                    # User registration interface
│   │   ├── page.tsx                   # Landing page (Renders HomeClient server-side)
│   │   ├── layout.tsx                 # Root layout injecting providers and fonts
│   │   └── globals.css                # Global CSS setup
│   ├── components/                    # Reusable React components
│   │   ├── BuyButton.tsx              # Form submission handler to PayUni UPP gateway
│   │   ├── HomeClient.tsx             # Interactive, premium client landing page
│   │   ├── LearnExtraDetails.tsx      # Sidebar player tabs (Attachments, local storage Q&A)
│   │   ├── MembershipList.tsx         # Membership plans list supporting real & simulated payments
│   │   ├── Navbar.tsx                 # Navigation bar with dynamic user status
│   │   ├── VideoPlayer.tsx            # Multi-format player (Bunny.net, Vimeo, YouTube, HTML5 MP4)
│   │   └── Providers.tsx              # NextAuth and context wrappers
│   ├── lib/                           # Shared utility libraries
│   │   ├── courses.ts                 # Database course fetchers & access validators
│   │   ├── email.ts                   # Resend REST API client for transactional mails
│   │   ├── payuni.ts                  # Cryptographic helper for PayUni encryption & decryption
│   │   ├── site-settings.ts           # Site configuration read/write (Supabase & JSON fallback)
│   │   ├── supabase.ts                # Supabase client instantiation
│   │   ├── types.ts                   # Core TypeScript interfaces
│   │   └── users.ts                   # User helper functions
└── package.json                       # Dependencies & build scripts
```

---

## 3. Database Schema (`PostgreSQL`)

The database is built on PostgreSQL (typically hosted on Supabase). Below are the table specifications and fields:

### `users` (User Authentication and Profiles)
* **`id`** (`UUID`, Primary Key, Defaults to `uuid_generate_v4()`): Unique identifier of the user.
* **`email`** (`TEXT`, Unique, Not Null): User email address.
* **`name`** (`TEXT`): Profile display name.
* **`password_hash`** (`TEXT`): Bcrypt password hash.
* **`role`** (`TEXT`, Defaults to `'user'`): User permissions level (`'admin'` or `'user'`).
* **`membership_plan_id`** (`UUID`, Foreign Key pointing to `membership_plans.id`, Nullable): Current active membership plan.
* **`membership_expires_at`** (`TIMESTAMP WITH TIME ZONE`, Nullable): Membership subscription expiration timestamp.
* **`created_at`** (`TIMESTAMP WITH TIME ZONE`, Defaults to `NOW()`): Timestamp of registration.

### `courses` (Course Metadata)
* **`id`** (`UUID`, Primary Key, Defaults to `uuid_generate_v4()`): Unique identifier of the course.
* **`title`** (`TEXT`, Not Null): Title of the course.
* **`description`** (`TEXT`): Detailed HTML or text course description.
* **`thumbnail_url`** (`TEXT`): Thumbnail image URL.
* **`price`** (`INTEGER`, Not Null): Price in New Taiwan Dollars (TWD).
* **`category`** (`TEXT`): Category tag.
* **`is_published`** (`BOOLEAN`, Defaults to `FALSE`): Control flag for frontend visibility.
* **`is_hidden`** (`BOOLEAN`, Defaults to `FALSE`): Hidden from course list catalog if true.
* **`allow_comments`** (`BOOLEAN`, Defaults to `TRUE`): Enables comment thread in the player.
* **`allow_ratings`** (`BOOLEAN`, Defaults to `TRUE`): Enables student ratings.
* **`file_url`** (`TEXT`, Nullable): Course-wide shared attachment file URL.
* **`video_url`** (`TEXT`, Nullable): Course promotional trailer video URL.
* **`created_at`** (`TIMESTAMP WITH TIME ZONE`, Defaults to `NOW()`): Creation timestamp.

### `chapters` (Lessons / Course Sections)
* **`id`** (`UUID`, Primary Key, Defaults to `uuid_generate_v4()`): Unique lesson identifier.
* **`course_id`** (`UUID`, Foreign Key pointing to `courses.id`, Cascades on Delete): Links lesson to course.
* **`title`** (`TEXT`, Not Null): Chapter/Lesson title.
* **`video_url`** (`TEXT`): Direct video file URL, Bunny.net Stream link, YouTube, or Vimeo URL.
* **`file_url`** (`TEXT`, Nullable): Lesson-specific downloadable attachment.
* **`order_index`** (`INTEGER`, Not Null): Ordering sequence value for listing lessons.
* **`created_at`** (`TIMESTAMP WITH TIME ZONE`, Defaults to `NOW()`): Creation timestamp.

### `orders` (Transactions)
* **`id`** (`TEXT`, Primary Key): Represents the unique `MerTradeNo` generated for the payment transaction.
* **`user_id`** (`UUID`, Foreign Key pointing to `users.id`): Purchasing user.
* **`course_id`** (`UUID`, Foreign Key pointing to `courses.id`, Nullable): Purchased course (if applicable).
* **`membership_plan_id`** (`UUID`, Foreign Key pointing to `membership_plans.id`, Nullable): Purchased membership subscription (if applicable).
* **`amount`** (`INTEGER`, Not Null): Paid amount in TWD.
* **`status`** (`TEXT`, Defaults to `'pending'`): Status flag (`'pending'`, `'paid'`, `'failed'`).
* **`payment_type`** (`TEXT`): Payment method returned by gateway (e.g., Credit Card, SIMULATED_TEST).
* **`created_at`** (`TIMESTAMP WITH TIME ZONE`, Defaults to `NOW()`).
* **`updated_at`** (`TIMESTAMP WITH TIME ZONE`, Defaults to `NOW()`).

### `user_courses` (Purchased Course Access Permissions)
* **`user_id`** (`UUID`, Foreign Key pointing to `users.id`, Cascades on Delete)
* **`course_id`** (`UUID`, Foreign Key pointing to `courses.id`, Cascades on Delete)
* **`purchased_at`** (`TIMESTAMP WITH TIME ZONE`, Defaults to `NOW()`)
* **Primary Key**: `(user_id, course_id)`

### `site_settings` (Dynamic Visual Layout & Settings)
* **`key`** (`TEXT`, Primary Key): Identifier key (typically `'homepage'`).
* **`value`** (`JSONB`, Not Null): Visual styles schema containing slogan, logo URL, carousel slides, section images, and main brand color.
* **`updated_at`** (`TIMESTAMP WITH TIME ZONE`, Defaults to `NOW()`).

### `events` (Offline & Online Webinars)
* **`id`** (`UUID`, Primary Key, Defaults to `uuid_generate_v4()`)
* **`title`** (`TEXT`, Not Null)
* **`description`** (`TEXT`)
* **`image_url`** (`TEXT`)
* **`price`** (`INTEGER`, Not Null)
* **`price_display`** (`TEXT`)
* **`date`** (`TIMESTAMP WITH TIME ZONE`, Not Null)
* **`location`** (`TEXT`)
* **`attendees`** (`INTEGER`, Defaults to `0`)
* **`status`** (`TEXT`, Defaults to `'upcoming'`)
* **`type`** (`TEXT`, Not Null)
* **`category`** (`TEXT`, Not Null)
* **`registration_url`** (`TEXT`)
* **`created_at`** (`TIMESTAMP WITH TIME ZONE`, Defaults to `NOW()`)

### `articles` (Blog & Knowledge Base Articles)
* **`id`** (`UUID`, Primary Key)
* **`title`** (`TEXT`, Not Null)
* **`author`** (`TEXT`, Defaults to `'BDS 編輯部'`)
* **`date`** (`TIMESTAMP WITH TIME ZONE`, Defaults to `NOW()`)
* **`views`** (`INTEGER`, Defaults to `0`)
* **`category`** (`TEXT`, Not Null)
* **`summary`** (`TEXT`)
* **`content`** (`TEXT`)
* **`image_url`** (`TEXT`)
* **`status`** (`TEXT`, Defaults to `'published'`)
* **`slug`** (`TEXT`, Unique)
* **`tags`** (`TEXT`)
* **`seo_title`** (`TEXT`)
* **`seo_description`** (`TEXT`)
* **`is_pinned`** (`BOOLEAN`, Defaults to `FALSE`)
* **`visibility`** (`TEXT`, Defaults to `'public'`)
* **`required_course_ids`** (`TEXT`): Restricts article access to students owning specific courses.

---

## 4. Authentication & Security Architecture

### Authentication Provider (NextAuth.js)
Implemented in `src/app/api/auth/[...nextauth]/route.ts`, utilizing a server-side JSON Web Token (`JWT`) strategy.
* **Provider**: Credentials Provider verifying email and password.
* **Password Hashing**: Bcrypt (`bcryptjs` at 12 rounds) hashes passwords during user registration (`/api/auth/signup/route.ts`).
* **Session Claims Extension**:
  JWT tokens and sessions are expanded to store user role (`admin` or `user`) and their database user ID, avoiding redundant database lookups on client-side renders:
  ```typescript
  async jwt({ token, user }) {
    if (user) {
      token.role = (user as any).role;
      token.id = (user as any).id;
    }
    return token;
  }
  async session({ session, token }) {
    if (session.user) {
      (session.user as any).role = token.role;
      (session.user as any).id = token.id;
    }
    return session;
  }
  ```

---

## 5. PayUni Payment Integration Flow

PayUni is the designated payment gateway. The implementation bypasses external plugins for a serverless native integration via AES-256-GCM encryption.

### Dynamic Encryption Utility (`src/lib/payuni.ts`)
PayUni requires payload parameters to be serialized in JSON, encrypted using AES-256-GCM, and accompanied by a cryptographic SHA-256 signature hash of `HashKey + EncryptInfo + HashIV`.

```typescript
export class PayuniTool {
  private hashKey: string;
  private hashIV: string;
  private algorithm = 'aes-256-gcm';

  encrypt(params: Record<string, any>): string {
    const plainText = JSON.stringify(params);
    const cipher = crypto.createCipheriv(this.algorithm, this.hashKey, this.hashIV) as any;
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return (encrypted + authTag).toUpperCase(); // Appends 32-char Hex tag
  }

  decrypt(encryptInfo: string): Record<string, any> {
    const tagLength = 32;
    const encryptedData = encryptInfo.slice(0, -tagLength);
    const authTag = encryptInfo.slice(-tagLength);
    const decipher = crypto.createDecipheriv(this.algorithm, this.hashKey, this.hashIV) as any;
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  generateHash(encryptInfo: string): string {
    const checkString = this.hashKey + encryptInfo + this.hashIV;
    return crypto.createHash('sha256').update(checkString).digest('hex').toUpperCase();
  }
}
```

### Checkout Session Creation API (`src/app/api/checkout/route.ts`)
When a user clicks "Buy" (handled by `BuyButton.tsx` or `MembershipList.tsx`):
1. **Authorize**: Retrieves session from NextAuth to guarantee authentication.
2. **Order Code**: Generates trade order code `merTradeNo` formatted as `BDS{Date.now()}`.
3. **Database Pre-insert**: Instantiates a row in `orders` with `status: 'pending'` and maps target item.
4. **Encrypt Payload**: Constructs PayUni params: `MerID`, `MerTradeNo`, `TradeAmt`, `Timestamp`, `ProdDesc`, `ReturnURL`, `NotifyURL`, `Version: '2.0'`. Encrypts payload and calculates signature hash.
5. **JSON Return**: Returns `MerID`, `Version`, `EncryptInfo`, and `HashInfo` to client-side.
6. **Form Posting**: The client creates a hidden HTML `<form>` targeting PayUni UPP gateway (`https://sandbox-api.payuni.com.tw/api/upp` in testing, or production endpoint) and submits it automatically.

### Callback Verification API (`src/app/api/checkout/callback/route.ts`)
Triggered asynchronously by PayUni servers when transaction statuses change:
1. **Signature Integrity Check**: Re-computes SHA-256 hash of incoming `EncryptInfo` using secret keys. Aborts if it mismatches `HashInfo`.
2. **Payload Decryption**: Decrypts transaction details to fetch `MerTradeNo`, `Status` (success/failed), and `PaymentType`.
3. **Access Provisioning**:
   * If `decodedData.Status === 'SUCCESS'`:
     * Updates `orders` status to `'paid'`.
     * **Course Purchases**: Upserts user ID and course ID into the `user_courses` table.
     * **Membership Subscriptions**: Queries billing frequency from `membership_plans`. Adds subscription expiration dates (e.g., `NOW + 1 Month` for 月繳, `NOW + 1 Year` for 年繳, `null` for Lifetime) and updates user profiles in the `users` table.
     * **Email Trigger**: Sends transactional success receipt email to user.
   * If failed, updates `orders` to `'failed'`.

### One-Click Sandbox Simulation (`src/app/api/checkout/simulate/route.ts`)
Provides developers and students with a zero-cost subscription workflow bypass:
* Accepts `planId`, `planName`, `price`, `period`.
* Generates simulated order `BDS_SIM_{Date.now()}` with status `'paid'`.
* Automatically computes expiry, saves record, grants user access in database, and fires success email.

---

## 6. Video Player & Learning System Architecture

The core player is implemented in `src/app/courses/[id]/learn/[chapterId]/page.tsx`.

### Permission Validation
Prior to loading the learning interface, the server component evaluates:
1. **Session Login Status**: Redirects anonymous users to `/login`.
2. **Role Bypass**: Allows users with role `'admin'` access without payment check.
3. **Course Access Verification**: Validates whether the user's ID exists in `user_courses` for the given `course_id`.

### Multi-Format Video Player (`src/components/VideoPlayer.tsx`)
Resolves URLs dynamically on the client side:
* **HTML5 Native Video**: Validates if file ends with standard video extensions (`.mp4`, `.webm`, `.ogg`, `.mov`, `.m4v`) or `blob:`. Renders native HTML5 `<video controls>`.
* **YouTube**: Transforms standard links into `/embed/` structures.
* **Vimeo**: Extracts Vimeo video IDs and formats player to `player.vimeo.com/video/`.
* **Bunny.net Stream**: Matches iframe content deliveries and directly inserts embeds.

### Client-Side Comments Sync System
* **Context**: Interactive comment boards are enabled if `courses.allow_comments` is true.
* **Storage**: In place of DB writes to reduce bandwidth billing, comments are written to browser `localStorage` key `bds_course_comments`.
* **Real-time Syncing**: Syncs dynamically across multiple open tabs or windows using the native `storage` DOM event. Comments created by the user show with a `pending` tag, while other users' comments display only when set to `approved` status.

---

## 7. Dynamic Visual Settings Manager

Enables admins to dynamically customize brand assets.

### Schema
The configuration values in the JSON structure are:
* `primaryColor`: HEX brand color code.
* `logoUrl`: Header branding logo.
* `slogan`: Landing sub-headline slogan text.
* `carouselSlides`: Array of slide URLs and paths: `[{ id, imageUrl, link }]`.
* `sectionImage1` / `sectionImage2`: Promotional images.

### Dual-Fallback Write System (`src/lib/site-settings.ts`)
* **Reads**: The server component tries fetching config from Supabase database key `homepage`. If connection fails or tables are missing, it defaults to the local copy `src/lib/site-settings.json`.
* **Writes**: Updates write to the database and also overwrite `src/lib/site-settings.json` locally, serving as a dual persistent backup that remains available if DB credentials are reset.

---

## 8. Resend Email Dispatch System (`src/lib/email.ts`)

BDS integrates the Resend transactional email API using native JS `fetch` to keep project dependencies light and fast.

* **API Endpoint**: `https://api.resend.com/emails` (POST with Bearer token authentication).
* **Mock Fallback**: If `RESEND_API_KEY` is not present in `.env.local`, the utility logs receipt emails into the console.
* **Sandbox Mode**: Resend free domains only permit sending emails to the account owner. The system overrides destination email fields and redirects sandbox emails to the verified `RESEND_TEST_RECIPIENT` email address for safe sandbox validation.

---

## 9. Environment Configuration Reference

The following environment variables must be defined in `.env.local` to enable full platform functionality:

```bash
# General
NEXTAUTH_URL=http://localhost:3000          # Base URL of NextAuth.js
NEXTAUTH_SECRET=base64_secret_key           # Session encryption key

# Database (Supabase PostgreSQL Connection)
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXT_PUBLIC_SUPABASE_URL=https://url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...

# PayUni Integration Key sets
PAYUNI_MERID=MS12345678                    # MerID assigned by PayUni
PAYUNI_HASH_KEY=your_hash_key              # HashKey assigned by PayUni
PAYUNI_HASH_IV=your_hash_iv                # HashIV assigned by PayUni

# Resend Mail Dispatcher
RESEND_API_KEY=re_your_api_key             # API Authorization key
RESEND_FROM_EMAIL=no-reply@bydoingso.com   # Sender email address
RESEND_TEST_RECIPIENT=your-email@gmail.com # Sandbox recipient override address
```

---

## 10. Production Checklist

1. **PayUni Production Switch**:
   * Switch the variables `PAYUNI_MERID`, `PAYUNI_HASH_KEY`, and `PAYUNI_HASH_IV` to real production credential sets.
   * Modify the submission form action in `src/components/BuyButton.tsx` and `src/components/MembershipList.tsx` from:
     `https://sandbox-api.payuni.com.tw/api/upp`
     to:
     `https://api.payuni.com.tw/api/upp`
2. **Resend Sender domain**:
   * Set up and verify domain DNS records in Resend dashboard.
   * Replace `RESEND_FROM_EMAIL` to use your custom verified domain (e.g., `no-reply@bydoingso.com`) and remove `RESEND_TEST_RECIPIENT` to ensure letters are sent to actual customers.
3. **Database connection pooling**:
   * Configure Supabase Connection Pooler (`port 6543`) inside `DATABASE_URL` in production to prevent exhausting database connections during high-traffic checkout callback bursts.
