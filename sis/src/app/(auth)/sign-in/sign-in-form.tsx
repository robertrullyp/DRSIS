"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (res?.ok) {
      router.push(callbackUrl);
      return;
    }
    if (res?.error) setError(res.error);
    else setError("Login gagal. Periksa kredensial Anda.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl p-6 glass-card"
      >
        <h1 className="text-xl font-semibold">Sign In</h1>
        <div className="space-y-2">
          <label className="block text-sm text-muted-foreground">Email</label>
          <input
            className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-muted-foreground">Password</label>
          <input
            className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-md px-4 py-2 bg-accent text-accent-foreground hover:opacity-90 transition-colors"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
