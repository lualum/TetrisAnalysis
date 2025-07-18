let wasmModule = null;
let bot = null;
let board = Array(40)
    .fill(null)
    .map(() => Array(10).fill(0)); // 40 rows, 10 columns
let currentPiece = null;
let currentX = 4;
let currentY = 0;
let currentRotation = 0;
let nextQueue = ["I", "O", "T", "L", "J", "S", "Z"];
let holdPiece = null;
let canHold = true;
let gameRunning = false;
let bestMove = null;
let botMoves = []; // Store bot's suggested moves

// Tetris piece definitions
const PIECES = {
    I: [
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]],
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]],
    ],
    O: [
        [
            [1, 1],
            [1, 1],
        ],
        [
            [1, 1],
            [1, 1],
        ],
        [
            [1, 1],
            [1, 1],
        ],
        [
            [1, 1],
            [1, 1],
        ],
    ],
    T: [
        [
            [0, 1, 0],
            [1, 1, 1],
        ],
        [
            [1, 0],
            [1, 1],
            [1, 0],
        ],
        [
            [1, 1, 1],
            [0, 1, 0],
        ],
        [
            [0, 1],
            [1, 1],
            [0, 1],
        ],
    ],
    L: [
        [
            [1, 0, 0],
            [1, 1, 1],
        ],
        [
            [1, 1],
            [1, 0],
            [1, 0],
        ],
        [
            [1, 1, 1],
            [0, 0, 1],
        ],
        [
            [0, 1],
            [0, 1],
            [1, 1],
        ],
    ],
    J: [
        [
            [0, 0, 1],
            [1, 1, 1],
        ],
        [
            [1, 0],
            [1, 0],
            [1, 1],
        ],
        [
            [1, 1, 1],
            [1, 0, 0],
        ],
        [
            [1, 1],
            [0, 1],
            [0, 1],
        ],
    ],
    S: [
        [
            [0, 1, 1],
            [1, 1, 0],
        ],
        [
            [1, 0],
            [1, 1],
            [0, 1],
        ],
        [
            [0, 1, 1],
            [1, 1, 0],
        ],
        [
            [1, 0],
            [1, 1],
            [0, 1],
        ],
    ],
    Z: [
        [
            [1, 1, 0],
            [0, 1, 1],
        ],
        [
            [0, 1],
            [1, 1],
            [1, 0],
        ],
        [
            [1, 1, 0],
            [0, 1, 1],
        ],
        [
            [0, 1],
            [1, 1],
            [1, 0],
        ],
    ],
};

// Piece colors
const COLORS = {
    I: "#75CBAE",
    O: "#CCC564",
    T: "#B559C8",
    L: "#C3845A",
    J: "#6253C7",
    S: "#92CC63",
    Z: "#BF5A5C",
};

// Canvas elements and contexts
let boardCanvas, holdCanvas, queueCanvas, bestMoveCanvas;
let boardCtx, holdCtx, queueCtx, bestMoveCtx;

function initCanvases() {
    // Get canvas elements by ID
    boardCanvas = document.getElementById("boardCanvas");
    holdCanvas = document.getElementById("holdCanvas");
    queueCanvas = document.getElementById("queueCanvas");
    bestMoveCanvas = document.getElementById("bestMoveCanvas");

    // Set canvas dimensions to match their parent containers
    const boardElement = document.querySelector(".board");
    const holdElement = document.querySelector(".hold");
    const queueElement = document.querySelector(".queue-area");
    const bestMoveElement = document.querySelector(".best-move");

    // Board canvas
    boardCanvas.width = boardElement.clientWidth;
    boardCanvas.height = boardElement.clientHeight;
    boardCtx = boardCanvas.getContext("2d");

    // Hold canvas
    holdCanvas.width = holdElement.clientWidth;
    holdCanvas.height = holdElement.clientHeight;
    holdCtx = holdCanvas.getContext("2d");

    // Queue canvas
    queueCanvas.width = queueElement.clientWidth;
    queueCanvas.height = queueElement.clientHeight;
    queueCtx = queueCanvas.getContext("2d");

    // Best move canvas
    bestMoveCanvas.width = bestMoveElement.clientWidth;
    bestMoveCanvas.height = bestMoveElement.clientHeight;
    bestMoveCtx = bestMoveCanvas.getContext("2d");
}

