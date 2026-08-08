import { BOARD_HEIGHT, NEXT_SIZE, PIECES } from "./constants";
import { botSettings } from "./config";
import { type CellType, type Piece, Tetris } from "./game";

interface BlockfishAnalysis {
	suggestions?: BlockfishSuggestion[];
}

interface BlockfishSnapshot {
	hold: string;
	next: string;
	rows: string[];
	node_limit?: number;
	suggestion_limit?: number;
	placement_limit?: number;
	evaluation_placement_limit?: number;
}

interface WorkerAnalysisResponse {
	id: number;
	ok: boolean;
	analysis?: string;
	evaluation?: string;
	error?: string;
}

type BlockfishInput = "left" | "right" | "cw" | "ccw" | "hold" | "sd" | "hd";
type AnalysisTarget = "current" | "previous" | "previous-evaluation";
export type PlacementAnnotation =
	| "best"
	| "excellent"
	| "good"
	| "inaccuracy"
	| "mistake"
	| "blunder";

interface BlockfishSuggestion {
	rating?: number;
	evaluation?: number;
	inputs?: string[];
}

export interface SuggestedMino {
	type: CellType;
	x: number;
	y: number;
	previewIndex: number;
}

export interface PlacementPreview {
	game: Tetris;
	suggestedPieces: SuggestedMino[];
}

const PREVIEW_PLACEMENT_LIMIT = 5;

export class BlockfishWrapper {
	game: Tetris;
	isPlaying = false;
	autoplayInterval: ReturnType<typeof setInterval> | null = null;
	waitingForSuggestion = false;
	private previewInputs: BlockfishInput[] = [];
	private previewStateKey = "";
	private previewHoldContinuationStateKey = "";
	private previousPreviewInputs: BlockfishInput[] = [];
	private previousPreviewStateKey = "";
	private previousPlacementAnnotation: PlacementAnnotation | null = null;
	private worker: Worker | null = null;
	private analysisRequestId = 0;
	private activeAnalysis: {
		id: number;
		stateKey: string;
		applyOnReady: boolean;
		target: AnalysisTarget;
		topRating?: number;
	} | null = null;

	constructor(game: Tetris) {
		this.game = game;
	}

	start(): void {
		this.clearPreview();
		this.clearPreviousPreview();
		this.ensurePreviousPreview();
	}

	suggest(): void {
		if (!botSettings.enabled || !this.game.current) return;

		this.consumePreviewHoldIfCurrent();
		const stateKey = this.getStateKey(this.game);
		if (this.previewStateKey === stateKey && this.previewInputs.length) {
			this.applyInputs(this.previewInputs);
			this.ensurePreview();
			return;
		}

		if (this.waitingForSuggestion) return;

		this.requestInputsForGame(this.game, stateKey, true, "current");
	}

	ensurePreview(): void {
		if (!botSettings.enabled || !this.game.current) {
			this.clearPreview();
			return;
		}

		this.consumePreviewHoldIfCurrent();
		if (this.waitingForSuggestion) return;
		const stateKey = this.getStateKey(this.game);
		if (this.previewStateKey === stateKey && this.previewInputs.length) return;

		this.clearPreview();
		this.requestInputsForGame(this.game, stateKey, false, "current");
	}

	ensurePreviousPreview(): void {
		if (!botSettings.enabled) {
			this.clearPreviousPreview();
			return;
		}

		const previewGame = this.getPreviousMoveGame();
		if (!previewGame?.current) {
			this.clearPreviousPreview();
			return;
		}

		const stateKey = this.getStateKey(previewGame);
		if (this.previousPreviewStateKey === stateKey && this.previousPreviewInputs.length) return;
		if (this.activeAnalysis) return;

		this.clearPreviousPreview();
		this.requestInputsForGame(previewGame, stateKey, false, "previous");
	}

