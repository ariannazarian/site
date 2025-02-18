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
        let expanded = hiddenText.style.display === "block";

        hiddenText.style.display = expanded ? "none" : "block";
        arrow.innerText = expanded ? "▼" : "▲";

        // Update ARIA attributes
        document.querySelector("#eternal-title").setAttribute("aria-expanded", !expanded);
        document.querySelector("#current-time").setAttribute("aria-expanded", !expanded);

        if (!isAudioPlaying) {
            playAudioWithFadeIn();
        } else {
            toggleAudio();
        }
    }

    document.querySelector("#hidden-text").style.display = "none";
    document.querySelector("#eternal-title").addEventListener("click", toggleEternalWatch);
    document.querySelector("#current-time").addEventListener("click", toggleEternalWatch);

    function toggleMatchingYears() {
        let matchingYears = document.querySelector("#matching-years");
        let arrow = document.querySelector("#watch-arrow");
        let expanded = matchingYears.style.display === "block";

        matchingYears.style.display = expanded ? "none" : "block";
        arrow.innerText = expanded ? "▼" : "▲";

        // Update ARIA attributes
        document.querySelector("#reveal-matching-alt").setAttribute("aria-expanded", !expanded);
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
    /* 🎵 Audio Preloading */
    /* -------------------- */
    function playAudioWithFadeIn() {
        if (!audio) return;

        audio.volume = 0.0;
        if (!hasStartedOnce) {
            audio.currentTime = 38.5;
            hasStartedOnce = true;
        }

        let fadeDuration = 20000;
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

    audio.addEventListener("ended", () => {
        audio.currentTime = 0;
        audio.play();
    });

    /* ------------------------------ */
    /* 🔄 Event Delegation for Translation */
    /* ------------------------------ */
    const translations = {
        "num-nimis-erravi": { latin: "NUM NIMIS ERRAVI", english: "Have I wandered too far?" },
        "iterum-nos-convenimus": { latin: "ITERUM NOS CONVENIMUS", english: "We meet again." },
        "quo-vel-quando-vadis": { latin: "QUO VEL QUANDO VADIS", english: "Where or when are you going?" }
    };

    document.body.addEventListener("click", (event) => {
        let id = event.target.id;
        if (translations[id]) {
            let element = document.querySelector(`#${id}`);
            let currentText = element.innerText;
            element.innerText = (currentText === translations[id].latin) ? translations[id].english : translations[id].latin;
        }
    });
});
