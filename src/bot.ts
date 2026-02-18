import { BOARD_HEIGHT, CENTERS, QUEUE_SIZE } from "./constants";
import { Board, PieceType, Tetris } from "./game";
import {
	PIECE_TYPE_TO_TBP,
	TBP_TO_PIECE_TYPE,
	TBP_TO_ROT,
} from "./tbp_constants";

interface TBPMoveLocation {
	type: string;
	orientation: string;
	x: number;
	y: number;
}

interface TBPMove {
	location: TBPMoveLocation;
	spin?: string;
}

export class MisaMinoWrapper {
	game: Tetris;

	worker: Worker;
	isPlaying = false;
	autoplayInterval: ReturnType<typeof setInterval> | null = null;
	waitingForSuggestion = false;

	playBtn = document.getElementById("playBtn") as HTMLButtonElement;
	prevBtn = document.getElementById("prevBtn") as HTMLButtonElement;
	nextBtn = document.getElementById("nextBtn") as HTMLButtonElement;
	ppsInput = document.getElementById("ppsInput") as HTMLInputElement;
	resetHeader = document.querySelector(".reset-header") as HTMLElement;

	constructor(game: Tetris) {
		this.game = game;
		this.worker = new Worker(
			new URL("../pkg/misaImport.js", import.meta.url),
		);
		this.worker.onmessage = this.onWorkerMessage.bind(this);

		this.playBtn.addEventListener("click", () =>
			this.isPlaying ? this.stopAutoplay() : this.startAutoplay(),
		);
		this.nextBtn.addEventListener("click", () => this.stepForward());
		this.prevBtn.addEventListener("click", () => this.stepBackward());
		this.ppsInput.addEventListener("change", () => {
			if (this.isPlaying) {
				this.stopAutoplay();
				this.startAutoplay();
			}
		});
		this.resetHeader.addEventListener("click", () => {
			this.stopAutoplay();
			game.reset();
			this.start();
		});
	}

	boardToTBP(board: Board): (string | null)[][] {
		return [...board].map((row) =>
			row.map((cell) =>
				cell !== undefined ? PIECE_TYPE_TO_TBP[cell] : null,
			),
		);
	}

	send(msg: object) {
		console.log("[TBP Request]", msg);
		this.worker.postMessage(msg);
	}

	start() {
		const queue = [
			PIECE_TYPE_TO_TBP[this.game.current!.type],
			...this.game.queue
				.map((p) => PIECE_TYPE_TO_TBP[p])
				.slice(0, QUEUE_SIZE),
		];
		const hold =
			this.game.holdPiece !== undefined
				? PIECE_TYPE_TO_TBP[this.game.holdPiece]
				: null;

		this.send({
			type: "start",
			board: this.boardToTBP(this.game.board),
			queue,
			hold,
			combo: 0,
			back_to_back: false,
		});
	}

	suggest() {
		if (this.waitingForSuggestion) return;
		this.waitingForSuggestion = true;
		this.send({ type: "suggest" });
	}

	play(move: TBPMove) {
		this.send({ type: "play", move });
	}

	new_piece(piece: PieceType) {
		this.send({ type: "new_piece", piece: PIECE_TYPE_TO_TBP[piece] });
	}

	stop() {
		this.send({ type: "stop" });
	}

	onWorkerMessage(e: MessageEvent) {
		const msg = e.data;
		console.log("[TBP Response]", msg);

		if (msg.type === "info") {
			this.send({ type: "rules", randomizer: "seven-bag" });
		}

		if (msg.type === "ready") {
			this.start();
			return;
		}

		if (msg.type === "suggestion") {
			this.waitingForSuggestion = false;
			const moves: TBPMove[] = msg.moves;
			if (!moves || moves.length === 0) return;

			const didHoldFromEmpty = this.applyMove(moves[0]);
			this.play(moves[0]);

			if (didHoldFromEmpty) this.new_piece(this.game.queue[QUEUE_SIZE - 2]);

			this.new_piece(this.game.queue[QUEUE_SIZE - 1]);
		}

		if (msg.type === "error") {
			console.error("[TBP Bot Error]", msg.reason);
			this.waitingForSuggestion = false;
		}
	}

	applyMove(move: TBPMove): boolean {
		if (!this.game.current) throw new Error("No current piece");

		const suggestedType = TBP_TO_PIECE_TYPE[move.location.type];
		const targetRot = TBP_TO_ROT[move.location.orientation] ?? 0;

		let holdFromEmpty = false;
		if (this.game.current.type !== suggestedType) {
			const wasEmptyHold = this.game.holdPiece === undefined;
			this.game.hold();
			holdFromEmpty = wasEmptyHold;
			if (this.game.current.type !== suggestedType) {
				throw new Error("Invalid move");
			}
		}

		this.game.current.x =
			move.location.x - CENTERS[suggestedType][targetRot][0];
		this.game.current.y =
			BOARD_HEIGHT -
			move.location.y -
			1 -
			CENTERS[suggestedType][targetRot][1];
		console.log(this.game.current.x, this.game.current.y);

		this.game.current.rot = targetRot;

		this.game.hardDrop();

		return holdFromEmpty;
	}

	getPPS(): number {
		const val = parseFloat(this.ppsInput.value);
		return isNaN(val) || val <= 0 ? 0.5 : val;
	}

	startAutoplay() {
		if (this.isPlaying) return;
		this.isPlaying = true;
		this.playBtn.textContent = "⏸";
		this.autoplayInterval = setInterval(
			() => this.suggest(),
			1000 / this.getPPS(),
		);
	}

	stopAutoplay() {
		if (!this.isPlaying) return;
		this.isPlaying = false;
		this.playBtn.textContent = "⏵";
		this.waitingForSuggestion = false;

		if (this.autoplayInterval !== null) {
			clearInterval(this.autoplayInterval);
			this.autoplayInterval = null;
		}

		this.send({ type: "stop" });
	}

	stepForward() {
		this.stopAutoplay();
		this.suggest();
	}

	stepBackward() {
		this.stopAutoplay();
		const ok = this.game.undo();
		if (ok) this.start();
	}
}
