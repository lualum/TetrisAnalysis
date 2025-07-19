import { state, setState } from "./state.js";
import { PIECES, KICK_TABLE } from "./constants.js";
import { getBotMove } from "./bot.js";

export function spawnPiece() {
    if (state.nextQueue.length === 0) {
        generateBag();
    }

    setState("currentPiece", state.nextQueue.shift());
    setState("currentX", 3);
    setState("currentY", 20);
    setState("currentRotation", 0);
    setState("canHold", true);

    if (
        !isValidMove(
            state.currentPiece,
            state.currentX,
            state.currentY,
            state.currentRotation
        )
    ) {
        setState("gameRunning", false);
        console.log("Game Over!");
        return;
    }

    generateBag();
    getBotMove();
}

export function generateBag() {
    const pieces = [1, 2, 3, 4, 5, 6, 7];
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    setState("nextQueue", [...state.nextQueue, ...pieces]);
}

export function isValidMove(piece, x, y, rotation) {
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
                    (newY >= 0 && state.board[newY][newX])
                ) {
                    return false;
                }
            }
        }
    }
    return true;
}

export function placePiece() {
    const pieceData = PIECES[state.currentPiece][state.currentRotation];
    const colorIndex = state.currentPiece; // Already a number, no conversion needed

    for (let row = 0; row < pieceData.length; row++) {
        for (let col = 0; col < pieceData[row].length; col++) {
            if (pieceData[row][col]) {
                const x = state.currentX + col;
                const y = state.currentY + row;
                if (y >= 0) {
                    state.board[y][x] = colorIndex;
                }
            }
        }
    }
    clearLines();
    spawnPiece();
}

function clearLines() {
    let newBoard = state.board;
    for (let row = 39; row >= 0; row--) {
        if (newBoard[row].every((cell) => cell !== 0)) {
            newBoard.splice(row, 1);
            newBoard.unshift(Array(10).fill(0));
            row++;
        }
    }
    setState("board", newBoard);
}

export function movePiece(dx, dy) {
    const newX = state.currentX + dx;
    const newY = state.currentY + dy;

    if (isValidMove(state.currentPiece, newX, newY, state.currentRotation)) {
        setState("currentX", newX);
        setState("currentY", newY);
        return true;
    }
    return false;
}

export function rotatePiece(direction) {
    const newRotation = (state.currentRotation + direction + 4) % 4;
    if (
        isValidMove(
            state.currentPiece,
            state.currentX,
            state.currentY,
            newRotation
        )
    ) {
        setState("currentRotation", newRotation);
        return true;
    }
    return tryWallKicks(state.currentRotation, newRotation);
}

function tryWallKicks(fromRotation, toRotation) {
    const pieceType = state.currentPiece;
    // O-piece (2) does not rotate or kick
    if (pieceType === 2) return false;

    // Use 'I' kicks for I-piece (1), and 'OTJLSZ' for all others
    const kickTableKey = pieceType === 1 ? "I" : "OTJLSZ";
    const kickKey = fromRotation * 3 + ((toRotation - fromRotation + 4) % 4);

    const kicks = KICK_TABLE[kickTableKey][kickKey];
    if (!kicks) return false;

    for (let kick of kicks) {
        const kickX = state.currentX + kick[0];
        const kickY = state.currentY + kick[1];
        if (isValidMove(pieceType, kickX, kickY, toRotation)) {
            setState("currentX", kickX);
            setState("currentY", kickY);
            setState("currentRotation", toRotation);
            return true;
        }
    }
    return false;
}

export function softDrop() {
    while (movePiece(0, 1)) {}
}

export function hardDrop() {
    while (movePiece(0, 1)) {}
    placePiece();
}

export function holdCurrentPiece() {
    if (state.holdPiece) {
        const temp = state.currentPiece;
        setState("currentPiece", state.holdPiece);
        setState("holdPiece", temp);
    } else {
        setState("holdPiece", state.currentPiece);
        spawnPiece();
        return;
    }

    setState("currentX", 3);
    setState("currentY", 20);
    setState("currentRotation", 0);
    setState("canHold", false);
}

export function resetGame() {
    setState(
        "board",
        Array(40)
            .fill()
            .map(() => Array(10).fill(0))
    );
    setState("nextQueue", []);
    setState("currentPiece", null);
    setState("currentX", 0);
    setState("currentY", 0);
    setState("currentRotation", 0);
    setState("holdPiece", null);
    setState("canHold", true);
    setState("gameRunning", true);
    spawnPiece();
}