	getPlacementPreview(): PlacementPreview | null {
		if (!botSettings.enabled) return null;

		this.ensurePreviousPreview();
		const previewGame = this.getPreviousMoveGame();
		if (!previewGame?.current) return null;

		const stateKey = this.getStateKey(previewGame);
		if (this.previousPreviewStateKey !== stateKey || !this.previousPreviewInputs.length) {
			return { game: previewGame, suggestedPieces: [] };
		}

		const suggestionGame = previewGame.clone();
		if (!suggestionGame.resetCurrentToSpawn()) {
			return { game: previewGame, suggestedPieces: [] };
		}

		return {
			game: previewGame,
			suggestedPieces: this.collectSuggestedPieces(
				suggestionGame,
				this.previousPreviewInputs,
			),
		};
	}

	private requestInputsForGame(
		game: Tetris,
		stateKey: string,
		applyOnReady: boolean,
		target: AnalysisTarget,
	): void {
		if (target === "current") {
			this.cancelAnalysis();
			this.waitingForSuggestion = true;
		}
		const id = ++this.analysisRequestId;
		const snapshot =
			target === "previous"
				? this.previousMoveSnapshotForBlockfish(game)
				: this.snapshotForBlockfish(game);
		this.activeAnalysis = { id, stateKey, applyOnReady, target };

		this.getWorker().postMessage({
			id,
			snapshot: JSON.stringify(snapshot),
		});
	}

	private getWorker(): Worker {
		this.worker ??= new Worker(new URL("./blockfish-worker.ts", import.meta.url), {
			type: "module",
		});
		this.worker.onmessage = (event: MessageEvent<WorkerAnalysisResponse>) => {
			const active = this.activeAnalysis;
			if (!active || active.id !== event.data.id) return;
			if (!event.data.ok) {
				console.error("[Blockfish]", event.data.error);
				if (active.target === "previous-evaluation") {
					this.activeAnalysis = null;
					return;
				}
				this.completeAnalysis(active.id, active.stateKey, active.applyOnReady, active.target, []);
				return;
			}

			if (active.target === "previous-evaluation") {
				const evaluation = JSON.parse(event.data.evaluation ?? "{}") as {
					rating?: number;
				};
				this.completePositionEvaluation(
					active.id,
					active.stateKey,
					evaluation.rating,
					active.topRating,
				);
				return;
			}

			const analysis = JSON.parse(event.data.analysis ?? "{}") as BlockfishAnalysis;
			this.completeAnalysis(
				active.id,
				active.stateKey,
				active.applyOnReady,
				active.target,
				analysis.suggestions ?? [],
			);
		};
		this.worker.onerror = (event) => {
			console.error("[Blockfish]", event.message);
			const active = this.activeAnalysis;
			if (active) {
				this.completeAnalysis(
					active.id,
					active.stateKey,
					active.applyOnReady,
					active.target,
					[],
				);
			}
		};
		return this.worker;
	}

	private completeAnalysis(
		id: number,
		stateKey: string,
		applyOnReady: boolean,
		target: AnalysisTarget,
		suggestions: BlockfishSuggestion[],
	): void {
		if (!this.activeAnalysis || this.activeAnalysis.id !== id) return;
		this.activeAnalysis = null;
		if (target === "current") {
			this.waitingForSuggestion = false;
		}

		if (target === "previous") {
			const previewGame = this.getPreviousMoveGame();
			if (!previewGame || this.getStateKey(previewGame) !== stateKey || !suggestions.length) {
				this.clearPreviousPreview();
				return;
			}

			const topSuggestion = suggestions[0];
			const inputs = this.normalizeInputs(topSuggestion.inputs ?? []);
			this.previousPreviewInputs = inputs;
			this.previousPreviewStateKey = stateKey;
			this.previousPlacementAnnotation = this.annotationForPreviousMove(
				previewGame,
				suggestions,
			);
			if (this.previousPlacementAnnotation === null && typeof topSuggestion.rating === "number") {
				this.requestPositionEvaluationForPreviousMove(
					previewGame,
					stateKey,
					topSuggestion.rating,
				);
			}
			return;
		}

		if (this.getStateKey(this.game) !== stateKey) {
			return;
		}

		const inputs = this.normalizeInputs(suggestions[0]?.inputs ?? []);
		if (!inputs.length) {
			this.clearPreview();
			return;
		}

		this.setPreview(inputs, stateKey);
		if (applyOnReady) {
			this.applyInputs(inputs);
			this.ensurePreview();
		}
	}

