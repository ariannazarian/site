document.addEventListener("DOMContentLoaded", () => {
    const frozenTime = new Date();
    const audio = document.querySelector("#eternal-audio");
    let isAudioPlaying = false;
    let hasStartedOnce = false;
    let hasRevealedOnce = false;

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

        if (expanded) {
            hiddenText.style.display = "none";
            arrow.innerText = "▼";
            pauseAudio();
        } else {
            hiddenText.style.display = "block";
            arrow.innerText = "▲";
            playAudioWithFadeIn();

            if (!hasRevealedOnce) {
                fadeInStoryText();
                hasRevealedOnce = true;
            } else {
                // Show text instantly if toggled again
                document.querySelectorAll(".watch-description").forEach(el => {
                    el.style.opacity = 1;
                    el.style.transition = "none";
                });
            }
        }
    }

    document.querySelector("#hidden-text").style.display = "none";
    document.querySelector("#eternal-title").addEventListener("click", toggleEternalWatch);
    document.querySelector("#current-time").addEventListener("click", toggleEternalWatch);

    document.querySelector("#reveal-matching-alt").addEventListener("click", toggleMatchingYears);

    function toggleMatchingYears() {
        let matchingYears = document.querySelector("#matching-years");
        let arrow = document.querySelector("#watch-arrow");
        let expanded = matchingYears.style.display === "block";

        if (!expanded) {
            revealMatchingYears();
            matchingYears.style.display = "block";
        } else {
            matchingYears.style.display = "none";
        }
        arrow.innerText = expanded ? "▼" : "▲";
    }

    function revealMatchingYears() {
        let now = new Date(frozenTime);
        let month = now.getMonth() + 1;
        let day = now.getDate();
        let weekday = now.getDay();
        let currentYear = new Date().getFullYear();

        let years = Array.from({ length: currentYear - 1892 }, (_, i) => i + 1892)
                         .filter(year => new Date(year, month - 1, day).getDay() === weekday);

        document.querySelector("#matching-years").innerText = `Coordinate reflections: ${years.join(', ')}`;
        document.querySelector("#matching-years").style.display = "block";
    }

    function playAudioWithFadeIn() {
        if (!audio) return;

        audio.volume = 0.0;
        if (!hasStartedOnce) {
            audio.currentTime = 38.5;
            hasStartedOnce = true;
        }

        let fadeDuration = 20000;
        let startTime = performance.now();

        function fadeInAudio(currentTime) {
            let elapsedTime = currentTime - startTime;
            let progress = elapsedTime / fadeDuration;
            audio.volume = Math.min(progress, 1.0);
            if (progress < 1) requestAnimationFrame(fadeInAudio);
        }

        audio.play().then(() => {
            isAudioPlaying = true;
            requestAnimationFrame(fadeInAudio);
        }).catch(console.error);
    }

    function pauseAudio() {
        if (audio && !audio.paused) {
            audio.pause();
            isAudioPlaying = false;
        }
    }

    function fadeInStoryText() {
        let storyParagraphs = document.querySelectorAll(".watch-description");
        storyParagraphs.forEach((el, index) => {
            el.style.opacity = 0;
            el.style.transition = `opacity 3s ease-in`;
            setTimeout(() => {
                el.style.opacity = 1;
            }, index * 5000); // 5-second gap between each fade-in
        });
    }

    document.querySelectorAll(".toggle-text").forEach(element => {
        element.addEventListener("click", () => {
            let translations = {
                "num-nimis-erravi": ["NUM NIMIS ERRAVI", "Have I wandered too far?"],
                "iterum-nos-convenimus": ["ITERUM NOS CONVENIMUS", "We meet again."],
                "quo-vel-quando-vadis": ["QUO VEL QUANDO VADIS", "Where or when are you going?"]
            };
            element.innerText = element.innerText === translations[element.id][0] ? translations[element.id][1] : translations[element.id][0];
        });
    });
});
