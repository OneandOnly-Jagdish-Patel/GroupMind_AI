import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { ArrowLeft, Mic, MicOff, ThumbsDown, ThumbsUp } from "lucide-react";
import VoiceVisualizer from "./VoiceVisualizer";

const socket = io("http://localhost:5001");

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
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingRef = useRef<boolean>(false);

  const startRecording = async () => {
    console.log("🎯 START RECORDING CALLED - topicId:", topicId);
    if (!topicId) {
      console.log("❌ No topicId - aborting");
      return;
    }

    try {
      setError(null);
      console.log("🔧 Starting recording process...");
      
      // Get microphone access with optimal settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log("🎤 Microphone access granted");
      streamRef.current = stream;

      // Create audio processing context with proper sample rate
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      // Resume audio context if suspended (required for Chrome)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      console.log("🔊 Audio processing initialized");

      // Process audio in real-time
      processor.onaudioprocess = (event) => {
        // Use recordingRef to avoid stale closure issue with isRecording state
        if (!recordingRef.current) return;
        
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Calculate audio level for visualization
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const average = sum / inputData.length;
        const currentLevel = Math.min(100, average * 1000);
        setLevel(currentLevel);

        console.log(`🎵 PROCESSING AUDIO: level=${currentLevel.toFixed(3)}, samples=${inputData.length}`);

        // Convert Float32Array to Int16Array
        const int16Array = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Array[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
        }

        console.log(`📤 EMITTING AUDIO DATA: debateId=${topicId}, samples=${int16Array.length}`);

        // Send audio data to backend via Socket.IO
        socket.emit("send_audio_data", {
          debateId: topicId,
          audioData: Array.from(int16Array)
        });

        console.log("✅ Audio data emitted successfully");
      };

      // Connect audio processing chain
      source.connect(processor);
      processor.connect(audioContext.destination);

      // Set recording flag (use ref to avoid stale closure in onaudioprocess)
      recordingRef.current = true;
      setIsRecording(true);

      console.log("🔊 Starting speech recognition service...");
      // Tell backend to start speech-to-text session
      socket.emit("start_speech_to_text", {
        debateId: topicId,
        mode: "transcript" // Use "debate" for AI scoring
      });

      console.log("✅ Audio capture started - ready to record!");

    } catch (error) {
      console.error("❌ Recording error:", error);
      setError(`Could not access microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    // Stop recording flag first so the processor stops emitting
    recordingRef.current = false;
    setIsRecording(false);
    setLevel(0);

    // Stop audio processing
    if (processorRef.current) {
      try { 
        processorRef.current.disconnect(); 
      } catch (e) {
        console.log("Processor already disconnected");
      }
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Tell backend to stop speech-to-text session
    if (topicId) {
      socket.emit("stop_speech_to_text", { debateId: topicId });
    }
  };

  const clearTranscription = () => {
    setTranscription("");
  };

  useEffect(() => {
    if (!topicId) return;

    console.log(`🏠 Joining debate room: ${topicId}`);
    console.log("🔌 Socket connected?", socket.connected);
    console.log("🔌 Socket ID:", socket.id);
    socket.emit("join_debate", topicId);

    socket.on("debate_messages_update", (data: DebateMessage[]) => {
      setMessages(data);
    });

    // Listen for live transcription updates from the backend
    socket.on("live_transcript_update", (data: { text: string; speaker: string; timestamp: number; debateId: string }) => {
      console.log("📝 TRANSCRIPT RECEIVED:", data);
      console.log("📝 Transcript text:", data.text);
      setTranscription(data.text);
      setError(null); // Clear any errors when we get successful transcripts
    });

    // Add debugging for all Socket.IO events
    socket.onAny((eventName, ...args) => {
      console.log(`🔌 Socket.IO Event: ${eventName}`, args);
    });

    // Listen for speech service status
    socket.on("speech_ready", (data: { debateId: string; mode: string }) => {
      console.log("🎤 Speech service ready:", data);
      setError(null);
    });

    socket.on("speech_error", (data: { error: string }) => {
      console.error("❌ Speech error:", data);
      setError(data.error);
      setIsRecording(false);
    });

    socket.on("speech_disconnected", (data: { debateId: string }) => {
      console.log("🔌 Speech service disconnected:", data);
      setIsRecording(false);
    });

    // Listen for role assignment (required by the server)
    socket.on("role_assigned", (assignedRole: string) => {
      console.log(`👤 Assigned role: ${assignedRole}`);
    });

    // Socket connection status
    socket.on("connect", () => {
      console.log("✅ Connected to Socket.IO server");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.IO server");
      setError("Disconnected from server");
      setIsRecording(false);
    });

    return () => {
      socket.emit("leave_debate", topicId);
      socket.off("debate_messages_update");
      socket.off("live_transcript_update");
      socket.off("speech_ready");
      socket.off("speech_error");
      socket.off("speech_disconnected");
      socket.off("role_assigned");
      socket.off("connect");
      socket.off("disconnect");
      socket.offAny(); // Remove the debug listener
    };
  }, [topicId]);

  const handleStopSpeaking = () => {
    if (!topicId) return;
    
    stopRecording();
    
    const text = transcription.trim();
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
