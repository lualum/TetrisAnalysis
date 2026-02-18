import { Application, Graphics, Text } from "pixi.js";

export type LabelKey =
	| "holdHeader"
	| "scoreHeader"
	| "scoreValue"
	| "statsHeader"
	| "statsValue"
	| "nextHeader"
	| "garbageSettingsHeader"
	| "garbageSettingsValue"
	| "messinessSettingsHeader"
	| "messinessSettingsValue";

export interface PixiSurface {
	app: Application;
	canvas: HTMLCanvasElement;
	graphics: Graphics;
	labels: Record<LabelKey, Text>;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Layout {
	container: Rect;
	board: Rect;
	hold: Rect;
	next: Rect;
	holdHeader: Rect;
	scoreHeader: Rect;
	score: Rect;
	statsHeader: Rect;
	stats: Rect;
	nextHeader: Rect;
	cheeseSettings: Rect;
}

export interface RenderMetrics {
	tileSize: number;
	borderWidth: number;
}

export interface RenderContext extends RenderMetrics {
	layout: Layout;
}
