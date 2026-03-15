import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleSignup = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/signup`,
        { name, email, password }
      );
      alert("Signup successful");
      navigate("/");
    } catch (error) {
      alert("Signup failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-sky-100 to-violet-100 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 shadow-2xl backdrop-blur border border-slate-200 animate-fade-in-up transition duration-500">
        <div className="p-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">💬</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">Create Your ChatShip</h1>
          <p className="mt-1 text-sm text-slate-500">Register quickly and start real-time chatting.</p>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-slate-300 px-3 py-2 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full rounded-xl border border-slate-300 px-3 py-2 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full rounded-xl border border-slate-300 px-3 py-2 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button onClick={handleSignup} disabled={loading} className="mt-4 w-full rounded-xl bg-indigo-600 px-3 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">{loading ? "Creating..." : "Sign up"}</button>
          <p className="mt-3 text-center text-sm text-slate-500">Already have account? <Link to="/" className="font-semibold text-indigo-600 hover:text-indigo-700">Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
