import { state, setState } from "./state.js";
import { isValidMove } from "./game.js";
import { PIECES, COLORS, HIGHLIGHT_COLOR } from "./constants.js";

// --- Helper Functions ---
function getPieceColor(pieceType) {
    return COLORS[pieceType] || "#888"; // Default to gray if invalid
}

function getPieceHighlightColor(pieceType) {
    return HIGHLIGHT_COLOR[pieceType] || "#888";
}

export function drawMino(
    ctx,
    pieceType,
    x,
    y,
    highlight = false,
    ts = state.tileSize
) {
    ctx.fillStyle = getPieceColor(pieceType);
    ctx.fillRect(x * ts, y * ts, ts, ts);
    if (highlight) {
        ctx.fillStyle = getPieceHighlightColor(pieceType);
        ctx.fillRect(x * ts, y * ts, ts, ts / 6); // Highlight top edge
    }
}

// --- Canvas Initialization ---
export function initCanvases() {
    setState("boardCanvas", document.getElementById("boardCanvas"));
    setState("holdCanvas", document.getElementById("holdCanvas"));
    setState("queueCanvas", document.getElementById("queueCanvas"));
    setState("bestMoveCanvas", document.getElementById("bestMoveCanvas"));

    state.boardCanvas.width = state.tileSize * 10;
    state.boardCanvas.height = state.tileSize * 20;
    state.holdCanvas.width = state.tileSize * 5;
    state.holdCanvas.height = state.tileSize * 3;
    state.queueCanvas.width = state.tileSize * 5;
    state.queueCanvas.height = state.tileSize * 15;
    state.bestMoveCanvas.width = state.tileSize * 5;
    state.bestMoveCanvas.height = state.tileSize * 10;

    setState("boardCtx", state.boardCanvas.getContext("2d"));
    setState("holdCtx", state.holdCanvas.getContext("2d"));
    setState("queueCtx", state.queueCanvas.getContext("2d"));
    setState("bestMoveCtx", state.bestMoveCanvas.getContext("2d"));
}

function findGhostPosition(piece, x, y, rotation) {
    let ghostY = y;

    while (isValidMove(piece, x, ghostY + 1, rotation)) {
        ghostY++;
    }

    return ghostY;
}

export function drawBoard() {
    state.boardCtx.fillStyle = "#000";
    state.boardCtx.fillRect(
        0,
        0,
        state.boardCanvas.width,
        state.boardCanvas.height
    );

    // Draw grid lines
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            state.boardCtx.strokeStyle = "#333";
            state.boardCtx.lineWidth = 1;
            state.boardCtx.strokeRect(
                col * state.tileSize,
                row * state.tileSize,
                state.tileSize,
                state.tileSize
            );
        }
    }

    // Draw placed pieces
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            if (state.board[row + 20][col]) {
                row > 0 && state.board[row + 19][col] === 0;
                drawMino(
                    state.boardCtx,
                    state.board[row + 20][col],
                    col,
                    row,
                    row > 0 && state.board[row + 19][col] === 0
                );
            }
        }
    }

    if (state.gameRunning) {
        // Draw ghost piece (shadow) first so it appears behind the current piece
        if (state.currentPiece) {
            const ghostY = findGhostPosition(
                state.currentPiece,
                state.currentX,
                state.currentY,
                state.currentRotation
            );

            // Only draw ghost if it's different from current position
            if (ghostY !== state.currentY) {
                drawShadow(
                    state.boardCtx,
                    state.currentPiece,
                    state.currentX,
                    ghostY - 20, // Adjust for board offset
                    state.currentRotation
                );
            }
        }

        // Draw current piece
        if (state.currentPiece) {
            drawPiece(
                state.boardCtx,
                state.currentPiece,
                state.currentX,
                state.currentY - 20,
                state.currentRotation
            );
        }

        // Draw best move preview if available
        if (state.bestMove) {
            drawBestMovePreview();
        }
    }
}

function drawPiece(ctx, pieceType, x, y, rotation) {
    const piece = PIECES[pieceType][rotation];
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const drawY = y + row;
                if (drawY * state.tileSize >= -2 * state.tileSize) {
                    const hasHighlight = row === 0 || piece[row - 1][col] === 0;
                    drawMino(ctx, pieceType, x + col, drawY, hasHighlight);
                }
            }
        }
    }
}

