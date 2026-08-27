const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let activePeers = [];

io.on('connection', (socket) => {
    console.log(`Device connected: ${socket.id}`);
    activePeers.push(socket.id);
    io.emit('peer-list', activePeers);

    // File request signaling
    socket.on('file-request', ({ target, metadata }) => {
        io.to(target).emit('file-request', { sender: socket.id, metadata });
    });

    // Accept / Decline response
    socket.on('file-response', ({ target, accepted }) => {
        io.to(target).emit('file-response', { sender: socket.id, accepted });
    });

    // Relayed file chunks (Bypasses firewall/tunnel blocks entirely)
    socket.on('file-chunk', ({ target, chunk, progress }) => {
        io.to(target).emit('file-chunk', { chunk, progress });
    });

    socket.on('file-complete', ({ target }) => {
        io.to(target).emit('file-complete');
    });

    socket.on('disconnect', () => {
        console.log(`Device disconnected: ${socket.id}`);
        activePeers = activePeers.filter(id => id !== socket.id);
        io.emit('peer-list', activePeers);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});