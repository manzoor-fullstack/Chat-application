const { io } = require("socket.io-client");

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZTdkY2VkYi0yM2Y2LTQxYWEtOTYwMi04NjM3NTRhZGM3NjQiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG4iLCJpYXQiOjE3ODk2Mzc1MTUsImV4cCI6MTc4OTYzODQxNX0.bM8Rhvx8y_EpEWxWMY5_vVU7syxoaEoGCmhoFUvuFnA";

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
  console.log("\n✅ JOHN CONNECTED");
  console.log("Socket ID:", socket.id);

  socket.emit("conversation:join", {
    conversationId: CONVERSATION_ID,
  });
});

socket.on("connection:ready", (data) => {
  console.log("\n🔐 JOHN CONNECTION READY:");
  console.log(data);
});

socket.on("conversation:joined", (data) => {
  console.log("\n✅ JOHN JOINED:");
  console.log(data);

  setTimeout(() => {
    console.log(
      "\n📤 JOHN SENDING MESSAGE..."
    );

    socket.emit("message:send", {
      conversationId: CONVERSATION_ID,
      content:
        "Read receipt test message2 ✅",
    });
  }, 1000);
});

socket.on("message:new", (message) => {
  console.log("\n🔥 NEW MESSAGE:");
  console.log(
    JSON.stringify(message, null, 2)
  );
});

socket.on("message:read", (data) => {
  console.log("\n👁️ MESSAGE READ RECEIPT:");
  console.log(
    JSON.stringify(data, null, 2)
  );
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
  console.log("\n🔌 JOHN DISCONNECTED:");
  console.log(reason);
});

socket.on("connect_error", (error) => {
  console.error(
    "\n❌ JOHN CONNECTION ERROR:"
  );
  console.error(error.message);
});