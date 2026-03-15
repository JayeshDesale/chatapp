import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

const socket = io(SOCKET_URL);

function Chat() {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isReadBySelected, setIsReadBySelected] = useState(false);
  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState(false);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    socket.emit("join", userId);

    socket.on("receiveMessage", (data) => {
      if (!data) return;
      const fromUser = data.sender_id;
      if (selectedUser && Number(fromUser) === Number(selectedUser.id)) {
        setMessages((prev) => [...prev, data]);
      }
    });

    socket.on("typing", (data) => {
      if (selectedUser && Number(data.fromUserId) === Number(selectedUser.id)) {
        setIsTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 1200);
      }
    });

    socket.on("messageRead", (data) => {
      if (selectedUser && Number(data.fromUserId) === Number(selectedUser.id)) {
        setIsReadBySelected(true);
        setMessages((prev) => prev.map((m) => (Number(m.sender_id) === Number(userId) ? { ...m, read_status: 1 } : m)));
      }
    });

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("messageRead");
      socket.off("onlineUsers");
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [selectedUser, userId]);

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
        const me = res.data.find((u) => Number(u.id) === Number(userId));
        if (me) setCurrentUser(me);
      } catch (err) {
        console.error("Load users failed", err);
      }
    };
    fetchUsers();
  }, [token]);

  const filteredUsers = useMemo(() => users.filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase())), [users, search]);

  const markMessagesRead = async (senderId) => {
    if (!senderId) return;
    try {
      await axios.post(
        "http://localhost:5000/api/messages/read",
        { sender_id: senderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsReadBySelected(true);
    } catch (err) {
      console.error("Mark read failed", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const loadMessages = async (user) => {
    setSelectedUser(user);
    setIsReadBySelected(false);
    setMessage("");
    setShowEmoji(false);
    try {
      const res = await axios.get(`http://localhost:5000/api/messages/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data);
      socket.emit("messageRead", { toUserId: user.id, fromUserId: userId });
      await markMessagesRead(user.id);
      setMessages((prev) => prev.map((m) => (Number(m.sender_id) === Number(user.id) ? { ...m, read_status: 1 } : m)));
    } catch (err) {
      console.error("Load messages failed", err);
      setMessages([]);
    }
  };

  const normalizeMessage = (msg) => {
    if (typeof msg === "string") return msg;
    if (msg == null) return "";
    if (typeof msg === "object") {
      if (typeof msg.emoji === "string") return msg.emoji;
      if (typeof msg.sticker === "string") return msg.sticker;
      if (typeof msg.url === "string") return msg.url;
      return JSON.stringify(msg);
    }
    return String(msg);
  };

  const handleTyping = () => {
    if (!selectedUser || !userId) return;
    socket.emit("typing", { toUserId: selectedUser.id, fromUserId: userId });
  };

  const handleSend = async () => {
    if (!selectedUser || isSending) return;
    const normalized = normalizeMessage(message).trim();
    if (!normalized) return;
    setIsSending(true);
    try {
      const response = await axios.post("http://localhost:5000/api/messages/send", { receiver_id: selectedUser.id, message: normalized }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((prev) => [...prev, { sender_id: Number(userId), message: normalized, created_at: new Date().toISOString(), read: false }]);
      setIsReadBySelected(false);
      setMessage("");
      setShowEmoji(false);
      console.log("Sent", response.data);
    } catch (err) {
      console.error("Send failed", err.response?.data || err.message || err);
      alert("Message send failed: " + (err.response?.data?.message || err.message || "Try again"));
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const formatTime = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return `${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(2, "0")} ${date.getHours() >= 12 ? "PM" : "AM"}`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-slate-100 transition-all duration-300">
      <div className="hidden lg:flex lg:w-80 flex-col border-r border-indigo-700/40 bg-white/10 backdrop-blur-xl shadow-xl">
        <div className="p-4 border-b border-indigo-700/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">ChatShip</p>
              <h1 className="text-2xl font-black text-white">Message Hub</h1>
            </div>
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white grid place-items-center shadow-lg">C</div>
          </div>
          <div className="flex gap-2 text-xs text-indigo-100">
            <button className="px-3 py-1 rounded-full bg-indigo-600/70 text-white shadow">Chats</button>
            <button className="px-3 py-1 rounded-full bg-white/10 text-indigo-100 hover:bg-white/20 transition">Status</button>
            <button className="px-3 py-1 rounded-full bg-white/10 text-indigo-100 hover:bg-white/20 transition">Calls</button>
          </div>
          <div className="mt-3 relative">
            <input
              placeholder="Search chats"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-indigo-400/30 bg-indigo-900/20 px-3 py-2 text-sm text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <span className="absolute right-3 top-2.5 text-indigo-200">🔍</span>
          </div>
        </div>
          <div className="p-2 overflow-y-auto flex-1 space-y-2">
          {filteredUsers.length ? filteredUsers.map((user) => {
            const isOnline = onlineUsers.includes(String(user.id));
            const active = selectedUser?.id === user.id;
            return (
              <div
                key={user.id}
                onClick={() => loadMessages(user)}
                className={`p-3 rounded-2xl mb-2 cursor-pointer border ${active ? "bg-indigo-600/30 border-indigo-400" : "bg-indigo-900/20 border-indigo-800/40 hover:bg-indigo-800/30"} transition`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white flex items-center justify-center text-sm font-semibold">{user.name[0].toUpperCase()}</div>
                    <span className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white ${isOnline ? "bg-emerald-400" : "bg-slate-400"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <span className="text-[10px] text-slate-400">2:05 PM</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">Quick reply ready</p>
                  </div>
                </div>
              </div>
            );
          }) : <p className="text-slate-500 text-sm p-2">No chats found</p>}
        </div>
        <div className="p-3 border-t border-slate-200">
          <div className="flex justify-between items-center text-slate-600 text-xs">
            <button onClick={() => alert("Chat settings coming soon 👍")} className="px-2 py-1 rounded-lg hover:bg-slate-100">Settings</button>
            <button onClick={() => alert("Need help? Use provided credentials from your teacher or mentor.")} className="px-2 py-1 rounded-lg hover:bg-slate-100">Help</button>
            <button onClick={handleLogout} className="px-2 py-1 rounded-lg hover:bg-slate-100">Logout</button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-indigo-900/70 border-b border-indigo-600/50 px-4 py-3 flex items-center justify-between shadow-xl backdrop-blur-md">
          <div>
            <h2 className="text-base font-semibold text-white">{selectedUser ? `${currentUser?.name || "You"} ↔ ${selectedUser.name}` : "Select a chat"}</h2>
            <p className="text-xs text-indigo-200">{currentUser ? `You are ${currentUser.name}` : "Choose a contact"}</p>
          </div>
          <div className="flex items-center gap-2 text-indigo-100 text-xs">
            <span className="px-2 py-1 rounded-full bg-amber-400/20 text-amber-200">Incognito for 2nd user</span>
            <button onClick={() => alert("Chat settings coming soon 👍")} className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition">Settings</button>
            <button onClick={() => alert("Need help? Open your console or ask your mentor.")} className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition">Help</button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-950 transition">
          {!selectedUser && <div className="h-full flex items-center justify-center text-indigo-200">Select a contact to start chatting</div>}
          {selectedUser && <>
            <div className="space-y-3">
              {messages.map((msg, index) => {
                const mine = Number(msg.sender_id) === Number(userId);
                const isRead = mine ? Number(msg.read_status || msg.read || 0) === 1 : true;
                const readStatus = mine ? (isRead ? "Seen" : "Sent") : "";
                return (
                  <div key={`${index}-${msg.message}-${msg.created_at || index}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[72%] px-3 py-2 rounded-3xl ${mine ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg" : "bg-indigo-100/10 border border-indigo-700/30 text-indigo-100"}`}>
                      <div className="text-sm break-words">{msg.message}</div>
                      <div className="mt-1 flex items-center justify-between text-[10px] opacity-70 text-indigo-200">
                        <span>{formatTime(msg.created_at)}</span>
                        {mine && <span className="text-emerald-200">{readStatus}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {isTyping && <div className="px-2 py-1 text-xs text-indigo-200">{selectedUser.name} is typing...</div>}
          </>}
        </div>

        {selectedUser && <div className="bg-indigo-900/50 border-t border-indigo-700/50 p-3 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition">😊</button>
            <div className="relative flex-1">
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="w-full border border-indigo-500/50 rounded-full bg-indigo-800/30 px-4 py-2 text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {showEmoji && <div className="absolute bottom-12 left-0 z-50"><EmojiPicker onEmojiClick={addEmoji} /></div>}
            </div>
            <button disabled={isSending} onClick={handleSend} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-white font-semibold shadow-lg hover:scale-105 transition disabled:opacity-60">{isSending ? "Sending..." : "Send"}</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

export default Chat;
