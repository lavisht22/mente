# Copilot Instructions for Mente

## Project Overview

Mente is a second brain AI application designed to help users organize, connect, and retrieve their thoughts and knowledge. The application focuses on intelligent knowledge management with AI-powered features.

## Tech Stack

### Frontend

- **React 19** - UI framework
- **TypeScript** - Primary language (strict typing required)
- **Hero UI** - Component library (ALWAYS use Hero UI components, never create custom ones from scratch)
- **Tailwind CSS 4** - Styling framework
- **TanStack Router** - File-based routing and navigation
- **Framer Motion** - Animations and transitions
- **Vite** - Build tool and dev server

### Backend

- **Supabase** - Database, authentication, and backend services

### Development Tools

- **Biome** - Code formatting and linting
- **Vitest** - Testing framework
- **npm** - Package manager

## Development Guidelines

### Component Development

1. **ALWAYS use Hero UI components** - Never create custom components from scratch when Hero UI provides equivalent functionality
2. **TypeScript First** - All files must be in TypeScript with proper typing
3. **Component Structure** - Use functional components with proper prop typing
4. **Export Patterns** - Use default exports for components

### Hero UI Usage

- Import components from `@heroui/react`
- Leverage Hero UI's theming system
- Use Hero UI's built-in accessibility features
- Prefer Hero UI components over custom implementations:
  - Use `Button` instead of custom buttons
  - Use `Input` instead of custom form inputs
  - Use `Modal` instead of custom overlays
  - Use `Card` instead of custom containers
  - Use `Avatar`, `Badge`, `Chip`, etc. for UI elements

### Styling Guidelines

- **Tailwind CSS 4** - Use Tailwind classes for all styling
- **Responsive Design** - Mobile-first approach using Tailwind breakpoints
- **Dark/Light Mode** - Consider theme variations
- **Hero UI Integration** - Use Hero UI's theming with Tailwind

### Routing with TanStack Router

- **File-based Routing** - Routes are defined in `src/routes/`
- **Route Generation** - Routes are auto-generated in `routeTree.gen.ts`
- **Navigation** - Use `Link` component from `@tanstack/react-router`
- **Route Structure**:
  ```
  src/routes/
  ├── __root.tsx      # Root layout
  ├── index.tsx       # Home page (/)
  └── [other routes]
  ```

### TypeScript Standards

- **Strict Mode** - All TypeScript strict checks enabled
- **Type Definitions** - Create proper interfaces for all data structures
- **Component Props** - Always type component props
- **API Responses** - Type all Supabase responses
- **No Any** - Avoid `any` type, use proper typing

## Project Structure

```
src/
├── main.tsx                 # App entry point
├── styles.css              # Global styles
├── routeTree.gen.ts        # Auto-generated routes
├── components/             # Reusable components
│   └── Header.tsx
├── routes/                 # Page components
│   ├── __root.tsx         # Root layout
│   └── index.tsx          # Home page
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── stores/               # State management
```

### File Naming Conventions

- **Components** - PascalCase (e.g., `UserProfile.tsx`)
- **Hooks** - camelCase with `use` prefix (e.g., `useUserData.ts`)
- **Utilities** - camelCase (e.g., `formatDate.ts`)
- **Types** - PascalCase with `.types.ts` suffix (e.g., `User.types.ts`)

## Supabase Integration

### Database Operations

- Use Supabase client for all database operations
- Implement proper error handling
- Use TypeScript for database schema typing
- Follow Supabase best practices for queries

### Authentication

- Leverage Supabase Auth for user management
- Implement proper auth guards for protected routes
- Handle auth state changes appropriately

### Real-time Features

- Use Supabase real-time subscriptions when needed
- Properly clean up subscriptions in useEffect cleanup

## Code Style and Quality

### Biome Configuration

- Follow the project's Biome configuration in `biome.json`
- Run `npm format` before committing
- Run `npm lint` to check for issues
- Use `npm check` for comprehensive checks

### Best Practices

1. **Performance** - Use React best practices (memo, useMemo, useCallback when appropriate)
2. **Accessibility** - Leverage Hero UI's built-in accessibility features
3. **Error Handling** - Implement proper error boundaries and error states
4. **Loading States** - Show appropriate loading indicators
5. **Testing** - Write tests using Vitest and Testing Library

## AI and Second Brain Features

### Knowledge Management

- Focus on user experience for knowledge capture and retrieval
- Implement intuitive search and filtering
- Consider AI-powered suggestions and connections
- Maintain data relationships and context

### User Interface

- Prioritize clean, minimal design
- Use Hero UI components for consistency
- Implement smooth transitions with Framer Motion
- Ensure responsive design across devices

## Common Patterns

### Component Example

```tsx
import { Button, Card } from "@heroui/react";
import { Link } from "@tanstack/react-router";

interface NoteCardProps {
  id: string;
  title: string;
  content: string;
  onEdit: (id: string) => void;
}

export default function NoteCard({
  id,
  title,
  content,
  onEdit,
}: NoteCardProps) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{content}</p>
      <div className="flex gap-2">
        <Button size="sm" onPress={() => onEdit(id)}>
          Edit
        </Button>
        <Button as={Link} to={`/notes/${id}`} variant="bordered" size="sm">
          View
        </Button>
      </div>
    </Card>
  );
}
```

## Commands

### Development

- `npm dev` - Start development server on port 3000
- `npm build` - Build for production
- `npm test` - Run tests
- `npm format` - Format code with Biome
- `npm lint` - Lint code with Biome
- `npm check` - Run all Biome checks

### Supabase

- `npx supabase start` - Start local Supabase
- `npx supabase db reset` - Reset local database
- `npx supabase gen types typescript` - Generate TypeScript types

## Important Reminders

1. **Hero UI First** - Always check Hero UI documentation before creating any UI component
2. **TypeScript Strict** - Never use `any`, always provide proper types
3. **Mobile Responsive** - Every component should work on mobile devices
4. **Performance** - Consider loading states, error states, and performance optimizations
5. **Accessibility** - Leverage Hero UI's accessibility features
6. **Consistent Patterns** - Follow established patterns in the codebase
7. **Supabase Best Practices** - Follow Supabase documentation for optimal integration

## Resources

- [Hero UI Documentation](https://heroui.com/docs)
- [TanStack Router Documentation](https://tanstack.com/router)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React 19 Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
