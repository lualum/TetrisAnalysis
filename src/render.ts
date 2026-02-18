import {
	BOARD_HEIGHT_VISIBLE,
	BOARD_WIDTH,
	COLORS,
	HIGHLIGHT_COLOR,
	PIECES,
} from "./constants";
import { Piece, PieceType } from "./game";
import { game } from "./main";
import type { CanvasElements } from "./types";

let canvases: CanvasElements;
let tileSize: number;

let fps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;

function initCanvases(): CanvasElements {
	const boardCanvas = document.getElementById(
		"boardCanvas",
	) as HTMLCanvasElement;
	const holdCanvas = document.getElementById(
		"holdCanvas",
	) as HTMLCanvasElement;
	const queueCanvas = document.getElementById(
		"queueCanvas",
	) as HTMLCanvasElement;
	const bestMoveCanvas = document.getElementById(
		"bestMoveCanvas",
	) as HTMLCanvasElement;

	boardCanvas.width = tileSize * BOARD_WIDTH;
	boardCanvas.height = tileSize * BOARD_HEIGHT_VISIBLE;
	holdCanvas.width = tileSize * 5;
	holdCanvas.height = tileSize * 3;
	queueCanvas.width = tileSize * 5;
	queueCanvas.height = tileSize * 15;
	bestMoveCanvas.width = tileSize * 5;
	bestMoveCanvas.height = tileSize * 10;

	return {
		boardCanvas,
		holdCanvas,
		queueCanvas,
		bestMoveCanvas,
		boardCtx: boardCanvas.getContext("2d")!,
		holdCtx: holdCanvas.getContext("2d")!,
		queueCtx: queueCanvas.getContext("2d")!,
		bestMoveCtx: bestMoveCanvas.getContext("2d")!,
	};
}

function drawMino(
	ctx: CanvasRenderingContext2D,
	pieceType: PieceType,
	x: number,
	y: number,
	highlight: boolean = false,
): void {
	ctx.fillStyle = COLORS[pieceType] || "#888";
	ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

	if (highlight) {
		ctx.fillStyle = HIGHLIGHT_COLOR[pieceType] || "#888";
		ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize / 6);
	}
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: Piece): void {
	const data = PIECES[piece.type][piece.rot];

	for (let r = 0; r < data.length; r++) {
		for (let c = 0; c < data[r].length; c++) {
			if (!data[r][c]) continue;

			const x = piece.x + c;
			const y = piece.y + r - 20;
			const hasHighlight = r === 0 || data[r - 1][c] === 0;
			drawMino(ctx, piece.type, x, y, hasHighlight);
		}
	}
}

function drawShadow(ctx: CanvasRenderingContext2D, piece: Piece): void {
	const data = PIECES[piece.type][piece.rot];

	ctx.globalAlpha = 0.8;
	for (let r = 0; r < data.length; r++) {
		for (let c = 0; c < data[r].length; c++) {
			if (data[r][c]) {
				const x = piece.x + c;
				const y = piece.y + r - 20;
				drawMino(ctx, piece.type, x, y, false);
			}
		}
	}
	ctx.globalAlpha = 1.0;
}

function drawSidePanelPiece(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	pieceType: PieceType,
): void {
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

	const pieceWidth = (maxCol - minCol + 1) * tileSize;
	const pieceHeight = (maxRow - minRow + 1) * tileSize;
	const offsetX = (canvas.width - pieceWidth) / 2 - minCol * tileSize;
	const offsetY = (canvas.height - pieceHeight) / 2 - minRow * tileSize;

	for (let r = 0; r < piece.length; r++) {
		for (let c = 0; c < piece[r].length; c++) {
			if (piece[r][c]) {
				drawMino(
					ctx,
					pieceType,
					offsetX / tileSize + c,
					offsetY / tileSize + r,
					r === 0 || piece[r - 1][c] === 0,
				);
			}
		}
	}
}

function drawBoard(): void {
	const ctx = canvases.boardCtx;

	ctx.clearRect(0, 0, canvases.boardCanvas.width, canvases.boardCanvas.height);

	ctx.strokeStyle = "#666666";
	ctx.lineWidth = 0.5;

	for (let r = 0; r <= 20; r++) {
		for (let c = 0; c <= 10; c++) {
			ctx.beginPath();
			ctx.moveTo(c * tileSize, (r - 1 / 5) * tileSize);
			ctx.lineTo(c * tileSize, (r + 1 / 5) * tileSize);
			ctx.moveTo((c - 1 / 5) * tileSize, r * tileSize);
			ctx.lineTo((c + 1 / 5) * tileSize, r * tileSize);
			ctx.stroke();
		}
	}

	for (let r = 0; r < 20; r++) {
		for (let c = 0; c < 10; c++) {
			const cell = game.board[r + 20][c];
			if (cell !== undefined) {
				const cellAbove = r > 0 ? game.board[r + 19][c] : undefined;
				drawMino(ctx, cell, c, r, cellAbove === undefined);
			}
		}
	}

	if (game.current) {
		const ghost = game.getGhost();
		drawShadow(ctx, ghost);
		drawPiece(ctx, game.current);
	}
}

function drawHold(): void {
	const ctx = canvases.holdCtx;
	ctx.clearRect(0, 0, canvases.holdCanvas.width, canvases.holdCanvas.height);

	if (game.holdPiece !== undefined) {
		drawSidePanelPiece(ctx, canvases.holdCanvas, game.holdPiece);
	}
}

function drawQueue(): void {
	const ctx = canvases.queueCtx;

	ctx.clearRect(0, 0, canvases.queueCanvas.width, canvases.queueCanvas.height);

	const queueSize = 5;
	const slotHeight = canvases.queueCanvas.height / queueSize;

	for (let i = 0; i < Math.min(queueSize, game.queue.length); i++) {
		const dummyCanvas = {
			width: canvases.queueCanvas.width,
			height: slotHeight,
		} as HTMLCanvasElement;

		ctx.save();
		ctx.translate(0, i * slotHeight);
		drawSidePanelPiece(ctx, dummyCanvas, game.queue[i]);
		ctx.restore();
	}
}

function updateFPS(): void {
	frameCount++;
	const now = performance.now();
	const elapsed = now - lastFpsUpdate;

	if (elapsed >= 500) {
		fps = Math.round((frameCount * 1000) / elapsed);
		frameCount = 0;
		lastFpsUpdate = now;
	}

	const ctx = canvases.boardCtx;
	ctx.fillStyle = "white";
	ctx.font = `${tileSize * 0.6}px monospace`;
	ctx.fillText(`${fps} fps`, 4, tileSize * 0.7);
}

export function setupRenderer(): void {
	tileSize =
		Math.floor(
			Math.min(window.innerWidth / 29, window.innerHeight / 22) / 2,
		) * 2;
	canvases = initCanvases();
	fps = 0;
	frameCount = 0;
	lastFpsUpdate = performance.now();
}

export function render(): void {
	drawBoard();
	drawHold();
	drawQueue();
	updateFPS();
}
