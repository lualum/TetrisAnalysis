import { Application, Assets, Container, Graphics, Sprite, Text, WebGLRenderer } from "pixi.js";
import { LabelKey, PixiSurface } from "./render-types";
import { type PlacementAnnotation } from "./bot";
import bestAnnotationUrl from "../assets/annotation/best.svg";
import blunderAnnotationUrl from "../assets/annotation/blunder.svg";
import excellentAnnotationUrl from "../assets/annotation/excellent.svg";
import goodAnnotationUrl from "../assets/annotation/good.svg";
import inaccuracyAnnotationUrl from "../assets/annotation/inaccuracy.svg";
import mistakeAnnotationUrl from "../assets/annotation/mistake.svg";

const ANNOTATION_URLS = [
	bestAnnotationUrl,
	excellentAnnotationUrl,
	goodAnnotationUrl,
	inaccuracyAnnotationUrl,
	mistakeAnnotationUrl,
	blunderAnnotationUrl,
];

const ANNOTATION_COUNT = 1;

const ANNOTATION_URL_BY_KIND: Record<PlacementAnnotation, string> = {
	best: bestAnnotationUrl,
	excellent: excellentAnnotationUrl,
	good: goodAnnotationUrl,
	inaccuracy: inaccuracyAnnotationUrl,
	mistake: mistakeAnnotationUrl,
	blunder: blunderAnnotationUrl,
};

function createLabels(): Record<LabelKey, Text> {
	return {
		holdHeader: new Text({ text: "HOLD", anchor: { x: 0, y: 0.5 } }),
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
	const annotationTextures = await Assets.load(ANNOTATION_URLS);
	const annotationContainer = new Container();
	const annotationSprites = Array.from({ length: ANNOTATION_COUNT }, () => {
		const texture = annotationTextures[ANNOTATION_URL_BY_KIND.best];
		const sprite = new Sprite(texture);
		sprite.anchor.set(0.5);
		return sprite;
	});
	const labels = createLabels();
	app.stage.addChild(graphics);
	for (const sprite of annotationSprites) {
		annotationContainer.addChild(sprite);
	}
	app.stage.addChild(annotationContainer);
	for (const label of Object.values(labels)) {
		app.stage.addChild(label);
	}

	return {
		app,
		canvas,
		graphics,
		annotationContainer,
		annotationSprites,
		annotationTextures,
		labels,
	};
}

export function getAnnotationTextureUrl(kind: PlacementAnnotation): string {
	return ANNOTATION_URL_BY_KIND[kind];
}
