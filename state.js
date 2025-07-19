export let state = {
    wasmModule: null,
    bot: null,
    board: Array(40)
        .fill(null)
        .map(() => Array(10).fill(0)),
    tileSize:
        Math.floor(
            Math.min(window.innerWidth / 29, window.innerHeight / 22) / 2
        ) * 2,
    currentPiece: null,
    currentX: 4,
    currentY: 0,
    currentRotation: 0,
    nextQueue: [1, 2, 3, 4, 5, 6, 7],
    holdPiece: null,
    canHold: true,
    gameRunning: false,
    bestMove: null,
    botMoves: [],

    // Canvas elements and contexts
    boardCanvas: null,
    holdCanvas: null,
    queueCanvas: null,
    bestMoveCanvas: null,
    boardCtx: null,
    holdCtx: null,
    queueCtx: null,
    bestMoveCtx: null,
};

export function setState(key, value) {
    if (key in state) {
        state[key] = value;
    } else {
        console.error(`Invalid state key: ${key}`);
    }
}
