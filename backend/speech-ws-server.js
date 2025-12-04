import WebSocket, { WebSocketServer } from "ws";
import fs from "fs";

const wss = new WebSocketServer({ port: 8001 });

console.log("🎤 Voice WebSocket server running on ws://localhost:8001/ws");

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.send(JSON.stringify({ info: "Connected to Speech Server" }));

  ws.on("message", async (data) => {
    // Ensure we received audio, not text packets
    if (!(data instanceof Buffer)) return;

    // Simulating transcription…
    // Later we replace this with OPENAI REAL SPEECH TO TEXT
    const mockText = fakeTranscription();

    ws.send(JSON.stringify({ text: mockText }));
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

/*
  A simple fake ASR system. 
  Replace this with real transcription:
  - Whisper
  - OpenAI Realtime Voice API
  - Deepgram Live
  - Vosk
*/
function fakeTranscription() {
  const samples = [
    "I agree with your point.",
    "Let me explain further.",
    "Here's my argument.",
    "To counter your idea…",
    "Let’s break this down.",
  ];
  return samples[Math.floor(Math.random() * samples.length)];
}
