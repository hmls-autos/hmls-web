"use client";

import { motion } from "framer-motion";
import { Loader2, Lock, LogIn, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { supabase } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Check for error from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get("error");
    if (callbackError) {
      setError(callbackError);
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  type OAuthProvider =
    | "google"
    | "apple"
    | "facebook"
    | "github"
    | "discord"
    | "twitter";

  const providers: { id: OAuthProvider; label: string }[] = [
    { id: "google", label: "Google" },
    { id: "apple", label: "Apple" },
    { id: "facebook", label: "Facebook" },
    { id: "github", label: "GitHub" },
    { id: "discord", label: "Discord" },
    { id: "twitter", label: "X" },
  ];

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/chat");
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        if (!/[A-Z]/.test(password)) {
          throw new Error("Password must contain an uppercase letter");
        }
        if (!/[a-z]/.test(password)) {
          throw new Error("Password must contain a lowercase letter");
        }
        if (!/[0-9]/.test(password)) {
          throw new Error("Password must contain a number");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
            },
          },
        });
        if (error) throw error;
        setError("Check your email for the confirmation link!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-full flex-col bg-background text-text">
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-red-light flex items-center justify-center mx-auto mb-4"
            >
              <LogIn className="w-8 h-8 text-red-primary" />
            </motion.div>
            <h1 className="text-2xl font-display font-bold mb-2">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-text-secondary">
              {mode === "login"
                ? "Sign in to access your account"
                : "Sign up to get started"}
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {providers.map((provider) => (
              <motion.button
                key={provider.id}
                type="button"
                onClick={() => handleOAuthLogin(provider.id)}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-surface text-text font-medium hover:bg-surface/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue with {provider.label}
              </motion.button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-text-secondary">
                or continue with email
              </span>
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {mode === "signup" && (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-text-secondary mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-text placeholder-text-secondary/50 focus:outline-none focus:border-red-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-text-secondary mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                      className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-text placeholder-text-secondary/50 focus:outline-none focus:border-red-primary transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-text placeholder-text-secondary/50 focus:outline-none focus:border-red-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-text placeholder-text-secondary/50 focus:outline-none focus:border-red-primary transition-colors"
                />
              </div>
              {mode === "signup" && (
                <ul className="text-xs text-text-secondary mt-2 space-y-1">
                  <li
                    className={password.length >= 8 ? "text-red-primary" : ""}
                  >
                    {password.length >= 8 ? "\u2713" : "\u2022"} At least 8
                    characters
                  </li>
                  <li
                    className={/[A-Z]/.test(password) ? "text-red-primary" : ""}
                  >
                    {/[A-Z]/.test(password) ? "\u2713" : "\u2022"} One uppercase
                    letter
                  </li>
                  <li
                    className={/[a-z]/.test(password) ? "text-red-primary" : ""}
                  >
                    {/[a-z]/.test(password) ? "\u2713" : "\u2022"} One lowercase
                    letter
                  </li>
                  <li
                    className={/[0-9]/.test(password) ? "text-red-primary" : ""}
                  >
                    {/[0-9]/.test(password) ? "\u2713" : "\u2022"} One number
                  </li>
                </ul>
              )}
            </div>

            {mode === "signup" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                    className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-text placeholder-text-secondary/50 focus:outline-none focus:border-red-primary transition-colors"
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm ${
                  error.includes("Check your email")
                    ? "text-green-600"
                    : "text-red-primary"
                }`}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-red-primary text-white font-medium py-3 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {mode === "login" ? "Sign In" : "Sign Up"}
                </>
              )}
            </motion.button>
          </motion.form>

          <p className="text-center text-text-secondary text-sm mt-6">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-red-primary hover:text-red-dark transition-colors font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-red-primary hover:text-red-dark transition-colors font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </main>
  );
}
