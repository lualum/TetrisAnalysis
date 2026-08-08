import { Graphics } from "pixi.js";
import type { SuggestedMino } from "./bot";
import { BOARD_HEIGHT_HIDDEN, BOARD_HEIGHT_VISIBLE, BOARD_WIDTH } from "./constants";
import { Tetris } from "./game";
import { getCssColor } from "./render-layout";
import { drawBoardMino, drawMinoOutlines, drawPiece, drawShadow } from "./render-minos";
import { RenderContext } from "./render-types";

const GRID_LINE_TILE_RATIO = 0.05;
const GRID_OPACITY = 0.2;

interface DrawBoardOptions {
	showCurrent?: boolean;
	showGrid?: boolean;
	fillFirstSuggestedPiece?: boolean;
	frameEdges?: {
		top?: boolean;
		right?: boolean;
		bottom?: boolean;
		left?: boolean;
	};
	suggestedOutlineWidthScale?: number;
}

function drawBoardGrid(graphics: Graphics, context: RenderContext): void {
	const { layout, tileSize } = context;
	const gridColor = getCssColor("--color-outline");
	const lineWidth = tileSize * GRID_LINE_TILE_RATIO;
	const halfLineWidth = lineWidth / 2;
	const horizontalSegmentWidth = Math.max(0, tileSize - lineWidth);

	for (let c = 1; c < BOARD_WIDTH; c++) {
		const x = layout.board.x + c * tileSize;
		graphics
			.rect(x - halfLineWidth, layout.board.y, lineWidth, layout.board.height)
			.fill({ color: gridColor, alpha: GRID_OPACITY });
	}

	for (let r = 1; r < BOARD_HEIGHT_VISIBLE; r++) {
		const y = layout.board.y + r * tileSize;
		for (let c = 0; c < BOARD_WIDTH; c++) {
			graphics
				.rect(
					layout.board.x + c * tileSize + halfLineWidth,
					y - halfLineWidth,
					horizontalSegmentWidth,
					lineWidth,
				)
				.fill({ color: gridColor, alpha: GRID_OPACITY });
		}
	}
}

function drawBoardFrame(graphics: Graphics, context: RenderContext, options: DrawBoardOptions): void {
	const { layout, borderWidth } = context;
	const outlineColor = getCssColor("--color-outline");
	const edges = {
		top: true,
		right: true,
		bottom: true,
		left: true,
		...options.frameEdges,
	};
	const leftBorderX = Math.max(0, layout.board.x - borderWidth);
	const leftInset = edges.left ? layout.board.x - leftBorderX : 0;
	const rightInset = edges.right ? borderWidth : 0;

	if (edges.top) {
		graphics
			.rect(
				layout.board.x - leftInset,
				layout.board.y - borderWidth,
				layout.board.width + leftInset + rightInset,
				borderWidth,
			)
			.fill(outlineColor);
	}
	if (edges.left) {
		graphics
			.rect(leftBorderX, layout.board.y, borderWidth, layout.board.height)
			.fill(outlineColor);
	}
	if (edges.right) {
		graphics
			.rect(
				layout.board.x + layout.board.width,
				layout.board.y,
				borderWidth,
				layout.board.height,
			)
			.fill(outlineColor);
	}
	if (edges.bottom) {
		graphics
			.rect(
				layout.board.x - leftInset,
				layout.board.y + layout.board.height,
				layout.board.width + leftInset + rightInset,
				borderWidth,
			)
			.fill(outlineColor);
	}
}

export function drawBoard(
	graphics: Graphics,
	context: RenderContext,
	game: Tetris,
	suggestedPieces: SuggestedMino[] = [],
	options: DrawBoardOptions = {},
): void {
	const { layout } = context;
	const boardColor = getCssColor("--color-board");
	const showCurrent = options.showCurrent ?? true;
	const showGrid = options.showGrid ?? true;

	graphics
		.rect(layout.board.x, layout.board.y, layout.board.width, layout.board.height)
		.fill(boardColor);
	drawBoardFrame(graphics, context, options);
	if (showGrid) {
		drawBoardGrid(graphics, context);
	}

	for (let r = 0; r < BOARD_HEIGHT_HIDDEN + BOARD_HEIGHT_VISIBLE; r++) {
		for (let c = 0; c < BOARD_WIDTH; c++) {
			const cell = game.board[r][c];
			if (cell) {
				const cellAbove = r > 0 ? game.board[r - 1][c] : null;
				drawBoardMino(
					graphics,
					context,
					cell,
					c,
					r - BOARD_HEIGHT_HIDDEN,
					cellAbove === null,
				);
			}
		}
	}

	const firstSuggestedPiece = suggestedPieces.filter((mino) => mino.previewIndex === 0);
	if (options.fillFirstSuggestedPiece) {
		const firstPiecePositions = new Set(
			firstSuggestedPiece.map((mino) => `${mino.x}:${mino.y}`),
		);

		for (const mino of firstSuggestedPiece) {
			drawBoardMino(
				graphics,
				context,
				mino.type,
				mino.x,
				mino.y - BOARD_HEIGHT_HIDDEN,
				!firstPiecePositions.has(`${mino.x}:${mino.y - 1}`),
				0.95,
			);
		}
	}

	const outlinedSuggestedPieces = options.fillFirstSuggestedPiece
		? suggestedPieces.filter((mino) => mino.previewIndex !== 0)
		: suggestedPieces;
	drawMinoOutlines(
		graphics,
		context,
		outlinedSuggestedPieces,
		(mino) => Math.max(0.25, 0.85 - (mino.previewIndex ?? 0) * 0.12),
		options.suggestedOutlineWidthScale ?? 1,
	);

	if (showCurrent && game.current) {
		const ghost = game.getGhost();
		drawShadow(graphics, context, ghost);
		drawPiece(graphics, context, game.current);
	}
}
