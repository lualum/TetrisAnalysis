import { DAS, ARR, SD_ARR, Keybinds, keybinds } from "./config";
import { game } from "./main";

interface MovementState {
	left: boolean;
	right: boolean;
	down: boolean;
}

const held = {
	left: false,
	right: false,
};

const queued: MovementState = {
	left: false,
	right: false,
	down: false,
};

let DASTimer: number | undefined;
let ARRTimer: number | true | undefined;
let SD_ARRTimer: number | true | undefined;

function getActionFromKey(key: string): keyof Keybinds | undefined {
	for (const [action, keys] of Object.entries(keybinds)) {
		if (keys.includes(key)) {
			return action as keyof Keybinds;
		}
	}
	return undefined;
}

function applyMovement(): void {
	while (true) {
		if (queued.down && game.move(0, 1)) {
			if (SD_ARRTimer !== true) {
				queued.down = false;
				if (SD_ARRTimer) {
					SD_ARRTimer = window.setTimeout(() => {
						queued.down = true;
						applyMovement();
					}, SD_ARR);
				}
			}
			continue;
		}

		if (queued.left && game.move(-1, 0)) {
			if (ARRTimer !== true) {
				queued.left = false;
				if (ARRTimer) {
					ARRTimer = window.setTimeout(() => {
						queued.left = true;
						applyMovement();
					}, ARR);
				}
			}
			continue;
		}

		if (queued.right && game.move(1, 0)) {
			if (ARRTimer !== true) {
				queued.right = false;
				if (ARRTimer) {
					ARRTimer = window.setTimeout(() => {
						queued.right = true;
						applyMovement();
					}, ARR);
				}
			}
			continue;
		}

		break;
	}
}

function startARR(dir: keyof MovementState): void {
	queued[dir] = true;

	if (dir === "down") {
		if (SD_ARR > 0) {
			SD_ARRTimer = window.setTimeout(() => {
				queued.down = true;
				applyMovement();
			}, SD_ARR);
		} else {
			SD_ARRTimer = true;
		}
		applyMovement();
		return;
	}

	if (ARR > 0) {
		ARRTimer = window.setTimeout(() => {
			queued[dir] = true;
			applyMovement();
		}, ARR);
	} else {
		ARRTimer = true;
	}

	applyMovement();
}

function startMovement(dir: keyof MovementState): void {
	queued[dir] = true;

	if (dir === "down") {
		startARR(dir);
		return;
	}

	DASTimer = window.setTimeout(() => {
		startARR(dir);
	}, DAS);
}

function stopMovement(dir: keyof MovementState): void {
	queued[dir] = false;

	if (dir === "down" && SD_ARRTimer) {
		if (SD_ARRTimer !== true) clearTimeout(SD_ARRTimer);
		SD_ARRTimer = undefined;
		return;
	}

	if (DASTimer) {
		clearTimeout(DASTimer);
		DASTimer = undefined;
	}

	if (ARRTimer) {
		if (ARRTimer !== true) clearTimeout(ARRTimer);
		ARRTimer = undefined;
	}
}

function handleKeyDown(event: KeyboardEvent): void {
	if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
	if (event.repeat) return;

	const action = getActionFromKey(event.code);
	if (!action) return;

	event.preventDefault();

	switch (action) {
		case "left":
			held.left = true;
			stopMovement("right");
			startMovement("left");
			break;

		case "right":
			held.right = true;
			stopMovement("left");
			startMovement("right");
			break;

		case "down":
			startMovement("down");
			break;

		case "rotateClockwise":
			game.rotate(1);
			break;

		case "rotateCounterClockwise":
			game.rotate(-1);
			break;

		case "rotate180":
			game.rotate(2);
			break;

		case "hardDrop":
			game.hardDrop();
			break;

		case "hold":
			game.hold();
			break;

		case "reset":
			game.reset();
			break;

		case "undo":
			game.undo();
			break;

		case "redo":
			game.redo();
			break;
	}

	applyMovement();
}

function handleKeyUp(event: KeyboardEvent): void {
	if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

	const action = getActionFromKey(event.code);

	switch (action) {
		case "left":
			held.left = false;
			stopMovement("left");
			if (held.right) startMovement("right");
			break;
		case "right":
			held.right = false;
			stopMovement("right");
			if (held.left) startMovement("left");
			break;
		case "down":
			stopMovement("down");
			break;
	}
}

export function setupInput(): void {
	document.addEventListener("keydown", handleKeyDown);
	document.addEventListener("keyup", handleKeyUp);
}

export function cleanupInput(): void {
	stopMovement("left");
	stopMovement("right");
	stopMovement("down");
	document.removeEventListener("keydown", handleKeyDown);
	document.removeEventListener("keyup", handleKeyUp);
}
