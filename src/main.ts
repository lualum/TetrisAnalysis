import { BlockfishWrapper } from "./bot";
import { Tetris } from "./game";
import { setupInput } from "./input";
import { render, setupRenderer } from "./render";

declare global {
	interface Window {
		game: Tetris;
		bot: BlockfishWrapper;
	}
}

export const game = new Tetris();

export const bot = new BlockfishWrapper(game);

window.game = game;
window.bot = bot;

function gameLoop(): void {
	render();
	requestAnimationFrame(gameLoop);
}

async function start(): Promise<void> {
	setupInput();
	await setupRenderer();
	bot.start();
	gameLoop();
}

document.addEventListener("DOMContentLoaded", () => {
	void start();
});
