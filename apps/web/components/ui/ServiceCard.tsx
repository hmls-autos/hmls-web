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
      className="block p-8 bg-cream-100 border border-cream-200 rounded-xl card-hover hover:border-charcoal-light"
    >
      <h3 className="text-lg font-medium text-charcoal mb-2">{title}</h3>
      <p className="text-sm text-charcoal-light mb-4">{description}</p>
      <p className="text-sm font-medium text-charcoal">From {price}</p>
    </Link>
  );
}
