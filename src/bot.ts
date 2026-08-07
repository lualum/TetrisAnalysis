import { NEXT_SIZE } from "./constants";
import { Tetris } from "./game";

interface BlockfishAnalysis {
	suggestions?: { inputs?: string[] }[];
}

export class BlockfishWrapper {
	game: Tetris;
	isPlaying = false;
	autoplayInterval: ReturnType<typeof setInterval> | null = null;
	waitingForSuggestion = false;

	constructor(game: Tetris) {
		this.game = game;
	}

	start(): void {
		// Public lifecycle hook used by reset controls.
	}

	async suggest(): Promise<void> {
		if (this.waitingForSuggestion || !this.game.current) return;

		this.waitingForSuggestion = true;
		try {
			const response = await fetch("/__blockfish/analyze", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					hold: this.game.holdPiece ?? "",
					next: [
						this.game.current.type,
						...this.game.next.slice(0, NEXT_SIZE),
					].join(""),
					rows: this.game.board.map((row) =>
						row.map((cell) => cell ?? ".").join(""),
					),
				}),
			});

			if (!response.ok) {
				throw new Error(`Blockfish request failed (${response.status})`);
			}

			const analysis = (await response.json()) as BlockfishAnalysis;
			const inputs = analysis.suggestions?.[0]?.inputs ?? [];
			this.applyInputs(inputs);
		} catch (error) {
			console.error("[Blockfish]", error);
		} finally {
			this.waitingForSuggestion = false;
		}
	}

	private applyInputs(inputs: string[]): void {
		for (const input of inputs) {
			switch (input) {
				case "left":
					this.game.move(-1, 0);
					break;
				case "right":
					this.game.move(1, 0);
					break;
				case "cw":
					this.game.rotate(1);
					break;
				case "ccw":
					this.game.rotate(-1);
					break;
				case "hold":
					this.game.hold();
					break;
				case "sd":
					this.game.sonicDrop();
					break;
				case "hd":
					this.game.hardDrop();
					return;
			}
		}
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
