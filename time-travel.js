document.addEventListener("DOMContentLoaded", () => {
    const frozenTime = new Date();
    const audio = document.querySelector("#eternal-audio");
    let isAudioPlaying = false;
    let hasStartedOnce = false;
    let hasRevealedStoryOnce = false;
    let hasRevealedYearsOnce = false;
    let hasRevealedLatinOnce = false;
    let hasRevealedQuoteOnce = false;
    let hasRevealedWatchOnce = false;

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
                fadeInStoryGroups(() => {
                    fadeInWatchText();
                });
                hasRevealedStoryOnce = true;
            } else {
                document.querySelectorAll(".fade-group").forEach(el => {
                    el.style.opacity = 1;
                    el.style.transition = "none";
                });
                fadeInWatchText();
            }
        }
    }

    document.querySelector("#hidden-text").style.display = "none";
    document.querySelector("#eternal-title").addEventListener("click", toggleEternalWatch);
    document.querySelector("#current-time").addEventListener("click", toggleEternalWatch);

    document.querySelector("#reveal-matching-alt").addEventListener("click", toggleMatchingYears);

    function toggleMatchingYears() {
        let matchingYears = document.querySelector("#matching-years");
        let travelQuote = document.querySelector("#travel-quote");
        let arrow = document.querySelector("#watch-arrow");
        let expanded = matchingYears.style.display === "block";

        if (expanded) {
            matchingYears.style.display = "none";
            travelQuote.style.display = "none";
            arrow.innerText = "▼";
        } else {
            matchingYears.style.display = "block";
            travelQuote.style.display = "block";
            arrow.innerText = "▲";

            if (!hasRevealedYearsOnce) {
                revealMatchingYearsWithFade(() => {
                    if (!hasRevealedQuoteOnce) {
                        fadeInTravelQuote();
                        hasRevealedQuoteOnce = true;
                    } else {
                        travelQuote.style.opacity = 1;
                        travelQuote.style.transition = "none";
                    }
                });
                hasRevealedYearsOnce = true;
            } else {
                matchingYears.style.opacity = 1;
                matchingYears.style.transition = "none";
                travelQuote.style.opacity = 1;
                travelQuote.style.transition = "none";
            }
        }
    }

    function revealMatchingYearsWithFade(callback) {
        let matchingYears = document.querySelector("#matching-years");
        matchingYears.innerHTML = `<strong>Coordinate reflections:</strong> `;
        matchingYears.style.display = "block";

        let now = new Date(frozenTime);
        let month = now.getMonth() + 1;
        let day = now.getDate();
        let weekday = now.getDay();
        let currentYear = new Date().getFullYear();

        let years = Array.from({ length: currentYear - 1892 }, (_, i) => i + 1892)
                         .filter(year => new Date(year, month - 1, day).getDay() === weekday);

        years.forEach((year, index) => {
            let span = document.createElement("span");
            span.textContent = `${year}${index < years.length - 1 ? ", " : ""}`;
            span.classList.add("year-item");
            span.style.opacity = 0;
            span.style.transition = "opacity 2s ease-in";

            matchingYears.appendChild(span);

            setTimeout(() => {
                span.style.opacity = 1;
                if (index === years.length - 1 && callback) {
                    setTimeout(callback, 1000);
                }
            }, index * 1000);
        });

        // Remove transition after first fade-in
        setTimeout(() => {
            document.querySelectorAll(".year-item").forEach(el => {
                el.style.transition = "none";
            });
        }, years.length * 1000);
    }

    function fadeInStoryGroups(callback) {
        let fadeGroups = document.querySelectorAll(".fade-group");
        fadeGroups.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = 1;
                el.style.transition = "opacity 3s ease-in";
                if (index === fadeGroups.length - 1 && callback) {
                    setTimeout(callback, 500);
                }
            }, index * 10000);
        });
    }

    function fadeInWatchText() {
        let watchText = document.querySelector("#reveal-matching-alt");
        if (!hasRevealedWatchOnce) {
            watchText.classList.remove("hidden");
            setTimeout(() => {
                watchText.style.opacity = 1;
            }, 50);
            hasRevealedWatchOnce = true;
        }
    }

    function fadeInTravelQuote() {
        let travelQuote = document.querySelector("#travel-quote");
        travelQuote.style.display = "block";
        setTimeout(() => {
            travelQuote.style.opacity = 1;
        }, 50);
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
