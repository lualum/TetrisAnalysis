import { Graphics } from "pixi.js";
import { BOARD_HEIGHT_HIDDEN, BOARD_HEIGHT_VISIBLE, BOARD_WIDTH } from "./constants";
import { Tetris } from "./game";
import { getCssColor } from "./render-layout";
import { drawBoardMino, drawPiece, drawShadow } from "./render-minos";
import { RenderContext } from "./render-types";

const GRID_LINE_TILE_RATIO = 0.05;
const GRID_OPACITY = 0.2;

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

function drawBoardFrame(graphics: Graphics, context: RenderContext): void {
	const { layout, borderWidth } = context;
	const outlineColor = getCssColor("--color-outline");

	graphics
		.rect(layout.board.x - borderWidth, layout.board.y, borderWidth, layout.board.height)
		.fill(outlineColor);
	graphics
		.rect(layout.board.x + layout.board.width, layout.board.y, borderWidth, layout.board.height)
		.fill(outlineColor);
	graphics
		.rect(
			layout.board.x - borderWidth,
			layout.board.y + layout.board.height,
			layout.board.width + borderWidth * 2,
			borderWidth,
		)
		.fill(outlineColor);
}

export function drawBoard(graphics: Graphics, context: RenderContext, game: Tetris): void {
	const { layout } = context;
	const boardColor = getCssColor("--color-board");

	graphics
		.rect(layout.board.x, layout.board.y, layout.board.width, layout.board.height)
		.fill(boardColor);
	drawBoardFrame(graphics, context);
	drawBoardGrid(graphics, context);

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

	if (game.current) {
		const ghost = game.getGhost();
		drawShadow(graphics, context, ghost);
		drawPiece(graphics, context, game.current);
	}
}
