# Medicare Myanmar AI Chat Bot

A medical AI chat assistant web application with Myanmar language support, powered by RAG pipeline and LLM integration. Features role-based access control for admin and regular users.

## Features

- **AI-Powered Medical Chat** - Intelligent medical assistant using LangChain and Groq API
- **Myanmar Language Support** - Full Myanmar (Burmese) language input/output with auto-translation
- **Bidirectional Translation** - Automatic Myanmar-to-English and English-to-Myanmar translation
- **RAG Pipeline** - Retrieval-Augmented Generation for context-aware medical Q&A
- **PDF Document Upload** - Upload and process medical documents for knowledge base
- **Role-Based Access** - Separate admin and user dashboards with RBAC
- **Admin Dashboard** - User management, chat history, and system statistics
- **Chat History** - Persistent conversation history per user
- **Password Reset** - Token-based password reset functionality
- **Manus-Inspired UI** - Clean dark theme with sidebar navigation and animated chat bubbles

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Express, tRPC, Drizzle ORM |
| Database | MySQL (TiDB) |
| AI/ML | LangChain, Groq API (LLM) |
| Auth | OAuth 2.0 |
| Storage | S3 (PDF uploads) |
| Testing | Vitest |

## Prerequisites

Before running locally, you need:

- Node.js 22+ and pnpm 10+
- A MySQL/TiDB database (or TiDB Cloud free tier)
- Groq API Key (free at https://console.groq.com)
- An S3-compatible storage (or AWS S3)
- (Optional) An OAuth provider for authentication

## Local Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/theikdizin/medicare-myanmar-ai.git
cd medicare-myanmar-ai
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Database (MySQL/TiDB connection string)
DATABASE_URL=mysql://user:password@host:3306/medicare_db

# JWT Secret (generate a random string)
JWT_SECRET=your-secret-key-here

# Groq API Key (required for AI chat)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# S3 Storage (AWS S3 or compatible)
S3_BUCKET=your-bucket-name
S3_REGION=ap-southeast-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_ENDPOINT=https://your-s3-endpoint.com

# OAuth (optional - use Manus OAuth or your own)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=your-open-id
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
```

### Step 4: Set Up the Database

**Option A: TiDB Cloud (Recommended - Free)**

1. Go to https://tidbcloud.com and create a free cluster
2. Copy the connection string from TiDB Cloud console
3. Paste it into `DATABASE_URL` in `.env`

**Option B: Local MySQL**

1. Install MySQL locally
2. Create a database:
```bash
mysql -u root -p
CREATE DATABASE medicare_db;
```
3. Set `DATABASE_URL=mysql://root:password@localhost:3306/medicare_db`

**Option C: PlanetScale (Free)**

1. Go to https://planetscale.com and create a free database
2. Copy the connection string and paste into `DATABASE_URL`

### Step 5: Apply Database Migrations

```bash
# Generate migration SQL from schema
pnpm drizzle-kit generate

# Apply migrations to your database
# You can use the generated SQL files in drizzle/migrations/
```

### Step 6: Configure Groq API

1. Sign up at https://console.groq.com (free tier available)
2. Create an API key
3. Add it to your `.env` file:
```env
GROQ_API_KEY=gsk_your_key_here
```

### Step 7: Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Running in VSCode

1. Open the project folder in VSCode: `code .`
2. Open integrated terminal (`Ctrl + ~`)
3. Run `pnpm install`
4. Run `pnpm dev`
5. The app opens at `http://localhost:3000`

### VSCode Extensions Recommended

- **ES7+ React/Redux/React-Native snippets** - React snippets
- **Tailwind CSS IntelliSense** - Tailwind class autocomplete
- **Prisma** - Schema highlighting
- **Vitest** - Test runner integration

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with role (admin/user) |
| `user_profiles` | Personal and medical profile data |
| `chat_sessions` | Chat conversation sessions |
| `chat_messages` | Individual messages in sessions |
| `documents` | Uploaded PDF/document metadata |
| `document_chunks` | RAG text chunks from documents |
| `password_reset_tokens` | Password reset tokens |

## Architecture

### RAG Pipeline

```
User Query -> Language Detection -> RAG Search -> LLM Context -> AI Response
                |                    |            |           |
         Myanmar/English      Document     System      Response
         Translation          Chunks       Prompt      in Same
                                                Language
```

### Language Detection

The system automatically detects whether the user is typing in Myanmar or English:
- Myanmar characters (Unicode range \u1000-\u109F) are detected
- Mixed language queries are handled intelligently
- Auto-translate triggers when language switches mid-conversation

### Role-Based Access Control

- **Users** (`role: user`): Access to chat interface, document upload, and personal chat history
- **Admins** (`role: admin`): Full access including user management, all chat sessions, and system statistics

## API Endpoints (tRPC Procedures)

### Chat
- `chat.listSessions` - List user's chat sessions
- `chat.getMessages` - Get messages for a session
- `chat.createSession` - Create new chat session
- `chat.sendMessage` - Send message and get AI response
- `chat.deleteSession` - Delete a chat session

### Documents
- `documents.list` - List uploaded documents
- `documents.upload` - Upload a PDF/document
- `documents.delete` - Delete a document

### Profile
- `profile.get` - Get current user's profile
- `profile.update` - Update user profile (personal info + medical records)

### Admin
- `admin.getUsers` - List all users
- `admin.getStats` - Get system statistics
- `admin.updateRole` - Update user role
- `admin.getAllSessions` - List all chat sessions
- `admin.getAllDocuments` - List all documents

### Auth
- `auth.me` - Get current user info
- `auth.logout` - Logout

### Password Reset
- `passwordReset.requestReset` - Generate reset token
- `passwordReset.verifyToken` - Verify reset token

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run vitest tests |
| `pnpm check` | TypeScript type check |
| `pnpm format` | Format code with Prettier |

## Troubleshooting

### Common Issues

**"DATABASE_URL not set" error:**
- Make sure you created a `.env` file with the correct `DATABASE_URL`
- Verify your database is accessible from your machine

**"GROQ_API_KEY not set" error:**
- Add your Groq API key to `.env`
- Get a free key at https://console.groq.com

**"ECONNREFUSED" or database connection error:**
- Check if your database server is running
- Verify the connection string format
- If using TiDB Cloud, check SSL/TLS settings

**"Module not found" after pnpm install:**
- Delete `node_modules` and `pnpm-lock.yaml`, then run `pnpm install` again
- Make sure pnpm version is 10+

## License

MIT

## Credits

Built with LangChain, Groq API, React, and TypeScript.
