# Project Management Frontend

A React-based frontend for managing projects, project items, and transactions.

## Features

- **Project Management**: Create, view, and edit projects
- **Project Items**: Track items related to each project with comprehensive details
- **Transactions**: Record financial transactions with project item associations
- **Responsive Design**: Works on desktop and mobile devices
- **Row Navigation**: Keyboard navigation support for tables
- **Quick Data Entry**: "Save and Add Another" functionality for faster data input

## Tech Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.x
- **UI Components**: Custom Shadcn UI-inspired components
- **State Management**:
  - Zustand (global state)
  - React Query (server state)
  - React Hook Form (form state)
- **Data Tables**: TanStack Table (React Table)
- **Routing**: React Router
- **Backend**: Supabase

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/             # Layout components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── projects/           # Project-related components
│   │   ├── project-items/      # Project items components
│   │   └── transactions/       # Transaction components
│   ├── hooks/                  # React Query hooks
│   ├── lib/                    # Utility libraries
│   │   └── supabase.ts         # Supabase client
│   ├── pages/                  # Route pages
│   ├── store/                  # Zustand stores
│   └── types/                  # TypeScript types
└── ...
```

## Getting Started

1. **Prerequisites**:
   - Node.js (recommended: latest LTS)
   - npm or yarn
   - Supabase account and project

2. **Installation**:
   ```bash
   # Install dependencies
   npm install
   ```

3. **Configuration**:
   Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Development**:
   ```bash
   npm run dev
   ```

5. **Build**:
   ```bash
   npm run build
   ```

## Database Schema

The application works with the following Supabase tables:

- **projects**: Main projects table
- **project_items**: Items associated with projects
- **transactions**: Financial transactions linked to projects and optionally to project items
- **clients**: Client information
- **suppliers**: Supplier information

## Type Generation

Generate TypeScript types from your Supabase schema:

```bash
npm run generate-types
```

Or directly:

```bash
supabase gen types typescript --project-id shosjfgprxzunriyfhxe --schema public > src/types/database.types.ts
```

## Features to Add

- User authentication
- Reporting and visualization
- Client and supplier management
- File attachments
- Export functionality