// vite.config.ts
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const projectDirectory = dirname(fileURLToPath(import.meta.url));

type Snapshot = {
	hold: string;
	next: string;
	rows: string[];
};

type Analysis = { id: number; suggestions: { inputs: string[] }[] };

function varint(value: number): number[] {
	const bytes: number[] = [];
	while (value >= 0x80) {
		bytes.push((value & 0x7f) | 0x80);
		value >>>= 7;
	}
	bytes.push(value);
	return bytes;
}

function field(fieldNumber: number, data: number[]): number[] {
	return [...varint((fieldNumber << 3) | 2), ...varint(data.length), ...data];
}

function text(value: string): number[] {
	return Array.from(new TextEncoder().encode(value));
}

function normalizeSnapshot(snapshot: Snapshot): Snapshot {
	const rows = [...snapshot.rows];
	while (rows.length > 0 && rows[0].split("").every((cell) => cell === ".")) {
		rows.shift();
	}
	return {
		...snapshot,
		rows: rows.reverse(),
	};
}

function snapshotMessage(snapshot: Snapshot): number[] {
	const result: number[] = [];
	if (snapshot.hold) result.push(...field(1, text(snapshot.hold)));
	result.push(...field(2, text(snapshot.next)));
	for (const row of snapshot.rows) result.push(...field(3, text(row)));
	return result;
}

function analyzeMessage(id: number, snapshot: Snapshot): number[] {
	const analyze = [...varint(8), ...varint(id), ...field(2, snapshotMessage(snapshot))];
	return field(3, analyze);
}

function framed(data: number[]): Buffer {
	return Buffer.from([...varint(data.length), ...data]);
}

function readVarint(data: Buffer, offset: number): [number, number] {
	let value = 0;
	let shift = 0;
	while (offset < data.length) {
		const byte = data[offset++];
		value |= (byte & 0x7f) << shift;
		if (!(byte & 0x80)) return [value >>> 0, offset];
		shift += 7;
	}
	throw new Error("incomplete protobuf varint");
}

function parseResponse(data: Buffer): Analysis | null {
	let offset = 0;
	let analysisMessage: Buffer | undefined;
	while (offset < data.length) {
		const [tag, afterTag] = readVarint(data, offset);
		offset = afterTag;
		const wireType = tag & 7;
		const fieldNumber = tag >>> 3;
		if (wireType === 2) {
			const [length, afterLength] = readVarint(data, offset);
			offset = afterLength;
			const end = offset + length;
			if (fieldNumber === 2) analysisMessage = data.subarray(offset, end);
			offset = end;
		} else if (wireType === 0) {
			[, offset] = readVarint(data, offset);
		} else {
			throw new Error("unsupported protobuf response");
		}
	}
	if (!analysisMessage) return null;
	let id = 0;
	const suggestions: { inputs: string[] }[] = [];
	offset = 0;
	while (offset < analysisMessage.length) {
		const [tag, afterTag] = readVarint(analysisMessage, offset);
		offset = afterTag;
		const wireType = tag & 7;
		const fieldNumber = tag >>> 3;
		if (wireType === 0) {
			const [value, nextOffset] = readVarint(analysisMessage, offset);
			offset = nextOffset;
			if (fieldNumber === 1) id = value;
			continue;
		}
		if (wireType !== 2) throw new Error("unsupported protobuf analysis response");
		const [length, afterLength] = readVarint(analysisMessage, offset);
		offset = afterLength;
		const end = offset + length;
		if (fieldNumber === 3) {
			const inputs: string[] = [];
			let suggestionOffset = offset;
			while (suggestionOffset < end) {
				const [suggestionTag, nextTag] = readVarint(analysisMessage, suggestionOffset);
				suggestionOffset = nextTag;
				if ((suggestionTag >>> 3) === 2 && (suggestionTag & 7) === 2) {
					const [packedLength, packedStart] = readVarint(analysisMessage, suggestionOffset);
					let inputOffset = packedStart;
					while (inputOffset < packedStart + packedLength) {
						const [input, nextInput] = readVarint(analysisMessage, inputOffset);
						inputOffset = nextInput;
						inputs.push(["left", "right", "cw", "ccw", "hold", "sd", "hd"][input] ?? "");
					}
					suggestionOffset = packedStart + packedLength;
				} else if ((suggestionTag & 7) === 0) {
					[, suggestionOffset] = readVarint(analysisMessage, suggestionOffset);
				} else {
					const [skip, skipStart] = readVarint(analysisMessage, suggestionOffset);
					suggestionOffset = skipStart + skip;
				}
			}
			suggestions.push({ inputs });
		}
		offset = end;
	}
	return suggestions.length ? { id, suggestions } : null;
}

