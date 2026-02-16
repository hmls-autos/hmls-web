export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires inline script injection
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
