import { Clerk } from '@clerk/clerk-react';

// Initialize Clerk
const clerk = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

// Export the initialized Clerk instance
export { clerk };