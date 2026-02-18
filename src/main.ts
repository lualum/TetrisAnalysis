import { MisaMinoWrapper } from "./bot";
import { Tetris } from "./game";
import { setupInput } from "./input";
import { render, setupRenderer } from "./render";

export const game = new Tetris();
export const misaMinoWrapper = new MisaMinoWrapper(game);

function gameLoop(): void {
	render();
	requestAnimationFrame(gameLoop);
}

document.addEventListener("DOMContentLoaded", () => {
	setupInput();
	setupRenderer();
	gameLoop();
});
