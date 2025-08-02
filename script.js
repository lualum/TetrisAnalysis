import {
    initCanvases,
    drawBoard,
    drawHold,
    drawQueue,
    drawBestMove,
} from "./ui.js";
import { setupInput } from "./input.js";
import { spawnPiece, generateBag } from "./game.js";
import { state, setState } from "./state.js";
import { ColdClearInterface } from "./bot.js";
import { setupBotControls } from "./botControls.js";

// Global bot interface instance
let botInterface = null;

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

async function init() {
    try {
        // Initialize bot interface
        botInterface = new ColdClearInterface();
        console.log("Initializing bot...");

        const botInitialized = await botInterface.initialize();
        if (botInitialized) {
            console.log("Bot initialized successfully");
        } else {
            console.warn("Bot initialization failed, continuing without bot");
        }

        // Make bot available globally for other modules
        window.coldClearBot = botInterface;
    } catch (error) {
        console.error("Bot initialization error:", error);
        console.log("Continuing without bot functionality");
    }

    // Initialize other components
    initCanvases();
    setupInput();
    setupBotControls();
    startGame();
}

// Export bot interface for use in other modules
export { botInterface };

document.addEventListener("DOMContentLoaded", init);
