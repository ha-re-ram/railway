const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

// Store connected clients
const clients = new Map();

// Store undelivered messages
const pendingMessages = new Map();

wss.on("connection", (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(New client connected from ${clientIp});

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);

            if (data.action === "register") {
                // Register client with their device ID
                const deviceId = data.deviceId;
                if (deviceId) {
                    clients.set(deviceId, ws);
                    console.log(Registered client: ${deviceId});

                    // Send any pending messages
                    if (pendingMessages.has(deviceId)) {
                        const messages = pendingMessages.get(deviceId);
                        messages.forEach((msg) => ws.send(JSON.stringify(msg)));
                        pendingMessages.delete(deviceId);
                    }
                }
                return;
            }

            // Extract sender and receiver correctly
            const senderData = data.senderData;
            const receiverData = data.receiverData;

            if (!senderData || !receiverData) {
                ws.send(JSON.stringify({ error: "Missing sender or receiver data" }));
                return;
            }

            const senderDeviceId = senderData.deviceId;
            const receiverDeviceId = receiverData.deviceId;

            if (!senderDeviceId || !receiverDeviceId) {
                ws.send(JSON.stringify({ error: "Invalid device IDs" }));
                return;
            }

            // Store sender session
            clients.set(senderDeviceId, ws);
            console.log(Sender (${senderDeviceId}) is online.);

            // Forward the message to the receiver if online
            if (clients.has(receiverDeviceId)) {
                console.log(Delivering message to receiver: ${receiverDeviceId});
                clients.get(receiverDeviceId).send(JSON.stringify(data));
            } else {
                console.log(Receiver (${receiverDeviceId}) is offline. Storing message.);
                if (!pendingMessages.has(receiverDeviceId)) {
                    pendingMessages.set(receiverDeviceId, []);
                }
                pendingMessages.get(receiverDeviceId).push(data);
            }
        } catch (error) {
            console.error("Error handling message:", error);
            ws.send(JSON.stringify({ error: "Invalid JSON format" }));
        }
    });

    ws.on("close", () => {
        console.log(Client from ${clientIp} disconnected);

        // Remove disconnected clients
        clients.forEach((client, deviceId) => {
            if (client === ws) {
                clients.delete(deviceId);
                console.log(Removed device: ${deviceId});
            }
        });
    });
});

console.log("WebSocket server is running on ws://localhost:8080");