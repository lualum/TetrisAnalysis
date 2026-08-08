import {
	botSettings as configuredBotSettings,
	defaultBotSettings,
	defaultHandling,
	defaultKeybinds,
	keybinds,
	MAX_ANALYZE_DEPTH,
	setBotSettings,
	setHandling,
	type BotSettings,
	type HandlingSettings,
	type KeybindSlot,
	type Keybinds,
} from "./config";

const STORAGE_KEY = "ccanalysis.controls";
const BACKGROUND_STORAGE_KEY = "ccanalysis.background";
const MAX_BINDS_PER_ACTION = 3;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const ACTION_LABELS: Record<keyof Keybinds, string> = {
	left: "LEFT",
	right: "RIGHT",
	down: "SOFT",
	hardDrop: "HARD",
	rotateClockwise: "CW",
	rotateCounterClockwise: "CCW",
	rotate180: "180",
	hold: "HOLD",
	reset: "RESET",
	undo: "UNDO",
	redo: "REDO",
};

const ACTIONS: Array<keyof Keybinds> = [
	"left",
	"right",
	"down",
	"hardDrop",
	"rotateClockwise",
	"rotateCounterClockwise",
	"rotate180",
	"hold",
	"reset",
	"undo",
	"redo",
];
const HANDLING_SETTINGS: Array<{
	key: keyof HandlingSettings;
	label: string;
	min: number;
	max: number;
	step: number;
}> = [
	{ key: "das", label: "DAS", min: 0, max: 1000, step: 1 },
	{ key: "arr", label: "ARR", min: 0, max: 1000, step: 1 },
	{ key: "sdArr", label: "SDARR", min: 0, max: 1000, step: 1 },
];
const BOT_NUMBER_SETTINGS: Array<{
	key: Extract<keyof BotSettings, "analyzeDepth">;
	label: string;
	min: number;
	max: number;
	step: number;
}> = [
	{ key: "analyzeDepth", label: "PEAK DEPTH", min: 1, max: MAX_ANALYZE_DEPTH, step: 1 },
];

let modal: HTMLDivElement | null = null;
let edgeTrigger: HTMLDivElement | null = null;
let bindingAction: keyof Keybinds | null = null;
let bindingIndex = 0;
let handling: HandlingSettings = { ...defaultHandling };
let botSettings: BotSettings = { ...configuredBotSettings };
let backgroundUploaded = false;

function cloneKeybinds(source: Keybinds): Keybinds {
	return Object.fromEntries(
		ACTIONS.map((action) => [action, normalizeKeySlots(source[action])]),
	) as unknown as Keybinds;
}

function isKeybinds(value: unknown): value is Partial<Keybinds> {
	return typeof value === "object" && value !== null;
}

function isHandlingSettings(value: unknown): value is Partial<HandlingSettings> {
	return typeof value === "object" && value !== null;
}

function isBotSettings(value: unknown): value is Partial<BotSettings> {
	return typeof value === "object" && value !== null;
}

function getStoredKeybinds(parsed: unknown): unknown {
	if (!isKeybinds(parsed)) return null;
	if ("keybinds" in parsed && isKeybinds(parsed.keybinds)) return parsed.keybinds;
	return parsed;
}

function getStoredHandling(parsed: unknown): unknown {
	if (!isKeybinds(parsed) || !("handling" in parsed)) return null;
	return parsed.handling;
}

function getStoredBotSettings(parsed: unknown): unknown {
	if (!isKeybinds(parsed) || !("bot" in parsed)) return null;
	return parsed.bot;
}

function sanitizeHandlingValue(value: unknown, fallback: number): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	return Math.max(0, Math.min(1000, Math.round(value)));
}

function sanitizeNumberSetting(
	value: unknown,
	fallback: number,
	min: number,
	max: number,
): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	return Math.max(min, Math.min(max, Math.round(value)));
}

