# ProjectHub Architecture Overview

##  Application Architecture

### High-Level Architecture

ProjectHub is a modern web application built with Next.js 13+ using the App Router pattern. The application follows a client-server architecture with a React frontend communicating with an ASP.NET Core backend API.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (ASP.NET)     │◄──►│   (SQL Server)  │
│                 │    │                 │    │                 │
│ • React 18      │    │ • .NET 8        │    │ • Entity        │
│ • TypeScript    │    │ • Entity        │    │   Framework     │
│ • Tailwind CSS  │    │   Framework     │    │ • Migrations    │
│ • shadcn/ui     │    │ • JWT Auth      │    │ • Relationships │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Folder Structure

```
Google-team-repo/
├── frontend/                    # Next.js Frontend Application
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Registration page
│   │   ├── projects/          # Project management
│   │   │   ├── [slug]/        # Dynamic project routes
│   │   │   │   ├── board/     # Kanban board
│   │   │   │   ├── backlog/   # Task backlog
│   │   │   │   ├── reports/   # Project reports
│   │   │   │   ├── activities/# Activity feed
│   │   │   │   ├── timeline/  # Project timeline
│   │   │   │   └── settings/  # Project settings
│   │   │   └── page.tsx       # Projects list
│   │   ├── billing/           # Billing management
│   │   ├── invitations/       # Invitation management
│   │   ├── profile/           # User profile
│   │   ├── settings/          # User settings
│   │   ├── summary/           # Dashboard
│   │   ├── terms/             # Terms of service
│   │   ├── privacy/           # Privacy policy
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx    # Button component
│   │   │   ├── card.tsx      # Card component
│   │   │   ├── dialog.tsx    # Dialog/modal component
│   │   │   ├── input.tsx     # Input component
│   │   │   ├── select.tsx    # Select component
│   │   │   ├── sidebar.tsx   # Sidebar component
│   │   │   └── ...           # Other UI components
│   │   ├── task/             # Task-specific components
│   │   │   ├── assignee-selector.tsx
│   │   │   ├── date-picker.tsx
│   │   │   ├── label-selector.tsx
│   │   │   ├── priority-selector.tsx
│   │   │   └── index.ts
│   │   ├── app-layout.tsx    # Main application layout
│   │   ├── conditional-layout.tsx # Auth-based layout
│   │   ├── create-task-modal.tsx  # Task creation modal
│   │   ├── project-selector.tsx   # Project switcher
│   │   └── ...               # Other feature components
│   ├── contexts/             # React contexts
│   │   ├── auth-context.tsx  # Authentication context
│   │   └── project-context.tsx # Project management context
│   ├── hooks/                # Custom React hooks
│   │   ├── use-ai-assistant.ts
│   │   ├── use-mobile.tsx
│   │   ├── use-project-labels.ts
│   │   ├── use-project-participants.ts
│   │   ├── use-project-workflow-stages.ts
│   │   ├── use-task-form.ts
│   │   ├── use-toast.ts
│   │   └── use-user-permissions.ts
│   ├── lib/                  # Utility libraries
│   │   ├── api.ts           # API client
│   │   ├── types.ts         # TypeScript types
│   │   ├── utils.ts         # Utility functions
│   │   ├── task-constants.ts # Task-related constants
│   │   └── ai-service.ts    # AI service integration
│   ├── public/              # Static assets
│   ├── styles/              # Additional styles
│   ├── package.json         # Dependencies
│   ├── next.config.mjs      # Next.js configuration
│   ├── tailwind.config.ts   # Tailwind CSS configuration
│   └── tsconfig.json        # TypeScript configuration
├── ProjectHub/              # ASP.NET Core Backend
│   ├── ProjectHub.API/      # Web API project
│   ├── ProjectHub.Core/     # Business logic layer
│   ├── ProjectHub.Infrastructure/ # Data access layer
│   └── NUnitTests/          # Unit tests
├── llm_service/             # AI/LLM service
├── docker-compose.yml       # Docker configuration
├── Dockerfile              # Frontend Dockerfile
└── README.md               # Project documentation
```

### State Management Strategy

The application uses a **hybrid state management approach** combining React Context for global state and local state for component-specific data.

#### 1. Global State (React Context)

**Authentication Context** (`contexts/auth-context.tsx`)
```typescript
interface AuthContextType {
  token: string | null
  user: { id: string; username: string; email: string; bio?: string } | null
  isLoading: boolean
  isHydrated: boolean
  login: (token: string) => void
  logout: () => void
}
```

**Project Context** (`contexts/project-context.tsx`)
```typescript
interface ProjectContextType {
  currentProject: Project | null
  projects: Project[]
  setCurrentProject: (project: Project) => void
  switchProject: (projectId: number) => void
  refreshProjects: () => void
}
```

#### 2. Local State Management

- **Form State**: Managed with `react-hook-form` for complex forms
- **UI State**: Local `useState` for modals, dropdowns, and component-specific state
- **Server State**: Direct API calls with loading states managed locally

#### 3. State Persistence

- **JWT Tokens**: Stored in `localStorage` for authentication
- **Current Project**: Persisted in `localStorage` for session continuity
- **User Preferences**: Stored in `localStorage` (theme, etc.)

### Routing Approach

The application uses **Next.js 13+ App Router** with a sophisticated routing strategy:

#### 1. File-Based Routing Structure

