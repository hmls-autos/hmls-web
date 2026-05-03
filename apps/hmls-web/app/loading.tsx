import { Wrench } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col bg-background text-text">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-light flex items-center justify-center mx-auto mb-6 wrench-pulse">
            <Wrench className="w-10 h-10 text-red-primary" />
          </div>

          <div className="flex gap-1 justify-center mb-4">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-3 h-3 bg-red-primary rounded-full dot-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          <p className="text-text-secondary boundary-fade-up boundary-fade-up-1">
            Loading...
          </p>
        </div>
      </div>
    </main>
  );
}
