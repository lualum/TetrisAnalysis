import { Application, Container, Graphics, Sprite, Text } from "pixi.js";

export type LabelKey =
	| "holdHeader"
	| "nextHeader"
	| "garbageSettingsHeader"
	| "garbageSettingsValue"
	| "messinessSettingsHeader"
	| "messinessSettingsValue";

export interface PixiSurface {
	app: Application;
	canvas: HTMLCanvasElement;
	graphics: Graphics;
	annotationContainer: Container;
	annotationSprites: Sprite[];
	annotationTextures: Record<string, Sprite["texture"]>;
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
	placementAnnotations: Rect;
	placementPreview: Rect;
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
