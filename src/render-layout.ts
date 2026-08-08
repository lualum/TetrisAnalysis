import {
	BOARD_HEIGHT,
	BOARD_HEIGHT_HIDDEN,
	BOARD_HEIGHT_VISIBLE,
	BOARD_WIDTH,
} from "./constants";
import { Layout, PixiSurface, RenderMetrics } from "./render-types";

const BORDER_TILE_RATIO = 0.1;
const SIDE_PANEL_TILE_WIDTH = 5;
const CONTAINER_WIDTH_TILE_UNITS = BOARD_WIDTH + SIDE_PANEL_TILE_WIDTH * 2 + BORDER_TILE_RATIO * 4;

export function getCssColor(name: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function readCssPixel(name: string): number {
	const value = getCssColor(name);
	return Number.parseFloat(value) || 0;
}

function measureLayout(tileSize: number, borderWidth: number): Layout {
	const containerElement = document.querySelector(".container") as HTMLElement;
	const containerRect = containerElement.getBoundingClientRect();
	const leftWidth = 5 * tileSize;
	const boardWidth = BOARD_WIDTH * tileSize;
	const boardHeight = BOARD_HEIGHT_VISIBLE * tileSize;
	const canvasHeight = BOARD_HEIGHT * tileSize + borderWidth;
	const boardY = BOARD_HEIGHT_HIDDEN * tileSize;
	const leftPadding = borderWidth;
	const boardX = leftPadding + leftWidth + borderWidth;
	const rightX = leftPadding + leftWidth + boardWidth + borderWidth * 2;
	const headerHeight = tileSize;
	const sidePanelWidth = 5 * tileSize;
	const leftColumnX = 0;
	const leftColumnWidth = sidePanelWidth + borderWidth;

	return {
		container: {
			x: 0,
			y: 0,
			width: containerRect.width,
			height: canvasHeight,
		},
		board: {
			x: boardX,
			y: boardY,
			width: boardWidth,
			height: boardHeight,
		},
		holdHeader: {
			x: leftColumnX,
			y: boardY,
			width: leftColumnWidth,
			height: headerHeight,
		},
		hold: {
			x: leftColumnX,
			y: boardY + headerHeight,
			width: leftColumnWidth,
			height: 3 * tileSize,
		},
		placementPreview: {
			x: leftColumnX + borderWidth,
			y: boardY + 10 * tileSize,
			width: sidePanelWidth,
			height: 10 * tileSize,
		},
		placementAnnotations: {
			x: leftColumnX,
			y: boardY + 5 * tileSize,
			width: leftColumnWidth,
			height: 4 * tileSize,
		},
		nextHeader: {
			x: rightX,
			y: boardY,
			width: sidePanelWidth,
			height: headerHeight,
		},
		next: {
			x: rightX,
			y: boardY + headerHeight,
			width: sidePanelWidth,
			height: 15 * tileSize,
		},
		cheeseSettings: {
			x: rightX,
			y: boardY + 16.2 * tileSize,
			width: sidePanelWidth,
			height: 4 * tileSize,
		},
	};
}

function resizeSurface(surface: PixiSurface, width: number, height: number): void {
	surface.app.renderer.resize(width, height);
	surface.canvas.style.width = `${width}px`;
	surface.canvas.style.height = `${height}px`;
}

export function syncCanvasLayout(surface: PixiSurface): RenderMetrics & { layout: Layout } {
	const containerElement = document.querySelector(".container") as HTMLElement;
	const containerRect = containerElement.getBoundingClientRect();
	const tileSize = containerRect.width / CONTAINER_WIDTH_TILE_UNITS;
	const borderWidth = readCssPixel("--border-width") || tileSize * BORDER_TILE_RATIO;
	const layout = measureLayout(tileSize, borderWidth);
	resizeSurface(surface, layout.container.width, layout.container.height);

	return { layout, tileSize, borderWidth };
}
