document.addEventListener("DOMContentLoaded", () => {
    const frozenTime = new Date();
    let hasRevealedStoryOnce = false;
    let hasRevealedYearsOnce = false;
    let hasRevealedQuoteOnce = false;
    let hasRevealedWatchOnce = false;
    let hasToggledEternalOnce = false;
    let hasToggledYearsOnce = false;

    const currentTime = document.getElementById("current-time");
    const hiddenText = document.getElementById("hidden-text");
    const eternalTitle = document.getElementById("eternal-title");
    const eternalArrow = document.getElementById("eternal-arrow");
    const revealMatching = document.getElementById("reveal-matching-alt");
    const matchingYears = document.getElementById("matching-years");
    const matchingYearsList = document.getElementById("matching-years-list");
    const watchArrow = document.getElementById("watch-arrow");
    const travelQuote = document.getElementById("travel-quote");

    function getFrozenUTCDate() {
        let now = new Date(frozenTime);

        return now.toLocaleString("en-US", {
            timeZone: "UTC",
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }) + " UTC";
    }

    currentTime.innerText = getFrozenUTCDate();

    function toggleEternalWatch() {
        const expanded = hiddenText.style.display === "block";

        if (!hasToggledEternalOnce) {
            eternalArrow.classList.remove("blink-arrow");
            hasToggledEternalOnce = true;
        }

        if (expanded) {
            hiddenText.style.display = "none";
            eternalArrow.innerText = "▼";
        } else {
            hiddenText.style.display = "block";
            eternalArrow.innerText = "▲";

            if (!hasRevealedStoryOnce) {
                fadeInStoryGroups();
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

    hiddenText.style.display = "none";
    eternalTitle.addEventListener("click", toggleEternalWatch);
    currentTime.addEventListener("click", toggleEternalWatch);

    revealMatching.addEventListener("click", toggleMatchingYears);

    function toggleMatchingYears() {
        const expanded = matchingYears.style.display === "block";

        if (!hasToggledYearsOnce) {
            watchArrow.classList.remove("blink-arrow");
            hasToggledYearsOnce = true;
        }

        if (expanded) {
            matchingYears.style.display = "none";
            travelQuote.style.display = "none";
            watchArrow.innerText = "▼";
        } else {
            matchingYears.style.display = "block";
            travelQuote.style.display = "block";
            watchArrow.innerText = "▲";

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
                document.querySelectorAll(".year-item").forEach(el => {
                    el.style.opacity = 1;
                    el.style.transition = "scale 0.18s ease";
                });
                travelQuote.style.opacity = 1;
                travelQuote.style.transition = "none";
            }
        }
    }

    function revealMatchingYearsWithFade(callback) {
        matchingYearsList.innerHTML = "";
        matchingYears.style.display = "block";

        const month = frozenTime.getUTCMonth() + 1;
        const day = frozenTime.getUTCDate();
        const weekday = frozenTime.getUTCDay();
        const currentYear = frozenTime.getUTCFullYear();

        const years = Array.from({ length: currentYear - 1880 }, (_, i) => i + 1880)
            .filter(year => {
                const candidate = new Date(Date.UTC(year, month - 1, day));
                const isSameDate =
                    candidate.getUTCMonth() === month - 1 &&
                    candidate.getUTCDate() === day;

                return isSameDate && candidate.getUTCDay() === weekday;
            });

        if (years.length > 0) {
            let label = document.createElement("strong");
            label.id = "coordinate-reflections";
            label.textContent = "Coordinate Reflections:";
            label.classList.add("clickable", "bold-text");
            matchingYearsList.appendChild(label);
            matchingYearsList.appendChild(document.createTextNode(" "));
        }

        years.forEach((year, index) => {
            let span = document.createElement("span");
            span.textContent = `${year}${index < years.length - 1 ? "," : ""}`;
            span.classList.add("year-item", "clickable");
            span.dataset.year = year;
            span.style.opacity = 0;
            span.style.transition = "opacity 1.8s ease-in, scale 0.18s ease";
            matchingYearsList.appendChild(span);
            if (index < years.length - 1) {
                matchingYearsList.appendChild(document.createTextNode(" "));
            }

            setTimeout(() => {
                span.style.opacity = 1;
                if (index === years.length - 1 && callback) {
                    setTimeout(callback, 600);
                }
            }, index * 600);
        });

        setTimeout(() => {
            document.querySelectorAll(".year-item").forEach(el => {
                el.style.transition = "scale 0.18s ease";
            });
        }, years.length * 1000 + 500);
    }

    function fadeInStoryGroups() {
        let fadeGroups = document.querySelectorAll(".fade-group");
        fadeGroups.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = 1;
                el.style.transition = "opacity 3s ease-in";

                if (index === fadeGroups.length - 1) {
                    setTimeout(() => {
                        fadeInWatchText();
                    }, 3500);
                }
            }, index * 10000);
        });
    }

    function fadeInWatchText() {
        const watchText = revealMatching;
        if (!hasRevealedWatchOnce) {
            watchText.style.visibility = "visible";
            setTimeout(() => {
                watchText.style.opacity = 1;
                setTimeout(() => {
                    watchText.style.transition = "scale 0.28s ease-in-out";
                }, 3000);
            }, 50);
            hasRevealedWatchOnce = true;
        }
    }

    eternalTitle.addEventListener("click", () => {
        toggleWatchText();
    });
    currentTime.addEventListener("click", () => {
        toggleWatchText();
    });

    function toggleWatchText() {
        const watchText = revealMatching;
        if (hasRevealedWatchOnce) {
            if (watchText.style.opacity === "1") {
                watchText.style.opacity = "0";
                setTimeout(() => {
                    watchText.style.visibility = "hidden";
                }, 50);
            } else {
                watchText.style.visibility = "visible";
                watchText.style.opacity = "1";
            }
        }
    }

    function fadeInTravelQuote() {
        travelQuote.style.display = "block";
        setTimeout(() => {
            travelQuote.style.opacity = 1;
        }, 50);
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

document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("popup-years-box");
    const videoContainer = document.getElementById("popup-video-container");
    const closeBtn = document.getElementById("popup-close");
    const matchingYearsContainer = document.getElementById("matching-years-list");
    matchingYearsContainer.addEventListener("click", function (event) {
        const target = event.target;
        const opensYearsPopup = target.id === "coordinate-reflections" || target.classList.contains("year-item");
        if (opensYearsPopup) {
            popup.setAttribute("aria-hidden", "false");
            popup.style.visibility = "visible";
            popup.style.opacity = "1";
            videoContainer.innerHTML = `
                <video id="popup-video" loop autoplay muted playsinline>
                    <source src="assets/images/london-time.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
            setTimeout(() => {
                const video = document.getElementById("popup-video");
                if (video) {
                    video.play().catch(err => {
                        console.warn("Autoplay blocked:", err);
                    });
                }
            }, 50);
        }
    });
    closeBtn.addEventListener("click", function () {
        popup.setAttribute("aria-hidden", "true");
        popup.style.visibility = "hidden";
        popup.style.opacity = "0";
        videoContainer.innerHTML = "";
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("eternal-audio");
    const popupToggle = document.getElementById("popup-audio-toggle");
    const audioIcon = document.getElementById("popup-audio-icon");
    const popupCloseBtn = document.getElementById("popup-close");

    function startAudio() {
        audio.currentTime = 0;

        audio.play()
            .then(() => {
                audioIcon.textContent = "∅";
            })
            .catch(() => {
                audioIcon.textContent = "♬";
            });
    }

    function stopAndResetAudio() {
        audio.pause();
        audio.currentTime = 0;
        audioIcon.textContent = "♬";
    }

    function toggleAudioPlayback() {
        if (audio.paused) {
            startAudio();
        } else {
            stopAndResetAudio();
        }
    }

    if (popupToggle) {
        popupToggle.addEventListener("click", toggleAudioPlayback);
    }

    if (popupCloseBtn) {
        popupCloseBtn.addEventListener("click", stopAndResetAudio);
    }
});
