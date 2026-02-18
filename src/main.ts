import { MisaMinoWrapper } from "./bot";
import { Tetris } from "./game";
import { InputHandler } from "./input";
import { Renderer } from "./render";

export const game = new Tetris();
export const inputHandler = new InputHandler(game);
export const renderer = new Renderer(game);
export const misaMinoWrapper = new MisaMinoWrapper(game);

function gameLoop(): void {
	renderer.renderAll();
	requestAnimationFrame(gameLoop);
}

document.addEventListener("DOMContentLoaded", () => {
	inputHandler.setup();
	gameLoop();
});
