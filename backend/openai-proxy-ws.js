import WebSocket, { WebSocketServer } from "ws";
import "dotenv/config";

const wss = new WebSocketServer({ port: 8001 });
console.log("🎧 OpenAI Realtime Proxy running at ws://localhost:8001");

// Track pending audio chunks before OpenAI connection is ready
let openaiReady = false;
let pendingAudio = [];

wss.on("connection", (clientWS) => {
  console.log("Client connected → creating OpenAI connection...");

  // CONNECT TO OPENAI REALTIME API
  const openaiWS = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12",
    {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  // OpenAI connection established
  openaiWS.on("open", () => {
    console.log("✅ Connected to OpenAI Realtime API");
    openaiReady = true;

    // Send queued audio
    pendingAudio.forEach(chunk => openaiWS.send(chunk));
    pendingAudio = [];
  });

  // Messages FROM OPENAI → send to client
  openaiWS.on("message", (data) => {
    try {
      clientWS.send(data);
    } catch (err) {
      console.error("Client send error:", err.message);
    }
  });

  // Client sends AUDIO → forward to OpenAI
  clientWS.on("message", (msg) => {
    if (!openaiReady) {
      pendingAudio.push(msg);
      return;
    }

    try {
      openaiWS.send(msg);
    } catch (err) {
      console.error("Send to OpenAI failed:", err.message);
    }
  });

  // Clean disconnect
  clientWS.on("close", () => {
    console.log("Client disconnected");
    openaiWS.close();
  });

  openaiWS.on("close", () => console.log("OpenAI WS closed"));
  openaiWS.on("error", (err) => console.error("OpenAI WS error:", err.message));
});
