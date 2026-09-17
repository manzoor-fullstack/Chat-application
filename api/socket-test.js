const { io } = require("socket.io-client");

const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNjRiZWNmNS1hNzZmLTQ5OTItYjYyMS1jNTE4NzYyM2QwZmEiLCJlbWFpbCI6Im1hbnpvb3JAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6Im1hbnpvb3IiLCJpYXQiOjE3ODk2Mzc0NzQsImV4cCI6MTc4OTYzODM3NH0.k2oxxtuy1xRfdxBxGuklfmpygj4Z6fu6PIvGcT5mFtE";

const CONVERSATION_ID =
  "4354ae8c-b8f3-4036-ac22-2f4ba3b6e7c5";

const socket = io(
  "http://localhost:5000/chat",
  {
    auth: {
      token: ACCESS_TOKEN,
    },
  },
);

socket.on("connect", () => {
  console.log("\n✅ MANZOOR CONNECTED");
  console.log("Socket ID:", socket.id);

  socket.emit("conversation:join", {
    conversationId: CONVERSATION_ID,
  });
});

socket.on("connection:ready", (data) => {
  console.log("\n🔐 MANZOOR CONNECTION READY:");
  console.log(data);
});

socket.on("conversation:joined", (data) => {
  console.log("\n✅ MANZOOR JOINED:");
  console.log(data);
});

socket.on("message:new", (message) => {
  console.log("\n📩 MESSAGE RECEIVED BY MANZOOR:");
  console.log(
    JSON.stringify(message, null, 2)
  );

  console.log(
    "\n👁️ MARKING MESSAGE AS READ..."
  );

  setTimeout(() => {
    socket.emit("message:read", {
      conversationId:
        CONVERSATION_ID,
      messageId: message.id,
    });

    console.log(
      "➡️ message:read SENT"
    );
  }, 1000);
});

socket.on("message:error", (error) => {
  console.error("\n❌ MESSAGE ERROR:");
  console.error(error);
});

socket.on("conversation:error", (error) => {
  console.error("\n❌ CONVERSATION ERROR:");
  console.error(error);
});

socket.on("disconnect", (reason) => {
  console.log("\n🔌 MANZOOR DISCONNECTED:");
  console.log(reason);
});

socket.on("connect_error", (error) => {
  console.error(
    "\n❌ MANZOOR CONNECTION ERROR:"
  );
  console.error(error.message);
});