	private cancelAnalysis(): void {
		this.activeAnalysis = null;
		this.waitingForSuggestion = false;
	}

	private requestPositionEvaluationForPreviousMove(
		game: Tetris,
		stateKey: string,
		topRating: number,
	): void {
		const positionRows = this.getActualPlacementRows(game);
		if (!positionRows) return;

		const id = ++this.analysisRequestId;
		this.activeAnalysis = {
			id,
			stateKey,
			applyOnReady: false,
			target: "previous-evaluation",
			topRating,
		};
		this.getWorker().postMessage({
			id,
			kind: "evaluate-position",
			snapshot: JSON.stringify({
				...this.snapshotForBlockfish(game),
				position_rows: positionRows,
			}),
		});
	}

	private completePositionEvaluation(
		id: number,
		stateKey: string,
		rating?: number,
		topRating?: number,
	): void {
		if (!this.activeAnalysis || this.activeAnalysis.id !== id) return;
		this.activeAnalysis = null;
		const previewGame = this.getPreviousMoveGame();
		if (
			!previewGame ||
			this.getStateKey(previewGame) !== stateKey ||
			typeof rating !== "number" ||
			typeof topRating !== "number"
		) {
			return;
		}

		this.previousPlacementAnnotation = this.annotationForEvaluation(
			Math.max(0, rating - topRating),
		);
	}

	destroy(): void {
		this.cancelAnalysis();
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
	}

	getSuggestedPieces(): SuggestedMino[] {
		if (!this.previewInputs.length) return [];
		this.consumePreviewHoldIfCurrent();
		if (this.previewStateKey !== this.getStateKey(this.game)) {
			this.clearPreview();
			return [];
		}

		const previewGame = this.game.clone();
		if (!previewGame.resetCurrentToSpawn()) return [];
		return this.collectSuggestedPieces(previewGame, this.previewInputs);
	}

	private clearPreview(): void {
		this.previewInputs = [];
		this.previewStateKey = "";
		this.previewHoldContinuationStateKey = "";
	}

	private clearPreviousPreview(): void {
		this.previousPreviewInputs = [];
		this.previousPreviewStateKey = "";
		this.previousPlacementAnnotation = null;
	}

	getPlacementAnnotation(): PlacementAnnotation | null {
		if (!botSettings.enabled) return null;

		this.ensurePreviousPreview();
		return this.previousPlacementAnnotation;
	}

	shouldShowPlacementPreview(): boolean {
		const annotation = this.getPlacementAnnotation();
		return (
			annotation === "good" ||
			annotation === "inaccuracy" ||
			annotation === "mistake" ||
			annotation === "blunder"
		);
	}

	private setPreview(inputs: BlockfishInput[], stateKey: string): void {
		this.previewInputs = inputs;
		this.previewStateKey = stateKey;
		this.previewHoldContinuationStateKey = this.getHoldContinuationStateKey(inputs);
	}

	private getHoldContinuationStateKey(inputs: BlockfishInput[]): string {
		if (inputs[0] !== "hold") return "";

		const previewGame = this.game.clone();
		if (!previewGame.resetCurrentToSpawn()) return "";
		previewGame.hold();
		return this.getStateKey(previewGame);
	}

	private consumePreviewHoldIfCurrent(): void {
		if (
			this.previewInputs[0] !== "hold" ||
			this.previewHoldContinuationStateKey !== this.getStateKey(this.game)
		) {
			return;
		}

		this.setPreview(this.previewInputs.slice(1), this.previewHoldContinuationStateKey);
	}

