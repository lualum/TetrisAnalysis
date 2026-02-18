import { Graphics } from "pixi.js";
import { BOARD_HEIGHT_HIDDEN, COLORS, HIGHLIGHT_COLOR, PIECES } from "./constants";
import { CellType, Orientation, Piece, PieceType } from "./game";
import { Rect, RenderContext } from "./render-types";

export function drawMinoAt(
	graphics: Graphics,
	context: RenderContext,
	cellType: CellType,
	left: number,
	top: number,
	highlight = false,
	alpha = 1,
): void {
	const { tileSize } = context;
	graphics
		.rect(left, top, tileSize, tileSize)
		.fill({ color: COLORS[cellType] || "#888888", alpha });

	if (highlight) {
		graphics
			.rect(left, top, tileSize, tileSize / 6)
			.fill({ color: HIGHLIGHT_COLOR[cellType] || "#888888", alpha });
	}
}

export function drawBoardMino(
	graphics: Graphics,
	context: RenderContext,
	cellType: CellType,
	x: number,
	y: number,
	highlight = false,
	alpha = 1,
): void {
	const { layout, tileSize } = context;
	drawMinoAt(
		graphics,
		context,
		cellType,
		layout.board.x + x * tileSize,
		layout.board.y + y * tileSize,
		highlight,
		alpha,
	);
}

export function drawPiece(graphics: Graphics, context: RenderContext, piece: Piece): void {
	const data = PIECES[piece.type][piece.orientation];

	for (let r = 0; r < data.length; r++) {
		for (let c = 0; c < data[r].length; c++) {
			if (!data[r][c]) continue;

			const x = piece.x + c;
			const y = piece.y + r - BOARD_HEIGHT_HIDDEN;
			const hasHighlight = r === 0 || data[r - 1][c] === 0;
			drawBoardMino(graphics, context, piece.type, x, y, hasHighlight);
		}
	}
}

export function drawShadow(graphics: Graphics, context: RenderContext, piece: Piece): void {
	const data = PIECES[piece.type][piece.orientation];

	for (let r = 0; r < data.length; r++) {
		for (let c = 0; c < data[r].length; c++) {
			if (!data[r][c]) continue;

			const x = piece.x + c;
			const y = piece.y + r - BOARD_HEIGHT_HIDDEN;
			drawBoardMino(graphics, context, piece.type, x, y, false, 0.8);
		}
	}
}

export function drawSidePanelPiece(
	graphics: Graphics,
	context: RenderContext,
	rect: Rect,
	pieceType: PieceType,
	yOffset = 0,
	slotHeight = rect.height,
): void {
	const { tileSize } = context;
	const piece = PIECES[pieceType][Orientation.north];
	let minRow = 4;
	let maxRow = -1;
	let minCol = 4;
	let maxCol = -1;

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
	const offsetX = rect.x + (rect.width - pieceWidth) / 2 - minCol * tileSize;
	const offsetY = rect.y + yOffset + (slotHeight - pieceHeight) / 2 - minRow * tileSize;

	for (let r = 0; r < piece.length; r++) {
		for (let c = 0; c < piece[r].length; c++) {
			if (piece[r][c]) {
				drawMinoAt(
					graphics,
					context,
					pieceType,
					offsetX + c * tileSize,
					offsetY + r * tileSize,
					r === 0 || piece[r - 1][c] === 0,
				);
			}
		}
	}
}
