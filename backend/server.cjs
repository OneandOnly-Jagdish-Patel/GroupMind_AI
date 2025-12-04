const http = require("http");
const { Server } = require("socket.io");
const WebSocket = require("ws");

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

let debates = [];
let debateMessages = {};
let debateUsers = {};
let debateDebaters = {};
let debateSpectators = {};
let userVotes = {};
let activeSpeechConnections = {}; // Track FastAPI WebSocket connections per debate

function addReply(list, parentId, reply) {
  for (const msg of list) {
    if (msg.id === parentId) {
      msg.replies.push(reply);
      return true;
    }
    if (addReply(msg.replies, parentId, reply)) return true;
  }
  return false;
}

function updateVotes(list, messageId, delta) {
  for (const msg of list) {
    if (msg.id === messageId) {
      msg.votes += delta;
      return true;
    }
    if (updateVotes(msg.replies, messageId, delta)) return true;
  }
  return false;
}

function updateParticipants(debateId) {
  const room = debates.find((d) => d.id === debateId);
  if (room) {
    const set = debateUsers[debateId];
    room.participants = set ? set.size : 0;
    io.emit("debates_update", debates);
  }
}

io.on("connection", (socket) => {
  socket.on("get_debates", () => {
    socket.emit("debates_update", debates);
  });

  socket.on("create_debate", (debate) => {
    debates.push(debate);
    debateMessages[debate.id] = [];
    debateUsers[debate.id] = new Set();
    debateDebaters[debate.id] = new Set();
    debateSpectators[debate.id] = new Set();
    io.emit("debates_update", debates);
  });

  socket.on("join_debate", (debateId) => {
    socket.join(debateId);

    if (!debateUsers[debateId]) debateUsers[debateId] = new Set();
    if (!debateDebaters[debateId]) debateDebaters[debateId] = new Set();
    if (!debateSpectators[debateId]) debateSpectators[debateId] = new Set();

    debateUsers[debateId].add(socket.id);

    let role = "spectator";
    if (debateDebaters[debateId].size < 2) {
      debateDebaters[debateId].add(socket.id);
      role = debateDebaters[debateId].size === 1 ? "debater_A" : "debater_B";
    } else {
      debateSpectators[debateId].add(socket.id);
    }

    updateParticipants(debateId);

    socket.emit("role_assigned", role);
    socket.emit("debate_messages_update", debateMessages[debateId] || []);
  });

  socket.on("leave_debate", (debateId) => {
    if (debateUsers[debateId]) debateUsers[debateId].delete(socket.id);
    if (debateDebaters[debateId]) debateDebaters[debateId].delete(socket.id);
    if (debateSpectators[debateId]) debateSpectators[debateId].delete(socket.id);
    updateParticipants(debateId);
  });

  socket.on("send_message", ({ debateId, message }) => {
    if (!debateMessages[debateId]) debateMessages[debateId] = [];
    debateMessages[debateId].push(message);
    io.to(debateId).emit("debate_messages_update", debateMessages[debateId]);
  });

  socket.on("send_reply", ({ debateId, parentId, reply }) => {
    const list = debateMessages[debateId];
    if (!list) return;
    addReply(list, parentId, reply);
    io.to(debateId).emit("debate_messages_update", list);
  });

  socket.on("vote_message", ({ debateId, messageId, userId, delta }) => {
    if (!userVotes[debateId]) userVotes[debateId] = {};
    if (!userVotes[debateId][messageId]) userVotes[debateId][messageId] = new Set();

    if (delta === 1 && !userVotes[debateId][messageId].has(userId)) {
      userVotes[debateId][messageId].add(userId);
      updateVotes(debateMessages[debateId], messageId, 1);
    }

    if (delta === -1 && userVotes[debateId][messageId].has(userId)) {
      userVotes[debateId][messageId].delete(userId);
      updateVotes(debateMessages[debateId], messageId, -1);
    }

    io.to(debateId).emit("debate_messages_update", debateMessages[debateId]);
  });

  // Handle audio streaming to FastAPI
  socket.on("start_speech_to_text", ({ debateId, mode = "transcript" }) => {
    if (activeSpeechConnections[debateId]) {
      socket.emit("speech_error", { error: "Speech connection already active for this debate" });
      return;
    }

    // Connect to FastAPI WebSocket
    const endpoint = mode === "debate" ? "ws://localhost:8000/ws/debate" : "ws://localhost:8000/ws/transcript";
    const fastApiWs = new WebSocket(endpoint);

    activeSpeechConnections[debateId] = {
      connection: fastApiWs,
      socketId: socket.id,
      mode: mode
    };

    fastApiWs.on("open", () => {
      console.log(`✅ Connected to FastAPI for debate ${debateId} (${mode} mode)`);
      socket.emit("speech_ready", { debateId, mode });
    });

    fastApiWs.on("message", (data) => {
      try {
        const result = JSON.parse(data.toString());
        console.log(`📝 Received from FastAPI:`, result);
        
        if (result.text) {
          console.log(`🎙️ Broadcasting transcript: "${result.text}"`);
          // Broadcast transcription to all users in the debate room
          io.to(debateId).emit("live_transcript_update", {
            text: result.text,
            speaker: socket.id, // You can enhance this with actual speaker identification
            timestamp: Date.now(),
            scores: result.scores || null, // Include AI scores if available
            debateId: debateId
          });
        }
        
        if (result.error) {
          console.log(`❌ FastAPI error:`, result.error);
          socket.emit("speech_error", { error: result.error });
        }
      } catch (e) {
        console.error("Error parsing FastAPI response:", e, "Raw data:", data.toString());
      }
    });

    fastApiWs.on("error", (error) => {
      console.error("FastAPI WebSocket error:", error);
      socket.emit("speech_error", { error: "Connection to speech service failed" });
      delete activeSpeechConnections[debateId];
    });

    fastApiWs.on("close", () => {
      console.log(`FastAPI connection closed for debate ${debateId}`);
      delete activeSpeechConnections[debateId];
      socket.emit("speech_disconnected", { debateId });
    });
  });

  // Forward audio data to FastAPI
  socket.on("send_audio_data", ({ debateId, audioData }) => {
    const connection = activeSpeechConnections[debateId];
    if (connection && connection.connection.readyState === WebSocket.OPEN) {
      // Convert array to Int16Array buffer for FastAPI
      const int16Array = new Int16Array(audioData);
      const buffer = Buffer.from(int16Array.buffer);
      connection.connection.send(buffer);
      console.log(`[DEBUG] Forwarded ${audioData.length} audio samples to FastAPI`);
    }
  });

  // Stop speech-to-text for a debate
  socket.on("stop_speech_to_text", ({ debateId }) => {
    const connection = activeSpeechConnections[debateId];
    if (connection) {
      connection.connection.close();
      delete activeSpeechConnections[debateId];
      socket.emit("speech_disconnected", { debateId });
    }
  });

  socket.on("broadcast_transcript", ({ debateId, text, speaker, timestamp }) => {
    io.to(debateId).emit("live_transcript_update", {
      text,
      speaker,
      timestamp
    });
  });

  socket.on("delete_debate", (id) => {
    debates = debates.filter((d) => d.id !== id);
    delete debateMessages[id];
    delete debateUsers[id];
    delete debateDebaters[id];
    delete debateSpectators[id];
    delete userVotes[id];
    io.emit("debates_update", debates);
  });

  socket.on("disconnect", () => {
    // Clean up speech connections when user disconnects
    for (const [debateId, connection] of Object.entries(activeSpeechConnections)) {
      if (connection.socketId === socket.id) {
        connection.connection.close();
        delete activeSpeechConnections[debateId];
      }
    }

    for (const debateId of Object.keys(debateUsers)) {
      debateUsers[debateId]?.delete(socket.id);
      debateDebaters[debateId]?.delete(socket.id);
      debateSpectators[debateId]?.delete(socket.id);
      updateParticipants(debateId);
    }
  });
});

server.listen(5001, () => {
  console.log("Socket server running on port 5001");
  console.log("Ready to connect to FastAPI speech service on port 8000");
});
