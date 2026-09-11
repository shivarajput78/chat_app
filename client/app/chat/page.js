"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import NewChatModal from "@/components/NewChatModal";
import StatusView from "@/components/StatusView";
import ProfileModal from "@/components/ProfileModal";
import CallModal from "@/components/CallModal";
import { otherParticipant } from "@/lib/chatHelpers";

export default function ChatPage() {
  const { user, loading, logout } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [lastSeenMap, setLastSeenMap] = useState({});
  const [typingUser, setTypingUser] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [callState, setCallState] = useState(null);

  const selectedChatRef = useRef(null);
  selectedChatRef.current = selectedChat;
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get("/api/chats").then(({ data }) => setChats(data));
  }, [user]);

  // Global socket listeners, active for the lifetime of the page.
  useEffect(() => {
    if (!socket) return;

    function onReceiveMessage({ chatId, message }) {
      if (selectedChatRef.current?._id === chatId) {
        setMessages((prev) => [...prev, message]);
        api.put(`/api/messages/seen/${chatId}`).then(() => {
          socket.emit("messages_read", { chatId, userId: user._id });
        });
      }
      setChats((prev) => {
        const idx = prev.findIndex((c) => c._id === chatId);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], latestMessage: message };
        const rest = prev.filter((c) => c._id !== chatId);
        return [updated, ...rest];
      });
    }

    function onTyping({ chatId, name }) {
      if (selectedChatRef.current?._id === chatId) setTypingUser(name);
    }
    function onStopTyping({ chatId }) {
      if (selectedChatRef.current?._id === chatId) setTypingUser(null);
    }
    function onMessagesRead({ chatId, userId }) {
      if (selectedChatRef.current?._id === chatId) {
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            readBy: m.readBy.includes(userId) ? m.readBy : [...m.readBy, userId],
          }))
        );
      }
    }
    function onUserOnline({ userId }) {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    }
    function onUserOffline({ userId, lastSeen }) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeen }));
    }
    function onIncomingCall({ from, offer, callType, chatId, callerName, callerAvatar }) {
      setCallState({ role: "incoming", from, offer, callType, chatId, callerName, callerAvatar, status: "ringing" });
    }

    socket.on("receive_message", onReceiveMessage);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStopTyping);
    socket.on("messages_read", onMessagesRead);
    socket.on("user_online", onUserOnline);
    socket.on("user_offline", onUserOffline);
    socket.on("incoming_call", onIncomingCall);

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStopTyping);
      socket.off("messages_read", onMessagesRead);
      socket.off("user_online", onUserOnline);
      socket.off("user_offline", onUserOffline);
      socket.off("incoming_call", onIncomingCall);
    };
  }, [socket, user]);

  async function selectChat(chat) {
    if (selectedChat && socket) socket.emit("leave_chat", selectedChat._id);
    setSelectedChat(chat);
    setTypingUser(null);
    if (socket) socket.emit("join_chat", chat._id);
    const { data } = await api.get(`/api/messages/${chat._id}`);
    setMessages(data);
    await api.put(`/api/messages/seen/${chat._id}`);
    socket?.emit("messages_read", { chatId: chat._id, userId: user._id });
  }

  async function sendMessage(content, file) {
    const form = new FormData();
    form.append("chatId", selectedChat._id);
    form.append("content", content);
    if (file) form.append("media", file);

    const { data: message } = await api.post("/api/messages", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setMessages((prev) => [...prev, message]);
    setChats((prev) => {
      const idx = prev.findIndex((c) => c._id === selectedChat._id);
      if (idx === -1) return prev;
      const updated = { ...prev[idx], latestMessage: message };
      const rest = prev.filter((c) => c._id !== selectedChat._id);
      return [updated, ...rest];
    });
    socket?.emit("send_message", { chatId: selectedChat._id, message });
    socket?.emit("stop_typing", { chatId: selectedChat._id, userId: user._id });
  }

  function handleTyping() {
    if (!socket || !selectedChat) return;
    if (!typingTimeoutRef.current) {
      socket.emit("typing", { chatId: selectedChat._id, userId: user._id, name: user.name });
    } else {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { chatId: selectedChat._id, userId: user._id });
      typingTimeoutRef.current = null;
    }, 2000);
  }

  function handleChatCreated(chat) {
    setChats((prev) => {
      if (prev.find((c) => c._id === chat._id)) return prev;
      return [chat, ...prev];
    });
    selectChat(chat);
  }

  function startCall(callType) {
    const peer = otherParticipant(selectedChat, user._id);
    if (!peer) {
      alert("Calls are only supported in direct messages for now.");
      return;
    }
    setCallState({ role: "outgoing", peer, callType, chatId: selectedChat._id, status: "calling" });
  }

  if (loading || !user) {
    return <div className="h-screen w-screen flex items-center justify-center bg-panel text-muted">Loading...</div>;
  }

  const other = selectedChat ? otherParticipant(selectedChat, user._id) : null;

  return (
    <div className="h-screen w-screen flex bg-panel overflow-hidden">
      <div className={`${selectedChat ? "hidden md:flex" : "flex"} h-full`}>
        <Sidebar
          user={user}
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={selectChat}
          onOpenNewChat={() => setShowNewChat(true)}
          onOpenStatus={() => setShowStatus(true)}
          onOpenProfile={() => setShowProfile(true)}
          onLogout={logout}
          onlineUsers={onlineUsers}
        />
      </div>

      <div className={`${selectedChat ? "flex" : "hidden md:flex"} flex-1`}>
        <ChatWindow
          chat={selectedChat}
          currentUser={user}
          messages={messages}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          typingUser={typingUser}
          onStartCall={startCall}
          isOnline={other ? onlineUsers.has(other._id) : false}
          lastSeen={other ? lastSeenMap[other._id] || other.lastSeen : null}
          onOpenMenu={() => {}}
        />
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onChatCreated={handleChatCreated} />}
      {showStatus && <StatusView user={user} onClose={() => setShowStatus(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      <CallModal socket={socket} currentUser={user} callState={callState} setCallState={setCallState} />
    </div>
  );
}
