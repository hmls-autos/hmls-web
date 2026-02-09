const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8080";

export async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${AGENT_URL}${path}`);
  if (!res.ok) {
    const error = new Error("Fetch failed") as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
}
