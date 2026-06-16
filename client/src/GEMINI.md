# Frontend Development Instructions (client/src)

This directory contains the React/TypeScript frontend for the Sushi EJS project.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion, GSAP
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Conventions

- **Components**:
  - Store reusable UI components in `components/ui/`.
  - Store layout components in `components/`.
  - Use functional components with arrow functions.
  - Define props using `interface`.
- **Pages**:
  - Store page components in `pages/`.
  - Nested pages (e.g., admin) should be in subdirectories (e.g., `pages/admin/`).
- **State Management**:
  - Use `AuthContext` for user authentication state.
  - Use `CartContext` for shopping cart state.
  - Avoid heavy global state libraries (like Redux) unless strictly necessary.
- **Styling**:
  - Use Tailwind utility classes directly in `className`.
  - For complex animations, leverage Framer Motion's `motion` components.
- **Routing**:
  - All routes are defined in `App.tsx`.
  - Use the `ProtectedRoute` component for routes requiring authentication or specific roles.

## Best Practices

- **Type Safety**: Avoid using `any`. Define interfaces for all API responses and component props.
- **Performance**: Use `useMemo` and `useCallback` when passing complex objects or functions to memoized components.
- **Clean Code**: Keep components small and focused. Extract complex logic into custom hooks if reused.
