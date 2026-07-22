# Medicare Myanmar AI Chat Bot - TODO

## Database Schema
- [x] Create chat_sessions table
- [x] Create chat_messages table
- [x] Create documents table (PDF uploads)
- [x] Create document_chunks table (RAG chunks)
- [x] Create password_reset_tokens table

## Backend - Chat & LLM
- [x] Create chat completion procedure with LLM
- [x] Implement Myanmar language system prompt
- [x] Add language detection (Myanmar/English/mixed)
- [x] Create chat history persistence procedures
- [x] Create chat session management (create, list, delete)

## Backend - RAG & PDF
- [x] Create PDF upload endpoint
- [x] Create PDF text extraction (base64 decode)
- [x] Create PDF chunking logic
- [x] Store document chunks in database
- [x] Implement RAG context retrieval
- [x] Inject RAG context into LLM prompts
- [x] S3 file storage for PDFs

## Backend - Admin
- [x] Create admin user management procedures
- [x] Create admin chat statistics procedures
- [x] Create admin document management procedures

## Backend - Auth
- [x] Password reset token generation and verification

## Frontend - Design
- [x] Set up dark theme with Manus-inspired design
- [x] Add Myanmar font (Noto Sans Myanmar) to index.html
- [x] Design color palette and design tokens

## Frontend - User Chat
- [x] Create user chat page with sidebar
- [x] Build chat interface with animated bubbles
- [x] Implement chat session list in sidebar
- [x] Create new chat session button
- [x] Implement message input with Myanmar support
- [x] Add suggested prompts for empty state
- [x] Implement drag-and-drop file upload
- [x] Build document list panel (My Documents dialog)
- [x] Add document deletion from user dialog

## Frontend - Admin Dashboard
- [x] Create admin dashboard layout
- [x] Build user management page
- [x] Build chat history overview
- [x] Build system usage statistics

## Frontend - Auth
- [x] Login page UI
- [x] Password reset page UI

## Routing & Layout
- [x] Role-based route protection
- [x] Admin routes vs User routes separation
- [x] Sidebar navigation per role

## Documentation & GitHub
- [x] Create README with setup instructions
- [x] Create requirements.txt
- [x] Create .env.example
- [x] Push to GitHub repository

## Testing
- [x] Write vitest tests for chat procedures
- [x] Write vitest tests for auth
- [x] Test Myanmar language detection
- [x] Test RAG context building
- [x] Test role-based access control
- [x] Test medical system prompt content
## User Profile Page (New Feature)
- [x] Create user_profile table in database
- [x] Add profile edit profile procedures (backend)
- [x] Create User Profile page with personal info editing
- [x] Add medical summary/record section
- [x] Add route and sidebar navigation
- [x] Write tests for profile procedures
## Mobile Responsive Improvements
- [ ] Audit all pages for mobile responsiveness issues
- [ ] Fix Chat page mobile layout (sidebar, input area, message bubbles)
- [ ] Fix Home/Landing page mobile layout
- [ ] Fix Admin Dashboard mobile layout
- [ ] Fix Admin pages (Users, Documents, Sessions) mobile layout
- [ ] Fix User Profile page mobile layout
- [ ] Fix Password Reset page mobile layout
- [ ] Fix Navigation/Header mobile behavior
- [ ] Test mobile viewport on all pages
## Bug Fixes
- [x] Fix DialogTrigger error on Home page - DialogTrigger must be used within Dialog
- [x] Fix SheetTrigger error in all admin pages - replaced with controlled open state
