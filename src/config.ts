export let DAS = 83;
export let ARR = 0;
export let SD_ARR = 0;

export let keybinds: Keybinds = {
	left: ["KeyR", "ArrowLeft"],
	right: ["KeyU", "ArrowRight"],
	down: ["KeyV", "ArrowDown"],
	rotateClockwise: ["KeyI", "ArrowUp", "KeyX"],
	rotateCounterClockwise: ["KeyE", "KeyS"],
	rotate180: ["KeyW"],
	hardDrop: ["Space"],
	hold: ["KeyO", "KeyC"],
	reset: ["KeyQ"],
	undo: ["KeyZ"],
	redo: ["KeyY"],
};

export interface Keybinds {
	left: string[];
	right: string[];
	down: string[];
	rotateClockwise: string[];
	rotateCounterClockwise: string[];
	rotate180: string[];
	hardDrop: string[];
	hold: string[];
	reset: string[];
	undo: string[];
	redo: string[];
}
