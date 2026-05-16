import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Image, Lock, Mail, MessageCircle, Mic, Send, Smile } from "lucide-react";

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
      localStorage.setItem("profilePic", res.data.user.profilePic || "");
      navigate("/chat");
    } catch (error) {
      alert("Login failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#eef2f7] text-slate-950 lg:grid-cols-[1fr_460px]">
      <section className="hidden min-h-screen flex-col justify-between overflow-hidden bg-[linear-gradient(135deg,#101827_0%,#112531_36%,#0f332d_100%)] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#45f5b6] text-slate-950 shadow-[0_16px_40px_rgba(69,245,182,0.28)]">
            <MessageCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#45f5b6]">ChatShip</p>
            <h1 className="text-2xl font-black">Your daily chat room</h1>
          </div>
        </div>

        <div className="grid items-center gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            <p className="text-6xl font-black leading-[0.95] tracking-normal">
              Chat, share, react.
              <span className="block text-[#ffdf5d]">All in one vibe.</span>
            </p>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-200">
              Send photos, post stories, create groups, drop reactions, and keep every conversation feeling alive.
            </p>
            <div className="mt-6 flex gap-3">
              {["Stories", "Groups", "Photos"].map((item) => (
                <span key={item} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <div className="mb-4 flex gap-3">
              {["Nia", "Aarav", "Maya", "You"].map((name, index) => (
                <div key={name} className="text-center">
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl text-sm font-black text-slate-950 ${
                    index === 0 ? "bg-[#ff7a90]" : index === 1 ? "bg-[#ffdf5d]" : index === 2 ? "bg-[#60a5fa]" : "bg-[#45f5b6]"
                  }`}>
                    {name[0]}
                  </div>
                  <p className="mt-1 max-w-14 truncate text-[11px] text-slate-200">{name}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-3xl bg-[#0b1220]/80 p-4">
              <div className="flex justify-start">
                <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm font-semibold text-slate-950">
                  Movie night group is live?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-md bg-[#45f5b6] px-4 py-3 text-sm font-semibold text-slate-950">
                  Yes, sharing the poster now.
                </div>
              </div>
              <div className="ml-auto max-w-[78%] overflow-hidden rounded-2xl rounded-br-md bg-[#ffdf5d] text-slate-950">
                <div className="h-28 bg-[linear-gradient(135deg,#ff7a90,#ffdf5d_48%,#45f5b6)]" />
                <p className="px-4 py-3 text-sm font-bold">Story posted</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-slate-300">
                <Smile size={18} />
                <span className="flex-1 text-sm">Type a message</span>
                <Image size={18} />
                <Mic size={18} />
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#ff7a90] text-white">
                  <Send size={15} />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["12", "active friends"],
            ["8", "fresh stories"],
            ["3", "group chats"],
          ].map(([count, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-2xl font-black text-[#45f5b6]">{count}</p>
              <p className="text-sm font-semibold text-slate-200">{label}</p>
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
