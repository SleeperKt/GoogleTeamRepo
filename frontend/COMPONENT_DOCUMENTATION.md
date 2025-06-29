# ProjectHub Component Documentation

##  Component Documentation

### UI Components (`/components/ui/`)

#### Button
A versatile button component with multiple variants and sizes.

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}
```

**Usage Examples:**
```tsx
// Default button
<Button>Click me</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Outline button with icon
<Button variant="outline" size="sm">
  <Plus className="h-4 w-4" />
  Add Item
</Button>

// Icon-only button
<Button size="icon" variant="ghost">
  <Settings className="h-4 w-4" />
</Button>
```

**Dependencies:** `@radix-ui/react-slot`, `class-variance-authority`, `clsx`

---

#### Card
A container component for displaying content in a card format.

**Components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Card title
- `CardDescription` - Card description
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage Example:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Project Title</CardTitle>
    <CardDescription>Project description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Dependencies:** `clsx`

---

#### Dialog
A modal dialog component for overlays and popups.

**Components:**
- `Dialog` - Root container
- `DialogTrigger` - Trigger element
- `DialogContent` - Dialog content
- `DialogHeader` - Dialog header
- `DialogTitle` - Dialog title
- `DialogDescription` - Dialog description
- `DialogFooter` - Dialog footer
- `DialogClose` - Close button

**Usage Example:**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Dependencies:** `@radix-ui/react-dialog`, `lucide-react`

---

#### Input
A form input component with consistent styling.

**Props:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

**Usage Example:**
```tsx
<Input placeholder="Enter text..." />
<Input type="email" placeholder="Email address" />
<Input disabled value="Read-only text" />
```

**Dependencies:** `clsx`

---

#### Select
A dropdown select component.

**Components:**
- `Select` - Root container
- `SelectTrigger` - Trigger button
- `SelectContent` - Dropdown content
- `SelectItem` - Individual option
- `SelectValue` - Display value

**Usage Example:**
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**Dependencies:** `@radix-ui/react-select`

---

#### Avatar
A user avatar component with fallback support.

**Components:**
- `Avatar` - Root container
- `AvatarImage` - Image element
- `AvatarFallback` - Fallback content

**Usage Example:**
```tsx
<Avatar>
  <AvatarImage src="/user.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

**Dependencies:** `@radix-ui/react-avatar`

---

#### Badge
A small status indicator component.

**Props:**
```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}
```

**Usage Example:**
```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

**Dependencies:** `clsx`

---

#### Calendar
A date picker component.

**Props:**
```typescript
interface CalendarProps {
  mode?: 'single' | 'multiple' | 'range'
  selected?: Date | Date[] | { from: Date; to: Date }
  onSelect?: (date: Date | Date[] | { from: Date; to: Date }) => void
  disabled?: Date[]
  initialFocus?: boolean
}
```

**Usage Example:**
```tsx
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-md border"
/>
```

**Dependencies:** `react-day-picker`, `date-fns`

---

#### DropdownMenu
A dropdown menu component.

**Components:**
- `DropdownMenu` - Root container
- `DropdownMenuTrigger` - Trigger element
- `DropdownMenuContent` - Menu content
- `DropdownMenuItem` - Menu item
- `DropdownMenuLabel` - Menu label
- `DropdownMenuSeparator` - Separator line

**Usage Example:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Dependencies:** `@radix-ui/react-dropdown-menu`

---

#### Form
A form component with validation support.

**Components:**
- `Form` - Root form container
- `FormField` - Form field wrapper
- `FormItem` - Form item container
- `FormLabel` - Form label
- `FormControl` - Form control wrapper
- `FormDescription` - Form description
- `FormMessage` - Form error message

**Usage Example:**
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

**Dependencies:** `react-hook-form`, `@hookform/resolvers`, `zod`

---

#### Sidebar
A collapsible sidebar component.

**Components:**
- `Sidebar` - Root container
- `SidebarContent` - Sidebar content
- `SidebarHeader` - Sidebar header
- `SidebarMenu` - Menu container
- `SidebarMenuItem` - Menu item
- `SidebarTrigger` - Toggle trigger

**Usage Example:**
```tsx
<Sidebar>
  <SidebarHeader>
    <h2>Navigation</h2>
  </SidebarHeader>
  <SidebarContent>
    <SidebarMenu>
      <SidebarMenuItem href="/dashboard">
        Dashboard
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarContent>
</Sidebar>
```

**Dependencies:** `@radix-ui/react-collapsible`

---

#### Toast
A notification toast component.

**Components:**
- `Toast` - Individual toast
- `ToastAction` - Toast action button
- `ToastClose` - Close button
- `ToastDescription` - Toast description
- `ToastProvider` - Provider component
- `ToastTitle` - Toast title
- `ToastViewport` - Toast viewport

**Usage Example:**
```tsx
<Toast>
  <ToastTitle>Success</ToastTitle>
  <ToastDescription>Action completed successfully</ToastDescription>
  <ToastAction altText="Undo">Undo</ToastAction>
