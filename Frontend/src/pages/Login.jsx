import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      navigate("/chat");
    } catch (error) {
      alert("Login failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-sky-100 to-violet-100 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 shadow-2xl backdrop-blur border border-slate-200 animate-fade-in-up transition duration-500">
        <div className="p-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">💬</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">ChatShip</h1>
          <p className="mt-1 text-sm text-slate-500">Modern real-time chat for your final-year project</p>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-3 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="mt-3 text-center text-sm text-slate-500">
            New user? <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
