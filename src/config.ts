export let DAS = 83;
export let ARR = 0;
export let SD_ARR = 0;
export const MAX_ANALYZE_DEPTH = 7;

export interface HandlingSettings {
	das: number;
	arr: number;
	sdArr: number;
}

export interface BotSettings {
	enabled: boolean;
	analyzeDepth: number;
	showMainBoardPreview: boolean;
}

export const defaultHandling: HandlingSettings = {
	das: DAS,
	arr: ARR,
	sdArr: SD_ARR,
};

export const defaultBotSettings: BotSettings = {
	enabled: true,
	analyzeDepth: 5,
	showMainBoardPreview: false,
};

export let botSettings: BotSettings = { ...defaultBotSettings };

export function setHandling(settings: HandlingSettings): void {
	DAS = settings.das;
	ARR = settings.arr;
	SD_ARR = settings.sdArr;
}

export function setBotSettings(settings: BotSettings): void {
	botSettings = settings;
}

function createDefaultKeybinds(): Keybinds {
	return {
		left: ["KeyR", "ArrowLeft", null],
		right: ["KeyU", "ArrowRight", null],
		down: ["KeyV", "ArrowDown", null],
		rotateClockwise: ["KeyI", "ArrowUp", "KeyX"],
		rotateCounterClockwise: ["KeyE", "KeyS", null],
		rotate180: ["KeyW", null, null],
		hardDrop: ["Space", null, null],
		hold: ["KeyO", "KeyC", null],
		reset: ["KeyQ", null, null],
		undo: ["KeyZ", null, null],
		redo: ["KeyY", null, null],
	};
}

export const defaultKeybinds: Keybinds = createDefaultKeybinds();

export let keybinds: Keybinds = createDefaultKeybinds();

export type KeybindSlot = string | null;

export interface Keybinds {
	left: KeybindSlot[];
	right: KeybindSlot[];
	down: KeybindSlot[];
	rotateClockwise: KeybindSlot[];
	rotateCounterClockwise: KeybindSlot[];
	rotate180: KeybindSlot[];
	hardDrop: KeybindSlot[];
	hold: KeybindSlot[];
	reset: KeybindSlot[];
	undo: KeybindSlot[];
	redo: KeybindSlot[];
}
