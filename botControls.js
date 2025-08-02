export function setupBotControls(botInterface = null) {
    // PPS Input
    const ppsInput = document.getElementById("ppsInput");

    ppsInput.addEventListener("input", () => {
        let val = parseFloat(ppsInput.value);
        if (isNaN(val)) {
            ppsInput.value = 1;
            return;
        }

        // Clamp to 0–10
        if (val < 0) ppsInput.value = 0;
        else if (val > 10) ppsInput.value = 10;
    });

    // Play/Pause Button
    const playPauseBtn = document.getElementById("playBtn");
    let isPlaying = false;

    playPauseBtn.addEventListener("click", () => {
        isPlaying = !isPlaying;

        if (isPlaying) {
            playPauseBtn.textContent = "⏸";
            onPlay();
        } else {
            playPauseBtn.textContent = "⏵";
            onPause();
        }
    });

    const input = document.getElementById("ppsInput");
    // const upBtn = document.querySelector(".arrow-up");
    // const downBtn = document.querySelector(".arrow-down");
    const rightBtn = document.querySelector(".arrow-right");

    // upBtn.addEventListener("click", () => {
    //     const currentValue = parseFloat(input.value) || 0;
    //     const step = 0.1;
    //     const max = 10;
    //     const newValue = currentValue + step;

    //     if (newValue <= max) {
    //         input.value = newValue.toFixed(1);
    //     }
    // });

    // downBtn.addEventListener("click", () => {
    //     const currentValue = parseFloat(input.value) || 0;
    //     const step = 0.1;
    //     const min = 0;
    //     const newValue = currentValue - step;

    //     if (newValue >= min) {
    //         input.value = newValue.toFixed(1);
    //     }
    // });

    // Right Arrow Button - Get Bot Suggestion
    if (rightBtn) {
        rightBtn.addEventListener("click", () => {
            if (botInterface && botInterface.isInitialized) {
                try {
                    botInterface.getSuggestion();
                    console.log("Requested bot suggestion");
                } catch (error) {
                    console.error("Failed to get bot suggestion:", error);
                }
            } else {
                console.warn("Bot interface not available or not initialized");
            }
        });
    }

    // Keyboard support for right arrow key
    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
            event.preventDefault(); // Prevent default browser behavior
            if (botInterface && botInterface.isInitialized) {
                try {
                    botInterface.getSuggestion();
                    console.log("Requested bot suggestion via keyboard");
                } catch (error) {
                    console.error("Failed to get bot suggestion:", error);
                }
            }
        }
    });
}

function onPlay() {}

function onPause() {}
