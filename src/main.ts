import { BlockfishWrapper } from "./bot";
import { Tetris } from "./game";
import { setupInput } from "./input";
import { render, setupRenderer } from "./render";

export const game = new Tetris();

export const bot = new BlockfishWrapper(game);

function gameLoop(): void {
	render();
	requestAnimationFrame(gameLoop);
}

async function start(): Promise<void> {
	setupInput();
	await setupRenderer();
	gameLoop();
}

document.addEventListener("DOMContentLoaded", () => {
	void start();
});
