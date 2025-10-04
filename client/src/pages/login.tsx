import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MaterialButton } from "@/components/material-button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { signInWithEmailAndPassword, getAuth } = await import("firebase/auth");
      const { app } = await import("@/services/firebase");
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="material-card p-6">
        <h2 className="text-xl font-medium mb-4">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm mb-1 block">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm mb-1 block">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <MaterialButton type="submit" disabled={loading} className="w-full">
            {loading ? "Logging in..." : "Login"}
          </MaterialButton>
        </form>
        <p className="text-sm text-muted-foreground mt-4">
          No account? <Link href="/signup" className="text-primary">Create one</Link>
        </p>
      </div>
    </div>
  );
}

