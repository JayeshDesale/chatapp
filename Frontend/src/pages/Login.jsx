import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, MessageCircle, ShieldCheck } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

  const handleLogin = async (event) => {
    event?.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("userName", res.data.user.name);
      navigate("/chat");
    } catch (error) {
      alert("Login failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#eef2f7] text-slate-950 lg:grid-cols-[1fr_460px]">
      <section className="hidden min-h-screen flex-col justify-between bg-[#111827] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500 text-slate-950">
            <MessageCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">ChatShip</p>
            <h1 className="text-2xl font-black">Realtime Workspace</h1>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-5xl font-black leading-tight">Clean, fast messaging for focused teams.</p>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Presence, typing indicators, read receipts, pinned contacts, quick replies, and a modern inbox are ready after sign in.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["Realtime", "Secure JWT", "MongoDB"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <ShieldCheck className="mb-3 text-cyan-300" size={20} />
              <p className="text-sm font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white lg:hidden">
              <MessageCircle size={23} />
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-black">Sign in to ChatShip</h2>
            <p className="mt-2 text-sm text-slate-500">Use your account to open the realtime chat dashboard.</p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-cyan-500">
                <Mail size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Password</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-cyan-500">
                <Lock size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-2xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            New user?{" "}
            <Link to="/signup" className="font-bold text-cyan-700 hover:text-cyan-800">
              Create account
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

export default Login;