</Toast>
```

**Dependencies:** `@radix-ui/react-toast`

---

### Layout Components

#### AppLayout
The main application layout component with sidebar navigation.

**Props:**
```typescript
interface AppLayoutProps {
  children: React.ReactNode
}
```

**Features:**
- Responsive sidebar navigation
- Project selector
- User profile dropdown
- Dynamic navigation based on current project
- Create project dialog

**Usage Example:**
```tsx
<AppLayout>
  <div>Page content</div>
</AppLayout>
```

**Dependencies:** 
- `useAuth` hook
- `useProject` hook
- `ProjectSelector` component
- Various UI components

---

#### ConditionalLayout
A wrapper component that conditionally renders the app layout based on authentication.

**Props:**
```typescript
interface ConditionalLayoutProps {
  children: React.ReactNode
}
```

**Features:**
- Handles authentication-based routing
- Shows loading states during hydration
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages

**Usage Example:**
```tsx
<ConditionalLayout>
  <div>Protected content</div>
</ConditionalLayout>
```

**Dependencies:**
- `useAuth` hook
- `AppLayout` component
- `ProjectProvider` context

---

### Feature Components

#### ProjectSelector
A dropdown component for switching between projects.

**Features:**
- Displays current project with avatar
- Lists all available projects
- Handles project switching with navigation
- Shows empty state for new users
- Create new project option

**Usage Example:**
```tsx
<ProjectSelector />
```

**Dependencies:**
- `useProject` hook
- `useAuth` hook
- `DropdownMenu` components
- `Avatar` component

---

#### CreateTaskModal
A modal component for creating new tasks.

**Props:**
```typescript
interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStage?: string
  onTaskCreated?: (task: any) => void
  projectPublicId?: string
}
```

**Features:**
- Form validation
- Dynamic team member loading
- Label selection
- Priority and stage selection
- Due date picker
- Assignee selection

**Usage Example:**
```tsx
<CreateTaskModal
  open={isOpen}
  onOpenChange={setIsOpen}
  initialStage="To Do"
  onTaskCreated={handleTaskCreated}
  projectPublicId="project-123"
/>
```

**Dependencies:**
- `Dialog` components
- `Calendar` component
- `Command` component
- `apiRequest` utility

---

#### Task Components (`/components/task/`)

##### AssigneeSelector
A component for selecting task assignees.

**Props:**
```typescript
interface AssigneeSelectorProps {
  value?: string
  onChange: (value: string | null) => void
  teamMembers: TeamMember[]
}
```

**Usage Example:**
```tsx
<AssigneeSelector
  value={assignee}
  onChange={setAssignee}
  teamMembers={teamMembers}
/>
```

---

##### LabelSelector
A component for selecting task labels.

**Props:**
```typescript
interface LabelSelectorProps {
  selectedLabels: number[]
  onChange: (labels: number[]) => void
  labels: Label[]
}
```

**Usage Example:**
```tsx
<LabelSelector
  selectedLabels={selectedLabels}
  onChange={setSelectedLabels}
  labels={availableLabels}