function drawBoard() {
    boardCtx.fillStyle = "#000";
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

    const cellSize = boardCanvas.width / 10;

    // Draw board grid and filled cells from the visible area (rows 20-39)
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            const x = col * cellSize;
            const y = row * cellSize;

            if (board[row + 20][col]) {
                // Look at rows 20-39
                boardCtx.fillStyle = getPieceColor(board[row + 20][col]);
                boardCtx.fillRect(x, y, cellSize, cellSize);
            }

            // Draw grid lines
            boardCtx.strokeStyle = "#333";
            boardCtx.lineWidth = 1;
            boardCtx.strokeRect(x, y, cellSize, cellSize);
        }
    }

    // Draw current piece
    if (currentPiece && gameRunning) {
        drawPiece(
            boardCtx,
            currentPiece,
            currentX,
            currentY - 20, // Adjust y-coordinate for visible area
            currentRotation,
            cellSize
        );
    }

    // Draw best move preview
    if (bestMove) {
        drawBestMovePreview();
    }
}

function drawPiece(ctx, pieceType, x, y, rotation, cellSize) {
    const piece = PIECES[pieceType][rotation];
    const color = COLORS[pieceType];

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;

    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const drawX = (x + col) * cellSize;
                const drawY = (y + row) * cellSize;
                if (drawY >= -2 * cellSize) {
                    // Culling for pieces partially above screen
                    ctx.fillRect(drawX, drawY, cellSize, cellSize);
                    ctx.strokeStyle = "#FFF";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(drawX, drawY, cellSize, cellSize);
                }
            }
        }
    }

    ctx.globalAlpha = 1;
}

function drawBestMovePreview() {
    if (!bestMove) return;

    const cellSize = boardCanvas.width / 10;
    const piece = PIECES[bestMove.piece][bestMove.rotation];

    boardCtx.fillStyle = COLORS[bestMove.piece];
    boardCtx.globalAlpha = 0.3;

    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const drawX = (bestMove.x + col) * cellSize;
                const drawY = (bestMove.y + row - 20) * cellSize;
                if (drawY >= 0) {
                    boardCtx.fillRect(drawX, drawY, cellSize, cellSize);
                    boardCtx.strokeStyle = "#FFF";
                    boardCtx.lineWidth = 1;
                    boardCtx.strokeRect(drawX, drawY, cellSize, cellSize);
                }
            }
        }
    }

    boardCtx.globalAlpha = 1;
}