```
app/
├── page.tsx                 # Home page (/)
├── login/page.tsx          # Login page (/login)
├── register/page.tsx       # Register page (/register)
├── projects/
│   ├── page.tsx           # Projects list (/projects)
│   └── [slug]/            # Dynamic project routes
│       ├── page.tsx       # Project overview (/projects/[slug])
│       ├── board/page.tsx # Kanban board (/projects/[slug]/board)
│       ├── backlog/page.tsx # Backlog (/projects/[slug]/backlog)
│       ├── reports/page.tsx # Reports (/projects/[slug]/reports)
│       ├── activities/page.tsx # Activities (/projects/[slug]/activities)
│       ├── timeline/page.tsx # Timeline (/projects/[slug]/timeline)
│       └── settings/page.tsx # Settings (/projects/[slug]/settings)
```

#### 2. Route Protection Strategy

**ConditionalLayout Component** handles authentication-based routing:

```typescript
const publicRoutes = ["/", "/login", "/register", "/terms", "/privacy"]

// Automatic redirects:
// - Unauthenticated users → /login
// - Authenticated users on auth pages → /projects
// - Preserves intended destination in localStorage
```

#### 3. Dynamic Navigation

- **Project Switching**: URL updates when switching projects
- **Deep Linking**: Direct access to project-specific pages
- **Breadcrumb Navigation**: Contextual navigation based on current route

### API Integration Strategy

#### 1. Centralized API Client (`lib/api.ts`)

**Core Features:**
- Automatic JWT token injection
- Request timeout handling (30s default)
- Error handling with detailed messages
- TypeScript support with generics
- Request/response interceptors

**Usage Example:**
```typescript
// Simple GET request
const projects = await apiRequest<Project[]>('/api/projects')

// POST request with body
const newProject = await apiRequest<Project>('/api/projects', {
  method: 'POST',
  body: JSON.stringify(projectData)
})

// Request without authentication
const publicData = await apiRequest('/api/public/data', { auth: false })
```

#### 2. API Organization

**Modular API Functions:**
```typescript
// User profile API
export const profileApi = {
  getCurrentUser: async () => apiRequest<User>('/api/user/me'),
  updateProfile: async (data: UpdateProfileRequest) => 
    apiRequest<User>('/api/user/me', { method: 'PUT', body: JSON.stringify(data) })
}

// Invitation API
export const invitationApi = {
  getReceivedInvitations: async (status?: number) => 
    apiRequest<ProjectInvitation[]>(`/api/invitations/received${status ? `?status=${status}` : ''}`),
  createProjectInvitation: async (projectId: number, request: CreateInvitationRequest) =>
    apiRequest(`/api/projects/${projectId}/invitations`, { method: 'POST', body: JSON.stringify(request) })
}
```

#### 3. Error Handling Strategy

- **Network Errors**: Timeout and connection error handling
- **Authentication Errors**: Automatic logout on 401 responses
- **Validation Errors**: Detailed error messages from server
- **User Feedback**: Toast notifications for API responses

### Technology Stack

#### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.2.4 | React framework with App Router |
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5 | Type safety and developer experience |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library built on Radix UI |
| **Radix UI** | Various | Headless UI primitives |
| **React Hook Form** | 7.54.1 | Form state management |
| **Zod** | 3.24.1 | Schema validation |
| **date-fns** | 3.6.0 | Date utility library |
| **Lucide React** | 0.454.0 | Icon library |
| **Sonner** | 1.7.1 | Toast notifications |
| **Recharts** | 2.15.0 | Chart library |

#### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **ASP.NET Core** | 8.0 | Web API framework |
| **Entity Framework** | 8.0 | ORM for database access |
| **SQL Server** | Latest | Primary database |
| **JWT** | - | Authentication tokens |
| **AutoMapper** | - | Object mapping |
| **FluentValidation** | - | Request validation |

#### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and quality |
| **PostCSS** | CSS processing |
| **Autoprefixer** | CSS vendor prefixing |
| **Docker** | Containerization |
| **Git** | Version control |

### Key Architectural Patterns

#### 1. Component Composition
- **Atomic Design**: UI components built from smaller, reusable pieces
- **Compound Components**: Related components grouped together (e.g., Dialog components)
- **Render Props**: Flexible component APIs

#### 2. Separation of Concerns
- **UI Components**: Pure presentation components
- **Container Components**: Handle business logic and data fetching
- **Custom Hooks**: Reusable logic extraction
- **Context Providers**: Global state management

#### 3. Performance Optimization
- **Code Splitting**: Automatic with Next.js App Router
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo and useMemo for expensive operations
- **Bundle Optimization**: Tree shaking and dead code elimination

#### 4. Security Patterns
- **JWT Authentication**: Stateless authentication
- **Route Protection**: Client and server-side validation
- **Input Validation**: Zod schemas for type safety
- **CORS Configuration**: Proper cross-origin handling

### Development Workflow

#### 1. Local Development
```bash
# Start frontend development server
npm run dev

# Start backend API (via Docker)
docker-compose up

# Run tests
npm run test
```

#### 2. Code Organization
- **Feature-based Structure**: Components organized by feature
- **Shared Components**: Reusable UI components in `/components/ui`
- **Type Definitions**: Centralized in `/lib/types.ts`
- **API Functions**: Modular organization in `/lib/api.ts`

#### 3. State Management Flow
```
User Action → Component → Hook/Context → API Call → State Update → UI Re-render
```

This architecture provides a scalable, maintainable foundation for the ProjectHub application with clear separation of concerns, type safety, and excellent developer experience. 