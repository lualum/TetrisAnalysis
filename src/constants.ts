import { GarbageType, Orientation, PieceType } from "./game";

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 40;
export const BOARD_HEIGHT_VISIBLE = 20;
export const BOARD_HEIGHT_HIDDEN = BOARD_HEIGHT - BOARD_HEIGHT_VISIBLE;
export const SPAWN_X = 4;
export const SPAWN_Y = 18;
export const NEXT_SIZE = 5;
export const CHEESE_RACE_GARBAGE_LINES = 9;
export const CHEESE_RACE_MESSINESS = 100;

export const PIECES = {
	[PieceType.I]: {
		[Orientation.north]: [
			[0, 0, 0, 0],
			[1, 1, 1, 1],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.east]: [
			[0, 0, 1, 0],
			[0, 0, 1, 0],
			[0, 0, 1, 0],
			[0, 0, 1, 0],
		],
		[Orientation.south]: [
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[1, 1, 1, 1],
			[0, 0, 0, 0],
		],
		[Orientation.west]: [
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
		],
	},
	[PieceType.O]: {
		[Orientation.north]: [
			[0, 1, 1, 0],
			[0, 1, 1, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.east]: [
			[0, 1, 1, 0],
			[0, 1, 1, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.south]: [
			[0, 1, 1, 0],
			[0, 1, 1, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.west]: [
			[0, 1, 1, 0],
			[0, 1, 1, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
	},
	[PieceType.T]: {
		[Orientation.north]: [
			[0, 1, 0, 0],
			[1, 1, 1, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.east]: [
			[0, 1, 0, 0],
			[0, 1, 1, 0],
			[0, 1, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.south]: [
			[0, 0, 0, 0],
			[1, 1, 1, 0],
			[0, 1, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.west]: [
			[0, 1, 0, 0],
			[1, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 0, 0, 0],
		],
	},
	[PieceType.J]: {
		[Orientation.north]: [
			[1, 0, 0, 0],
			[1, 1, 1, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.east]: [
			[0, 1, 1, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.south]: [
			[0, 0, 0, 0],
			[1, 1, 1, 0],
			[0, 0, 1, 0],
			[0, 0, 0, 0],
		],
		[Orientation.west]: [
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[1, 1, 0, 0],
			[0, 0, 0, 0],
		],
	},
	[PieceType.L]: {
		[Orientation.north]: [
			[0, 0, 1, 0],
			[1, 1, 1, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.east]: [
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 1, 0],
			[0, 0, 0, 0],
		],
		[Orientation.south]: [
			[0, 0, 0, 0],
			[1, 1, 1, 0],
			[1, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.west]: [
			[1, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 0, 0, 0],
		],
	},
	[PieceType.S]: {
		[Orientation.north]: [
			[0, 1, 1, 0],
			[1, 1, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.east]: [
			[0, 1, 0, 0],
			[0, 1, 1, 0],
			[0, 0, 1, 0],
			[0, 0, 0, 0],
		],
		[Orientation.south]: [
			[0, 0, 0, 0],
			[0, 1, 1, 0],
			[1, 1, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.west]: [
			[1, 0, 0, 0],
			[1, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 0, 0, 0],
		],
	},
	[PieceType.Z]: {
		[Orientation.north]: [
			[1, 1, 0, 0],
			[0, 1, 1, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.east]: [
			[0, 0, 1, 0],
			[0, 1, 1, 0],
			[0, 1, 0, 0],
			[0, 0, 0, 0],
		],
		[Orientation.south]: [
			[0, 0, 0, 0],
			[1, 1, 0, 0],
			[0, 1, 1, 0],
			[0, 0, 0, 0],
		],
		[Orientation.west]: [
			[0, 1, 0, 0],
			[1, 1, 0, 0],
			[1, 0, 0, 0],
			[0, 0, 0, 0],
		],
	},
};

const CENTERS_OTJLSZ = {
	[Orientation.north]: [1, 1],
	[Orientation.east]: [1, 1],
	[Orientation.south]: [1, 1],
	[Orientation.west]: [1, 1],
};
export const CENTERS = {
	[PieceType.I]: {
		[Orientation.north]: [1, 1],
		[Orientation.east]: [2, 1],
		[Orientation.south]: [2, 2],
		[Orientation.west]: [1, 2],
	},
	[PieceType.O]: CENTERS_OTJLSZ,
	[PieceType.T]: CENTERS_OTJLSZ,
	[PieceType.J]: CENTERS_OTJLSZ,
	[PieceType.L]: CENTERS_OTJLSZ,
	[PieceType.S]: CENTERS_OTJLSZ,
	[PieceType.Z]: CENTERS_OTJLSZ,
};

export const KICKS_TJLSZ = {
	"0-1": [
		[0, 0],
		[-1, 0],
		[-1, 1],
		[0, -2],
		[-1, -2],
	],
	"1-0": [
		[0, 0],
		[1, 0],
		[1, -1],
		[0, 2],
		[1, 2],
	],
	"0-3": [
		[0, 0],
		[1, 0],
		[1, 1],
		[0, -2],
		[1, -2],
	],
	"3-0": [
		[0, 0],
		[-1, 0],
		[-1, -1],
		[0, 2],
		[-1, 2],
	],
	"1-2": [
		[0, 0],
		[1, 0],
		[1, -1],
		[0, 2],
		[1, 2],
	],
	"2-1": [
		[0, 0],
		[-1, 0],
		[-1, 1],
		[0, -2],
		[-1, -2],
	],
	"3-2": [
		[0, 0],
		[-1, 0],
		[-1, -1],
		[0, 2],
		[-1, 2],
	],
	"2-3": [
		[0, 0],
		[1, 0],
		[1, 1],
		[0, -2],
		[1, -2],
	],
	"0-2": [
		[0, 0],
		[0, 1],
		[1, 1],
		[-1, -1],
		[1, 0],
		[-1, 0],
	],
	"2-0": [
		[0, 0],
		[0, -1],
		[-1, -1],
		[1, 1],
		[-1, 0],
		[1, 0],
	],
	"1-3": [
		[0, 0],
		[1, 0],
		[1, 2],
		[1, 1],
		[0, 2],
		[0, 1],
	],
	"3-1": [
		[0, 0],
		[-1, 0],
		[-1, 2],
		[-1, 1],
		[0, 2],
		[0, 1],
	],
};

export const KICKS = {
	[PieceType.I]: {
		"0-1": [
			[0, 0],
			[-2, 0],
			[1, 0],
			[-2, -1],
			[1, 2],
		],
		"1-0": [
			[0, 0],
			[2, 0],
			[-1, 0],
			[2, 1],
			[-1, -2],
		],
		"1-2": [
			[0, 0],
			[-1, 0],
			[2, 0],
			[-1, 2],
			[-2, -1],
		],
		"2-1": [
			[0, 0],
			[1, 0],
			[-2, 0],
			[1, -2],
			[-2, 1],
		],
		"2-3": [
			[0, 0],
			[2, 0],
			[-1, 0],
			[2, 1],
			[-1, -2],
		],
		"3-2": [
			[0, 0],
			[-2, 0],
			[1, 0],
			[-2, -1],
			[1, 2],
		],
		"3-0": [
			[0, 0],
			[1, 0],
			[-2, 0],
			[1, -2],
			[-2, 1],
		],
		"0-3": [
			[0, 0],
			[-1, 0],
			[2, 0],
			[-1, 2],
			[2, -1],
		],
		"0-2": [
			[0, 0],
			[-1, 0],
			[1, 0],
			[0, -1],
			[0, 1],
		],
		"2-0": [
			[0, 0],
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		],
		"1-3": [
			[0, 0],
			[0, -1],
			[-1, 0],
			[1, 0],
			[0, 1],
		],
		"3-1": [
			[0, 0],
			[0, -1],
			[1, 0],
			[-1, 0],
			[0, 1],
		],
	},
	[PieceType.O]: {},
	[PieceType.T]: KICKS_TJLSZ,
	[PieceType.J]: KICKS_TJLSZ,
	[PieceType.L]: KICKS_TJLSZ,
	[PieceType.S]: KICKS_TJLSZ,
	[PieceType.Z]: KICKS_TJLSZ,
};

export const COLORS = {
	[PieceType.I]: "#42afe1",
	[PieceType.O]: "#f6d03c",
	[PieceType.T]: "#9739a2",
	[PieceType.J]: "#1165b5",
	[PieceType.L]: "#f38927",
	[PieceType.S]: "#51b84d",
	[PieceType.Z]: "#eb4f65",
	[GarbageType.Garbage]: "#868686",
};

export const HIGHLIGHT_COLOR = {
	[PieceType.I]: "#6ceaff",
	[PieceType.O]: "#ffff7f",
	[PieceType.T]: "#d958e9",
	[PieceType.J]: "#339bff",
	[PieceType.L]: "#ffba59",
	[PieceType.S]: "#84f880",
	[PieceType.Z]: "#ff7f79",
	[GarbageType.Garbage]: "#DDDDDD",
};
