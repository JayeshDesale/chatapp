import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Info,
  MessageSquareReply,
  MoreVertical,
  BellOff,
  Camera,
  Copy,
  Image,
  LogOut,
  Moon,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  Search,
  Send,
  Settings,
  Smile,
  Star,
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

const reactionOptions = ["👍", "❤️", "😂", "🔥", "👏"];
const IMAGE_MESSAGE_PREFIX = "__CHATSHIP_IMAGE__";
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_STORY_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

const getMessageKey = (item) => String(item.id || item.created_at || item.message);

const buildImageMessage = ({ name, size, type, dataUrl, caption }) =>
  `${IMAGE_MESSAGE_PREFIX}${JSON.stringify({ name, size, type, dataUrl, caption })}`;

const parseImageMessage = (text = "") => {
  if (!text.startsWith(IMAGE_MESSAGE_PREFIX)) return null;

  try {
    return JSON.parse(text.slice(IMAGE_MESSAGE_PREFIX.length));
  } catch {
    return null;
  }
};

const parseReplyMessage = (text = "") => {
  if (!text.startsWith("Reply to ")) {
    return { replyMeta: null, body: text };
  }

  const separator = "\n---\n";
  const separatorIndex = text.indexOf(separator);
  if (separatorIndex === -1) {
    return { replyMeta: null, body: text };
  }

  const header = text.slice(0, separatorIndex);
  const body = text.slice(separatorIndex + separator.length);
  const match = header.match(/^Reply to (.*?): (.*)$/);

  if (!match) {
    return { replyMeta: null, body: text };
  }

  return {
    replyMeta: {
      name: match[1],
      text: match[2],
    },
    body,
  };
};

