// apps/api/src/types/user-context.ts

export interface UserContext {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: string;
  } | null;
}

export function formatUserContext(user: UserContext): string {
  const lines = [
    `## Current Customer`,
    `- Name: ${user.name}`,
    `- Email: ${user.email}`,
    `- Phone: ${user.phone}`,
  ];

  if (user.vehicleInfo) {
    lines.push(
      `- Vehicle: ${user.vehicleInfo.year} ${user.vehicleInfo.make} ${user.vehicleInfo.model}`
    );
  } else {
    lines.push(`- Vehicle: Not specified`);
  }

  lines.push(`- Customer ID: ${user.id}`);

  return lines.join("\n");
}
