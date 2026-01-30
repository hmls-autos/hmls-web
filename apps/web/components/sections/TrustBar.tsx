export default function TrustBar() {
  const stats = [
    { value: "20+", label: "Years Experience" },
    { value: "500+", label: "Repairs Completed" },
    { value: "100%", label: "Satisfaction Rate" },
  ];

  return (
    <section className="w-full py-8 border-y border-cream-200 bg-cream-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-serif text-charcoal">
                {stat.value}
              </div>
              <div className="text-sm text-charcoal-light uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
