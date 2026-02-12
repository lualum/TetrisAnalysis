import {
	BOARD_HEIGHT,
	BOARD_WIDTH,
	KICKS,
	PIECES,
	QUEUE_SIZE,
	SPAWN_X,
	SPAWN_Y,
} from "./constants";

export enum PieceType {
	I = 0,
	O = 1,
	T = 2,
	J = 3,
	L = 4,
	S = 5,
	Z = 6,
}

export type Board = (PieceType | undefined)[][];

export interface Piece {
	type: PieceType;
	rot: number;
	x: number;
	y: number;
}

export class Tetris {
	board!: Board;
	current: Piece | undefined;
	queue: PieceType[] = [];
	holdPiece: PieceType | undefined;

	constructor() {
		this.reset();
	}

	reset(): void {
		this.board = Array(BOARD_HEIGHT)
			.fill(undefined)
			.map(() => Array(BOARD_WIDTH).fill(undefined));
		this.current = undefined;
		this.holdPiece = undefined;
		this.queue = [];

		this.spawnPiece();
	}

	generateBag(): void {
		const pieces: PieceType[] = [0, 1, 2, 3, 4, 5, 6];
		for (let i = pieces.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pieces[i], pieces[j]] = [pieces[j], pieces[i]];
		}
		this.queue.push(...pieces);
	}

	spawnPiece(pieceType?: PieceType): boolean {
		if (pieceType === undefined) {
			if (this.queue.length <= QUEUE_SIZE) this.generateBag();
			pieceType = this.queue.shift()!;
		}

		const spawnedPiece = {
			type: pieceType,
			rot: 0,
			x: SPAWN_X,
			y: SPAWN_Y,
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
		const data = PIECES[piece.type][piece.rot];
		for (let r = 0; r < data.length; r++) {
			for (let c = 0; c < data[r].length; c++) {
				if (!data[r][c]) continue;
				const x = piece.x + c;
				const y = piece.y + r;
				if (!this.inBounds(x, y) || this.board[y][x] !== undefined)
					return false;
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
		const rot = (this.current.rot + drot + 4) % 4;
		const kickTable =
			this.current.type === PieceType.I ? KICKS.I : KICKS.TJLSZ;
		const kickKey = `${this.current.rot}-${rot}` as keyof typeof kickTable;
		const kicks = kickTable[kickKey];
		for (const kick of kicks) {
			const x = this.current.x + kick[0];
			const y = this.current.y - kick[1];
			const piece = {
				...this.current,
				rot,
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
	}

	place(): void {
		if (!this.current) return;
		const data = PIECES[this.current.type][this.current.rot];
		for (let r = 0; r < data.length; r++) {
			for (let c = 0; c < data[r].length; c++) {
				if (!data[r][c]) continue;
				const x = this.current.x + c;
				const y = this.current.y + r;
				this.board[y][x] = this.current.type;
			}
		}
		this.clearLines();
		this.spawnPiece();
	}

	clearLines(): void {
		for (let r = 39; r >= 0; r--) {
			if (this.board[r].every((cell) => cell !== undefined)) {
				this.board.splice(r, 1);
				this.board.unshift(Array(10).fill(undefined));
				r++;
			}
		}
	}

	hold(): void {
		if (this.current === undefined) return;
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
