import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { ArrowLeft, Mic, MicOff, ThumbsDown, ThumbsUp } from "lucide-react";
import { useLiveTranscription } from "../hooks/useLiveTranscription";
import VoiceVisualizer from "./VoiceVisualizer";

const socket = io("http://localhost:5000");

interface DebateMeta {
  id: string;
  title: string;
  description: string;
  debaters: number;
  spectators: number;
}

interface DebateMessage {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  votes: number;
}

type Role = "debater_A" | "debater_B" | "spectator";

const DebateRoom = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const debate = (location.state?.debate as DebateMeta) || null;
  const initialRole: Role = location.state?.role || "spectator";

  const [role] = useState<Role>(initialRole);
  const [messages, setMessages] = useState<DebateMessage[]>([]);

  const {
    isRecording,
    transcription,
    error,
    level,
    startRecording,
    stopRecording,
    clearTranscription
  } = useLiveTranscription();

  useEffect(() => {
    if (!topicId) return;

    socket.emit("join_debate", topicId);

    socket.on("debate_messages_update", (data: DebateMessage[]) => {
      setMessages(data);
    });

    return () => {
      socket.emit("leave_debate", topicId);
      socket.off("debate_messages_update");
    };
  }, [topicId]);

  const handleStopSpeaking = () => {
    if (!topicId) return;
    const text = transcription.trim();
    stopRecording();
    if (!text) return;

    const author =
      role === "debater_A" ? "Debater A" : role === "debater_B" ? "Debater B" : "User";

    const message: DebateMessage = {
      id: Date.now().toString(),
      text,
      author,
      timestamp: Date.now(),
      votes: 0
    };

    socket.emit("send_message", { debateId: topicId, message });
    clearTranscription();
  };

  const voteMessage = (messageId: string, delta: 1 | -1) => {
    if (!topicId) return;
    socket.emit("vote_message", {
      debateId: topicId,
      messageId,
      userId: socket.id,
      delta
    });
  };

  const roleLabel =
    role === "debater_A"
      ? "You are Debater A"
      : role === "debater_B"
      ? "You are Debater B"
      : "You are a Spectator";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{debate?.title || "Live Debate"}</h1>
            {debate?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {debate.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{roleLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-base p-6 text-center">
              {role === "spectator" ? (
                <div className="text-muted-foreground py-6">
                  Spectators cannot speak. Waiting for debaters...
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    {isRecording ? (
                      <button
                        onClick={handleStopSpeaking}
                        className="px-6 py-3 rounded-xl bg-red-500 text-white flex items-center gap-2"
                      >
                        <MicOff className="w-5 h-5" />
                        Stop Speaking
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground flex items-center gap-2"
                      >
                        <Mic className="w-5 h-5" />
                        Start Speaking
                      </button>
                    )}
                  </div>

                  <div className="flex justify-center mb-4">
                    <VoiceVisualizer level={level} active={isRecording} />
                  </div>

                  <div className="min-h-[80px] p-4 bg-secondary rounded-lg text-left text-sm">
                    {transcription || "Start speaking to generate live transcription..."}
                  </div>

                  {error && (
                    <div className="text-red-500 mt-2 text-sm">{error}</div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="card-base p-4 max-h-[70vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-3">Debate Transcript</h2>
            {messages.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No arguments yet. Once debaters speak, transcripts will appear here.
              </p>
            )}
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-lg bg-secondary">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      {msg.author} •{" "}
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => voteMessage(msg.id, 1)}
                        className="p-1 rounded bg-primary/10"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">
                        {msg.votes}
                      </span>
                      <button
                        onClick={() => voteMessage(msg.id, -1)}
                        className="p-1 rounded bg-destructive/10"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebateRoom;
