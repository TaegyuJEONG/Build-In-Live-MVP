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
    // Generate identity: prioritize tokens from localStorage (sent via query)
    const savedId = socket.handshake.query.savedId;
    const savedName = socket.handshake.query.savedName;
    const userColor = `hsl(${Math.random() * 360}, 80%, 70%)`;
    
    // Generate human-like identity
    const generateHumanName = () => {
      const names = [
        "Sarah Chen", "Elena Rodriguez", "Alex Thompson", "Jun-ho Kim", 
        "Aisha Roberts", "Lucas Meyer", "Yuki Tanaka", "Sanjay Gupta",
        "Sofia Bianchi", "Marcus Webb", "Chloe Dubois", "Kenji Sato",
        "Amara Okafor", "Liam O'Connor", "Zoe Fischer", "Mateo Silva"
      ];
      return names[Math.floor(Math.random() * names.length)];
    };

    const userId = savedId || socket.id;
    const userName = savedName || generateHumanName();

    const user = {
      id: userId,
      x: 0,
      y: 0,
      name: userName,
      color: userColor,
      projectId: "home"
    };

    activeUsers.set(socket.id, user);

    socket.emit("init", {
      you: user,
      users: Array.from(activeUsers.values()),
      markers: Array.from(markers.values()),
      comments: Object.fromEntries(comments)
    });

    socket.broadcast.emit("user-joined", user);

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
      markers.set(marker.id, marker);
      comments.set(marker.id, []);
      io.emit("marker-added", marker);
    });

    socket.on("add-comment", (payload) => {
      const markerComments = comments.get(payload.markerId) || [];
      markerComments.push(payload.comment);
      comments.set(payload.markerId, markerComments);
      io.emit("comment-added", payload);
    });

    socket.on("delete-marker", (markerId) => {
      console.log(`[SERVER] Deleting marker ${markerId}`);
      markers.delete(markerId);
      comments.delete(markerId);
      io.emit("marker-deleted", markerId);
    });

    socket.on("delete-comment", ({ markerId, commentId }) => {
      console.log(`[SERVER] Deleting comment ${commentId} from marker ${markerId}`);
      let markerComments = comments.get(markerId) || [];
      const updatedComments = markerComments.filter(c => c.id !== commentId);
      comments.set(markerId, updatedComments);
      io.emit("comment-deleted", { markerId, commentId });
    });

    socket.on("edit-comment", ({ markerId, commentId, text }) => {
      console.log(`[SERVER] Editing comment ${commentId}`);
      let markerComments = comments.get(markerId) || [];
      const updatedComments = markerComments.map(c => c.id === commentId ? { ...c, text } : c);
      comments.set(markerId, updatedComments);
      io.emit("comment-edited", { markerId, commentId, text });
    });

    socket.on("disconnect", () => {
      activeUsers.delete(socket.id);
      io.emit("user-left", userId);
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
