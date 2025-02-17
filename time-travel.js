// Store the frozen time when the page loads
const frozenTime = new Date();
const audio = document.getElementById("eternal-audio");
let isAudioPlaying = false;

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

// Function to play audio with fade-in effect (Ensures autoplay is allowed)
function playAudioWithFadeIn() {
    if (!audio) return;

    audio.volume = 0.2;

    // Try to play audio (browsers block autoplay unless inside a user-initiated event)
    audio.play().then(() => {
        isAudioPlaying = true;
        let fadeDuration = 15000; // 15 seconds fade-in
        let fadeStep = 0.05;
        let interval = fadeDuration / (0.8 / fadeStep);

        let fadeIn = setInterval(() => {
            if (audio.volume < 1.0) {
                audio.volume = Math.min(audio.volume + fadeStep, 1.0);
            } else {
                clearInterval(fadeIn);
            }
        }, interval);
    }).catch(error => {
        console.error("Audio playback prevented:", error);
    });
}

// Function to toggle audio without restarting
function toggleAudio() {
    if (!audio) return;

    if (audio.paused) {
        audio.play();
        isAudioPlaying = true;
    } else {
        audio.pause();
        isAudioPlaying = false;
    }
}