function drawHold() {
    holdCtx.fillStyle = "#222";
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (holdPiece) {
        const piece = PIECES[holdPiece][0];
        const color = COLORS[holdPiece];

        const cellSize = Math.min(holdCanvas.width / 5, holdCanvas.height / 3);

        const pieceWidth = piece[0].length * cellSize;
        const pieceHeight = piece.length * cellSize;
        const offsetX = (holdCanvas.width - pieceWidth) / 2;
        const offsetY = (holdCanvas.height - pieceHeight) / 2;

        holdCtx.fillStyle = color;
        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    holdCtx.fillRect(
                        offsetX + col * cellSize,
                        offsetY + row * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    }
}

function drawQueue() {
    queueCtx.fillStyle = "#222";
    queueCtx.fillRect(0, 0, queueCanvas.width, queueCanvas.height);

    const queueSize = 5; // Number of pieces to show
    const slotHeight = queueCanvas.height / queueSize;
    // Assume a 5x4 grid per slot for drawing
    const cellSize = Math.min(queueCanvas.width / 5, slotHeight / 4);

    for (let i = 0; i < Math.min(queueSize, nextQueue.length); i++) {
        const pieceType = nextQueue[i];
        const piece = PIECES[pieceType][0];
        const color = COLORS[pieceType];

        const pieceWidth = piece[0].length * cellSize;
        const pieceHeight = piece.length * cellSize;

        const offsetX = (queueCanvas.width - pieceWidth) / 2;
        const slotY = i * slotHeight;
        const offsetY = slotY + (slotHeight - pieceHeight) / 2; // Center vertically

        queueCtx.fillStyle = color;
        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    queueCtx.fillRect(
                        offsetX + col * cellSize,
                        offsetY + row * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    }
}

function drawBestMove() {
    bestMoveCtx.fillStyle = "#222";
    bestMoveCtx.fillRect(0, 0, bestMoveCanvas.width, bestMoveCanvas.height);

    if (botMoves && botMoves.length > 0) {
        // Display bot's suggested moves as text
        const fontSize = Math.min(
            bestMoveCanvas.width / 15,
            bestMoveCanvas.height / 10
        );

        bestMoveCtx.fillStyle = "#FFF";
        bestMoveCtx.font = `${fontSize}px Arial`;
        bestMoveCtx.textAlign = "center";

        // Display moves
        let yPos = fontSize * 3;
        for (let i = 0; i < Math.min(botMoves.length, 8); i++) {
            const move = botMoves[i];
            const displayMove = move.replace(/_/g, " ").toUpperCase();
            bestMoveCtx.fillText(displayMove, bestMoveCanvas.width / 2, yPos);
            yPos += fontSize * 1.2;
        }
    } else {
        // Display "No moves" if no bot suggestions
        const fontSize = Math.min(
            bestMoveCanvas.width / 12,
            bestMoveCanvas.height / 8
        );
        bestMoveCtx.fillStyle = "#888";
        bestMoveCtx.font = `${fontSize}px Arial`;
        bestMoveCtx.textAlign = "center";
        bestMoveCtx.fillText(
            "No bot moves",
            bestMoveCanvas.width / 2,
            bestMoveCanvas.height / 2
        );
    }
}

function getPieceColor(pieceType) {
    const colorMap = {
        1: "#75CBAE",
        2: "#CCC564",
        3: "#B559C8",
        4: "#C3845A",
        5: "#6253C7",
        6: "#92CC63",
        7: "#BF5A5C",
    };
    return colorMap[pieceType] || "#888";
}

function spawnPiece() {
    if (nextQueue.length === 0) {
        generateBag();
    }

    currentPiece = nextQueue.shift();
    currentX = 4;
    currentY = 20; // Spawn above visible area
    currentRotation = 0;
    canHold = true;

    if (!isValidMove(currentPiece, currentX, currentY, currentRotation)) {
        // Game Over
        gameRunning = false;
        console.log("Game Over!");
        return;
    }

    generateBag();
    getBotMove();
}

function generateBag() {
    const pieces = ["I", "O", "T", "L", "J", "S", "Z"];
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    nextQueue.push(...pieces);
}

function isValidMove(piece, x, y, rotation) {
    const pieceData = PIECES[piece][rotation];

    for (let row = 0; row < pieceData.length; row++) {
        for (let col = 0; col < pieceData[row].length; col++) {
            if (pieceData[row][col]) {
                const newX = x + col;
                const newY = y + row;

                if (
                    newX < 0 ||
                    newX >= 10 ||
                    newY >= 40 ||
                    (newY >= 0 && board[newY][newX])
                ) {
                    return false;
                }
            }
        }
    }

    return true;
}

function placePiece() {
    const piece = PIECES[currentPiece][currentRotation];
    const colorIndex = Object.keys(COLORS).indexOf(currentPiece) + 1;

    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const x = currentX + col;
                const y = currentY + row;
                if (y >= 0) {
                    board[y][x] = colorIndex;
                }
            }
        }
    }

    clearLines();
    spawnPiece();
}

function clearLines() {
    for (let row = 39; row >= 0; row--) {
        if (board[row].every((cell) => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(10).fill(0));
            row++; // Check the same row again
        }
    }
}

