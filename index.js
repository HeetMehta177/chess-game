// Import: express, http, socket.io, chess.js
const expr = require("express");
const http = require("http");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");

// - Create Express app instance
const app = expr();
// - Initialize HTTP server with Express
const server = http.createServer(app);
// - Instantiate Socket.io on HTTP server
const io = socket(server);

// - Create Chess object instance (chess.js)
const chess = new Chess();

// - Initialize:
// - Players object: track socket IDs, roles (white/black)
// - CurrentPlayer: track current turn
const players = {};
let currentPlayer = "w";

// - Configure Express app:
//     - Use EJS templating engine
//     - Serve static files from 'public' directory

app.set("view engine", "ejs");
app.use(expr.static(path.join(__dirname, "public")));

// - Define route for root URL
// - Render EJS template "index"
app.get("/", (req, res) => {
    res.render("index", { title: "chess game" });
})

// - Socket.io handles connection event
// - Callback executed on client connect
io.on("connection", function (uniquesocket) {
    console.log("connected!");

    // - Client connection:
    // - Assign role based on game state:
    if (!players.white) { // - If no white player, assign white role
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w")
    } else if (!players.black) { //- If no black player, assign black role
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b")
    } else {                   // - Emit "spectatorRole" event
        uniquesocket.emit("spectatorRole")
    }
    uniquesocket.emit("boardState", chess.fen());

    // - Client disconnection:
    // - Remove assigned role from players object
    uniquesocket.on("disconnect", () => {
        if (uniquesocket.id === players.white) {
            delete players.white
        }
        if (uniquesocket.id === players.black) {
            delete players.black
        }
    })

    // - Listen for "move" events:
    // - Validate correct player's turn
    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();  //- Update game state
                io.emit("move", move);    //- Broadcast move via "move" event
                io.emit("boardstate", chess.fen()) // - Send updated board state
                if (chess.isGameOver()) {
                    io.emit("gameOver", chess.isCheckmate() ? `${chess.turn() === 'w' ? 'Black' : 'White'} wins!` : "Game over");
                }
            } else {
                console.log("invalid move:", move);
                uniquesocket.emit("invalid move:", move)
            };

        } catch (err) {
            console.log(err);
            uniquesocket.emit("failed")
        }
    })
})

const PORT = process.env.PORT || 7000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});