import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Image, Lock, Mail, MessageCircle, Send, Sparkles, UserRound, UsersRound } from "lucide-react";

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

      <section className="hidden min-h-screen flex-col justify-between overflow-hidden bg-[linear-gradient(135deg,#101827_0%,#27253f_42%,#3b1f35_100%)] p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffdf5d] text-slate-950 shadow-[0_16px_40px_rgba(255,223,93,0.28)]">
            <UsersRound size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffdf5d]">ChatShip</p>
            <h1 className="text-2xl font-black">Meet your circle</h1>
          </div>
        </div>

        <div className="grid items-center gap-8 xl:grid-cols-[1fr_0.95fr]">
          <div className="max-w-xl">
            <p className="text-6xl font-black leading-[0.95] tracking-normal">
              Make chats feel
              <span className="block text-[#ff7a90]">less boring.</span>
            </p>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-200">
              Add your profile photo, post quick stories, build groups, and send picture-first conversations.
            </p>
            <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
              {["Profile photos", "Stories", "Groups", "Image chats"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black">Friends</p>
                <p className="text-xs text-slate-300">online now</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#45f5b6] text-slate-950">
                <Sparkles size={18} />
              </span>
            </div>

            <div className="space-y-3 rounded-3xl bg-[#0b1220]/80 p-4">
              {[
                ["J", "Jay", "Posted a new story", "#ffdf5d"],
                ["R", "Riya", "Sent a photo", "#ff7a90"],
                ["G", "Goa Plan", "6 members typing", "#45f5b6"],
              ].map(([letter, name, status, color]) => (
                <div key={name} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-black text-slate-950" style={{ backgroundColor: color }}>
                    {letter}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{name}</p>
                    <p className="truncate text-xs text-slate-300">{status}</p>
                  </div>
                  <Image size={17} className="text-slate-300" />
                </div>
              ))}

              <div className="flex justify-end">
                <div className="flex items-center gap-2 rounded-2xl rounded-br-md bg-[#ff7a90] px-4 py-3 text-sm font-bold text-white">
                  See you in chat <Send size={15} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["profile", "story", "group"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-black capitalize text-[#ffdf5d]">{item}</p>
              <p className="mt-1 text-xs font-semibold text-slate-300">ready after signup</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Signup;
