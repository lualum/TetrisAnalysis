import initBlockfishWasm, {
	analyze as analyzeBlockfishWasm,
	evaluate_position as evaluateBlockfishPositionWasm,
} from "./blockfish-wasm-pkg/blockfish_wasm";

interface AnalyzeRequest {
	id: number;
	kind?: "analyze" | "evaluate-position";
	snapshot: string;
}

interface AnalyzeResponse {
	id: number;
	ok: boolean;
	analysis?: string;
	evaluation?: string;
	error?: string;
}

let blockfishReady: Promise<void> | null = null;

async function ensureBlockfish(): Promise<void> {
	blockfishReady ??= initBlockfishWasm().then(() => undefined);
	await blockfishReady;
}

self.addEventListener("message", (event: MessageEvent<AnalyzeRequest>) => {
	const { id, kind = "analyze", snapshot } = event.data;
	if (kind === "evaluate-position") {
		void evaluatePosition(id, snapshot);
		return;
	}
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

async function evaluatePosition(id: number, snapshot: string): Promise<void> {
	try {
		await ensureBlockfish();
		postMessage({
			id,
			ok: true,
			evaluation: evaluateBlockfishPositionWasm(snapshot),
		} satisfies AnalyzeResponse);
	} catch (error) {
		postMessage({
			id,
			ok: false,
			error: String(error),
		} satisfies AnalyzeResponse);
	}
}
