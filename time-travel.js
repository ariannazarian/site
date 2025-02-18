document.addEventListener("DOMContentLoaded", () => {
    const frozenTime = new Date();
    const audio = document.querySelector("#eternal-audio");
    let isAudioPlaying = false;
    let hasStartedOnce = false;

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

    document.querySelector("#current-time").innerText = getFrozenPSTDate();

    function toggleEternalWatch() {
        let hiddenText = document.querySelector("#hidden-text");
        let arrow = document.querySelector("#eternal-arrow");

        let isVisible = hiddenText.style.display === "block";
        hiddenText.style.display = isVisible ? "none" : "block";
        arrow.innerText = isVisible ? "▼" : "▲";

        if (!isAudioPlaying) {
            playAudioWithFadeIn();
        } else {
            toggleAudio();
        }
    }

    // Ensure the hidden-text starts hidden on page load
    document.querySelector("#hidden-text").style.display = "none";

    document.querySelector("#eternal-title").addEventListener("click", toggleEternalWatch);
    document.querySelector("#current-time").addEventListener("click", toggleEternalWatch);

    function toggleMatchingYears() {
        let matchingYears = document.querySelector("#matching-years");
        let arrow = document.querySelector("#watch-arrow");

        if (matchingYears.style.display === "none" || matchingYears.style.display === "") {
            revealMatchingYears();
            matchingYears.style.display = "block";
            arrow.innerText = "▲";
        } else {
            matchingYears.style.display = "none";
            arrow.innerText = "▼";
        }
    }

    document.querySelector("#reveal-matching-alt").addEventListener("click", toggleMatchingYears);

    function revealMatchingYears() {
        let now = new Date(frozenTime);
        let month = now.getMonth() + 1;
        let day = now.getDate();
        let weekday = now.getDay();
        let currentYear = new Date().getFullYear();

        let years = Array.from({ length: currentYear - 1892 }, (_, i) => i + 1892)
                         .filter(year => new Date(year, month - 1, day).getDay() === weekday);

        document.querySelector("#matching-years").innerText = `Coordinate reflections: ${years.join(', ')}`;
    }

    /* -------------------- */
    /* 🎵 Fixing Music Issue */
    /* -------------------- */
    function playAudioWithFadeIn() {
        if (!audio) return;

        audio.volume = 0.0;

        // Ensure the audio starts from 38.5s the first time it plays
        if (!hasStartedOnce) {
            audio.currentTime = 38.5;
            hasStartedOnce = true;
        }

        let fadeDuration = 20000; // 20 seconds fade-in
        let maxVolume = 1.0;
        let startTime = performance.now();

        function fadeInAudio(currentTime) {
            let elapsedTime = currentTime - startTime;
            let progress = elapsedTime / fadeDuration;
            if (progress < 1) {
                audio.volume = Math.min(progress * maxVolume, maxVolume);
                requestAnimationFrame(fadeInAudio);
            } else {
                audio.volume = maxVolume;
            }
        }

        audio.play().then(() => {
            isAudioPlaying = true;
            requestAnimationFrame(fadeInAudio);
        }).catch(error => {
            console.error("Audio playback prevented:", error);
        });
    }

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
        audio.currentTime = 0;
        audio.play();
    });

    /* ------------------------------ */
    /* 🔄 Latin-English Toggle Feature */
    /* ------------------------------ */
    const translations = {
        "num-nimis-erravi": { latin: "NUM NIMIS ERRAVI", english: "Have I wandered too far?" },
        "iterum-nos-convenimus": { latin: "ITERUM NOS CONVENIMUS", english: "We meet again." },
        "quo-vel-quando-vadis": { latin: "QUO VEL QUANDO VADIS", english: "Where or when are you going?" }
    };

    function toggleTranslation(event) {
        let id = event.target.id;
        if (!translations[id]) return;

        let element = document.querySelector(`#${id}`);
        let currentText = element.innerText;

        element.innerText = (currentText === translations[id].latin) ? translations[id].english : translations[id].latin;
    }

    document.querySelector("#num-nimis-erravi").addEventListener("click", toggleTranslation);
    document.querySelector("#iterum-nos-convenimus").addEventListener("click", toggleTranslation);
    document.querySelector("#quo-vel-quando-vadis").addEventListener("click", toggleTranslation);
});
