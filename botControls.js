export function setupBotControls() {
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
}

function onPlay() {}

function onPause() {}
