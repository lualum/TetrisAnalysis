import { Graphics, Text } from "pixi.js";
import { CHEESE_RACE_GARBAGE_LINES, CHEESE_RACE_MESSINESS } from "./constants";
import { Tetris } from "./game";
import { getCssColor } from "./render-layout";
import { drawSidePanelPiece } from "./render-minos";
import { getAnnotationTextureUrl } from "./render-surface";
import { PixiSurface, Rect, RenderContext } from "./render-types";
import { type PlacementAnnotation } from "./bot";

function drawHeader(graphics: Graphics, rect: Rect): void {
	const outlineColor = getCssColor("--color-outline");

	graphics.rect(rect.x, rect.y, rect.width, rect.height).fill(outlineColor);
}

function layoutLabel(
	label: Text,
	context: RenderContext,
	text: string,
	rect: Rect,
	fill: string,
): void {
	const { tileSize, borderWidth } = context;
	label.text = text;
	label.style = {
		fontFamily: "HunDIN, sans-serif",
		fontSize: tileSize * 0.8,
		fontWeight: "400",
		fill,
		padding: Math.ceil(borderWidth),
	};

	label.anchor.set(0, 0.5);
	label.position.set(rect.x + Math.max(borderWidth, 1), rect.y + rect.height / 2);
}

function layoutCheeseText(surface: PixiSurface, context: RenderContext): void {
	const { layout, tileSize, borderWidth } = context;
	const textColor = getCssColor("--color-text-primary");
	const inset = borderWidth * 2;
	const valueY = layout.cheeseSettings.y + tileSize * 1.25;

	surface.labels.garbageSettingsHeader.text = "cheese";
	surface.labels.garbageSettingsHeader.style = {
		fontFamily: "HunDIN, sans-serif",
		fontSize: tileSize * 0.72,
		fontWeight: "400",
		fill: textColor,
		padding: Math.ceil(borderWidth),
	};
	surface.labels.garbageSettingsHeader.anchor.set(0, 0);
	surface.labels.garbageSettingsHeader.position.set(
		layout.cheeseSettings.x + inset,
		layout.cheeseSettings.y + inset,
	);

	surface.labels.garbageSettingsValue.text = `${CHEESE_RACE_GARBAGE_LINES}`;
	surface.labels.garbageSettingsValue.style = {
		fontFamily: "HunDIN, sans-serif",
		fontSize: tileSize * 1.2,
		fontWeight: "400",
		fill: textColor,
		padding: Math.ceil(borderWidth),
	};
	surface.labels.garbageSettingsValue.anchor.set(0, 0);
	surface.labels.garbageSettingsValue.position.set(
		layout.cheeseSettings.x + inset,
		valueY,
	);

	surface.labels.messinessSettingsHeader.text = "";
	surface.labels.messinessSettingsValue.text = `, ${CHEESE_RACE_MESSINESS.toFixed(2)}%`;
	surface.labels.messinessSettingsValue.style = {
		fontFamily: "HunDIN, sans-serif",
		fontSize: tileSize * 0.82,
		fontWeight: "400",
		fill: textColor,
		padding: Math.ceil(borderWidth),
	};
	surface.labels.messinessSettingsValue.anchor.set(0, 0);
	surface.labels.messinessSettingsValue.position.set(
		surface.labels.garbageSettingsValue.x + surface.labels.garbageSettingsValue.width,
		valueY + tileSize * 0.26,
	);
}

export function drawStaticPanels(graphics: Graphics, context: RenderContext): void {
	const { layout } = context;
	drawHeader(graphics, layout.holdHeader);
	drawHeader(graphics, layout.nextHeader);
}

export function layoutStaticText(surface: PixiSurface, context: RenderContext): void {
	const { layout } = context;
	const headerColor = getCssColor("--color-text-outline");

	layoutLabel(surface.labels.holdHeader, context, "HOLD", layout.holdHeader, headerColor);
	layoutLabel(surface.labels.nextHeader, context, "NEXT", layout.nextHeader, headerColor);
	layoutCheeseText(surface, context);
}

