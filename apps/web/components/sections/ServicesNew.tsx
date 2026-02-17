import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import ServiceCard from "@/components/ui/ServiceCard";

const services = [
  {
    title: "Oil Change",
    description: "Full synthetic oil change with filter and fluid top-off.",
    price: "$89",
  },
  {
    title: "Brake Service",
    description: "Pads, rotors, fluid inspection and repair.",
    price: "$149",
  },
  {
    title: "Battery & Electrical",
    description: "Testing, replacement, and system diagnosis.",
    price: "$49",
  },
  {
    title: "Engine Diagnostics",
    description: "Check engine light, computer scanning, and troubleshooting.",
    price: "$79",
  },
  {
    title: "A/C Service",
    description: "Comprehensive air conditioning inspection and recharge.",
    price: "$129",
  },
  {
    title: "Suspension",
    description: "Diagnose and repair for a smooth, noise-free ride.",
    price: "$99",
  },
];

export default function ServicesNew() {
  return (
    <section id="services" className="w-full py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <RevealOnScroll>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text text-center mb-4 text-balance">
            What we can help with
          </h2>
          <p className="text-text-secondary text-center max-w-xl mx-auto mb-16">
            From routine maintenance to complex repairs, we handle it all at
            your location.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <RevealOnScroll
              key={service.title}
              delay={(index % 3) + 1}
              className="h-full"
            >
              <ServiceCard {...service} />
            </RevealOnScroll>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/chat"
            className="inline-block px-6 py-3 border border-text text-text rounded-lg hover:bg-text hover:text-background transition-colors font-medium"
          >
            View all services
          </Link>
        </div>
      </div>
    </section>
  );
}
