import {
    initCanvases,
    drawBoard,
    drawHold,
    drawQueue,
    drawBestMove,
} from "./ui.js";
import { setupInput } from "./input.js";
import { initWasm } from "./bot.js";
import { spawnPiece, generateBag } from "./game.js";
import { state, setState } from "./state.js";

function startGame() {
    setState("gameRunning", true);
    setState(
        "board",
        Array(40)
            .fill(null)
            .map(() => Array(10).fill(0))
    );
    setState("nextQueue", []);
    setState("holdPiece", null);
    setState("canHold", true);
    setState("bestMove", null);
    setState("botMoves", []);

    generateBag();
    spawnPiece();

    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!state.gameRunning) return;

    drawBoard();
    drawHold();
    drawQueue();
    drawBestMove();

    requestAnimationFrame(gameLoop);
}

function init() {
    initWasm();
    initCanvases();
    setupInput();
    startGame();
}

document.addEventListener("DOMContentLoaded", init);