/>
```

---

##### PrioritySelector
A component for selecting task priority.

**Props:**
```typescript
interface PrioritySelectorProps {
  value?: string
  onChange: (value: string) => void
  priorities: Priority[]
}
```

**Usage Example:**
```tsx
<PrioritySelector
  value={priority}
  onChange={setPriority}
  priorities={priorities}
/>
```

---

##### DatePicker
A component for selecting task due dates.

**Props:**
```typescript
interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
}
```

**Usage Example:**
```tsx
<DatePicker
  value={dueDate}
  onChange={setDueDate}
/>
```

---

### Utility Components

#### DynamicTitle
A component that dynamically updates the page title based on the current route.

**Features:**
- Updates document title based on current page
- Handles project-specific titles
- Fallback to default title

**Usage Example:**
```tsx
<DynamicTitle />
```

**Dependencies:** `usePathname` hook

---

#### ThemeProvider
A provider component for theme management.

**Props:**
```typescript
interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}
```

**Usage Example:**
```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  {children}
</ThemeProvider>
```

**Dependencies:** `next-themes`

---

## 🏗️ Architecture Overview

### Folder Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── projects/          # Project-related pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── task/             # Task-specific components
│   └── *.tsx            # Feature components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
└── public/               # Static assets
```

### State Management Strategy

The application uses a combination of React Context and local state:

1. **Authentication Context** (`auth-context.tsx`)
   - Manages user authentication state
   - Handles JWT token storage and validation
   - Provides login/logout functionality
   - Handles user profile data

2. **Project Context** (`project-context.tsx`)
   - Manages current project selection
   - Handles project switching
   - Caches project data
   - Syncs with URL parameters

3. **Local State**
   - Form state managed with `react-hook-form`
   - UI state (modals, dropdowns) managed locally
   - Component-specific state using `useState`

### Routing Approach

The application uses Next.js 13+ App Router with:

1. **File-based Routing**
   - Pages defined in `app/` directory
   - Dynamic routes with `[slug]` syntax
   - Nested layouts with `layout.tsx`

2. **Route Protection**
   - `ConditionalLayout` component handles auth-based redirects
   - Public routes defined in `publicRoutes` array
   - Automatic redirect to login for protected routes

3. **Dynamic Navigation**
   - Project-specific routes with public IDs
   - URL-based project switching
   - Breadcrumb navigation

### API Integration Strategy

1. **Centralized API Client** (`lib/api.ts`)
   - `apiRequest` function for all HTTP requests
   - Automatic JWT token injection
   - Error handling and timeout management
   - TypeScript support

2. **API Organization**
   - Modular API functions by feature
   - Consistent error handling
   - Request/response type definitions

3. **Authentication**
   - JWT token stored in localStorage
   - Automatic token refresh handling
   - 401 error handling with logout

### Main Libraries and Technologies

#### Core Framework
- **Next.js 15.2.4** - React framework with App Router
- **React 18.2.0** - UI library
- **TypeScript 5** - Type safety

#### UI and Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management
- **clsx** - Conditional className utility

#### Forms and Validation
- **React Hook Form 7.54.1** - Form state management
- **Zod 3.24.1** - Schema validation
- **@hookform/resolvers** - Form validation resolvers

#### Date and Time
- **date-fns 3.6.0** - Date utility library
- **react-day-picker 8.10.1** - Date picker component

#### UI Enhancements
- **Sonner 1.7.1** - Toast notifications
- **Embla Carousel 8.5.1** - Carousel component
- **Recharts 2.15.0** - Chart library
- **React Resizable Panels 2.1.7** - Resizable layout components

#### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

### Key Features

1. **Responsive Design**
   - Mobile-first approach
   - Collapsible sidebar
   - Touch-friendly interactions

2. **Theme Support**
   - Light/dark mode
   - System theme detection
   - Smooth theme transitions

3. **Accessibility**
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader support
   - Focus management

4. **Performance**
   - Code splitting with Next.js
   - Optimized bundle size
   - Lazy loading of components
   - Efficient re-renders

5. **Developer Experience**
   - TypeScript for type safety
   - Consistent code formatting
   - Component documentation
   - Hot reloading 