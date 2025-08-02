// bot.js
import init, {
    ColdClearBot,
    init_panic_hook,
    create_start_message,
} from "./pkg/cold_clear_2.js";

export class ColdClearInterface {
    constructor() {
        this.bot = null;
        this.isInitialized = false;
        this.messagePollingInterval = null;
        this.initPromise = null;
    }

    async initialize() {
        // Prevent multiple initializations
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._doInitialize();
        return this.initPromise;
    }

    async _doInitialize() {
        try {
            // Initialize WASM module
            await init();
            init_panic_hook();

            // FIX CONFIG
            const config = {
                freestyle_weights: {
                    cell_coveredness: -0.2,
                    max_cell_covered_height: 6,
                    holes: -1.5,
                    row_transitions: -0.2,
                    height: -0.4,
                    height_upper_half: -1.5,
                    height_upper_quarter: -5.0,
                    tetris_well_depth: 0.3,
                    tslot: [0.1, 1.5, 2.0, 4.0],
                    has_back_to_back: 0.5,
                    wasted_t: -1.5,
                    softdrop: -0.2,
                    normal_clears: [0.0, -2.0, -1.5, -1.0, 3.5],
                    mini_spin_clears: [0.0, -1.5, -1.0],
                    spin_clears: [0.0, 1.0, 4.0, 6.0],
                    back_to_back_clear: 1.0,
                    combo_attack: 1.5,
                    perfect_clear: 15.0,
                    perfect_clear_override: true,
                },
                freestyle_exploitation: 0.6931471805599453,
            };

            this.bot = new ColdClearBot(JSON.stringify(config));
            this.isInitialized = true;

            console.log("Bot initialized successfully");
            return true;
        } catch (error) {
            console.error("Failed to initialize bot:", error);
            this.initPromise = null; // Reset so we can try again
            return false;
        }
    }

    startBot() {
        if (!this.isInitialized) {
            throw new Error("Bot not initialized");
        }

        this.bot.start_bot();

        // Start polling for messages
        this.startMessagePolling();

        console.log("Bot started");
    }

    startMessagePolling() {
        // Poll for messages every 16ms (~60fps)
        this.messagePollingInterval = setInterval(() => {
            this.processMessages();
        }, 16);
    }

    processMessages() {
        if (!this.bot) return;

        // Process all available messages
        let message;
        while ((message = this.bot.receive_message()) !== undefined) {
            try {
                const parsed = JSON.parse(message);
                this.handleBotMessage(parsed);
            } catch (error) {
                console.error("Failed to parse bot message:", error, message);
            }
        }
    }

    handleBotMessage(message) {
        console.log("Received bot message:", message);

        if (message.Info) {
            console.log(
                `Bot Info: ${message.Info.name} v${message.Info.version} by ${message.Info.author}`
            );
        } else if (message.Suggestion) {
            console.log("Bot suggestion:", message.Suggestion);
            this.onSuggestion(message.Suggestion);
        } else if (message.Ready) {
            console.log("Bot is ready");
            this.onReady();
        }
    }

    // Game control methods
    startGame(board, queue, hold = null) {
        if (!this.bot) throw new Error("Bot not initialized");

        try {
            const startMessage = create_start_message(
                JSON.stringify(board),
                JSON.stringify(queue),
                hold ? JSON.stringify(hold) : ""
            );

            this.bot.send_message(startMessage);
            console.log("Game started");
        } catch (error) {
            console.error("Failed to start game:", error);
        }
    }

    getSuggestion() {
        if (!this.bot) throw new Error("Bot not initialized");

        const message = JSON.stringify({ Suggest: null });
        this.bot.send_message(message);
    }

    playMove(move) {
        if (!this.bot) throw new Error("Bot not initialized");

        const message = JSON.stringify({ Play: { mv: move } });
        this.bot.send_message(message);
    }

    newPiece(piece) {
        if (!this.bot) throw new Error("Bot not initialized");

        const message = JSON.stringify({ NewPiece: { piece: piece } });
        this.bot.send_message(message);
    }

    stopBot() {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }

        if (this.bot) {
            this.bot.stop_bot();
        }

        console.log("Bot stopped");
    }

    // Event handlers (override these in your application)
    onSuggestion(suggestion) {
        // Handle bot suggestions
        console.log("Suggestion received:", suggestion);
    }

    onReady() {
        // Bot is ready to receive commands
        console.log("Bot is ready for commands");
    }
}
