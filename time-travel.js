// Store the frozen time when the page loads
const frozenTime = new Date();
const audio = document.getElementById("eternal-audio");
let isAudioPlaying = false;
let hasStartedOnce = false; // Tracks if the song has already played once

function getFrozenPSTDate() {
    let now = new Date(frozenTime);
    let utcOffset = now.getTimezoneOffset() / 60;
    let pstOffset = 8;
    
    now.setHours(now.getHours() + (utcOffset - pstOffset));
    
    return now.toLocaleString("en-US", { 
        weekday: "long", 
        month: "long", 
        day: "numeric", 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit", 
        hour12: false
    });
}

// Update frozen time on page load
document.getElementById("current-time").innerText = getFrozenPSTDate();

// Toggle visibility for The Eternal Watch and Frozen Time Display + Play/Pause Audio
function toggleEternalWatch() {
    let hiddenText = document.getElementById("hidden-text");
    let arrow = document.getElementById("eternal-arrow");

    let isVisible = hiddenText.style.display === "block";
    hiddenText.style.display = isVisible ? "none" : "block";
    arrow.innerText = isVisible ? "▼" : "▲";

    // Control audio playback
    if (!isAudioPlaying) {
        playAudioWithFadeIn();
    } else {
        toggleAudio();
    }
}

// Sync clicks between The Eternal Watch and Frozen Time Display
document.getElementById("eternal-title").addEventListener("click", toggleEternalWatch);
document.getElementById("current-time").addEventListener("click", toggleEternalWatch);

// Toggle coordinate reflections visibility
document.getElementById("reveal-matching-alt").addEventListener("click", toggleMatchingYears);

function toggleMatchingYears() {
    let matchingYears = document.getElementById("matching-years");
    let arrow = document.getElementById("watch-arrow");

    if (matchingYears.style.display === "none" || matchingYears.style.display === "") {
        revealMatchingYears();
        matchingYears.style.display = "block";
        arrow.innerText = "▲";
    } else {
        matchingYears.style.display = "none";
        arrow.innerText = "▼";
    }
}

// Generate coordinate reflections dynamically
function revealMatchingYears() {
    let now = new Date(frozenTime);
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let weekday = now.getDay();
    let currentYear = new Date().getFullYear();

    let years = Array.from({ length: currentYear - 1892 }, (_, i) => i + 1892)
                     .filter(year => new Date(year, month - 1, day).getDay() === weekday);

    document.getElementById("matching-years").innerText = `Coordinate reflections: ${years.join(', ')}`;
}

function playAudioWithFadeIn() {
    if (!audio) return;

    // Ensure audio starts at zero volume
    audio.volume = 0.0;

    // Jump to 0:38.5 only the first time the song plays
    if (!hasStartedOnce) {
        audio.currentTime = 38.5;
        hasStartedOnce = true;
    }

    // Try to play audio (required for autoplay restrictions)
    audio.play().then(() => {
        isAudioPlaying = true;

        // Slight delay before starting the fade-in (Fix for mobile)
        setTimeout(() => {
            let fadeDuration = 20000; // 20 seconds fade-in
            let fadeStep = 0.01; // Smooth fade increment
            let maxVolume = 1.0; // Target max volume
            let interval = fadeDuration / ((maxVolume - 0.0) / fadeStep); // Adjusted for smooth transition

            let fadeIn = setInterval(() => {
                if (audio.volume < maxVolume) {
                    audio.volume = Math.min(audio.volume + fadeStep, maxVolume);
                } else {
                    clearInterval(fadeIn);
                }
            }, interval);
        }, 300); // Delay start by 300ms to bypass mobile restrictions

    }).catch(error => {
        console.error("Audio playback prevented:", error);
    });
}

// Function to toggle audio without restarting
function toggleAudio() {
    if (!audio) return;

    if (audio.paused) {
        audio.play().catch(error => console.error("Audio play error:", error));
        isAudioPlaying = true;
    } else {
        audio.pause();
        isAudioPlaying = false;
    }
}

// Ensure audio loops from 0:00 after finishing
audio.addEventListener("ended", () => {
    audio.currentTime = 0; // Reset playback to start at 0:00 for looping
    audio.play();
});