function Chat() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stories, setStories] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
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
  const [replyTo, setReplyTo] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem("chatWallpaper") || "plain");
  const [starredMessages, setStarredMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("starredMessages") || "{}");
    } catch {
      return {};
    }
  });
  const [messageReactions, setMessageReactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("messageReactions") || "{}");
    } catch {
      return {};
    }
  });
  const [mutedUsers, setMutedUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mutedUsers") || "[]");
    } catch {
      return [];
    }
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [storyDraft, setStoryDraft] = useState({ image: "", caption: "", name: "" });
  const [groupDraft, setGroupDraft] = useState({ name: "", memberIds: [] });

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const savedUserName = localStorage.getItem("userName");
  const navigate = useNavigate();

  const typingTimerRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const storyInputRef = useRef(null);
  const selectedUserRef = useRef(null);
  const selectedGroupRef = useRef(null);

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
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    localStorage.setItem("chatTheme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("pinnedUsers", JSON.stringify(pinnedUsers));
  }, [pinnedUsers]);

  useEffect(() => {
    localStorage.setItem("starredMessages", JSON.stringify(starredMessages));
  }, [starredMessages]);

  useEffect(() => {
    localStorage.setItem("messageReactions", JSON.stringify(messageReactions));
  }, [messageReactions]);

  useEffect(() => {
    localStorage.setItem("mutedUsers", JSON.stringify(mutedUsers));
  }, [mutedUsers]);

  useEffect(() => {
    localStorage.setItem("chatWallpaper", wallpaper);
  }, [wallpaper]);

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

    const handleReceiveGroupMessage = (data) => {
      if (!data) return;
      const activeGroup = selectedGroupRef.current;

      if (activeGroup && String(data.group_id) === String(activeGroup.id)) {
        setMessages((prev) => [...prev, data]);
      }
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
    socket.on("receiveGroupMessage", handleReceiveGroupMessage);
    socket.on("typing", handleTypingEvent);
    socket.on("messageRead", handleMessageRead);
    socket.on("onlineUsers", setOnlineUsers);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("receiveGroupMessage", handleReceiveGroupMessage);
      socket.off("typing", handleTypingEvent);
      socket.off("messageRead", handleMessageRead);
      socket.off("onlineUsers", setOnlineUsers);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [markMessagesRead, navigate, token, userId]);

  useEffect(() => {
    if (!token) return;

    if (savedUserName) {
      setCurrentUser({
        id: userId,
        name: savedUserName,
        profilePic: localStorage.getItem("profilePic") || "",
      });
    }

    const fetchInitialData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [usersRes, groupsRes, storiesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/users`, { headers }),
          axios.get(`${API_BASE_URL}/api/groups`, { headers }),
          axios.get(`${API_BASE_URL}/api/stories`, { headers }),
        ]);
        setUsers(usersRes.data);
        setGroups(groupsRes.data);
        setStories(storiesRes.data);
      } catch (err) {
        console.error("Load initial chat data failed", err);
      }
    };

    fetchInitialData();
  }, [savedUserName, token, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser, messageSearch]);

  const contactUsers = useMemo(
    () => users.filter((user) => String(user.id) !== String(userId)),
    [userId, users]
  );

  const contactOnlineCount = useMemo(
    () =>
      contactUsers.filter((user) => onlineUsers.includes(String(user.id))).length,
    [contactUsers, onlineUsers]
  );

  const selectedChat = selectedGroup || selectedUser;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return contactUsers
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
  }, [activeFilter, contactUsers, onlineUsers, pinnedUsers, search, unreadByUser]);

  const visibleMessages = useMemo(() => {
    const query = messageSearch.trim().toLowerCase();
    return messages.filter((item) => {
      const key = item.id || item.created_at || item.message;
      if (hiddenMessageIds.includes(String(key))) return false;
      if (!query) return true;
      return String(item.message || "").toLowerCase().includes(query);
    });
  }, [hiddenMessageIds, messageSearch, messages]);

  const selectedStarredCount = useMemo(() => {
    if (!selectedChat) return 0;
    return Object.values(starredMessages).filter(
      (item) => String(item.chatId) === String(selectedChat.id)
    ).length;
  }, [selectedChat, starredMessages]);

  const selectedSharedItemsCount = useMemo(
    () =>
      messages.filter((item) => {
        const value = String(item.message || "");
        return value.includes("Attachment:") || value.includes(IMAGE_MESSAGE_PREFIX);
      }).length,
    [messages]
  );

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
    setSelectedGroup(null);
    setIsReadBySelected(false);
    setShowEmoji(false);
    setMessageSearch("");
    setHiddenMessageIds([]);
    setPendingAttachment(null);
    setReplyTo(null);
    setShowInfoPanel(false);
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

  const loadGroupMessages = async (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setIsReadBySelected(false);
    setShowEmoji(false);
    setMessageSearch("");
    setHiddenMessageIds([]);
    setPendingAttachment(null);
    setReplyTo(null);
    setShowInfoPanel(false);
    setMessage(localStorage.getItem(`draft:group:${group.id}`) || "");

    try {
      const res = await axios.get(`${API_BASE_URL}/api/messages/group/${group.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Load group messages failed", err);
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
    if (selectedGroup) {
      localStorage.setItem(`draft:group:${selectedGroup.id}`, value);
    }
  };

  const handleTyping = () => {
    if (!selectedUser || selectedGroup || !userId) return;
    socket.emit("typing", { toUserId: selectedUser.id, fromUserId: userId });
  };

  const handleSend = async () => {
    if ((!selectedUser && !selectedGroup) || isSending) return;

    const normalized = normalizeMessage(message).trim();
    const replyLine = replyTo
      ? `Reply to ${replyTo.senderName}: ${replyTo.preview}\n---\n`
      : "";
    const imageMessage =
      pendingAttachment?.kind === "image"
        ? buildImageMessage({ ...pendingAttachment, caption: normalized })
        : "";
    const attachmentLine =
      pendingAttachment && pendingAttachment.kind !== "image"
        ? `\n\nAttachment: ${pendingAttachment.name} (${pendingAttachment.size})`
        : "";
    const body = `${replyLine}${imageMessage || normalized}${attachmentLine}`.trim();
    if (!body) return;

    setIsSending(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/messages`,
        {
          receiverId: selectedUser?.id,
          groupId: selectedGroup?.id,
          message: body,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, response.data]);
      setMessage("");
      setPendingAttachment(null);
      setReplyTo(null);
      if (selectedUser) localStorage.removeItem(`draft:${selectedUser.id}`);
      if (selectedGroup) localStorage.removeItem(`draft:group:${selectedGroup.id}`);
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

    if (file.type.startsWith("image/")) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        alert("Please choose an image under 2 MB.");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setPendingAttachment({
          kind: "image",
          name: file.name,
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          type: file.type,
          dataUrl: reader.result,
        });
      };
      reader.readAsDataURL(file);
      event.target.value = "";
      return;
    }

    setPendingAttachment({
      kind: "file",
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

  const toggleMute = (contactId) => {
    const id = String(contactId);
    setMutedUsers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleStar = (item) => {
    if (!selectedChat) return;
    const key = getMessageKey(item);
    setStarredMessages((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }

      return {
        ...prev,
        [key]: {
          chatId: selectedChat.id,
          chatName: selectedChat.name,
          message: item.message,
          created_at: item.created_at,
        },
      };
    });
  };

  const setReaction = (item, reaction) => {
    const key = getMessageKey(item);
    setMessageReactions((prev) => ({
      ...prev,
      [key]: prev[key] === reaction ? "" : reaction,
    }));
  };

  const beginReply = (item, mine, senderName) => {
    const parsed = parseReplyMessage(item.message);
    const image = parseImageMessage(parsed.body);
    setReplyTo({
      senderName: mine ? "You" : senderName || selectedUser?.name || "Contact",
      preview: image ? `Photo: ${image.caption || image.name}` : parsed.body.replace(/\s+/g, " ").slice(0, 90),
    });
  };

  const readImageFile = (file, limitBytes, onLoad) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > limitBytes) {
      alert(`Please choose an image under ${Math.round(limitBytes / 1024 / 1024)} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result, file);
    reader.readAsDataURL(file);
  };

  const updateProfilePicture = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    readImageFile(file, MAX_STORY_IMAGE_SIZE_BYTES, async (dataUrl) => {
      try {
        const res = await axios.put(
          `${API_BASE_URL}/api/users/profile`,
          { profilePic: dataUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCurrentUser(res.data);
        localStorage.setItem("profilePic", res.data.profilePic || "");
        setShowProfileModal(false);
      } catch (err) {
        console.error("Profile update failed", err);
        alert("Profile picture update failed");
      }
    });
  };

  const selectStoryImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    readImageFile(file, MAX_STORY_IMAGE_SIZE_BYTES, (dataUrl, selectedFile) => {
      setStoryDraft((prev) => ({
        ...prev,
        image: dataUrl,
        name: selectedFile.name,
      }));
    });
  };

  const createStory = async () => {
    if (!storyDraft.image) return;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/stories`,
        { image: storyDraft.image, caption: storyDraft.caption },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStories((prev) => [res.data, ...prev]);
      setStoryDraft({ image: "", caption: "", name: "" });
      setShowStoryModal(false);
    } catch (err) {
      console.error("Story upload failed", err);
      alert("Story upload failed");
    }
  };

  const toggleGroupMember = (memberId) => {
    setGroupDraft((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((id) => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  };

  const createGroup = async () => {
    if (!groupDraft.name.trim() || !groupDraft.memberIds.length) return;
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/groups`,
        { name: groupDraft.name, memberIds: groupDraft.memberIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups((prev) => [res.data, ...prev]);
      setGroupDraft({ name: "", memberIds: [] });
      setShowGroupModal(false);
      loadGroupMessages(res.data);
    } catch (err) {
      console.error("Group create failed", err);
      alert("Group create failed");
    }
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
  const selectedMuted = selectedUser && mutedUsers.includes(String(selectedUser.id));
  const selectedMembers = selectedGroup?.members || [];
  const conversationBg =
    wallpaper === "pattern"
      ? "bg-[radial-gradient(circle_at_1px_1px,rgba(34,211,238,0.22)_1px,transparent_0)] bg-[length:22px_22px]"
      : "";

  return (
    <div className={`h-screen overflow-hidden ${themeClasses.shell}`}>
      <div className="flex h-full">
        <aside
          className={`${
            selectedChat ? "hidden lg:flex" : "flex"
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

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowStoryModal(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${themeClasses.panel} ${themeClasses.hover}`}
              >
                <Image size={15} /> Story
              </button>
              <button
                onClick={() => setShowGroupModal(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${themeClasses.panel} ${themeClasses.hover}`}
              >
                <Plus size={15} /> Group
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {stories.length ? (
              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${themeClasses.muted}`}>Stories</p>
                  <span className={`text-xs ${themeClasses.muted}`}>24h</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {stories.map((story) => (
                    <button
                      key={story.id}
                      onClick={() => window.open(story.image, "_blank")}
                      className="shrink-0 text-left"
                      title={story.caption || story.user_name}
                    >
                      <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 p-0.5">
                        <img
                          src={story.image}
                          alt={story.caption || story.user_name}
                          className="h-16 w-16 rounded-[14px] object-cover"
                        />
                      </div>
                      <p className="mt-1 max-w-16 truncate text-[11px]">{story.user_name}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className={`rounded-2xl border p-3 ${themeClasses.panel}`}>
                <p className={`text-xs ${themeClasses.muted}`}>Contacts</p>
                <p className="text-lg font-bold">{contactUsers.length}</p>
              </div>
              <div className={`rounded-2xl border p-3 ${themeClasses.panel}`}>
                <p className={`text-xs ${themeClasses.muted}`}>Online</p>
                <p className="text-lg font-bold">{contactOnlineCount}</p>
              </div>
              <div className={`rounded-2xl border p-3 ${themeClasses.panel}`}>
                <p className={`text-xs ${themeClasses.muted}`}>Unread</p>
                <p className="text-lg font-bold">
                  {Object.values(unreadByUser).reduce((total, count) => total + count, 0)}
                </p>
              </div>
            </div>

            {groups.length ? (
              <div className="mb-4 space-y-2">
                <p className={`px-1 text-xs font-semibold uppercase tracking-[0.16em] ${themeClasses.muted}`}>Groups</p>
                {groups.map((group) => {
                  const active = selectedGroup?.id === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => loadGroupMessages(group)}
                      className={`w-full rounded-2xl border p-3 text-left ${
                        active ? "border-cyan-400 bg-cyan-500/15" : `${themeClasses.panel} ${themeClasses.hover}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
                          <UsersRound size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{group.name}</p>
                          <p className={`truncate text-xs ${themeClasses.muted}`}>
                            {group.members?.length || 0} members
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="space-y-2">
              {filteredUsers.length ? (
                filteredUsers.map((user) => {
                  const isOnline = onlineUsers.includes(String(user.id));
                  const active = selectedUser?.id === user.id;
                  const isPinned = pinnedUsers.includes(String(user.id));
                  const isMuted = mutedUsers.includes(String(user.id));
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
                            {user.profilePic ? (
                              <img src={user.profilePic} alt={user.name} className="h-full w-full rounded-2xl object-cover" />
                            ) : (
                              initials(user.name)
                            )}
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
                            {isMuted && <BellOff size={13} className={themeClasses.muted} />}
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
                <button
                  title="Update profile picture"
                  onClick={() => setShowProfileModal(true)}
                  className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-slate-900 text-white"
                >
                  {currentUser?.profilePic ? (
                    <img src={currentUser.profilePic} alt={currentUser.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={18} />
                  )}
                </button>
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

        <main className={`${selectedChat ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col ${themeClasses.main}`}>
          {selectedChat ? (
            <>
              <header className={`border-b px-4 py-3 ${themeClasses.side}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      title="Back"
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedGroup(null);
                      }}
                      className={`grid h-10 w-10 place-items-center rounded-xl border lg:hidden ${themeClasses.panel}`}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-sm font-black text-slate-950">
                      {selectedGroup ? (
                        <UsersRound size={20} />
                      ) : selectedUser.profilePic ? (
                        <img src={selectedUser.profilePic} alt={selectedUser.name} className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        initials(selectedUser.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold">{selectedChat.name}</h2>
                      <p className={`text-xs ${themeClasses.muted}`}>
                        {selectedGroup
                          ? `${selectedMembers.length} members`
                          : `${activeIsOnline ? "Online" : "Offline"} ${isTyping ? "- typing..." : ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      title={selectedMuted ? "Unmute chat" : "Mute chat"}
                      onClick={() => selectedUser && toggleMute(selectedUser.id)}
                      className={`grid h-10 w-10 place-items-center rounded-xl border ${themeClasses.panel} ${themeClasses.hover}`}
                    >
                      <BellOff size={18} className={selectedMuted ? "text-cyan-400" : ""} />
                    </button>
                    <button
                      title="Pin contact"
                      onClick={() => selectedUser && togglePin(selectedUser.id)}
                      className={`grid h-10 w-10 place-items-center rounded-xl border ${themeClasses.panel} ${themeClasses.hover}`}
                    >
                      {selectedUser && pinnedUsers.includes(String(selectedUser.id)) ? <PinOff size={18} /> : <Pin size={18} />}
                    </button>
                    <button
                      title="Chat info"
                      onClick={() => setShowInfoPanel((value) => !value)}
                      className={`grid h-10 w-10 place-items-center rounded-xl border ${themeClasses.panel} ${themeClasses.hover}`}
                    >
                      <Info size={18} />
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

              {showInfoPanel && (
                <section className={`border-b p-4 ${themeClasses.side}`}>
                  <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-4">
                    <div className={`rounded-2xl border p-3 ${themeClasses.panel}`}>
                      <p className={`text-xs ${themeClasses.muted}`}>Status</p>
                      <p className="mt-1 text-sm font-bold">
                        {selectedGroup ? "Group chat" : activeIsOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                    <div className={`rounded-2xl border p-3 ${themeClasses.panel}`}>
                      <p className={`text-xs ${themeClasses.muted}`}>Starred</p>
                      <p className="mt-1 text-sm font-bold">{selectedStarredCount} messages</p>
                    </div>
                    <div className={`rounded-2xl border p-3 ${themeClasses.panel}`}>
                      <p className={`text-xs ${themeClasses.muted}`}>Shared files</p>
                      <p className="mt-1 text-sm font-bold">{selectedSharedItemsCount} items</p>
                    </div>
                    <button
                      onClick={() => setWallpaper(wallpaper === "plain" ? "pattern" : "plain")}
                      className={`rounded-2xl border p-3 text-left ${themeClasses.panel} ${themeClasses.hover}`}
                    >
                      <p className={`text-xs ${themeClasses.muted}`}>Wallpaper</p>
                      <p className="mt-1 text-sm font-bold">{wallpaper === "plain" ? "Plain" : "Pattern"}</p>
                    </button>
                  </div>
                </section>
              )}

              <section className={`flex-1 overflow-y-auto p-4 ${conversationBg}`}>
                <div className="flex w-full flex-col gap-3 px-0 md:px-6">
                  {visibleMessages.length ? (
                    visibleMessages.map((item, index) => {
                      const mine = String(item.sender_id) === String(userId);
                      const isRead = mine ? Boolean(item.read_status || item.read) : true;
                      const readStatus = mine ? (isRead ? "Seen" : "Sent") : "";
                      const messageKey = getMessageKey(item);
                      const parsed = parseReplyMessage(item.message);
                      const image = parseImageMessage(parsed.body);
                      const reaction = messageReactions[messageKey];
                      const isStarred = Boolean(starredMessages[messageKey]);
                      const senderName = selectedGroup
                        ? selectedMembers.find((member) => String(member.id) === String(item.sender_id))?.name || "Member"
                        : selectedUser?.name || "Contact";

                      return (
                        <div
                          key={`${index}-${item.id || item.created_at || index}`}
                          className={`group flex w-full ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[58%] ${
                              mine
                                ? "bg-cyan-500 text-slate-950"
                                : theme === "dark"
                                  ? "bg-white/10 text-slate-100"
                                  : "bg-white text-slate-900"
                            }`}
                          >
                            {selectedGroup && !mine && (
                              <p className="mb-1 text-xs font-bold opacity-75">{senderName}</p>
                            )}
                            {parsed.replyMeta && (
                              <div
                                className={`mb-2 rounded-xl border-l-4 px-3 py-2 text-xs ${
                                  mine
                                    ? "border-slate-950/40 bg-slate-950/10"
                                    : "border-cyan-400 bg-cyan-400/10"
                                }`}
                              >
                                <p className="font-bold">{parsed.replyMeta.name}</p>
                                <p className="mt-0.5 line-clamp-2 opacity-80">{parsed.replyMeta.text}</p>
                              </div>
                            )}
                            {image ? (
                              <div className="space-y-2">
                                <img
                                  src={image.dataUrl}
                                  alt={image.name || "Shared image"}
                                  className="max-h-[360px] w-full rounded-xl object-cover"
                                />
                                {image.caption && (
                                  <div className="whitespace-pre-wrap break-words text-sm leading-6">
                                    {image.caption}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap break-words text-sm leading-6">{parsed.body}</div>
                            )}
                            {(reaction || isStarred) && (
                              <div className="mt-2 flex items-center gap-1">
                                {reaction && (
                                  <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs">{reaction}</span>
                                )}
                                {isStarred && (
                                  <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs">
                                    <Star size={12} className="inline fill-current" /> Starred
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-between gap-4 text-[11px] opacity-70">
                              <span>{formatTime(item.created_at)}</span>
                              <div className="flex items-center gap-2">
                                {mine && <span>{readStatus}</span>}
                                <button title="Reply" onClick={() => beginReply(item, mine, senderName)}>
                                  <MessageSquareReply size={13} />
                                </button>
                                <button title="Star message" onClick={() => toggleStar(item)}>
                                  <Star size={13} className={isStarred ? "fill-current" : ""} />
                                </button>
                                <button title="Copy message" onClick={() => copyMessage(item.message)}>
                                  <Copy size={13} />
                                </button>
                                <button title="Hide message locally" onClick={() => hideMessage(item)}>
                                  <Trash2 size={13} />
                                </button>
                                <MoreVertical size={13} />
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100">
                              {reactionOptions.map((option) => (
                                <button
                                  key={option}
                                  title={`React ${option}`}
                                  onClick={() => setReaction(item, option)}
                                  className={`rounded-full px-2 py-0.5 text-xs ${
                                    reaction === option ? "bg-white/40" : "bg-white/20"
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
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

                  {replyTo && (
                    <div className={`mb-2 flex items-center justify-between rounded-2xl border px-3 py-2 text-sm ${themeClasses.panel}`}>
                      <div className="min-w-0">
                        <p className="font-semibold">Replying to {replyTo.senderName}</p>
                        <p className={`truncate text-xs ${themeClasses.muted}`}>{replyTo.preview}</p>
                      </div>
                      <button title="Cancel reply" onClick={() => setReplyTo(null)}>
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {pendingAttachment && (
                    <div className={`mb-2 flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm ${themeClasses.panel}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        {pendingAttachment.kind === "image" && (
                          <img
                            src={pendingAttachment.dataUrl}
                            alt={pendingAttachment.name}
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                        )}
                        <span className="truncate">
                          {pendingAttachment.kind === "image" ? "Photo ready" : "Attached"}: {pendingAttachment.name} ({pendingAttachment.size})
                        </span>
                      </div>
                      <button title="Remove attachment" onClick={() => setPendingAttachment(null)}>
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <div className={`relative flex items-center gap-2 rounded-2xl border p-2 ${themeClasses.panel}`}>
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleAttach} />
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

      {showProfileModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className={`w-full max-w-sm rounded-3xl border p-5 ${themeClasses.side}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Profile Picture</h3>
              <button onClick={() => setShowProfileModal(false)} title="Close">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-3xl bg-slate-900 text-white">
                {currentUser?.profilePic ? (
                  <img src={currentUser.profilePic} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={34} />
                )}
              </div>
              <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={updateProfilePicture} />
              <button
                onClick={() => profileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-bold text-slate-950"
              >
                <Camera size={18} /> Upload Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {showStoryModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className={`w-full max-w-md rounded-3xl border p-5 ${themeClasses.side}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Post Story</h3>
              <button onClick={() => setShowStoryModal(false)} title="Close">
                <X size={18} />
              </button>
            </div>
            <input ref={storyInputRef} type="file" accept="image/*" className="hidden" onChange={selectStoryImage} />
            <button
              onClick={() => storyInputRef.current?.click()}
              className={`mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 ${themeClasses.panel} ${themeClasses.hover}`}
            >
              <Image size={18} /> Browse Image
            </button>
            {storyDraft.image && (
              <img src={storyDraft.image} alt={storyDraft.name} className="mb-3 max-h-72 w-full rounded-2xl object-cover" />
            )}
            <textarea
              value={storyDraft.caption}
              onChange={(e) => setStoryDraft((prev) => ({ ...prev, caption: e.target.value }))}
              placeholder="Add a caption"
              rows={3}
              className={`mb-3 w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none ${themeClasses.field}`}
            />
            <button
              disabled={!storyDraft.image}
              onClick={createStory}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"
            >
              Post Story
            </button>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className={`w-full max-w-md rounded-3xl border p-5 ${themeClasses.side}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Create Group</h3>
              <button onClick={() => setShowGroupModal(false)} title="Close">
                <X size={18} />
              </button>
            </div>
            <input
              value={groupDraft.name}
              onChange={(e) => setGroupDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Group name"
              className={`mb-3 w-full rounded-2xl border px-3 py-2 text-sm outline-none ${themeClasses.field}`}
            />
            <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
              {contactUsers.map((user) => (
                <label key={user.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${themeClasses.panel}`}>
                  <input
                    type="checkbox"
                    checked={groupDraft.memberIds.includes(user.id)}
                    onChange={() => toggleGroupMember(user.id)}
                  />
                  <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-cyan-500 text-sm font-bold text-slate-950">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      initials(user.name)
                    )}
                  </div>
                  <span className="font-semibold">{user.name}</span>
                </label>
              ))}
            </div>
            <button
              disabled={!groupDraft.name.trim() || !groupDraft.memberIds.length}
              onClick={createGroup}
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
