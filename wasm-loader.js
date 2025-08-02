// wasm-loader.js
// WASM loader for no-modules target (GitHub Pages compatible)

let isInitialized = false;
let initPromise = null;

export async function initWasm() {
    // Return existing promise if already initializing
    if (initPromise) return initPromise;
    if (isInitialized) return window.wasm_bindgen;

    initPromise = (async () => {
        try {
            console.log("Loading WASM module...");

            // Load the JavaScript wrapper first
            if (!window.wasm_bindgen) {
                await loadScript("./pkg/cold_clear_2.js");
            }

            // Initialize the WASM module
            await window.wasm_bindgen("./pkg/cold_clear_2_bg.wasm");

            // Initialize panic hook if available
            if (window.wasm_bindgen.init_panic_hook) {
                window.wasm_bindgen.init_panic_hook();
            }

            isInitialized = true;
            console.log("WASM module initialized successfully");
            return window.wasm_bindgen;
        } catch (error) {
            console.error("Failed to load WASM module:", error);
            // Reset promise so we can try again
            initPromise = null;
            throw error;
        }
    })();

    return initPromise;
}

// Helper function to load a script dynamically
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () =>
            reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

export function getWasmModule() {
    if (!isInitialized) {
        throw new Error("WASM module not initialized. Call initWasm() first.");
    }
    return window.wasm_bindgen;
}

export function isWasmReady() {
    return isInitialized;
}
