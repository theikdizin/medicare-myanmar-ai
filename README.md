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
| Auth | Manus OAuth |
| Storage | S3 (PDF uploads) |
| Testing | Vitest |

## Prerequisites

- Node.js 22+ 
- pnpm 10+
- Manus API credentials (provided automatically in Manus environment)

## Project Structure

```
medicare-myanmar-ai/
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── Home.tsx     # Landing page
│   │   │   ├── Chat.tsx     # Main chat interface
│   │   │   ├── AdminDashboard.tsx  # Admin overview
│   │   │   ├── AdminUsers.tsx      # User management
│   │   │   ├── AdminDocuments.tsx  # Document management
│   │   │   ├── AdminSessions.tsx   # Chat sessions view
│   │   │   └── PasswordReset.tsx   # Password reset
│   │   ├── components/      # Reusable UI components
│   │   └── lib/trpc.ts      # tRPC client
├── server/                  # Express backend
│   ├── routers.ts           # tRPC procedures
│   ├── db.ts                # Database helpers
│   ├── storage.ts           # S3 storage helpers
│   └── _core/               # Framework internals
├── drizzle/                 # Database schema & migrations
│   └── schema.ts            # Table definitions
├── shared/                  # Shared types & constants
└── vitest.config.ts         # Test configuration
```

## Getting Started

### Development

1. Clone the repository:
```bash
git clone https://github.com/theikdizin/medicare-myanmar-ai.git
cd medicare-myanmar-ai
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Run tests:
```bash
pnpm test
```

5. Type check:
```bash
pnpm check
```

### Running in VSCode

1. Open the project folder in VSCode
2. Open integrated terminal (Ctrl+`)
3. Run `pnpm install` to install dependencies
4. Run `pnpm dev` to start the development server
5. The app will be available at `http://localhost:3000`

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run vitest tests |
| `pnpm check` | TypeScript type check |
| `pnpm format` | Format code with Prettier |

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with role (admin/user) |
| `chat_sessions` | Chat conversation sessions |
| `chat_messages` | Individual messages in sessions |
| `documents` | Uploaded PDF/document metadata |
| `document_chunks` | RAG text chunks from documents |
| `password_reset_tokens` | Password reset tokens |

## Architecture

### RAG Pipeline

```
User Query → Language Detection → RAG Search → LLM Context → AI Response
                ↓                    ↓            ↓           ↓
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

## License

MIT

## Credits

Built with LangChain, Groq API, and the Manus platform.
