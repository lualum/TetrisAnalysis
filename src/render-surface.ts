import { Application, Graphics, Text, WebGLRenderer } from "pixi.js";
import { LabelKey, PixiSurface } from "./render-types";

function createLabels(): Record<LabelKey, Text> {
	return {
		holdHeader: new Text({ text: "HOLD", anchor: { x: 0, y: 0.5 } }),
		scoreHeader: new Text({ text: "SCORE", anchor: { x: 0, y: 0.5 } }),
		scoreValue: new Text({ text: "(5x3)", anchor: 0.5 }),
		statsHeader: new Text({ text: "STATS", anchor: { x: 0, y: 0.5 } }),
		statsValue: new Text({ text: "(5x8)", anchor: 0.5 }),
		nextHeader: new Text({ text: "NEXT", anchor: { x: 0, y: 0.5 } }),
		garbageSettingsHeader: new Text({ text: "garbage", anchor: { x: 0, y: 0 } }),
		garbageSettingsValue: new Text({ text: "", anchor: { x: 0, y: 0 } }),
		messinessSettingsHeader: new Text({
			text: "messiness",
			anchor: { x: 0, y: 0 },
		}),
		messinessSettingsValue: new Text({ text: "", anchor: { x: 0, y: 0 } }),
	};
}

export async function createSurface(canvasId: string): Promise<PixiSurface> {
	const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
	const app = new Application<WebGLRenderer>();
	const renderer = new WebGLRenderer();

	await renderer.init({
		canvas,
		width: 1,
		height: 1,
		backgroundAlpha: 0,
		antialias: false,
		autoDensity: true,
		resolution: window.devicePixelRatio || 1,
	});
	app.renderer = renderer;

	const graphics = new Graphics();
	const labels = createLabels();
	app.stage.addChild(graphics);
	for (const label of Object.values(labels)) {
		app.stage.addChild(label);
	}

	return { app, canvas, graphics, labels };
}