function sanitizeBooleanSetting(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function normalizeKeySlots(keys: unknown): KeybindSlot[] {
	const slots = Array.isArray(keys)
		? keys
				.filter((key): key is KeybindSlot => typeof key === "string" || key === null)
				.slice(0, MAX_BINDS_PER_ACTION)
		: [];

	while (slots.length < MAX_BINDS_PER_ACTION) {
		slots.push(null);
	}

	return slots;
}

function applyHandling(nextHandling: HandlingSettings): void {
	handling = nextHandling;
	setHandling(nextHandling);
}

function applyBotSettings(nextBotSettings: BotSettings): void {
	botSettings = nextBotSettings;
	setBotSettings(nextBotSettings);
}

function readSettingsCookie(): string | null {
	const prefix = `${encodeURIComponent(STORAGE_KEY)}=`;
	const cookie = document.cookie
		.split("; ")
		.find((item) => item.startsWith(prefix));
	if (!cookie) return null;

	return decodeURIComponent(cookie.slice(prefix.length));
}

function writeSettingsCookie(value: string): void {
	document.cookie = `${encodeURIComponent(STORAGE_KEY)}=${encodeURIComponent(
		value,
	)}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
}

function clearSettingsCookie(): void {
	document.cookie = `${encodeURIComponent(STORAGE_KEY)}=; max-age=0; path=/; samesite=lax`;
}

function loadStoredSettings(): void {
	const stored = readSettingsCookie() ?? localStorage.getItem(STORAGE_KEY);
	if (!stored) return;

	try {
		const parsed = JSON.parse(stored);
		const storedKeybinds = getStoredKeybinds(parsed);
		const storedHandling = getStoredHandling(parsed);
		const storedBotSettings = getStoredBotSettings(parsed);

		for (const action of ACTIONS) {
			if (!isKeybinds(storedKeybinds)) break;
			const keys = storedKeybinds[action];
			if (
				Array.isArray(keys) &&
				keys.every((key) => typeof key === "string" || key === null)
			) {
				keybinds[action] = normalizeKeySlots(keys);
			}
		}

		if (isHandlingSettings(storedHandling)) {
			applyHandling({
				das: sanitizeHandlingValue(storedHandling.das, defaultHandling.das),
				arr: sanitizeHandlingValue(storedHandling.arr, defaultHandling.arr),
				sdArr: sanitizeHandlingValue(storedHandling.sdArr, defaultHandling.sdArr),
			});
		}

		if (isBotSettings(storedBotSettings)) {
			applyBotSettings({
				enabled: sanitizeBooleanSetting(
					storedBotSettings.enabled,
					defaultBotSettings.enabled,
				),
				analyzeDepth: sanitizeNumberSetting(
					storedBotSettings.analyzeDepth,
					defaultBotSettings.analyzeDepth,
					1,
					MAX_ANALYZE_DEPTH,
				),
				showMainBoardPreview: sanitizeBooleanSetting(
					storedBotSettings.showMainBoardPreview,
					defaultBotSettings.showMainBoardPreview,
				),
			});
		}
		saveSettings();
	} catch {
		clearSettingsCookie();
	}
}

function applyBackground(value: string | null): void {
	if (value) {
		document.body.style.setProperty(
			"--app-background-image",
			`url(${JSON.stringify(value)})`,
		);
		backgroundUploaded = true;
		return;
	}

	document.body.style.removeProperty("--app-background-image");
	backgroundUploaded = false;
}

function loadStoredBackground(): void {
	applyBackground(localStorage.getItem(BACKGROUND_STORAGE_KEY));
}

function saveBackground(value: string): void {
	localStorage.setItem(BACKGROUND_STORAGE_KEY, value);
	applyBackground(value);
	renderBackgroundSettings();
}

function clearBackground(): void {
	localStorage.removeItem(BACKGROUND_STORAGE_KEY);
	applyBackground(null);
	renderBackgroundSettings();
}

function saveSettings(): void {
	writeSettingsCookie(
		JSON.stringify({
			keybinds,
			handling,
			bot: botSettings,
		}),
	);
	localStorage.removeItem(STORAGE_KEY);
}

function readUploadedBackground(file: File): void {
	if (!file.type.startsWith("image/")) return;

	const reader = new FileReader();
	reader.addEventListener("load", () => {
		if (typeof reader.result === "string") {
			saveBackground(reader.result);
		}
	});
	reader.readAsDataURL(file);
}

function formatKey(code: string): string {
	if (code === "Space") return "space";
	if (code.startsWith("Key")) return code.slice(3).toLowerCase();
	if (code.startsWith("Digit")) return code.slice(5).toLowerCase();
	if (code.startsWith("Arrow")) return code.replace("Arrow", "").toLowerCase();
	return code.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function assignKey(action: keyof Keybinds, index: number, code: string): void {
	for (const currentAction of ACTIONS) {
		keybinds[currentAction] = normalizeKeySlots(
			keybinds[currentAction].map((key) => (key === code ? null : key)),
		);
	}

	const keys = normalizeKeySlots(keybinds[action]);
	keys[index] = code;
	keybinds[action] = keys;
	saveSettings();
}

function removeKey(action: keyof Keybinds, index: number): void {
	const keys = normalizeKeySlots(keybinds[action]);
	keys[index] = null;
	keybinds[action] = keys;
	saveSettings();
}

function setWaiting(action: keyof Keybinds, index: number): void {
	bindingAction = action;
	bindingIndex = index;
	renderControlsList();
}

function renderControlsList(): void {
	const list = modal?.querySelector(".controls-settings-list");
	if (!list) return;

	list.innerHTML = "";
	for (const action of ACTIONS) {
		const row = document.createElement("div");
		row.className = "controls-settings-row";

		const label = document.createElement("div");
		label.className = "controls-settings-label";
		label.textContent = ACTION_LABELS[action];
		row.append(label);

		const keys = document.createElement("div");
		keys.className = "controls-settings-keys";
		const actionKeys = normalizeKeySlots(keybinds[action]);
		keybinds[action] = actionKeys;

		for (let index = 0; index < MAX_BINDS_PER_ACTION; index++) {
			const key = actionKeys[index];
			const slot = document.createElement("button");
			slot.type = "button";
			slot.className = "control-key";
			slot.textContent =
				bindingAction === action && bindingIndex === index
					? "press key"
					: key
						? formatKey(key)
						: "none";
			if (!key) {
				slot.classList.add("is-empty");
			}
			slot.addEventListener("click", () => setWaiting(action, index));
			keys.append(slot);
		}

		row.append(keys);
		list.append(row);
	}
}

function setHandlingValue(key: keyof HandlingSettings, value: string): void {
	const setting = HANDLING_SETTINGS.find((item) => item.key === key);
	if (!setting) return;

	const parsed = Number(value);
	const nextValue = sanitizeHandlingValue(parsed, handling[key]);
	const nextHandling = {
		...handling,
		[key]: Math.max(setting.min, Math.min(setting.max, nextValue)),
	};
	applyHandling(nextHandling);
	saveSettings();
	renderHandlingSettings();
}

function renderHandlingSettings(): void {
	const list = modal?.querySelector(".handling-settings-list");
	if (!list) return;

	list.innerHTML = "";
	for (const setting of HANDLING_SETTINGS) {
		const row = document.createElement("label");
		row.className = "handling-settings-row";

		const label = document.createElement("span");
		label.className = "handling-settings-label";
		label.textContent = setting.label;
		row.append(label);

		const input = document.createElement("input");
		input.className = "handling-settings-input";
		input.type = "number";
		input.min = `${setting.min}`;
		input.max = `${setting.max}`;
		input.step = `${setting.step}`;
		input.value = `${handling[setting.key]}`;
		input.addEventListener("change", () => setHandlingValue(setting.key, input.value));
		input.addEventListener("blur", () => setHandlingValue(setting.key, input.value));
		row.append(input);

		const unit = document.createElement("span");
		unit.className = "handling-settings-unit";
		unit.textContent = "ms";
		row.append(unit);

		list.append(row);
	}
}

function setBotNumberValue(key: "analyzeDepth", value: string): void {
	const setting = BOT_NUMBER_SETTINGS.find((item) => item.key === key);
	if (!setting) return;

	const parsed = Number(value);
	const nextValue = sanitizeNumberSetting(
		parsed,
		botSettings[key],
		setting.min,
		setting.max,
	);
	applyBotSettings({
		...botSettings,
		[key]: nextValue,
	});
	saveSettings();
	renderBotSettings();
}

function setBotEnabled(checked: boolean): void {
	applyBotSettings({
		...botSettings,
		enabled: checked,
	});
	saveSettings();
	renderBotSettings();
}

function setBotPreviewEnabled(checked: boolean): void {
	applyBotSettings({
		...botSettings,
		showMainBoardPreview: checked,
	});
	saveSettings();
	renderBotSettings();
}

function renderBotSettings(): void {
	const list = modal?.querySelector(".bot-settings-list");
	if (!list) return;

	list.innerHTML = "";
	const enabledRow = document.createElement("label");
	enabledRow.className = "bot-settings-row bot-settings-toggle-row";

	const enabledLabel = document.createElement("span");
	enabledLabel.className = "bot-settings-label";
	enabledLabel.textContent = "ENABLED";
	enabledRow.append(enabledLabel);

	const enabledInput = document.createElement("input");
	enabledInput.className = "bot-settings-toggle";
	enabledInput.type = "checkbox";
	enabledInput.checked = botSettings.enabled;
	enabledInput.addEventListener("change", () =>
		setBotEnabled(enabledInput.checked),
	);
	enabledRow.append(enabledInput);
	list.append(enabledRow);

	for (const setting of BOT_NUMBER_SETTINGS) {
		const row = document.createElement("label");
		row.className = "bot-settings-row";

		const label = document.createElement("span");
		label.className = "bot-settings-label";
		label.textContent = setting.label;
		row.append(label);

		const input = document.createElement("input");
		input.className = "bot-settings-input";
		input.type = "number";
		input.min = `${setting.min}`;
		input.max = `${setting.max}`;
		input.step = `${setting.step}`;
		input.value = `${botSettings[setting.key]}`;
		input.addEventListener("change", () =>
			setBotNumberValue(setting.key, input.value),
		);
		input.addEventListener("blur", () =>
			setBotNumberValue(setting.key, input.value),
		);
		row.append(input);

		list.append(row);
	}

	const previewRow = document.createElement("label");
	previewRow.className = "bot-settings-row bot-settings-toggle-row";

	const previewLabel = document.createElement("span");
	previewLabel.className = "bot-settings-label";
	previewLabel.textContent = "BOARD PREVIEW";
	previewRow.append(previewLabel);

	const previewInput = document.createElement("input");
	previewInput.className = "bot-settings-toggle";
	previewInput.type = "checkbox";
	previewInput.checked = botSettings.showMainBoardPreview;
	previewInput.addEventListener("change", () =>
		setBotPreviewEnabled(previewInput.checked),
	);
	previewRow.append(previewInput);
	list.append(previewRow);
}

function renderBackgroundSettings(): void {
	const list = modal?.querySelector(".background-settings-list");
	if (!list) return;

	list.innerHTML = "";

	const row = document.createElement("div");
	row.className = "background-settings-row";

	const label = document.createElement("span");
	label.className = "background-settings-label";
	label.textContent = backgroundUploaded ? "CUSTOM" : "NONE";
	row.append(label);

	const actions = document.createElement("div");
	actions.className = "controls-settings-keys";

	const uploadInput = document.createElement("input");
	uploadInput.className = "background-settings-file";
	uploadInput.type = "file";
	uploadInput.accept = "image/*";
	uploadInput.addEventListener("change", () => {
		const [file] = Array.from(uploadInput.files ?? []);
		if (file) readUploadedBackground(file);
		uploadInput.value = "";
	});

	const uploadButton = document.createElement("button");
	uploadButton.type = "button";
	uploadButton.className = "background-settings-upload";
	uploadButton.textContent = "upload";
	uploadButton.addEventListener("click", () => uploadInput.click());
	actions.append(uploadButton, uploadInput);

	if (backgroundUploaded) {
		const clearButton = document.createElement("button");
		clearButton.type = "button";
		clearButton.className = "background-settings-upload";
		clearButton.textContent = "clear";
		clearButton.addEventListener("click", clearBackground);
		actions.append(clearButton);
	}

	row.append(actions);
	list.append(row);
}

function openSettings(): void {
	if (!modal) return;
	bindingAction = null;
	modal.classList.add("is-open");
	modal.setAttribute("aria-hidden", "false");
	renderBotSettings();
	renderControlsList();
	renderHandlingSettings();
	renderBackgroundSettings();
}

function closeSettings(): void {
	if (!modal) return;
	bindingAction = null;
	modal.classList.remove("is-open");
	modal.setAttribute("aria-hidden", "true");
}

function resetKeybinds(): void {
	const defaults = cloneKeybinds(defaultKeybinds);
	for (const action of ACTIONS) {
		keybinds[action] = defaults[action];
	}
	applyHandling({ ...defaultHandling });
	applyBotSettings({ ...defaultBotSettings });
	clearBackground();
	saveSettings();
	renderBotSettings();
	renderControlsList();
	renderHandlingSettings();
}

function handleModalKeyDown(event: KeyboardEvent): void {
	if (!modal || !modal.classList.contains("is-open")) return;

	if (bindingAction) {
		event.preventDefault();
		if (event.code === "Backspace" || event.code === "Delete") {
			removeKey(bindingAction, bindingIndex);
		} else if (event.code !== "Escape") {
			assignKey(bindingAction, bindingIndex, event.code);
		}
		bindingAction = null;
		renderControlsList();
		return;
	}

	if (event.code === "Escape") {
		event.preventDefault();
		closeSettings();
	}
}

function bindModal(root: HTMLDivElement): void {
	root.addEventListener("pointerenter", openSettings);
	root.addEventListener("mousemove", openSettings);
	root.addEventListener("mouseleave", () => {
		if (!bindingAction) closeSettings();
	});
	root.querySelector(".controls-settings-reset")?.addEventListener("click", resetKeybinds);
}

function bindEdgeTrigger(trigger: HTMLDivElement): void {
	trigger.addEventListener("pointerenter", openSettings);
	trigger.addEventListener("mousemove", openSettings);
	trigger.addEventListener("click", openSettings);
	trigger.addEventListener("keydown", (event) => {
		if (event.code === "Enter" || event.code === "Space") {
			event.preventDefault();
			openSettings();
		}
	});
}

export function isControlsSettingsOpen(): boolean {
	return modal?.classList.contains("is-open") === true;
}

export function setupControlsSettings(): void {
	loadStoredSettings();
	loadStoredBackground();

	modal = document.querySelector(".controls-settings-modal");
	edgeTrigger = document.querySelector(".controls-settings-edge");
	if (!modal || !edgeTrigger) return;

	bindModal(modal);
	bindEdgeTrigger(edgeTrigger);
	document.addEventListener("keydown", handleModalKeyDown);
}
