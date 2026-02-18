import { game } from "./main";
import { drawBoard } from "./render-board";
import { syncCanvasLayout as measureCanvasLayout } from "./render-layout";
import { drawHold, drawNext, drawStaticPanels, layoutStaticText } from "./render-panels";
import { createSurface } from "./render-surface";
import { PixiSurface, RenderContext } from "./render-types";

let surface: PixiSurface;
let renderContext: RenderContext;
let resizeListenerAttached = false;

function syncCanvasLayout(): void {
	renderContext = measureCanvasLayout(surface);
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

	graphics.clear();
	drawStaticPanels(graphics, renderContext);
	drawHold(graphics, renderContext, game);
	drawBoard(graphics, renderContext, game);
	drawNext(graphics, renderContext, game);
	layoutStaticText(surface, renderContext);

	surface.app.render();
}
