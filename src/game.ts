import {
	BOARD_HEIGHT,
	BOARD_WIDTH,
	CENTERS,
	CHEESE_RACE_GARBAGE_LINES,
	CHEESE_RACE_MESSINESS,
	KICKS,
	PIECES,
	NEXT_SIZE,
	SPAWN_X,
	SPAWN_Y,
} from "./constants";

export enum PieceType {
	I = "I",
	O = "O",
	T = "T",
	J = "J",
	L = "L",
	S = "S",
	Z = "Z",
}

export enum GarbageType {
	Garbage = "G",
}

export enum Orientation {
	north = "north",
	east = "east",
	south = "south",
	west = "west",
}

export type CellType = PieceType | GarbageType;
export type Board = (CellType | null)[][];

export interface Piece {
	type: PieceType;
	orientation: Orientation;
	x: number;
	y: number;
}

export interface Snapshot {
	board: Board;
	current: PieceType | null;
	next: PieceType[];
	holdPiece: PieceType | null;
}

export class Tetris {
	board!: Board;
	current!: Piece | null;
	next: PieceType[] = [];
	holdPiece!: PieceType | null;
	history: Snapshot[] = [];
	future: Snapshot[] = [];

	constructor() {
		this.reset();
	}

	reset(): void {
		this.board = Array(BOARD_HEIGHT)
			.fill(null)
			.map(() => Array(BOARD_WIDTH).fill(null));
		this.addCheeseGarbage();
		this.current = null;
		this.holdPiece = null;
		this.next = [];
		this.history = [];
		this.future = [];
		this.spawnPiece();
		this.save();
	}

	private addCheeseGarbage(): void {
		this.pushCheeseGarbage(this.getCheeseGarbageDeficit());
	}

	private countCheeseGarbageRows(): number {
		return this.board.filter((row) =>
			row.some((cell) => cell === GarbageType.Garbage),
		).length;
	}

	private getCheeseGarbageDeficit(): number {
		const garbageLines = Math.max(
			0,
			Math.min(BOARD_HEIGHT, CHEESE_RACE_GARBAGE_LINES),
		);
		return Math.max(0, garbageLines - this.countCheeseGarbageRows());
	}

	private createCheeseGarbageRow(hole: number): Board[number] {
		return Array.from({ length: BOARD_WIDTH }, (_, col) =>
			col === hole ? null : GarbageType.Garbage,
		);
	}

	private getBottomGarbageHole(): number | null {
		for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
			if (!this.board[row].some((cell) => cell === GarbageType.Garbage)) continue;

			const hole = this.board[row].findIndex(
				(cell) => cell !== GarbageType.Garbage,
			);
			return hole === -1 ? null : hole;
		}

