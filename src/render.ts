import {
	BOARD_HEIGHT_VISIBLE,
	BOARD_WIDTH,
	COLORS,
	HIGHLIGHT_COLOR,
	PIECES,
} from "./constants";
import { Piece, PieceType, Tetris } from "./game";
import type { CanvasElements } from "./types";

export class Renderer {
	game: Tetris;
	canvases: CanvasElements;
	tileSize: number;

	fps: number;
	frameCount: number;
	lastFpsUpdate: number;

	constructor(game: Tetris) {
		this.game = game;
		this.tileSize =
			Math.floor(
				Math.min(window.innerWidth / 29, window.innerHeight / 22) / 2,
			) * 2;
		this.canvases = this.initCanvases();

		this.fps = 0;
		this.frameCount = 0;
		this.lastFpsUpdate = performance.now();
	}

	initCanvases(): CanvasElements {
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

		boardCanvas.width = this.tileSize * BOARD_WIDTH;
		boardCanvas.height = this.tileSize * BOARD_HEIGHT_VISIBLE;
		holdCanvas.width = this.tileSize * 5;
		holdCanvas.height = this.tileSize * 3;
		queueCanvas.width = this.tileSize * 5;
		queueCanvas.height = this.tileSize * 15;
		bestMoveCanvas.width = this.tileSize * 5;
		bestMoveCanvas.height = this.tileSize * 10;

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

	drawMino(
		ctx: CanvasRenderingContext2D,
		pieceType: PieceType,
		x: number,
		y: number,
		highlight: boolean = false,
	): void {
		ctx.fillStyle = COLORS[pieceType] || "#888";
		ctx.fillRect(
			x * this.tileSize,
			y * this.tileSize,
			this.tileSize,
			this.tileSize,
		);

		if (highlight) {
			ctx.fillStyle = HIGHLIGHT_COLOR[pieceType] || "#888";
			ctx.fillRect(
				x * this.tileSize,
				y * this.tileSize,
				this.tileSize,
				this.tileSize / 6,
			);
		}
	}

	drawPiece(ctx: CanvasRenderingContext2D, piece: Piece): void {
		const data = PIECES[piece.type][piece.rot];

		for (let r = 0; r < data.length; r++) {
			for (let c = 0; c < data[r].length; c++) {
				if (!data[r][c]) continue;

				const x = piece.x + c;
				const y = piece.y + r - 20;
				const hasHighlight = r === 0 || data[r - 1][c] === 0;
				this.drawMino(ctx, piece.type, x, y, hasHighlight);
			}
		}
	}

	drawShadow(ctx: CanvasRenderingContext2D, piece: Piece): void {
		const data = PIECES[piece.type][piece.rot];

		ctx.globalAlpha = 0.8;
		for (let r = 0; r < data.length; r++) {
			for (let c = 0; c < data[r].length; c++) {
				if (data[r][c]) {
					const x = piece.x + c;
					const y = piece.y + r - 20;

					this.drawMino(ctx, piece.type, x, y, false);
				}
			}
		}
		ctx.globalAlpha = 1.0;
	}

	drawSidePanelPiece(
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

		const pieceWidth = (maxCol - minCol + 1) * this.tileSize;
		const pieceHeight = (maxRow - minRow + 1) * this.tileSize;
		const offsetX = (canvas.width - pieceWidth) / 2 - minCol * this.tileSize;
		const offsetY =
			(canvas.height - pieceHeight) / 2 - minRow * this.tileSize;

		for (let r = 0; r < piece.length; r++) {
			for (let c = 0; c < piece[r].length; c++) {
				if (piece[r][c]) {
					this.drawMino(
						ctx,
						pieceType,
						offsetX / this.tileSize + c,
						offsetY / this.tileSize + r,
						r === 0 || piece[r - 1][c] === 0,
					);
				}
			}
		}
	}

	drawBoard(): void {
		const state = this.game;
		const ctx = this.canvases.boardCtx;

		ctx.clearRect(
			0,
			0,
			this.canvases.boardCanvas.width,
			this.canvases.boardCanvas.height,
		);

		// Draw grid lines
		ctx.strokeStyle = "#666666";
		ctx.lineWidth = 0.5;

		for (let r = 0; r <= 20; r++) {
			for (let c = 0; c <= 10; c++) {
				// t shape on corner of all cells
				ctx.beginPath();
				ctx.moveTo(c * this.tileSize, (r - 1 / 5) * this.tileSize);
				ctx.lineTo(c * this.tileSize, (r + 1 / 5) * this.tileSize);
				ctx.moveTo((c - 1 / 5) * this.tileSize, r * this.tileSize);
				ctx.lineTo((c + 1 / 5) * this.tileSize, r * this.tileSize);
				ctx.stroke();
			}
		}

		// Draw placed pieces
		for (let r = 0; r < 20; r++) {
			for (let c = 0; c < 10; c++) {
				const cell = state.board[r + 20][c];
				if (cell !== undefined) {
					const cellAbove = r > 0 ? state.board[r + 19][c] : undefined;
					this.drawMino(ctx, cell, c, r, cellAbove === undefined);
				}
			}
		}

		if (state.current) {
			const ghost = this.game.getGhost();
			this.drawShadow(ctx, ghost);
			this.drawPiece(ctx, state.current);
		}
	}

	drawHold(): void {
		const ctx = this.canvases.holdCtx;
		ctx.clearRect(
			0,
			0,
			this.canvases.holdCanvas.width,
			this.canvases.holdCanvas.height,
		);

		if (this.game.holdPiece !== undefined) {
			this.drawSidePanelPiece(
				ctx,
				this.canvases.holdCanvas,
				this.game.holdPiece,
			);
		}
	}

	drawQueue(): void {
		const ctx = this.canvases.queueCtx;

		ctx.clearRect(
			0,
			0,
			this.canvases.queueCanvas.width,
			this.canvases.queueCanvas.height,
		);

		const queueSize = 5;
		const slotHeight = this.canvases.queueCanvas.height / queueSize;

		for (let i = 0; i < Math.min(queueSize, this.game.queue.length); i++) {
			const dummyCanvas = {
				width: this.canvases.queueCanvas.width,
				height: slotHeight,
			} as HTMLCanvasElement;

			ctx.save();
			ctx.translate(0, i * slotHeight);
			this.drawSidePanelPiece(ctx, dummyCanvas, this.game.queue[i]);
			ctx.restore();
		}
	}

	updateFPS(): void {
		this.frameCount++;
		const now = performance.now();
		const elapsed = now - this.lastFpsUpdate;

		if (elapsed >= 500) {
			this.fps = Math.round((this.frameCount * 1000) / elapsed);
			this.frameCount = 0;
			this.lastFpsUpdate = now;
		}

		const ctx = this.canvases.boardCtx;
		ctx.fillStyle = "white";
		ctx.font = `${this.tileSize * 0.6}px monospace`;
		ctx.fillText(`${this.fps} fps`, 4, this.tileSize * 0.7);
	}

	renderAll(): void {
		this.drawBoard();
		this.drawHold();
		this.drawQueue();
		this.updateFPS();
	}
}