	private getPreviousMoveGame(): Tetris | null {
		const previewGame = this.game.clone();
		return previewGame.undo() ? previewGame : null;
	}

	private snapshotForBlockfish(game: Tetris): BlockfishSnapshot {
		return {
			hold: game.holdPiece ?? "",
			next: [
				game.current?.type ?? "",
				...game.next.slice(0, NEXT_SIZE),
			].join(""),
			rows: game.board.map((row) =>
				row.map((cell) => cell ?? ".").join(""),
			),
			placement_limit: botSettings.analyzeDepth,
			evaluation_placement_limit: botSettings.analyzeDepth,
		};
	}

	private previousMoveSnapshotForBlockfish(game: Tetris): BlockfishSnapshot {
		return {
			...this.snapshotForBlockfish(game),
			suggestion_limit: 256,
		};
	}

	private getStateKey(game: Tetris): string {
		const current = game.current?.type ?? "";

		return [
			current,
			game.holdPiece ?? "",
			game.next.join(""),
			game.board
				.map((row) => row.map((cell) => cell ?? ".").join(""))
				.join("/"),
		].join("|");
	}

	private normalizeInputs(inputs: string[]): BlockfishInput[] {
		return inputs.filter((input): input is BlockfishInput =>
			["left", "right", "cw", "ccw", "hold", "sd", "hd"].includes(input),
		);
	}

	private annotationForPreviousMove(
		previewGame: Tetris,
		suggestions: BlockfishSuggestion[],
	): PlacementAnnotation | null {
		const actualPlacement = this.game.lastPlacement;
		if (!actualPlacement) return null;

		const topRating = suggestions[0]?.rating;
		for (const suggestion of suggestions) {
			const inputs = this.normalizeInputs(suggestion.inputs ?? []);
			if (!inputs.length) continue;

			const suggestedPlacement = this.getFirstSuggestedPlacement(previewGame, inputs);
			if (!suggestedPlacement || !this.samePlacement(suggestedPlacement, actualPlacement)) {
				continue;
			}

			const evaluation =
				suggestion.evaluation ??
				(typeof suggestion.rating === "number" && typeof topRating === "number"
					? suggestion.rating - topRating
					: null);
			return typeof evaluation === "number"
				? this.annotationForEvaluation(evaluation)
				: null;
		}

		return null;
	}

	private getActualPlacementRows(game: Tetris): string[] | null {
		const actualPlacement = this.game.lastPlacement;
		if (!actualPlacement) return null;

		const evaluationGame = game.clone();
		evaluationGame.current = { ...actualPlacement };
		evaluationGame.place(false);
		return evaluationGame.board.map((row) =>
			row.map((cell) => cell ?? ".").join(""),
		);
	}

	private getFirstSuggestedPlacement(
		game: Tetris,
		inputs: BlockfishInput[],
	): Piece | null {
		const suggestionGame = game.clone();
		if (!suggestionGame.resetCurrentToSpawn()) return null;

		for (const input of inputs) {
			if (!suggestionGame.current) return null;
			if (input === "hd") return suggestionGame.getGhost();
			this.applyInput(suggestionGame, input);
		}

		return null;
	}

	private samePlacement(lhs: Piece, rhs: Piece): boolean {
		if (lhs.type !== rhs.type) return false;

		const lhsCells = this.getPlacementCells(lhs);
		const rhsCells = new Set(this.getPlacementCells(rhs));
		return lhsCells.length === rhsCells.size &&
			lhsCells.every((cell) => rhsCells.has(cell));
	}

	private getPlacementCells(piece: Piece): string[] {
		const data = PIECES[piece.type][piece.orientation];
		const cells: string[] = [];

		for (let row = 0; row < data.length; row++) {
			for (let col = 0; col < data[row].length; col++) {
				if (data[row][col]) cells.push(`${piece.x + col}:${piece.y + row}`);
			}
		}

		return cells;
	}

