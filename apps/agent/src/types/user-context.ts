// apps/api/src/types/user-context.ts

export interface UserContext {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export function formatUserContext(user: UserContext): string {
  const lines = [
    `## Current Customer`,
    `- Name: ${user.name}`,
    `- Email: ${user.email}`,
    `- Phone: ${user.phone}`,
    `- Customer ID: ${user.id}`,
  ];

  return lines.join("\n");
}
