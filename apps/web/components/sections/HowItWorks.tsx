import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Book online",
      description: "Get a quote in minutes via our AI chat assistant.",
    },
    {
      number: "02",
      title: "We come to you",
      description: "Our mechanic arrives at your home or office.",
    },
    {
      number: "03",
      title: "Done",
      description: "Pay when you're satisfied with the work.",
    },
  ];

  return (
    <section className="w-full py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-text text-center mb-16">
          How it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <RevealOnScroll key={step.number} delay={index + 1}>
              <div className="text-center">
                <div className="text-5xl font-display font-extrabold text-red-primary/20 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-display font-semibold text-text mb-2">
                  {step.title}
                </h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
