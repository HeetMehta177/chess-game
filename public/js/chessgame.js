// Chess Game, socket.io Initialization
const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard"); //class "chessboard" to render the chessboard
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((cell, colindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowindex + colindex) % 2 === 0 ? "light" : "dark"); //light and dark squares
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = colindex;

            if (cell) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", cell.color === "w" ? "white" : "black");

                pieceElement.innerText = getPieceUnicode(cell);
                pieceElement.draggable = chess.turn() && playerRole === cell.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: colindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                })

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            })

            boardElement.appendChild(squareElement);
        });
    });
    if (playerRole === 'b') {
        boardElement.classList.add("flipped")
    } else {
        boardElement.classList.remove("flipped")
    }
};
const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    }
    const result = chess.move(move);
    if (result) {
        // If the move is legal, emit it to the server
        socket.emit("move", move);
        renderBoard(); // Re-render the board to reflect the move
    } else {
        // If the move is illegal, return the piece to its original position
        renderBoard();
    }
}
const getPieceUnicode = (piece) => {
    const unicodePieces = {

        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        p: "♟",
        p: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔",

    }
    return unicodePieces[piece.type] || "";
}

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
})
socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
})
socket.on("boardState", (fen) => {
    chess.load(fen)
    renderBoard();
})
socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
})
renderBoard();