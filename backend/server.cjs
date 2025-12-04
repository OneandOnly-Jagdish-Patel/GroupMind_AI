const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

let debates = [];
let debateMessages = {};
let debateUsers = {};
let debateDebaters = {};
let debateSpectators = {};
let userVotes = {};

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
    for (const debateId of Object.keys(debateUsers)) {
      debateUsers[debateId]?.delete(socket.id);
      debateDebaters[debateId]?.delete(socket.id);
      debateSpectators[debateId]?.delete(socket.id);
      updateParticipants(debateId);
    }
  });
});

server.listen(5000, () => {
  console.log("Socket server running on port 5000");
});
