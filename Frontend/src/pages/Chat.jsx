import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  LogOut,
  Moon,
  Paperclip,
  Pin,
  PinOff,
  Search,
  Send,
  Settings,
  Smile,
  Sun,
  Trash2,
  UserRound,
  UsersRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;
const socket = io(SOCKET_URL, { autoConnect: true });

const quickReplies = [
  "Yes, that works for me.",
  "I will check and update you.",
  "Can we discuss this today?",
  "Thanks for the update.",
];

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
  const [messageSearch, setMessageSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [theme, setTheme] = useState(() => localStorage.getItem("chatTheme") || "dark");
  const [pinnedUsers, setPinnedUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pinnedUsers") || "[]");
    } catch {
      return [];
    }
  });
  const [unreadByUser, setUnreadByUser] = useState({});
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [hiddenMessageIds, setHiddenMessageIds] = useState([]);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const savedUserName = localStorage.getItem("userName");
  const navigate = useNavigate();

  const typingTimerRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedUserRef = useRef(null);

  const markMessagesRead = useCallback(
    async (senderId) => {
      if (!senderId || !token) return;
      try {
        await axios.post(
          `${API_BASE_URL}/api/messages/read`,
          { sender_id: senderId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsReadBySelected(true);
        setUnreadByUser((prev) => ({ ...prev, [senderId]: 0 }));
      } catch (err) {
        console.error("Mark read failed", err);
      }
    },
    [token]
  );

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    localStorage.setItem("chatTheme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("pinnedUsers", JSON.stringify(pinnedUsers));
  }, [pinnedUsers]);

  useEffect(() => {
    if (!token || !userId) {
      navigate("/");
      return;
    }

    socket.emit("join", userId);

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join", userId);
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleReceiveMessage = (data) => {
      if (!data) return;
      const activeChat = selectedUserRef.current;

      if (activeChat && String(data.sender_id) === String(activeChat.id)) {
        setMessages((prev) => [...prev, data]);
        markMessagesRead(activeChat.id);
        socket.emit("messageRead", { toUserId: activeChat.id, fromUserId: userId });
        return;
      }

      setUnreadByUser((prev) => ({
        ...prev,
        [data.sender_id]: (prev[data.sender_id] || 0) + 1,
      }));
    };

    const handleTypingEvent = (data) => {
      const activeChat = selectedUserRef.current;
      if (activeChat && String(data.fromUserId) === String(activeChat.id)) {
        setIsTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 1200);
      }
    };

    const handleMessageRead = (data) => {
      const activeChat = selectedUserRef.current;
      if (activeChat && String(data.fromUserId) === String(activeChat.id)) {
        setIsReadBySelected(true);
        setMessages((prev) =>
          prev.map((item) =>
            String(item.sender_id) === String(userId)
              ? { ...item, read_status: true }
              : item
          )
        );
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTypingEvent);
    socket.on("messageRead", handleMessageRead);
    socket.on("onlineUsers", setOnlineUsers);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTypingEvent);
      socket.off("messageRead", handleMessageRead);
      socket.off("onlineUsers", setOnlineUsers);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [markMessagesRead, navigate, token, userId]);

  useEffect(() => {
    if (!token) return;

    if (savedUserName) {
      setCurrentUser({ id: userId, name: savedUserName });
    }

    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Load users failed", err);
      }
    };

    fetchUsers();
  }, [savedUserName, token, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser, messageSearch]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(query);
        const isOnline = onlineUsers.includes(String(user.id));
        const isPinned = pinnedUsers.includes(String(user.id));

        if (!matchesSearch) return false;
        if (activeFilter === "online") return isOnline;
        if (activeFilter === "pinned") return isPinned;
        if (activeFilter === "unread") return Boolean(unreadByUser[user.id]);
        return true;
      })
      .sort((a, b) => {
        const aPinned = pinnedUsers.includes(String(a.id));
        const bPinned = pinnedUsers.includes(String(b.id));
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [activeFilter, onlineUsers, pinnedUsers, search, unreadByUser, users]);

  const visibleMessages = useMemo(() => {
    const query = messageSearch.trim().toLowerCase();
    return messages.filter((item) => {
      const key = item.id || item.created_at || item.message;
      if (hiddenMessageIds.includes(String(key))) return false;
      if (!query) return true;
      return String(item.message || "").toLowerCase().includes(query);
    });
  }, [hiddenMessageIds, messageSearch, messages]);

  const themeClasses =
    theme === "dark"
      ? {
          shell: "bg-[#111827] text-slate-100",
          side: "bg-[#172033] border-white/10",
          main: "bg-[#0f172a]",
          panel: "bg-white/5 border-white/10",
          field: "bg-[#0f172a] border-white/10 text-white placeholder:text-slate-500",
          muted: "text-slate-400",
          hover: "hover:bg-white/10",
        }
      : {
          shell: "bg-[#eef2f7] text-slate-900",
          side: "bg-white border-slate-200",
          main: "bg-[#f6f8fb]",
          panel: "bg-white border-slate-200",
          field: "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
          muted: "text-slate-500",
          hover: "hover:bg-slate-100",
        };

  const initials = (name = "?") =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const loadMessages = async (user) => {
    setSelectedUser(user);
    setIsReadBySelected(false);
    setShowEmoji(false);
    setMessageSearch("");
    setHiddenMessageIds([]);
    setPendingAttachment(null);
    setMessage(localStorage.getItem(`draft:${user.id}`) || "");

    try {
      const res = await axios.get(`${API_BASE_URL}/api/messages/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages(res.data);
      socket.emit("messageRead", { toUserId: user.id, fromUserId: userId });
      await markMessagesRead(user.id);
      setMessages((prev) =>
        prev.map((item) =>
          String(item.sender_id) === String(user.id)
            ? { ...item, read_status: true }
            : item
        )
      );
    } catch (err) {
      console.error("Load messages failed", err);
      setMessages([]);
    }
  };

  const normalizeMessage = (value) => {
    if (typeof value === "string") return value;
    if (value == null) return "";
    if (typeof value === "object") {
      if (typeof value.emoji === "string") return value.emoji;
      if (typeof value.sticker === "string") return value.sticker;
      if (typeof value.url === "string") return value.url;
      return JSON.stringify(value);
    }
    return String(value);
  };

  const updateDraft = (value) => {
    setMessage(value);
    if (selectedUser) {
      localStorage.setItem(`draft:${selectedUser.id}`, value);
    }
  };

  const handleTyping = () => {
    if (!selectedUser || !userId) return;
    socket.emit("typing", { toUserId: selectedUser.id, fromUserId: userId });
  };

  const handleSend = async () => {
    if (!selectedUser || isSending) return;

    const normalized = normalizeMessage(message).trim();
    const attachmentLine = pendingAttachment
      ? `\n\nAttachment: ${pendingAttachment.name} (${pendingAttachment.size})`
      : "";
    const body = `${normalized}${attachmentLine}`.trim();
    if (!body) return;

    setIsSending(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/messages`,
        {
          receiverId: selectedUser.id,
          message: body,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, response.data]);
      setMessage("");
      setPendingAttachment(null);
      localStorage.removeItem(`draft:${selectedUser.id}`);
      setIsReadBySelected(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emojiData) => {
    updateDraft(message + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleAttach = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingAttachment({
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      type: file.type || "file",
    });
    event.target.value = "";
  };

  const togglePin = (contactId) => {
    const id = String(contactId);
    setPinnedUsers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const hideMessage = (item) => {
    const key = item.id || item.created_at || item.message;
    setHiddenMessageIds((prev) => [...prev, String(key)]);
  };

  const copyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return `${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(2, "0")} ${
      date.getHours() >= 12 ? "PM" : "AM"
    }`;
  };

  const activeIsOnline = selectedUser && onlineUsers.includes(String(selectedUser.id));

  return (
    <div className={`h-screen overflow-hidden ${themeClasses.shell}`}>
      <div className="flex h-full">
        <aside
          className={`${
            selectedUser ? "hidden lg:flex" : "flex"
          } w-full lg:w-[380px] flex-col border-r ${themeClasses.side}`}
        >
          <div className="border-b border-inherit p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500 text-sm font-black text-slate-950">
                  CS
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${themeClasses.muted}`}>
                    ChatShip
                  </p>
                  <h1 className="text-xl font-bold leading-tight">Inbox</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  title="Toggle theme"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={`grid h-10 w-10 place-items-center rounded-xl border ${themeClasses.panel} ${themeClasses.hover}`}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button
                  title="Logout"
                  onClick={handleLogout}
                  className={`grid h-10 w-10 place-items-center rounded-xl border ${themeClasses.panel} ${themeClasses.hover}`}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>

            <div className={`mt-4 flex items-center gap-2 rounded-2xl border px-3 py-2 ${themeClasses.field}`}>
              <Search size={17} className={themeClasses.muted} />
              <input
                placeholder="Search contacts"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 text-xs font-semibold">
              {["all", "online", "unread", "pinned"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-xl px-3 py-2 capitalize ${
                    activeFilter === filter
                      ? "bg-cyan-500 text-slate-950"
                      : `border ${themeClasses.panel} ${themeClasses.hover}`
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className={`rounded-2xl border p-3 ${themeClasses.panel}`}>
                <p className={`text-xs ${themeClasses.muted}`}>Contacts</p>
                <p className="text-lg font-bold">{users.length}</p>
              </div>
              <div className={`rounded-2xl border p-3 ${themeClasses.panel}`}>
                <p className={`text-xs ${themeClasses.muted}`}>Online</p>
                <p className="text-lg font-bold">{onlineUsers.length}</p>
              </div>
              <div className={`rounded-2xl border p-3 ${themeClasses.panel}`}>
                <p className={`text-xs ${themeClasses.muted}`}>Unread</p>
                <p className="text-lg font-bold">
                  {Object.values(unreadByUser).reduce((total, count) => total + count, 0)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {filteredUsers.length ? (
                filteredUsers.map((user) => {
                  const isOnline = onlineUsers.includes(String(user.id));
                  const active = selectedUser?.id === user.id;
                  const isPinned = pinnedUsers.includes(String(user.id));
                  const unread = unreadByUser[user.id] || 0;

                  return (
                    <button
                      key={user.id}
                      onClick={() => loadMessages(user)}
                      className={`w-full rounded-2xl border p-3 text-left ${
                        active
                          ? "border-cyan-400 bg-cyan-500/15"
                          : `${themeClasses.panel} ${themeClasses.hover}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-sm font-black text-slate-950">
                            {initials(user.name)}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 ${
                              theme === "dark" ? "border-[#172033]" : "border-white"
                            } ${isOnline ? "bg-emerald-400" : "bg-slate-400"}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold">{user.name}</p>
                            {isPinned && <Pin size={13} className="text-cyan-400" />}
                          </div>
                          <p className={`truncate text-xs ${themeClasses.muted}`}>
                            {isOnline ? "Online now" : "Offline"} {unread ? `- ${unread} new` : ""}
                          </p>
                        </div>
                        {unread ? (
                          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-cyan-500 px-2 text-xs font-bold text-slate-950">
                            {unread}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className={`rounded-2xl border p-5 text-center text-sm ${themeClasses.panel} ${themeClasses.muted}`}>
                  No contacts match this view.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-inherit p-3">
            <div className={`flex items-center justify-between rounded-2xl border p-3 ${themeClasses.panel}`}>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
                  <UserRound size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{currentUser?.name || "You"}</p>
                  <p className={`flex items-center gap-1 text-xs ${themeClasses.muted}`}>
                    {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
                    {isConnected ? "Realtime connected" : "Reconnecting"}
                  </p>
                </div>
              </div>
              <Settings size={18} className={themeClasses.muted} />
            </div>
          </div>
        </aside>

        <main className={`${selectedUser ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col ${themeClasses.main}`}>
          {selectedUser ? (
            <>
              <header className={`border-b px-4 py-3 ${themeClasses.side}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      title="Back"
                      onClick={() => setSelectedUser(null)}
                      className={`grid h-10 w-10 place-items-center rounded-xl border lg:hidden ${themeClasses.panel}`}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-sm font-black text-slate-950">
                      {initials(selectedUser.name)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold">{selectedUser.name}</h2>
                      <p className={`text-xs ${themeClasses.muted}`}>
                        {activeIsOnline ? "Online" : "Offline"} {isTyping ? "- typing..." : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      title="Pin contact"
                      onClick={() => togglePin(selectedUser.id)}
                      className={`grid h-10 w-10 place-items-center rounded-xl border ${themeClasses.panel} ${themeClasses.hover}`}
                    >
                      {pinnedUsers.includes(String(selectedUser.id)) ? <PinOff size={18} /> : <Pin size={18} />}
                    </button>
                    <div className={`hidden items-center gap-2 rounded-xl border px-3 py-2 sm:flex ${themeClasses.panel}`}>
                      {isReadBySelected ? <CheckCheck size={16} className="text-cyan-400" /> : <Check size={16} />}
                      <span className="text-xs font-semibold">{isReadBySelected ? "Seen" : "Live chat"}</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-3 flex items-center gap-2 rounded-2xl border px-3 py-2 ${themeClasses.field}`}>
                  <Search size={16} className={themeClasses.muted} />
                  <input
                    placeholder="Search in conversation"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  {messageSearch && (
                    <button title="Clear search" onClick={() => setMessageSearch("")}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              </header>

              <section className="flex-1 overflow-y-auto p-4">
                <div className="mx-auto flex max-w-4xl flex-col gap-3">
                  {visibleMessages.length ? (
                    visibleMessages.map((item, index) => {
                      const mine = String(item.sender_id) === String(userId);
                      const isRead = mine ? Boolean(item.read_status || item.read) : true;
                      const readStatus = mine ? (isRead ? "Seen" : "Sent") : "";

                      return (
                        <div
                          key={`${index}-${item.id || item.created_at || index}`}
                          className={`group flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[68%] ${
                              mine
                                ? "bg-cyan-500 text-slate-950"
                                : theme === "dark"
                                  ? "bg-white/10 text-slate-100"
                                  : "bg-white text-slate-900"
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words text-sm leading-6">{item.message}</div>
                            <div className="mt-2 flex items-center justify-between gap-4 text-[11px] opacity-70">
                              <span>{formatTime(item.created_at)}</span>
                              <div className="flex items-center gap-2">
                                {mine && <span>{readStatus}</span>}
                                <button title="Copy message" onClick={() => copyMessage(item.message)}>
                                  <Copy size={13} />
                                </button>
                                <button title="Hide message locally" onClick={() => hideMessage(item)}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={`mt-10 rounded-3xl border p-8 text-center ${themeClasses.panel}`}>
                      <UsersRound className={`mx-auto mb-3 ${themeClasses.muted}`} />
                      <p className="font-semibold">No messages in this view</p>
                      <p className={`mt-1 text-sm ${themeClasses.muted}`}>
                        Start the conversation or clear the message search.
                      </p>
                    </div>
                  )}

                  {isTyping && (
                    <div className={`w-fit rounded-full border px-3 py-1 text-xs ${themeClasses.panel} ${themeClasses.muted}`}>
                      {selectedUser.name} is typing...
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </section>

              <footer className={`border-t p-3 ${themeClasses.side}`}>
                <div className="mx-auto max-w-4xl">
                  <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                    {quickReplies.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => updateDraft(reply)}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${themeClasses.panel} ${themeClasses.hover}`}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>

                  {pendingAttachment && (
                    <div className={`mb-2 flex items-center justify-between rounded-2xl border px-3 py-2 text-sm ${themeClasses.panel}`}>
                      <span className="truncate">
                        Attached: {pendingAttachment.name} ({pendingAttachment.size})
                      </span>
                      <button title="Remove attachment" onClick={() => setPendingAttachment(null)}>
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <div className={`relative flex items-center gap-2 rounded-2xl border p-2 ${themeClasses.panel}`}>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleAttach} />
                    <button
                      title="Attach file"
                      onClick={() => fileInputRef.current?.click()}
                      className={`grid h-11 w-11 place-items-center rounded-xl ${themeClasses.hover}`}
                    >
                      <Paperclip size={19} />
                    </button>
                    <button
                      title="Emoji"
                      onClick={() => setShowEmoji(!showEmoji)}
                      className={`grid h-11 w-11 place-items-center rounded-xl ${themeClasses.hover}`}
                    >
                      <Smile size={19} />
                    </button>
                    <textarea
                      value={message}
                      onChange={(e) => {
                        updateDraft(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message"
                      rows={1}
                      className={`max-h-28 min-h-11 flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none ${themeClasses.field}`}
                    />
                    <button
                      title="Send"
                      disabled={isSending}
                      onClick={handleSend}
                      className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-500 text-slate-950 disabled:opacity-60"
                    >
                      <Send size={19} />
                    </button>
                    {showEmoji && (
                      <div className="absolute bottom-16 left-2 z-50">
                        <EmojiPicker onEmojiClick={addEmoji} theme={theme} />
                      </div>
                    )}
                  </div>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <div className={`max-w-sm rounded-3xl border p-8 text-center ${themeClasses.panel}`}>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-500 text-slate-950">
                  <UsersRound size={24} />
                </div>
                <h2 className="text-xl font-bold">Select a conversation</h2>
                <p className={`mt-2 text-sm ${themeClasses.muted}`}>
                  Choose a contact from the inbox to send messages, emojis, quick replies, and file notes.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Chat;
