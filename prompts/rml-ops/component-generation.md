# Generate React Component Following RML Standards

You are creating a React component for an RML internal application.

## Standards

### 1. TypeScript Strict Mode

- No `any` types
- Explicitly type all props, state, returns
- Use `interface` for props (not `type`)

### 2. Functional Components

- Use functional components with hooks
- No class components
- Hooks at top of component (before any logic)

### 3. Styling with Tailwind

- No CSS modules, styled-components, or CSS-in-JS
- Use Tailwind utility classes
- Prefer RML design tokens:
  - `bg-rml-primary` (plum #522241)
  - `border-rml-accent` (coral #d05c3d)
  - `bg-rml-cream` (cream #f6dfb6)
  - `bg-rml-background` (light grey #f9f9f9)
  - `bg-rml-danger` (red)
  - `text-rml-warning` (amber)

### 4. Import from @roam-migration/components When Possible

Before creating a new component, check if it exists in `@roam-migration/components`:
- Button
- Card
- Typography
- AppShell
- IAPAuthProvider
- SecureRoute

### 5. Accessibility

- Add `aria-label` for icon buttons
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Support keyboard navigation
- Sufficient color contrast

## Component Template
```tsx
import { useState } from 'react';
import { Button, Card } from '@roam-migration/components';

interface ComponentNameProps {
  // Props typed explicitly
  title: string;
  onSubmit?: () => void;
  isLoading?: boolean;
}

/**
 * Brief description of what component does
 *
 * @example
 * <ComponentName title="Hello" onSubmit={() => {}} />
 */
export function ComponentName({
  title,
  onSubmit,
  isLoading = false
}: ComponentNameProps) {
  // Hooks at top
  const [state, setState] = useState('');

  // Event handlers
  const handleClick = () => {
    if (onSubmit) onSubmit();
  };

  // Render logic
  return (
    <Card>
      <Typography variant="h2">
        {title}
      </Typography>

      <div>
        {/* Component content */}
      </div>

      <Button variant="primary" onClick={handleClick} isLoading={isLoading}>
        Submit
      </Button>
    </Card>
  );
}
```

## File Placement

**For app-specific components:**
- `src/components/ComponentName.tsx`

**For shared components (rare):**
- Add to `@roam-migration/components` repo instead
- Follow process in `add-shared-component.md`

## Documentation

Add JSDoc comment above component:
```tsx
/**
 * [Brief one-line description]
 *
 * [Optional detailed description]
 *
 * @example
 * <ComponentName title="Hello" />
 *
 * @example
 * <ComponentName title="Hello" onSubmit={() => {}} isLoading />
 */
```

## Common Patterns

### Form Handling
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Handle form submission
};

return (
  <form onSubmit={handleSubmit}>
    {/* Form fields */}
  </form>
);
```

### Conditional Rendering
```tsx
{isLoading ? (
  <span>Loading...</span>
) : (
  <div>Content</div>
)}
```

### Lists
```tsx
{items.map((item) => (
  <div key={item.id}>
    {item.name}
  </div>
))}
```

## Testing Considerations

For complex components, suggest test coverage:
```tsx
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders title correctly', () => {
    render(<ComponentName title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onSubmit when button clicked', () => {
    const handleSubmit = vi.fn();
    render(<ComponentName title="Test" onSubmit={handleSubmit} />);
    fireEvent.click(screen.getByText('Submit'));
    expect(handleSubmit).toHaveBeenCalled();
  });
});
```

## Output

When generating a component:

1. Create the component file
2. Export from appropriate index.ts if needed
3. Suggest where to use it in the app
4. Note any additional dependencies required
