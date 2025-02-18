document.addEventListener("DOMContentLoaded", () => {
    const frozenTime = new Date();
    const audio = document.querySelector("#eternal-audio");
    let isAudioPlaying = false;
    let hasStartedOnce = false;
    let hasRevealedStoryOnce = false;
    let hasRevealedYearsOnce = false;
    let hasRevealedLatinOnce = false;

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

            if (!hasRevealedStoryOnce) {
                fadeInStoryText();
                hasRevealedStoryOnce = true;
            } else {
                document.querySelectorAll(".watch-description").forEach(el => {
                    el.style.opacity = 1;
                    el.style.transition = "none";
                });
            }

            if (!hasRevealedLatinOnce) {
                fadeInLatinText();
                hasRevealedLatinOnce = true;
            } else {
                document.querySelectorAll(".toggle-text").forEach(el => {
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

        if (expanded) {
            matchingYears.style.display = "none";
            arrow.innerText = "▼";
        } else {
            matchingYears.style.display = "block";
            arrow.innerText = "▲";

            if (!hasRevealedYearsOnce) {
                revealMatchingYearsWithFade();
                hasRevealedYearsOnce = true;
            } else {
                document.querySelectorAll(".year-item").forEach(el => {
                    el.style.opacity = 1;
                    el.style.transition = "none";
                });
            }
        }
    }

    function revealMatchingYearsWithFade() {
        let now = new Date(frozenTime);
        let month = now.getMonth() + 1;
        let day = now.getDate();
        let weekday = now.getDay();
        let currentYear = new Date().getFullYear();

        let years = Array.from({ length: currentYear - 1892 }, (_, i) => i + 1892)
                         .filter(year => new Date(year, month - 1, day).getDay() === weekday);

        let outputElement = document.querySelector("#matching-years");
        outputElement.innerHTML = `<strong>Coordinate reflections:</strong> `;

        years.forEach((year, index) => {
            let span = document.createElement("span");
            span.textContent = `${year}${index < years.length - 1 ? ", " : ""}`;
            span.classList.add("year-item");
            span.style.opacity = 0;
            span.style.transition = "opacity 2s ease-in";

            outputElement.appendChild(span);

            setTimeout(() => {
                span.style.opacity = 1;
            }, index * 1000);
        });
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
            }, index * 10000); // 10-second gap between each fade-in
        });
    }

    function fadeInLatinText() {
        let latinElements = document.querySelectorAll(".toggle-text");
        latinElements.forEach(el => {
            el.style.opacity = 0;
            el.style.transition = "opacity 3s ease-in";
            setTimeout(() => {
                el.style.opacity = 1;
            }, 1000); // No delay between fades
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