function movePiece(dx, dy, newRotation = currentRotation) {
    const newX = currentX + dx;
    const newY = currentY + dy;

    if (isValidMove(currentPiece, newX, newY, newRotation)) {
        currentX = newX;
        currentY = newY;
        currentRotation = newRotation;
        return true;
    }

    return false;
}

function hardDrop() {
    while (movePiece(0, 1)) {}
    placePiece();
}

function holdCurrentPiece() {
    if (!canHold) return;

    if (holdPiece) {
        const temp = currentPiece;
        currentPiece = holdPiece;
        holdPiece = temp;
    } else {
        holdPiece = currentPiece;
        spawnPiece();
        return;
    }

    currentX = 4;
    currentY = 20; // Respawn at top
    currentRotation = 0;
    canHold = false;
}

// Game loop (removed gravity)
function gameLoop(timestamp) {
    if (!gameRunning) return;

    // No automatic dropping - gravity removed
    drawBoard();
    drawHold();
    drawQueue();
    drawBestMove();

    requestAnimationFrame(gameLoop);
}

// Input handling
function setupInput() {
    document.addEventListener("keydown", (e) => {
        if (!gameRunning) return;

        switch (e.key) {
            case "ArrowLeft":
                movePiece(-1, 0);
                break;
            case "ArrowRight":
                movePiece(1, 0);
                break;
            case "ArrowDown":
                if (!movePiece(0, 1)) {
                    placePiece();
                }
                break;
            case "ArrowUp":
            case "x":
                movePiece(0, 0, (currentRotation + 1) % 4);
                break;
            case "z":
                movePiece(0, 0, (currentRotation + 3) % 4);
                break;
            case " ":
                e.preventDefault();
                hardDrop();
                break;
            case "c":
                holdCurrentPiece();
                break;
        }
    });
}

// Bot integration
function boardToTBP() {
    const tbpBoard = [];
    for (let row = 0; row < 40; row++) {
        const tbpRow = [];
        for (let col = 0; col < 10; col++) {
            tbpRow.push(board[row][col] !== 0);
        }
        tbpBoard.push(tbpRow);
    }
    return tbpBoard;
}

async function sendTBPCommand(command) {
    if (!wasmModule || !bot) return null;

    try {
        const commandStr = JSON.stringify(command);
        const response = bot.send_message(commandStr);
        return JSON.parse(response);
    } catch (error) {
        console.error("Error processing command:", error);
        return null;
    }
}

async function getBotMove() {
    if (!currentPiece) return;

    const moveCommand = {
        type: "suggest",
        payload: {
            board: boardToTBP(),
            queue: [currentPiece, ...nextQueue.slice(0, 5)],
            hold: holdPiece,
            can_hold: canHold,
            combo: 0,
            back_to_back: false,
            incoming_garbage: [],
        },
    };

    const response = await sendTBPCommand(moveCommand);
    if (response && response.type === "suggestion") {
        // Handle the new bot response format
        console.log("Bot suggests:", response);
    }
}

// WebAssembly initialization
async function initWasm() {
    try {
        // NOTE: You need to serve the wasm package from a 'pkg' directory
        wasmModule = await import("./pkg/cold_clear_2.js");
        await wasmModule.default();

        bot = new wasmModule.ColdClear2Bot();
        bot.initialize("{}");

        const startCommand = { type: "start", payload: {} };
        const response = await sendTBPCommand(startCommand);

        if (response && response.type === "ready") {
            console.log("Bot initialized and ready");
        }
    } catch (error) {
        console.error("Failed to initialize WebAssembly:", error);
        console.log("Continuing without bot functionality");
    }
}

function startGame() {
    gameRunning = true;
    board = Array(40)
        .fill(null)
        .map(() => Array(10).fill(0));
    nextQueue = [];
    holdPiece = null;
    canHold = true;
    bestMove = null;
    botMoves = [];

    generateBag();
    spawnPiece();

    requestAnimationFrame(gameLoop);
}

// Initialize everything
function init() {
    initCanvases();
    setupInput();
    initWasm();
    startGame();
}

document.addEventListener("DOMContentLoaded", init);
