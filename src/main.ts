import { Tetris } from "./game";
import { InputHandler } from "./input";
import { Renderer } from "./render";

class TetrisApp {
	game: Tetris;
	inputHandler: InputHandler;
	renderer: Renderer;
	animationId: number | undefined = undefined;

	constructor() {
		this.game = new Tetris();
		this.inputHandler = new InputHandler(this.game);
		this.renderer = new Renderer(this.game);
	}

	initialize(): void {
		this.inputHandler.setup();
		this.startGame();
	}

	startGame(): void {
		this.gameLoop();
	}

	gameLoop = (): void => {
		this.renderer.renderAll();
		this.animationId = requestAnimationFrame(this.gameLoop);
	};

	cleanup(): void {
		this.inputHandler.cleanup();
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
		}
	}
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
	const app = new TetrisApp();
	await app.initialize();

	// Make app available globally for debugging
	(window as any).tetrisApp = app;
});