function drawShadow(ctx, pieceType, x, y, rotation) {
    const piece = PIECES[pieceType][rotation];

    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const drawY = y + row;
                if (drawY * state.tileSize >= -2 * state.tileSize) {
                    // Remove board lines
                    ctx.fillStyle = "#000";
                    ctx.fillRect(
                        x * state.tileSize + col * state.tileSize,
                        drawY * state.tileSize,
                        state.tileSize,
                        state.tileSize
                    );
                    // Draw shadow with reduced opacity
                    ctx.globalAlpha = 0.8;
                    drawMino(ctx, pieceType, x + col, drawY, false);
                    ctx.globalAlpha = 1.0;
                }
            }
        }
    }
}

function drawBestMovePreview() {
    const { piece: pieceType, rotation, x, y } = state.bestMove;
    const piece = PIECES[pieceType][rotation];
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const drawY = y + row - 20;
                if (drawY >= 0) {
                    state.boardCtx.globalAlpha = 0.3;
                    drawMino(state.boardCtx, pieceType, x + col, drawY, false);
                    state.boardCtx.globalAlpha = 1.0;
                }
            }
        }
    }
}

function drawSidePanelPiece(ctx, canvas, pieceType) {
    const piece = PIECES[pieceType][0];
    let minRow = 4,
        maxRow = -1,
        minCol = 4,
        maxCol = -1;
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
            if (piece[r][c]) {
                minRow = Math.min(minRow, r);
                maxRow = Math.max(maxRow, r);
                minCol = Math.min(minCol, c);
                maxCol = Math.max(maxCol, c);
            }
        }
    }
    const pieceWidth = (maxCol - minCol + 1) * state.tileSize;
    const pieceHeight = (maxRow - minRow + 1) * state.tileSize;
    const offsetX = (canvas.width - pieceWidth) / 2 - minCol * state.tileSize;
    const offsetY = (canvas.height - pieceHeight) / 2 - minRow * state.tileSize;
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                drawMino(
                    ctx,
                    pieceType,
                    offsetX / state.tileSize + col,
                    offsetY / state.tileSize + row,
                    row === 0 || piece[row - 1][col] === 0
                );
            }
        }
    }
}

export function drawHold() {
    state.holdCtx.fillStyle = "#222";
    state.holdCtx.fillRect(
        0,
        0,
        state.holdCanvas.width,
        state.holdCanvas.height
    );
    if (state.holdPiece) {
        drawSidePanelPiece(state.holdCtx, state.holdCanvas, state.holdPiece);
    }
}

export function drawQueue() {
    state.queueCtx.fillStyle = "#222";
    state.queueCtx.fillRect(
        0,
        0,
        state.queueCanvas.width,
        state.queueCanvas.height
    );
    const queueSize = 5;
    const slotHeight = state.queueCanvas.height / queueSize;
    for (let i = 0; i < Math.min(queueSize, state.nextQueue.length); i++) {
        const dummyCanvas = {
            width: state.queueCanvas.width,
            height: slotHeight,
        };
        state.queueCtx.save();
        state.queueCtx.translate(0, i * slotHeight);
        drawSidePanelPiece(state.queueCtx, dummyCanvas, state.nextQueue[i]);
        state.queueCtx.restore();
    }
}

export function drawBestMove() {
    state.bestMoveCtx.fillStyle = "#222";
    state.bestMoveCtx.fillRect(
        0,
        0,
        state.bestMoveCanvas.width,
        state.bestMoveCanvas.height
    );
    const fontSize = Math.min(
        state.bestMoveCanvas.width / 15,
        state.bestMoveCanvas.height / 10
    );
    state.bestMoveCtx.fillStyle = "#FFF";
    state.bestMoveCtx.font = `${fontSize}px Arial`;
    state.bestMoveCtx.textAlign = "center";

    if (state.botMoves && state.botMoves.length > 0) {
        let yPos = fontSize * 3;
        for (let i = 0; i < Math.min(state.botMoves.length, 8); i++) {
            const move = state.botMoves[i].replace(/_/g, " ").toUpperCase();
            state.bestMoveCtx.fillText(
                move,
                state.bestMoveCanvas.width / 2,
                yPos
            );
            yPos += fontSize * 1.2;
        }
    } else {
        state.bestMoveCtx.fillStyle = "#888";
        state.bestMoveCtx.fillText(
            "No bot moves",
            state.bestMoveCanvas.width / 2,
            state.bestMoveCanvas.height / 2
        );
    }
}
