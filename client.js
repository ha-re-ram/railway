const WebSocket = require("ws");

const socket = new WebSocket("wss://railway-production-0006.up.railway.app");

socket.on("open", () => {
    console.log("Connected to WebSocket server!");
    socket.send(JSON.stringify({ action: "register", deviceId: "my-device-id" }));
});

socket.on("message", (data) => {
    console.log("Message from server:", data.toString());
});

socket.on("error", (error) => {
    console.error("WebSocket error:", error);
});

socket.on("close", () => {
    console.log("WebSocket connection closed.");
});
