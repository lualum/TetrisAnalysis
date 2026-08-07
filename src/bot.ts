import { BOARD_HEIGHT, NEXT_SIZE, PIECES } from "./constants";
import { type CellType, type Piece, Tetris } from "./game";

interface BlockfishAnalysis {
	suggestions?: { inputs?: string[] }[];
}

type BlockfishInput = "left" | "right" | "cw" | "ccw" | "hold" | "sd" | "hd";

export interface SuggestedMino {
	type: CellType;
	x: number;
	y: number;
	previewIndex: number;
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

	constructor(game: Tetris) {
		this.game = game;
	}

	start(): void {
		this.clearPreview();
		this.ensurePreview();
	}

	async suggest(): Promise<void> {
		if (!this.game.current) return;

		this.consumePreviewHoldIfCurrent();
		const stateKey = this.getStateKey(this.game);
		if (this.previewStateKey === stateKey && this.previewInputs.length) {
			this.applyInputs(this.previewInputs);
			this.ensurePreview();
			return;
		}

		if (this.waitingForSuggestion) return;

		const inputs = await this.fetchInputsForCurrentState(stateKey);
		if (inputs.length && this.getStateKey(this.game) === stateKey) {
			this.setPreview(inputs, stateKey);
			this.applyInputs(inputs);
			this.ensurePreview();
		}
	}

	ensurePreview(): void {
		if (!this.game.current) return;

		this.consumePreviewHoldIfCurrent();
		if (this.waitingForSuggestion) return;
		const stateKey = this.getStateKey(this.game);
		if (this.previewStateKey === stateKey && this.previewInputs.length) return;

		this.clearPreview();
		void this.fetchInputsForCurrentState(stateKey).then((inputs) => {
			if (this.getStateKey(this.game) !== stateKey) return;
			this.setPreview(inputs, inputs.length ? stateKey : "");
		});
	}

	private async fetchInputsForCurrentState(stateKey: string): Promise<BlockfishInput[]> {
		this.waitingForSuggestion = true;
		try {
			const response = await fetch("/__blockfish/analyze", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(this.snapshotForBlockfish()),
			});

			if (!response.ok) {
				throw new Error(`Blockfish request failed (${response.status})`);
			}

			const analysis = (await response.json()) as BlockfishAnalysis;
			if (this.getStateKey(this.game) !== stateKey) return [];
			return this.normalizeInputs(analysis.suggestions?.[0]?.inputs ?? []);
		} catch (error) {
			console.error("[Blockfish]", error);
			return [];
		} finally {
			this.waitingForSuggestion = false;
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

	private snapshotForBlockfish(): {
		hold: string;
		next: string;
		rows: string[];
	} {
		return {
			hold: this.game.holdPiece ?? "",
			next: [
				this.game.current?.type ?? "",
				...this.game.next.slice(0, NEXT_SIZE),
			].join(""),
			rows: this.game.board.map((row) =>
				row.map((cell) => cell ?? ".").join(""),
			),
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
		this.waitingForSuggestion = false;

		if (this.autoplayInterval !== null) {
			clearInterval(this.autoplayInterval);
			this.autoplayInterval = null;
		}
	}

	stepForward(): Promise<void> {
		return this.suggest();
	}

	stepBackward(): void {
		this.stopAutoplay();
		this.game.undo();
		this.start();
	}
}
