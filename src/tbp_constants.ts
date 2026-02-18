import { PieceType } from "./game";

export const PIECE_TYPE_TO_TBP: Record<PieceType, string> = {
	[PieceType.I]: "I",
	[PieceType.O]: "O",
	[PieceType.T]: "T",
	[PieceType.J]: "J",
	[PieceType.L]: "L",
	[PieceType.S]: "S",
	[PieceType.Z]: "Z",
};

export const TBP_TO_PIECE_TYPE: Record<string, PieceType> = {
	I: PieceType.I,
	O: PieceType.O,
	T: PieceType.T,
	J: PieceType.J,
	L: PieceType.L,
	S: PieceType.S,
	Z: PieceType.Z,
};

export const ROT_TO_TBP: Record<number, string> = {
	0: "north",
	1: "east",
	2: "south",
	3: "west",
};

export const TBP_TO_ROT: Record<string, number> = {
	north: 0,
	east: 1,
	south: 2,
	west: 3,
};