		return null;
	}

	private pushCheeseGarbage(lines: number): void {
		if (lines <= 0) return;

		const messiness = Math.max(0, Math.min(100, CHEESE_RACE_MESSINESS));
		const bottomHole = this.getBottomGarbageHole();
		let hole = bottomHole ?? Math.floor(Math.random() * BOARD_WIDTH);

		for (let i = 0; i < lines; i++) {
			if ((i > 0 || bottomHole !== null) && Math.random() * 100 < messiness) {
				let nextHole = Math.floor(Math.random() * BOARD_WIDTH);
				while (nextHole === hole && BOARD_WIDTH > 1) {
					nextHole = Math.floor(Math.random() * BOARD_WIDTH);
				}
				hole = nextHole;
			}

			this.board.shift();
			this.board.push(this.createCheeseGarbageRow(hole));
		}
	}

	snapshot(): Snapshot {
		return {
			board: this.board.map((row) => [...row]),
			current: this.current ? this.current.type : null,
			next: [...this.next],
			holdPiece: this.holdPiece,
		};
	}

	private restore(snap: Snapshot): void {
		this.board = snap.board.map((row) => [...row]);
		this.next = [...snap.next];
		this.holdPiece = snap.holdPiece;
		this.current = null;
		if (snap.current) {
			this.spawnPiece(snap.current);
		}
	}

	save(): void {
		if (this.board === null) return;
		this.history.push(this.snapshot());
		this.future = [];
	}

	undo(): boolean {
		if (this.history.length <= 1) return false;
		this.future.push(this.history.pop()!);
		this.restore(this.history[this.history.length - 1]);
		return true;
	}

	redo(): boolean {
		if (!this.future.length) return false;
		const snap = this.future.pop()!;
		this.history.push(snap);
		this.restore(snap);
		return true;
	}

	generateBag(): void {
		const pieces: PieceType[] = [
			PieceType.I,
			PieceType.O,
			PieceType.T,
			PieceType.J,
			PieceType.L,
			PieceType.S,
			PieceType.Z,
		];
		for (let i = pieces.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pieces[i], pieces[j]] = [pieces[j], pieces[i]];
		}
		this.next.push(...pieces);
	}

	shiftNext(): PieceType {
		if (this.next.length <= NEXT_SIZE) this.generateBag();
		return this.next.shift()!;
	}

	spawnPiece(piece?: PieceType | null): boolean {
		if (!piece) piece = this.shiftNext();

		const spawnedPiece = {
			type: piece,
			orientation: Orientation.north,
			x: SPAWN_X - CENTERS[piece][Orientation.north][0],
			y: SPAWN_Y - CENTERS[piece][Orientation.north][1],
		};
		if (!this.isValid(spawnedPiece)) {
			return false;
		}
		this.current = spawnedPiece;
		return true;
	}

	inBounds(x: number, y: number): boolean {
		return x >= 0 && y >= 0 && x < BOARD_WIDTH && y < BOARD_HEIGHT;
	}

	isValid(piece = this.current): boolean {
		if (!piece) return false;
		const data = PIECES[piece.type][piece.orientation];
		for (let r = 0; r < data.length; r++) {
			for (let c = 0; c < data[r].length; c++) {
				if (!data[r][c]) continue;
				const x = piece.x + c;
				const y = piece.y + r;
				if (!this.inBounds(x, y) || this.board[y][x] !== null) return false;
			}
		}
		return true;
	}

	move(dx: number, dy: number): boolean {
		if (!this.current) return false;
		const x = this.current.x + dx;
		const y = this.current.y + dy;
		const piece = {
			...this.current,
			x,
			y,
		};
		if (!this.isValid(piece)) return false;
		this.current = piece;
		return true;
	}

	rotate(drot: number): boolean {
		if (!this.current) return false;
		if (this.current.type === PieceType.O) return true;

		const orientationKey = [
			Orientation.north,
			Orientation.east,
			Orientation.south,
			Orientation.west,
		];

		const orientationFrom = orientationKey.indexOf(this.current.orientation);
		const orientationTo = (orientationFrom + drot + 4) % 4;
		const orientation = orientationKey[orientationTo];

		const kickTable = KICKS[this.current.type];
		const kickKey =
			`${orientationFrom}-${orientationTo}` as keyof typeof kickTable;
		const kicks = kickTable[kickKey];
		console.log(kickKey);
		for (const kick of kicks) {
			const x = this.current.x + kick[0];
			const y = this.current.y - kick[1];
			const piece = {
				...this.current,
				orientation,
				x,
				y,
			};
			if (this.isValid(piece)) {
				this.current = piece;
				return true;
			}
		}
		return false;
	}

	hardDrop(): void {
		while (this.move(0, 1)) {}
		this.place();
		this.save();
	}

	sonicDrop(): boolean {
		let moved = false;
		while (this.move(0, 1)) {
			moved = true;
		}
		return moved;
	}

	place(): void {
		if (!this.current) return;
		const data = PIECES[this.current.type][this.current.orientation];
		for (let r = 0; r < data.length; r++) {
			for (let c = 0; c < data[r].length; c++) {
				if (!data[r][c]) continue;
				const x = this.current.x + c;
				const y = this.current.y + r;
				this.board[y][x] = this.current.type;
			}
		}
		const clearedLines = this.clearLines();
		if (clearedLines === 0) {
			this.addCheeseGarbage();
		}
		this.spawnPiece();
	}

	clearLines(): number {
		let clearedLines = 0;

		for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
			if (this.board[r].every((cell) => cell !== null)) {
				this.board.splice(r, 1);
				this.board.unshift(Array(BOARD_WIDTH).fill(null));
				clearedLines++;
				r++;
			}
		}

		return clearedLines;
	}

	hold(): void {
		if (this.current === null) return;
		const temp = this.current.type;
		this.spawnPiece(this.holdPiece);
		this.holdPiece = temp;
	}

	getGhost(): Piece {
		if (!this.current) throw new Error("No current piece");
		let ghost = this.current;
		while (
			this.isValid({
				...ghost,
				y: ghost.y + 1,
			})
		) {
			ghost = { ...ghost, y: ghost.y + 1 };
		}
		return ghost;
	}
}
