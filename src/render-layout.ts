import {
	BOARD_HEIGHT,
	BOARD_HEIGHT_HIDDEN,
	BOARD_HEIGHT_VISIBLE,
	BOARD_WIDTH,
} from "./constants";
import { Layout, PixiSurface, RenderMetrics } from "./render-types";

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
	const boardX = leftWidth + borderWidth;
	const rightX = leftWidth + boardWidth + borderWidth * 2;
	const headerHeight = tileSize;
	const sidePanelWidth = 5 * tileSize;

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
			x: 0,
			y: boardY,
			width: sidePanelWidth,
			height: headerHeight,
		},
		hold: {
			x: 0,
			y: boardY + headerHeight,
			width: sidePanelWidth,
			height: 3 * tileSize,
		},
		scoreHeader: {
			x: 0,
			y: boardY + 5 * tileSize,
			width: sidePanelWidth,
			height: headerHeight,
		},
		score: {
			x: 0,
			y: boardY + 6 * tileSize,
			width: sidePanelWidth,
			height: 3 * tileSize,
		},
		statsHeader: {
			x: 0,
			y: boardY + 10 * tileSize,
			width: sidePanelWidth,
			height: headerHeight,
		},
		stats: {
			x: 0,
			y: boardY + 11 * tileSize,
			width: sidePanelWidth,
			height: 9 * tileSize,
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
	const tileSize = readCssPixel("--tile-width") || containerRect.width / 20.2;
	const borderWidth = readCssPixel("--border-width") || tileSize / 10;
	const layout = measureLayout(tileSize, borderWidth);
	resizeSurface(surface, layout.container.width, layout.container.height);

	return { layout, tileSize, borderWidth };
}