export function layoutPlacementAnnotations(
	surface: PixiSurface,
	context: RenderContext,
	annotation: PlacementAnnotation | null,
): void {
	const { layout, tileSize } = context;
	const iconSize = tileSize * 3.6;

	surface.annotationContainer.visible = annotation !== null;
	if (!annotation) return;

	for (let i = 0; i < surface.annotationSprites.length; i++) {
		const sprite = surface.annotationSprites[i];

		if (i > 0) {
			sprite.visible = false;
			continue;
		}

		sprite.texture = surface.annotationTextures[getAnnotationTextureUrl(annotation)];
		const textureWidth = sprite.texture.width || iconSize;
		const textureHeight = sprite.texture.height || iconSize;
		const scale = iconSize / Math.max(textureWidth, textureHeight);
		sprite.visible = true;
		sprite.scale.set(scale);
		sprite.position.set(
			layout.placementAnnotations.x + layout.placementAnnotations.width / 2,
			layout.placementAnnotations.y + layout.placementAnnotations.height / 2,
		);
	}
}

function drawClippedPanel(
	graphics: Graphics,
	context: RenderContext,
	rect: Rect,
	corner: "bottom-left" | "bottom-right",
): void {
	const { layout, tileSize, borderWidth } = context;
	const boardColor = getCssColor("--color-board");
	const outlineColor = getCssColor("--color-outline");
	const cornerSize = tileSize / 2;
	const isFlushLeft = rect.x <= borderWidth / 2;
	const isFlushRight = rect.x + rect.width >= layout.container.width - borderWidth / 2;
	const leftStrokeX = rect.x + (isFlushLeft ? borderWidth / 2 : -borderWidth / 2);
	const rightStrokeX =
		rect.x + rect.width + (isFlushRight ? -borderWidth / 2 : borderWidth / 2);
	const outerBottom = rect.y + rect.height + borderWidth / 2;

	if (corner === "bottom-left") {
		graphics
			.poly([
				rect.x,
				rect.y,
				rect.x + rect.width,
				rect.y,
				rect.x + rect.width,
				rect.y + rect.height,
				rect.x + cornerSize,
				rect.y + rect.height,
				rect.x,
				rect.y + rect.height - cornerSize,
			])
			.fill(boardColor);
		graphics
			.moveTo(leftStrokeX, rect.y)
			.lineTo(leftStrokeX, rect.y + rect.height - cornerSize)
			.lineTo(rect.x + cornerSize, outerBottom)
			.lineTo(rect.x + rect.width, outerBottom)
			.stroke({ color: outlineColor, width: borderWidth });
		return;
	}

	graphics
		.poly([
			rect.x,
			rect.y,
			rect.x + rect.width,
			rect.y,
			rect.x + rect.width,
			rect.y + rect.height - cornerSize,
			rect.x + rect.width - cornerSize,
			rect.y + rect.height,
			rect.x,
			rect.y + rect.height,
		])
		.fill(boardColor);
	graphics
		.moveTo(rect.x, outerBottom)
		.lineTo(rect.x + rect.width - cornerSize, outerBottom)
		.lineTo(rightStrokeX, rect.y + rect.height - cornerSize)
		.lineTo(rightStrokeX, rect.y)
		.stroke({ color: outlineColor, width: borderWidth });
}

export function drawHold(graphics: Graphics, context: RenderContext, game: Tetris): void {
	const { layout, borderWidth } = context;
	drawClippedPanel(graphics, context, layout.hold, "bottom-left");

	if (game.holdPiece) {
		drawSidePanelPiece(
			graphics,
			context,
			{
				...layout.hold,
				x: layout.hold.x + borderWidth,
				width: layout.hold.width - borderWidth,
			},
			game.holdPiece,
		);
	}
}

export function drawNext(graphics: Graphics, context: RenderContext, game: Tetris): void {
	const { layout, tileSize, borderWidth } = context;
	const outlineColor = getCssColor("--color-outline");
	const cornerSize = tileSize / 2;
	drawClippedPanel(graphics, context, layout.next, "bottom-right");
	graphics
		.rect(
			layout.next.x + layout.next.width,
			layout.nextHeader.y,
			borderWidth,
			layout.next.y + layout.next.height - cornerSize - layout.nextHeader.y,
		)
		.fill(outlineColor);

	const nextSize = 5;
	const slotHeight = layout.next.height / nextSize;

	for (let i = 0; i < Math.min(nextSize, game.next.length); i++) {
		drawSidePanelPiece(graphics, context, layout.next, game.next[i], i * slotHeight, slotHeight);
	}
}