class BlockfishBridge {
	private process: ChildProcessWithoutNullStreams;
	private buffer = Buffer.alloc(0);
	private nextId = 1;
	private closed = false;
	private pending = new Map<number, {
		resolve: (analysis: Analysis) => void;
		reject: (error: Error) => void;
		timeout: ReturnType<typeof setTimeout>;
	}>();

	constructor() {
		const executable = resolve(projectDirectory, "blockfish");
		if (!existsSync(executable)) {
			throw new Error(`Blockfish executable not found at ${executable}`);
		}
		this.process = spawn(executable, [], { stdio: "pipe" });
		this.process.stdout.on("data", (chunk: Buffer) => this.read(chunk));
		this.process.stderr.on("data", (chunk: Buffer) => process.stderr.write(chunk));
		this.process.on("error", (error) => {
			this.rejectAll(error);
		});
		this.process.on("exit", (code, signal) => {
			this.closed = true;
			this.rejectAll(new Error(`Blockfish exited (${signal ?? code ?? "unknown"})`));
		});
	}

	analyze(snapshot: Snapshot): Promise<Analysis> {
		if (this.closed) throw new Error("Blockfish process is not running");
		const id = this.nextId++;
		return new Promise((resolveResult, reject) => {
			const timeout = setTimeout(() => {
				this.pending.delete(id);
				reject(new Error("Blockfish analysis timed out"));
			}, 5000);
			this.pending.set(id, { resolve: resolveResult, reject, timeout });
			this.process.stdin.write(framed(analyzeMessage(id, snapshot)), (error) => {
				if (!error) return;
				const pending = this.pending.get(id);
				if (pending) {
					clearTimeout(pending.timeout);
					this.pending.delete(id);
				}
				reject(error);
			});
		});
	}

	close() {
		this.closed = true;
		this.process.kill();
	}

	get isClosed() {
		return this.closed;
	}

	private read(chunk: Buffer) {
		this.buffer = Buffer.concat([this.buffer, chunk]);
		while (true) {
			try {
				const [length, start] = readVarint(this.buffer, 0);
				if (this.buffer.length < start + length) return;
				const response = parseResponse(this.buffer.subarray(start, start + length));
				this.buffer = this.buffer.subarray(start + length);
				if (!response) continue;
				const pending = this.pending.get(response.id);
				if (pending) {
					clearTimeout(pending.timeout);
					this.pending.delete(response.id);
					pending.resolve(response);
				}
			} catch {
				return;
			}
		}
	}

	private rejectAll(error: Error) {
		for (const { reject, timeout } of this.pending.values()) {
			clearTimeout(timeout);
			reject(error);
		}
		this.pending.clear();
	}
}

function blockfishPlugin(): Plugin {
	let bridge: BlockfishBridge | undefined;
	return {
		name: "blockfish-bridge",
		configureServer(server) {
			server.middlewares.use("/__blockfish/analyze", async (req, res) => {
				if (req.method !== "POST") {
					res.statusCode = 405;
					res.end();
					return;
				}
				const chunks: Buffer[] = [];
				for await (const chunk of req) chunks.push(Buffer.from(chunk));
				try {
					if (!bridge || bridge.isClosed) bridge = new BlockfishBridge();
					const snapshot = normalizeSnapshot(JSON.parse(Buffer.concat(chunks).toString()));
					const result = await bridge.analyze(snapshot);
					res.setHeader("content-type", "application/json");
					res.end(JSON.stringify(result));
				} catch (error) {
					if (bridge?.isClosed) bridge = undefined;
					res.statusCode = 500;
					res.setHeader("content-type", "application/json");
					res.end(JSON.stringify({ error: String(error) }));
				}
			});
			server.httpServer?.once("close", () => bridge?.close());
		},
	};
}


export default defineConfig(({ command }) => ({
	plugins: [blockfishPlugin()],
	// GitHub Pages needs the repository subpath, while the local dev server
	// should serve the app from any path (including /TetrisAnalysis/).
	base: command === "serve" ? "/" : "/TetrisAnalysis/",
	root: ".",
	build: {
		outDir: "dist",
		rollupOptions: {
			input: {
				main: "./index.html",
			},
		},
	},
	server: {
		port: 3000,
	},
}));
