import initBlockfishWasm, { analyze as analyzeBlockfishWasm } from "./blockfish-wasm-pkg/blockfish_wasm";

interface AnalyzeRequest {
	id: number;
	snapshot: string;
}

interface AnalyzeResponse {
	id: number;
	ok: boolean;
	analysis?: string;
	error?: string;
}

let blockfishReady: Promise<void> | null = null;

async function ensureBlockfish(): Promise<void> {
	blockfishReady ??= initBlockfishWasm().then(() => undefined);
	await blockfishReady;
}

self.addEventListener("message", (event: MessageEvent<AnalyzeRequest>) => {
	const { id, snapshot } = event.data;
	void analyze(id, snapshot);
});

async function analyze(id: number, snapshot: string): Promise<void> {
	try {
		await ensureBlockfish();
		postMessage({
			id,
			ok: true,
			analysis: analyzeBlockfishWasm(snapshot),
		} satisfies AnalyzeResponse);
	} catch (error) {
		postMessage({
			id,
			ok: false,
			error: String(error),
		} satisfies AnalyzeResponse);
	}
}
