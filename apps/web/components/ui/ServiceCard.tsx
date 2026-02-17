import Link from "next/link";

interface ServiceCardProps {
  title: string;
  description: string;
  price: string;
  href?: string;
}

export default function ServiceCard({
  title,
  description,
  price,
  href = "/chat",
}: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col h-full p-8 bg-surface border border-border rounded-xl card-hover hover:border-red-primary focus-visible:ring-2 focus-visible:ring-red-primary"
    >
      <h3 className="text-lg font-display font-semibold text-text mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-secondary mb-4 flex-1">{description}</p>
      <p className="text-sm font-bold text-red-primary">From {price}</p>
    </Link>
  );
}
