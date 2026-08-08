import { bot, game } from "./main";
import { drawBoard } from "./render-board";
import { syncCanvasLayout as measureCanvasLayout } from "./render-layout";
import {
	drawHold,
	drawNext,
	drawStaticPanels,
	layoutPlacementAnnotations,
	layoutStaticText,
} from "./render-panels";
import { createSurface } from "./render-surface";
import { PixiSurface, RenderContext } from "./render-types";

let surface: PixiSurface;
let renderContext: RenderContext;
let resizeListenerAttached = false;

function syncCanvasLayout(): void {
	renderContext = measureCanvasLayout(surface);
}

function getPlacementPreviewContext(): RenderContext {
	return {
		layout: {
			...renderContext.layout,
			board: renderContext.layout.placementPreview,
		},
		tileSize: renderContext.tileSize / 2,
		borderWidth: renderContext.borderWidth,
	};
}

export async function setupRenderer(): Promise<void> {
	surface = await createSurface("gameCanvas");

	syncCanvasLayout();
	document.body.classList.remove("app-loading");

	if (!resizeListenerAttached) {
		window.addEventListener("resize", syncCanvasLayout);
		resizeListenerAttached = true;
	}
}

export function render(): void {
	const graphics = surface.graphics;
	const placementAnnotation = bot.getPlacementAnnotation();
	const placementPreview = bot.shouldShowPlacementPreview()
		? bot.getPlacementPreview()
		: null;

	graphics.clear();
	drawStaticPanels(graphics, renderContext);
	drawHold(graphics, renderContext, game);
	drawBoard(graphics, renderContext, game, [], { frameEdges: { top: false } });
	layoutPlacementAnnotations(surface, renderContext, placementAnnotation);
	if (placementPreview) {
		drawBoard(
			graphics,
			getPlacementPreviewContext(),
			placementPreview.game,
			placementPreview.suggestedPieces,
			{
				showCurrent: false,
				showGrid: false,
				fillFirstSuggestedPiece: true,
				suggestedOutlineWidthScale: 1.35,
			},
		);
	}
	drawNext(graphics, renderContext, game);
	layoutStaticText(surface, renderContext);

	surface.app.render();
}
