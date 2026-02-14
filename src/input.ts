import type { Tetris } from "./game";

const DAS = 92;
const ARR = 0;
const SD_ARR = 0;

interface KeyMapping {
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

interface MovementState {
	left: boolean;
	right: boolean;
	down: boolean;
}

export class InputHandler {
	game: Tetris;
	keyMappings: KeyMapping = {
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

	held = {
		left: false,
		right: false,
	};

	queued: MovementState = {
		left: false,
		right: false,
		down: false,
	};

	DASTimer: number | undefined;
	ARRTimer: number | true | undefined;
	SD_ARRTimer: number | true | undefined;

	constructor(game: Tetris) {
		this.game = game;
	}

	getActionFromKey(key: string): keyof KeyMapping | undefined {
		for (const [action, keys] of Object.entries(this.keyMappings)) {
			if (keys.includes(key)) {
				return action as keyof KeyMapping;
			}
		}
		return undefined;
	}

	applyMovement(): void {
		while (true) {
			if (this.queued.down && this.game.move(0, 1)) {
				if (this.SD_ARRTimer !== true) {
					this.queued.down = false;
					if (this.SD_ARRTimer) {
						this.SD_ARRTimer = window.setTimeout(() => {
							this.queued.down = true;
							this.applyMovement();
						}, SD_ARR);
					}
				}
				continue;
			}

			if (this.queued.left && this.game.move(-1, 0)) {
				if (this.ARRTimer !== true) {
					this.queued.left = false;
					if (this.ARRTimer) {
						this.ARRTimer = window.setTimeout(() => {
							this.queued.left = true;
							this.applyMovement();
						}, ARR);
					}
				}
				continue;
			}

			if (this.queued.right && this.game.move(1, 0)) {
				if (this.ARRTimer !== true) {
					this.queued.right = false;
					if (this.ARRTimer) {
						this.ARRTimer = window.setTimeout(() => {
							this.queued.right = true;
							this.applyMovement();
						}, ARR);
					}
				}
				continue;
			}

			break;
		}
	}

	startMovement(dir: keyof MovementState): void {
		this.queued[dir] = true;

		if (dir === "down") {
			this.startARR(dir);
			return;
		}

		this.DASTimer = window.setTimeout(() => {
			this.startARR(dir);
		}, DAS);
	}

	startARR(dir: keyof MovementState): void {
		this.queued[dir] = true;

		if (dir === "down") {
			if (SD_ARR > 0) {
				this.SD_ARRTimer = window.setTimeout(() => {
					this.queued.down = true;
					this.applyMovement();
				}, SD_ARR);
			} else {
				this.SD_ARRTimer = true;
			}
			this.applyMovement();
			return;
		}

		if (ARR > 0) {
			this.ARRTimer = window.setTimeout(() => {
				this.queued[dir] = true;
				this.applyMovement();
			}, ARR);
		} else {
			this.ARRTimer = true;
		}
		this.applyMovement();
	}

	stopMovement(dir: keyof MovementState): void {
		this.queued[dir] = false;

		if (dir === "down" && this.SD_ARRTimer) {
			if (this.SD_ARRTimer !== true) clearTimeout(this.SD_ARRTimer);
			this.SD_ARRTimer = undefined;
			return;
		}

		if (this.DASTimer) {
			clearTimeout(this.DASTimer);
			this.DASTimer = undefined;
		}

		if (this.ARRTimer) {
			if (this.ARRTimer !== true) clearTimeout(this.ARRTimer);
			this.ARRTimer = undefined;
		}
	}

	handleKeyDown = (event: KeyboardEvent): void => {
		if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
			return;
		}

		if (event.repeat) return;

		const action = this.getActionFromKey(event.code);
		if (!action) return;

		event.preventDefault();

		switch (action) {
			case "left":
				this.held.left = true;
				this.stopMovement("right");
				this.startMovement("left");
				break;

			case "right":
				this.held.right = true;
				this.stopMovement("left");
				this.startMovement("right");
				break;

			case "down":
				this.startMovement("down");
				break;

			case "rotateClockwise":
				this.game.rotate(1);
				break;

			case "rotateCounterClockwise":
				this.game.rotate(-1);
				break;

			case "rotate180":
				this.game.rotate(2);
				break;

			case "hardDrop":
				this.game.hardDrop();
				break;

			case "hold":
				this.game.hold();
				break;

			case "reset":
				this.game.reset();
				break;

			case "undo":
				this.game.undo();
				break;

			case "redo":
				this.game.redo();
				break;
		}

		this.applyMovement();
	};

	handleKeyUp = (event: KeyboardEvent): void => {
		if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
			return;
		}

		const action = this.getActionFromKey(event.code);

		switch (action) {
			case "left":
				this.held.left = false;
				this.stopMovement("left");
				if (this.held.right) this.startMovement("right");
				break;
			case "right":
				this.held.right = false;
				this.stopMovement("right");
				if (this.held.left) this.startMovement("left");
				break;
			case "down":
				this.stopMovement("down");
				break;
		}
	};

	setup(): void {
		document.addEventListener("keydown", this.handleKeyDown);
		document.addEventListener("keyup", this.handleKeyUp);
	}

	cleanup(): void {
		this.stopMovement("left");
		this.stopMovement("right");
		this.stopMovement("down");
		document.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("keyup", this.handleKeyUp);
	}
}
