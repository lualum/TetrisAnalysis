import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function resolveBlockfishExecutable() {
	const candidates = [
		resolve(projectDirectory, "blockfish"),
		resolve(projectDirectory, "../blockfish-dev/target/debug/blockfish"),
		resolve(projectDirectory, "../blockfish-dev/target/release/blockfish"),
	];
	const executable = candidates.find((candidate) => existsSync(candidate));
	if (!executable) {
		throw new Error(`Blockfish executable not found. Tried: ${candidates.join(", ")}`);
	}
	return executable;
}

function varint(value) {
	const bytes = [];
	while (value >= 0x80) {
		bytes.push((value & 0x7f) | 0x80);
		value >>>= 7;
	}
	bytes.push(value);
	return bytes;
}

function field(fieldNumber, data) {
	return [...varint((fieldNumber << 3) | 2), ...varint(data.length), ...data];
}

function text(value) {
	return Array.from(new TextEncoder().encode(value));
}

function snapshotMessage(snapshot) {
	const result = [];
	if (snapshot.hold) result.push(...field(1, text(snapshot.hold)));
	result.push(...field(2, text(snapshot.queue)));
	for (const row of snapshot.matrix) result.push(...field(3, text(row)));
	return result;
}

function analyzeMessage(id, snapshot) {
	const analyze = [...varint(8), ...varint(id), ...field(2, snapshotMessage(snapshot))];
	return field(3, analyze);
}

function framed(data) {
	return Buffer.from([...varint(data.length), ...data]);
}

function readVarint(data, offset) {
	let value = 0;
	let shift = 0;
	while (offset < data.length) {
		const byte = data[offset++];
		value |= (byte & 0x7f) << shift;
		if (!(byte & 0x80)) return [value >>> 0, offset];
		shift += 7;
	}
	return null;
}

function parseResponse(data) {
	let offset = 0;
	let analysisMessage;
	while (offset < data.length) {
		const tagResult = readVarint(data, offset);
		if (!tagResult) return null;
		const [tag, afterTag] = tagResult;
		offset = afterTag;
		const wireType = tag & 7;
		const fieldNumber = tag >>> 3;
		if (wireType === 2) {
			const lengthResult = readVarint(data, offset);
			if (!lengthResult) return null;
			const [length, afterLength] = lengthResult;
			offset = afterLength;
			const end = offset + length;
			if (fieldNumber === 2) analysisMessage = data.subarray(offset, end);
			offset = end;
		} else if (wireType === 0) {
			const valueResult = readVarint(data, offset);
			if (!valueResult) return null;
			offset = valueResult[1];
		} else {
			throw new Error("unsupported protobuf response");
		}
	}
	if (!analysisMessage) return null;

	const suggestions = [];
	offset = 0;
	while (offset < analysisMessage.length) {
		const [tag, afterTag] = readVarint(analysisMessage, offset);
		offset = afterTag;
		const wireType = tag & 7;
		const fieldNumber = tag >>> 3;
		if (wireType === 0) {
			[, offset] = readVarint(analysisMessage, offset);
			continue;
		}
		if (wireType !== 2) throw new Error("unsupported protobuf analysis response");
		const [length, afterLength] = readVarint(analysisMessage, offset);
		offset = afterLength;
		const end = offset + length;
		if (fieldNumber === 3) {
			const inputs = [];
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
	return suggestions.length ? { suggestions } : null;
}

function analyze(snapshot) {
	const subprocess = spawn(resolveBlockfishExecutable(), [], { stdio: "pipe" });
	let buffer = Buffer.alloc(0);

	return new Promise((resolveResult, reject) => {
		const timeout = setTimeout(() => {
			subprocess.kill();
			reject(new Error("Blockfish analysis timed out"));
		}, 5000);

		subprocess.once("error", reject);
		subprocess.stdout.on("data", (chunk) => {
			buffer = Buffer.concat([buffer, chunk]);
			while (buffer.length > 0) {
				const lengthResult = readVarint(buffer, 0);
				if (!lengthResult) return;
				const [length, start] = lengthResult;
				if (buffer.length < start + length) return;
				const result = parseResponse(buffer.subarray(start, start + length));
				buffer = buffer.subarray(start + length);
				if (!result) continue;
				clearTimeout(timeout);
				subprocess.kill();
				resolveResult(result);
				return;
			}
		});

		subprocess.stdin.write(framed(analyzeMessage(1, snapshot)));
	});
}

const empty = "..........";
const sample = {
	hold: "",
	queue: "TILJOSZ",
	matrix: [
		"GGGG.GGGGG",
		"GGGG.GGGGG",
		"GGGG.GGGGG",
		"GGG.GGGGGG",
		"GGG.GGGGGG",
		empty,
		empty,
		empty,
	],
};

const analysis = await analyze(sample);
console.log(JSON.stringify(analysis.suggestions[0], null, 2));
