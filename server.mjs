import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // State
  const activeUsers = new Map(); // id -> { id, x, y, name, color, projectId }
  const markers = new Map(); // id -> { id, x, y, projectId, author }
  const comments = new Map(); // markerId -> array of { id, text, author, timestamp }

  io.on("connection", (socket) => {
    // Generate random color for user
    const userColor = `hsl(${Math.random() * 360}, 80%, 70%)`;
    
    activeUsers.set(socket.id, {
      id: socket.id,
      x: 0,
      y: 0,
      name: `Builder-${socket.id.substring(0,4)}`,
      color: userColor,
      projectId: "home" // default
    });

    socket.emit("init", {
      you: activeUsers.get(socket.id),
      users: Array.from(activeUsers.values()),
      markers: Array.from(markers.values()),
      comments: Object.fromEntries(comments)
    });

    io.emit("user-joined", activeUsers.get(socket.id));

    socket.on("join-project", (projectId) => {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.projectId = projectId;
        activeUsers.set(socket.id, user);
        io.emit("user-updated", user);
      }
    });

    socket.on("cursor-move", ({ x, y }) => {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.x = x;
        user.y = y;
        socket.broadcast.emit("cursor-moved", user);
      }
    });

    socket.on("add-marker", (marker) => {
      // marker: { id, x, y, projectId, author }
      markers.set(marker.id, marker);
      comments.set(marker.id, []);
      io.emit("marker-added", marker);
    });

    socket.on("add-comment", (payload) => {
      // payload: { markerId, comment: { id, text, author, timestamp } }
      const markerComments = comments.get(payload.markerId) || [];
      markerComments.push(payload.comment);
      comments.set(payload.markerId, markerComments);
      io.emit("comment-added", payload);
    });

    socket.on("disconnect", () => {
      activeUsers.delete(socket.id);
      io.emit("user-left", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
