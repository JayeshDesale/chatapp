import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, MessageCircle, UserRound, UsersRound } from "lucide-react";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

  const handleSignup = async (event) => {
    event?.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/signup`, { name, email, password });
      alert("Signup successful");
      navigate("/");
    } catch (error) {
      alert("Signup failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#eef2f7] text-slate-950 lg:grid-cols-[460px_1fr]">
      <main className="flex min-h-screen items-center justify-center p-4">
        <form onSubmit={handleSignup} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
              <MessageCircle size={23} />
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Create account</p>
            <h2 className="mt-2 text-3xl font-black">Start chatting today</h2>
            <p className="mt-2 text-sm text-slate-500">Create your profile and join the realtime inbox.</p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Name</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-cyan-500">
                <UserRound size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Your name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-cyan-500">
                <Mail size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="you@example.com"
                  type="email"
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
                  placeholder="Choose password"
                  type="password"
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
            {loading ? "Creating..." : "Sign up"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/" className="font-bold text-cyan-700 hover:text-cyan-800">
              Login
            </Link>
          </p>
        </form>
      </main>

      <section className="hidden min-h-screen flex-col justify-between bg-[#111827] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500 text-slate-950">
            <UsersRound size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">ChatShip</p>
            <h1 className="text-2xl font-black">Modern Chat</h1>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-5xl font-black leading-tight">A sharper interface for every conversation.</p>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Sign up once, then use live presence, message search, themes, pinned chats, quick replies, and read receipts.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-cyan-300">Built with React, Socket.IO, Express, and MongoDB</p>
        </div>
      </section>
    </div>
  );
}

export default Signup;
