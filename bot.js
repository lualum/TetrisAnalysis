import { state, setState } from "./state.js";

// Converts our internal piece numbers to the letter format the bot requires.
const PIECE_NUM_TO_LETTER = {
    1: "I",
    2: "O",
    3: "T",
    4: "L",
    5: "J",
    6: "S",
    7: "Z",
};

export async function initWasm() {
    try {
        const wasmModule = await import("./pkg/cold_clear_2.js");
        await wasmModule.default();

        setState("wasmModule", wasmModule);
        setState("bot", new wasmModule.ColdClear2Bot());
        state.bot.initialize("{}");

        const response = await sendTBPCommand({ type: "start", payload: {} });
        if (response && response.type === "ready") {
            console.log("Bot initialized and ready");
        }
    } catch (error) {
        console.error("Failed to initialize WebAssembly:", error);
        console.log("Continuing without bot functionality.");
    }
}

function boardToTBP() {
    return state.board.map((row) => row.map((cell) => cell !== 0));
}

async function sendTBPCommand(command) {
    if (!state.wasmModule || !state.bot) return null;
    try {
        const commandStr = JSON.stringify(command);
        const response = state.bot.send_message(commandStr);
        return JSON.parse(response);
    } catch (error) {
        console.error("Error processing command:", error);
        return null;
    }
}

export async function getBotMove() {
    if (!state.currentPiece) return;

    const moveCommand = {
        type: "suggest",
        payload: {
            board: boardToTBP(),
            // Convert numbers to letters for the bot
            queue: [
                PIECE_NUM_TO_LETTER[state.currentPiece],
                ...state.nextQueue
                    .slice(0, 5)
                    .map((p) => PIECE_NUM_TO_LETTER[p]),
            ],
            hold: state.holdPiece ? PIECE_NUM_TO_LETTER[state.holdPiece] : null,
            can_hold: state.canHold,
            combo: 0,
            back_to_back: false,
            incoming_garbage: [],
        },
    };

    const response = await sendTBPCommand(moveCommand);
    if (response && response.type === "suggestion") {
        console.log("Bot suggests:", response);
        // You could update state here, e.g., setState('botMoves', response.payload.moves);
    }
}
