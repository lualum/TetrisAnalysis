import { Graphics } from "pixi.js";
import { BOARD_HEIGHT_HIDDEN, COLORS, HIGHLIGHT_COLOR, PIECES } from "./constants";
import { CellType, Orientation, Piece, PieceType } from "./game";
import { Rect, RenderContext } from "./render-types";

export interface OutlineMino {
	type: CellType;
	x: number;
	y: number;
	previewIndex?: number;
}

interface GridPoint {
	x: number;
	y: number;
}

interface BoundaryEdge {
	start: GridPoint;
	end: GridPoint;
}

interface OutlineGroup {
	alpha: number;
	minos: OutlineMino[];
}

function pointKey(point: GridPoint): string {
	return `${point.x}:${point.y}`;
}

function edgeDirection(edge: BoundaryEdge): number {
	if (edge.end.x > edge.start.x) return 0;
	if (edge.end.y > edge.start.y) return 1;
	if (edge.end.x < edge.start.x) return 2;
	return 3;
}

function traceBoundaryPaths(edges: BoundaryEdge[]): GridPoint[][] {
	const outgoing = new Map<string, BoundaryEdge[]>();

	for (const edge of edges) {
		const key = pointKey(edge.start);
		const candidates = outgoing.get(key) ?? [];
		candidates.push(edge);
		outgoing.set(key, candidates);
	}

	const paths: GridPoint[][] = [];
	let remainingEdges = edges.length;

	while (remainingEdges > 0) {
		const firstCandidates = [...outgoing.values()].find((candidates) => candidates.length > 0);
		if (!firstCandidates) break;

		const firstEdge = firstCandidates.pop()!;
		remainingEdges--;
		const path = [firstEdge.start, firstEdge.end];
		let currentEdge = firstEdge;

		while (pointKey(currentEdge.end) !== pointKey(firstEdge.start)) {
			const candidates = outgoing.get(pointKey(currentEdge.end));
			if (!candidates?.length) break;

			const direction = edgeDirection(currentEdge);
			const turnPreference = [
				(direction + 1) % 4,
				direction,
				(direction + 3) % 4,
				(direction + 2) % 4,
			];
			let nextIndex = 0;

			for (const preferredDirection of turnPreference) {
				const candidateIndex = candidates.findIndex(
					(candidate) => edgeDirection(candidate) === preferredDirection,
				);
				if (candidateIndex !== -1) {
					nextIndex = candidateIndex;
					break;
				}
			}

			currentEdge = candidates.splice(nextIndex, 1)[0];
			remainingEdges--;
			path.push(currentEdge.end);
		}

		paths.push(path);
	}

	return paths;
}

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

export function drawPieceOutline(
	graphics: Graphics,
	context: RenderContext,
	piece: Piece,
	alpha = 1,
): void {
	const { layout, tileSize } = context;
	const data = PIECES[piece.type][piece.orientation];
	const lineWidth = Math.max(1, tileSize * 0.08);
	const color = COLORS[piece.type] || "#888888";

	const isOccupied = (row: number, col: number): boolean =>
		row >= 0 &&
		row < data.length &&
		col >= 0 &&
		col < data[row].length &&
		data[row][col] === 1;

	for (let r = 0; r < data.length; r++) {
		for (let c = 0; c < data[r].length; c++) {
			if (!data[r][c]) continue;

			const left = layout.board.x + (piece.x + c) * tileSize;
			const top = layout.board.y + (piece.y + r - BOARD_HEIGHT_HIDDEN) * tileSize;
			const right = left + tileSize;
			const bottom = top + tileSize;

			if (!isOccupied(r - 1, c)) {
				graphics
					.moveTo(left, top)
					.lineTo(right, top)
					.stroke({ color, width: lineWidth, alpha });
			}
			if (!isOccupied(r, c + 1)) {
				graphics
					.moveTo(right, top)
					.lineTo(right, bottom)
					.stroke({ color, width: lineWidth, alpha });
			}
			if (!isOccupied(r + 1, c)) {
				graphics
					.moveTo(left, bottom)
					.lineTo(right, bottom)
					.stroke({ color, width: lineWidth, alpha });
			}
			if (!isOccupied(r, c - 1)) {
				graphics
					.moveTo(left, top)
					.lineTo(left, bottom)
					.stroke({ color, width: lineWidth, alpha });
			}
		}
	}
}

export function drawMinoOutlines(
	graphics: Graphics,
	context: RenderContext,
	minos: OutlineMino[],
	alphaForMino: (mino: OutlineMino) => number = () => 1,
): void {
	const { layout, tileSize } = context;
	const lineWidth = Math.max(1, tileSize * 0.08);
	const groups = new Map<string, OutlineGroup>();

	for (const mino of minos) {
		const alpha = alphaForMino(mino);
		const key = `${mino.previewIndex ?? ""}:${mino.type}:${alpha}`;
		const group = groups.get(key) ?? { alpha, minos: [] };
		group.minos.push(mino);
		groups.set(key, group);
	}

	for (const { alpha, minos: groupedMinos } of groups.values()) {
		const minosByPosition = new Map(
			groupedMinos.map((mino) => [`${mino.x}:${mino.y}`, mino]),
		);
		const occupied = new Set(minosByPosition.keys());
		const edges: BoundaryEdge[] = [];

		for (const mino of minosByPosition.values()) {
			const { x, y } = mino;
			if (!occupied.has(`${x}:${y - 1}`)) {
				edges.push({ start: { x, y }, end: { x: x + 1, y } });
			}
			if (!occupied.has(`${x + 1}:${y}`)) {
				edges.push({ start: { x: x + 1, y }, end: { x: x + 1, y: y + 1 } });
			}
			if (!occupied.has(`${x}:${y + 1}`)) {
				edges.push({ start: { x: x + 1, y: y + 1 }, end: { x, y: y + 1 } });
			}
			if (!occupied.has(`${x - 1}:${y}`)) {
				edges.push({ start: { x, y: y + 1 }, end: { x, y } });
			}
		}

		for (const path of traceBoundaryPaths(edges)) {
			const firstPoint = path[0];
			graphics.moveTo(
				layout.board.x + firstPoint.x * tileSize,
				layout.board.y + (firstPoint.y - BOARD_HEIGHT_HIDDEN) * tileSize,
			);

			for (const point of path.slice(1)) {
				graphics.lineTo(
					layout.board.x + point.x * tileSize,
					layout.board.y + (point.y - BOARD_HEIGHT_HIDDEN) * tileSize,
				);
			}

			graphics.closePath();
		}

		const firstMino = groupedMinos[0];
		graphics.stroke({
			color: COLORS[firstMino.type] || "#888888",
			width: lineWidth,
			alpha,
			alignment: 1,
		});
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
