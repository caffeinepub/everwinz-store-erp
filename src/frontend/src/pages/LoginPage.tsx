import { useState } from "react";
import { useAuth } from "../auth";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) setError("Invalid username or password");
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f0f4ff" }}>
      {/* Left branding */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 text-white px-12">
        <div className="bg-white rounded-xl p-4 mb-8 shadow-xl">
          <img
            src="/assets/img-20260317-wa0036-019d1c16-55a3-74fb-b354-f7471e141478.jpg"
            alt="Everwinz Logo"
            className="w-48 h-auto"
          />
        </div>
        <h1 className="text-3xl font-bold text-center mb-3 tracking-wide">
          EVERWINZ STRUCTURAL SYSTEMS PVT LTD
        </h1>
        <p className="text-blue-200 text-lg text-center">
          Your Trusted Engineering Partner
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
          {[
            "Store Management",
            "Purchase Orders",
            "Supplier Register",
            "Stock Reports",
          ].map((f) => (
            <div
              key={f}
              className="bg-blue-600/40 rounded-lg p-3 text-sm text-center text-blue-100"
            >
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right login */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="lg:hidden mb-8 text-center">
          <div className="bg-white rounded-xl p-3 shadow-md inline-block mb-3">
            <img
              src="/assets/img-20260317-wa0036-019d1c16-55a3-74fb-b354-f7471e141478.jpg"
              alt="Everwinz Logo"
              className="w-32 h-auto mx-auto"
            />
          </div>
          <h1 className="text-xl font-bold text-blue-800">
            EVERWINZ STRUCTURAL SYSTEMS
          </h1>
        </div>

        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Sign in to Store & Purchase ERP
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="username" className="text-gray-700 font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="mt-1 h-11"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="mt-1 h-11"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-medium"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-6 text-xs text-gray-400 text-center">
              Default: admin / admin123
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-sm text-gray-500">
          EVERWINZ STRUCTURAL SYSTEMS PVT LTD
        </p>
      </div>
    </div>
  );
}
