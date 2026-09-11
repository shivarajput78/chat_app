"use client";
import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// callState shapes:
// outgoing: { role: "outgoing", peer: {_id,name,avatar}, callType, chatId, status: "calling" | "in-call" }
// incoming: { role: "incoming", from, callerName, callerAvatar, callType, chatId, offer, status: "ringing" | "in-call" }
export default function CallModal({ socket, currentUser, callState, setCallState }) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const peerId = callState?.role === "outgoing" ? callState.peer._id : callState?.from;
  const isVideo = callState?.callType === "video";

  function cleanup() {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  }

  function endCall(notifyPeer = true) {
    if (notifyPeer && peerId) socket?.emit("end_call", { to: peerId });
    cleanup();
    setCallState(null);
  }

  async function createPeerConnection(targetId) {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (e) => {
      if (e.candidate) socket?.emit("ice_candidate", { to: targetId, candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    pcRef.current = pc;
    return pc;
  }

  // Set up outgoing call: get media, create offer, send it.
  useEffect(() => {
    if (!callState || callState.role !== "outgoing" || callState.status !== "calling") return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideo,
          audio: true,
        });
        if (cancelled) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = await createPeerConnection(callState.peer._id);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.emit("call_user", {
          to: callState.peer._id,
          from: currentUser._id,
          offer,
          callType: callState.callType,
          chatId: callState.chatId,
          callerName: currentUser.name,
          callerAvatar: currentUser.avatar,
        });
      } catch (err) {
        console.error("Could not start call", err);
        endCall(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState?.role, callState?.status]);

  // Socket listeners for the lifetime of an active call.
  useEffect(() => {
    if (!socket || !callState) return;

    async function onCallAnswered({ answer }) {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState((c) => (c ? { ...c, status: "in-call" } : c));
      }
    }
    async function onIceCandidate({ candidate }) {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE candidate error", err);
      }
    }
    function onCallRejected() {
      cleanup();
      setCallState(null);
    }
    function onCallEnded() {
      cleanup();
      setCallState(null);
    }

    socket.on("call_answered", onCallAnswered);
    socket.on("ice_candidate", onIceCandidate);
    socket.on("call_rejected", onCallRejected);
    socket.on("call_ended", onCallEnded);

    return () => {
      socket.off("call_answered", onCallAnswered);
      socket.off("ice_candidate", onIceCandidate);
      socket.off("call_rejected", onCallRejected);
      socket.off("call_ended", onCallEnded);
    };
  }, [socket, callState]);

  async function acceptCall() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = await createPeerConnection(callState.from);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit("answer_call", { to: callState.from, answer });
      setCallState((c) => (c ? { ...c, status: "in-call" } : c));
    } catch (err) {
      console.error("Could not accept call", err);
      rejectCall();
    }
  }

  function rejectCall() {
    socket?.emit("reject_call", { to: callState.from });
    setCallState(null);
  }

  function toggleMute() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  }

  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOff(!track.enabled);
    }
  }

  if (!callState) return null;

  const isRinging = callState.role === "incoming" && callState.status === "ringing";
  const name = callState.role === "outgoing" ? callState.peer.name : callState.callerName;
  const avatar = callState.role === "outgoing" ? callState.peer.avatar : callState.callerAvatar;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white">
      {isVideo && callState.status === "in-call" && (
        <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
      )}

      {(!isVideo || callState.status !== "in-call") && (
        <div className="flex flex-col items-center mt-10">
          <Avatar src={avatar} name={name} size={110} />
          <h2 className="text-2xl mt-4">{name}</h2>
          <p className="text-muted mt-1">
            {isRinging
              ? `Incoming ${callState.callType} call...`
              : callState.status === "calling"
              ? "Calling..."
              : "In call"}
          </p>
        </div>
      )}

      {isVideo && callState.status === "in-call" && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-24 right-6 w-32 h-44 object-cover rounded-xl border border-line"
        />
      )}

      <div className="absolute bottom-10 flex items-center gap-6">
        {isRinging ? (
          <>
            <button onClick={rejectCall} className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-xl">
              ✕
            </button>
            <button onClick={acceptCall} className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-xl text-panel">
              ✓
            </button>
          </>
        ) : (
          <>
            <button onClick={toggleMute} className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              {muted ? "🔇" : "🎙️"}
            </button>
            {isVideo && (
              <button onClick={toggleCamera} className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                {camOff ? "📷🚫" : "📷"}
              </button>
            )}
            <button onClick={() => endCall(true)} className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-xl">
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
}
