import { state } from "./state.js";
import {
    movePiece,
    softDrop,
    hardDrop,
    rotatePiece,
    holdCurrentPiece,
    resetGame,
} from "./game.js";

// Key mappings
const keyMappings = {
    left: ["KeyR", "ArrowLeft"],
    right: ["KeyU", "ArrowRight"],
    down: ["KeyV", "ArrowDown"],
    rotateClockwise: ["KeyI", "ArrowUp", "KeyX"],
    rotateCounterClockwise: ["KeyE", "KeyZ"],
    rotate180: ["KeyW"],
    hardDrop: ["Space"],
    hold: ["KeyO", "KeyC"],
    reset: ["KeyQ", "KeyA"],
};

// Movement state tracking
let movementState = {
    left: false,
    right: false,
    down: false,
};

// Timing variables for DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate)
let dasTimers = {
    left: null,
    right: null,
    down: null,
};

let arrIntervals = {
    left: null,
    right: null,
    down: null,
};

// DAS and ARR settings (in milliseconds)
const DAS_DELAY = 97; // Delayed Auto Shift delay
const ARR_RATE = 0; // Auto Repeat Rate
const SD_ARR_RATE = 0; // Soft Drop Auto Repeat Rate

function getActionFromKey(key) {
    for (const [action, keys] of Object.entries(keyMappings)) {
        if (keys.includes(key)) {
            return action;
        }
    }
    return null;
}

function startDAS(direction) {
    if (dasTimers[direction]) return; // Already started

    // Execute immediate movement
    if (direction === "left") {
        movePiece(-1, 0);
    } else if (direction === "right") {
        movePiece(1, 0);
    } else if (direction === "down") {
        softDrop();
    }

    movementState[direction] = true;

    // Start DAS timer
    dasTimers[direction] = setTimeout(() => {
        startARR(direction);
        dasTimers[direction] = null;
    }, DAS_DELAY);
}

function startARR(direction) {
    if (arrIntervals[direction]) return; // Already started

    const rate = direction === "down" ? SD_ARR_RATE : ARR_RATE;

    arrIntervals[direction] = setInterval(() => {
        if (!movementState[direction]) {
            stopARR(direction);
            return;
        }

        if (direction === "left") {
            movePiece(-1, 0);
        } else if (direction === "right") {
            movePiece(1, 0);
        } else if (direction === "down") {
            softDrop();
        }
    }, rate);
}

function stopMovement(direction) {
    movementState[direction] = false;

    // Clear DAS timer
    if (dasTimers[direction]) {
        clearTimeout(dasTimers[direction]);
        dasTimers[direction] = null;
    }

    // Clear ARR interval
    stopARR(direction);

    // Handle opposite direction priority
    if (direction === "left" && movementState.right) {
        startDAS("right");
    } else if (direction === "right" && movementState.left) {
        startDAS("left");
    }
}

function stopARR(direction) {
    if (arrIntervals[direction]) {
        clearInterval(arrIntervals[direction]);
        arrIntervals[direction] = null;
    }
}

function handleKeyDown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
    }

    const action = getActionFromKey(event.code);

    if (!action) return;

    event.preventDefault();

    switch (action) {
        case "left":
            if (!movementState.left) {
                // Stop right movement if active
                if (movementState.right) {
                    stopMovement("right");
                }
                startDAS("left");
            }
            break;

        case "right":
            if (!movementState.right) {
                // Stop left movement if active
                if (movementState.left) {
                    stopMovement("left");
                }
                startDAS("right");
            }
            break;

        case "down":
            if (!movementState.down) {
                startDAS("down");
            }
            break;

        case "rotateClockwise":
            rotatePiece(1);
            break;

        case "rotateCounterClockwise":
            rotatePiece(-1);
            break;

        case "rotate180":
            rotatePiece(2);
            break;

        case "hardDrop":
            hardDrop();
            break;

        case "hold":
            holdCurrentPiece();
            break;
        case "reset":
            resetGame();
            break;
    }
}

function handleKeyUp(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
    }

    const action = getActionFromKey(event.code);
    if (!action) return;

    switch (action) {
        case "left":
            stopMovement("left");
            break;

        case "right":
            stopMovement("right");
            break;

        case "down":
            stopMovement("down");
            break;
    }
}

export function setupInput() {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Test that the setup worked
    console.log("Input setup complete. Key mappings:", keyMappings);
}

// Clean up function for when game ends
export function cleanupInput() {
    // Stop all movements
    stopMovement("left");
    stopMovement("right");
    stopMovement("down");

    // Remove event listeners
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
}
