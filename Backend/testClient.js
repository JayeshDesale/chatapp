import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const userId = process.argv[2]; // pass user id when running

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);

  socket.emit("join", userId);
});

// Listen for incoming messages
socket.on("receiveMessage", (data) => {
  console.log("New message received:", data);
});

// Send test message after 5 seconds
setTimeout(() => {
  socket.emit("sendMessage", {
    sender_id: userId,
    receiver_id: userId === "1" ? "2" : "1",
    message: "Hello from user " + userId,
  });
}, 5000);