	private annotationForEvaluation(evaluation: number): PlacementAnnotation {
		if (evaluation <= 0) return "best";
		if (evaluation <= 5) return "excellent";
		if (evaluation <= 10) return "good";
		if (evaluation <= 20) return "inaccuracy";
		if (evaluation <= 40) return "mistake";
		return "blunder";
	}

	private collectSuggestedPieces(game: Tetris, inputs: BlockfishInput[]): SuggestedMino[] {
		const minos: SuggestedMino[] = [];
		const previewRows = Array.from({ length: BOARD_HEIGHT }, (_, row) => row);
		let placementCount = 0;

		for (const input of inputs) {
			if (!game.current) break;

			if (input === "hd") {
				minos.push(
					...this.getSuggestedMinos(game.getGhost(), placementCount, previewRows),
				);
				this.reserveClearedPreviewRows(previewRows, game.hardDrop(false));
				placementCount++;
				if (placementCount >= PREVIEW_PLACEMENT_LIMIT) break;
				continue;
			}

			this.applyInput(game, input);
		}

		return minos;
	}

	private reserveClearedPreviewRows(
		previewRows: number[],
		clearedRows: number[],
	): void {
		for (const clearedRow of clearedRows) {
			// Remove the row from collision space while retaining its display position.
			const nextTopRow = previewRows[0] - 1;
			previewRows.splice(clearedRow, 1);
			previewRows.unshift(nextTopRow);
		}
	}

	private getSuggestedMinos(
		piece: Piece,
		previewIndex: number,
		previewRows: readonly number[],
	): SuggestedMino[] {
		const data = PIECES[piece.type][piece.orientation];
		const minos: SuggestedMino[] = [];

		for (let r = 0; r < data.length; r++) {
			for (let c = 0; c < data[r].length; c++) {
				if (!data[r][c]) continue;
				minos.push({
					type: piece.type,
					x: piece.x + c,
					y: previewRows[piece.y + r],
					previewIndex,
				});
			}
		}

		return minos;
	}

	private applyInput(game: Tetris, input: BlockfishInput): boolean {
		switch (input) {
			case "left":
				return game.move(-1, 0);
			case "right":
				return game.move(1, 0);
			case "cw":
				return game.rotate(1);
			case "ccw":
				return game.rotate(-1);
			case "hold":
				game.hold();
				return true;
			case "sd":
				return game.sonicDrop();
			case "hd":
				game.hardDrop();
				return true;
		}
	}

	private applyInputs(inputs: BlockfishInput[]): void {
		let consumedInputs = 0;

		if (!this.game.resetCurrentToSpawn()) {
			this.clearPreview();
			return;
		}

		for (const input of inputs) {
			consumedInputs++;
			this.applyInput(this.game, input);
			if (input === "hd") break;
		}

		const remainingInputs = inputs.slice(consumedInputs);
		this.setPreview(
			remainingInputs,
			remainingInputs.length ? this.getStateKey(this.game) : "",
		);
	}

	startAutoplay(pps = 1): void {
		if (this.isPlaying) return;

		const piecesPerSecond = Number.isFinite(pps) && pps > 0 ? pps : 1;
		this.isPlaying = true;
		this.autoplayInterval = setInterval(
			() => void this.suggest(),
			1000 / piecesPerSecond,
		);
	}

	stopAutoplay(): void {
		if (!this.isPlaying) return;

		this.isPlaying = false;
		this.cancelAnalysis();

		if (this.autoplayInterval !== null) {
			clearInterval(this.autoplayInterval);
			this.autoplayInterval = null;
		}
	}

	stepForward(): void {
		this.suggest();
	}

	stepBackward(): void {
		this.stopAutoplay();
		this.game.undo();
		this.start();
	}
}
