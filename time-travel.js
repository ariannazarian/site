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

    // Set the fade-in duration
    let fadeDuration = 20000; // 20 seconds
    let maxVolume = 1.0; // Target max volume
    let startTime = performance.now(); // Get current time for smooth animation

    function fadeInAudio(currentTime) {
        let elapsedTime = currentTime - startTime;
        let progress = elapsedTime / fadeDuration;
        if (progress < 1) {
            audio.volume = Math.min(progress * maxVolume, maxVolume);
            requestAnimationFrame(fadeInAudio);
        } else {
            audio.volume = maxVolume; // Ensure final volume is exactly 1.0
        }
    }

    // Try to play audio (required for autoplay restrictions)
    audio.play().then(() => {
        isAudioPlaying = true;
        requestAnimationFrame(fadeInAudio); // Start fade-in BEFORE play
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
