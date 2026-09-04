document.addEventListener("DOMContentLoaded", () => {
    const frozenTime = new Date();
    const audio = document.querySelector("#eternal-audio");
    let hasRevealedStoryOnce = false;
    let hasRevealedYearsOnce = false;
    let hasRevealedLatinOnce = false;
    let hasRevealedQuoteOnce = false;
    let hasRevealedWatchOnce = false;
    let hasToggledEternalOnce = false;
    let hasToggledYearsOnce = false;

    function getFrozenUTCDate() {
        let now = new Date(frozenTime);
    
        return now.toLocaleString("en-US", {
            timeZone: "UTC", // Force UTC display
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }) + " UTC"; // Append UTC to the string
    }    

    document.querySelector("#current-time").innerText = getFrozenUTCDate();

    function toggleEternalWatch() {
        let hiddenText = document.querySelector("#hidden-text");
        let arrow = document.querySelector("#eternal-arrow");
        let expanded = hiddenText.style.display === "block";
    
        if (!hasToggledEternalOnce) {
            arrow.classList.remove("blink-arrow");
            hasToggledEternalOnce = true;
        }
    
        if (expanded) {
            hiddenText.style.display = "none";
            arrow.innerText = "▼";
        } else {
            hiddenText.style.display = "block";
            arrow.innerText = "▲";
    
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

        if (!hasToggledYearsOnce) {
            arrow.classList.remove("blink-arrow"); // Stop blinking after first toggle
            hasToggledYearsOnce = true;
        }

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
        let matchingYearsContainer = document.querySelector("#matching-years");
        let matchingYearsList = document.querySelector("#matching-years-list");
    
        matchingYearsList.innerHTML = ""; // Clear previous years
        matchingYearsContainer.style.display = "block"; // Show the section
    
        const month = frozenTime.getUTCMonth() + 1;
        const day = frozenTime.getUTCDate();
        const weekday = frozenTime.getUTCDay();
        const currentYear = frozenTime.getUTCFullYear();
    
        const years = Array.from({ length: currentYear - 1880 }, (_, i) => i + 1880)
            .filter(year => {
                const candidate = new Date(Date.UTC(year, month - 1, day));

                // Date() normalizes impossible dates (for example, February 29
                // in a non-leap year). Verify that the requested calendar date
                // survived construction before comparing its weekday.
                const isSameDate =
                    candidate.getUTCMonth() === month - 1 &&
                    candidate.getUTCDate() === day;

                return isSameDate && candidate.getUTCDay() === weekday;
            });
    
        if (years.length > 0) {
            // Add "Coordinate Reflections:" before the first year.
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

            // Preserve the exact visible comma-and-space formatting while making
            // each generated year a transformable hover target.
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

    function fadeInStoryGroups(callback) {
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
        let watchText = document.querySelector("#reveal-matching-alt");
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

    document.querySelector("#eternal-title").addEventListener("click", () => {
        toggleWatchText();
    });
    document.querySelector("#current-time").addEventListener("click", () => {
        toggleWatchText();
    });

    function toggleWatchText() {
        let watchText = document.querySelector("#reveal-matching-alt");
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
        let travelQuote = document.querySelector("#travel-quote");
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

    // Handle clicks on the dynamically generated Coordinate Reflections label or year.
    matchingYearsContainer.addEventListener("click", function (event) {
        const target = event.target;
        const opensYearsPopup = target.id === "coordinate-reflections" || target.classList.contains("year-item");
        if (opensYearsPopup) {
            // Show popup
            popup.setAttribute("aria-hidden", "false");
            popup.style.visibility = "visible";
            popup.style.opacity = "1";

            // Insert fresh video
            videoContainer.innerHTML = `
                <video id="popup-video" loop autoplay muted playsinline>
                    <source src="assets/images/london-time.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;

            // Try to autoplay after layout
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

    // ✅ Close popup and stop video
    closeBtn.addEventListener("click", function () {
        popup.setAttribute("aria-hidden", "true");
        popup.style.visibility = "hidden";
        popup.style.opacity = "0";
        videoContainer.innerHTML = ""; // Fully remove video to stop loop
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("eternal-audio");
    const popupToggle = document.getElementById("popup-audio-toggle");
    const audioIcon = document.getElementById("popup-audio-icon");
    const popupCloseBtn = document.getElementById("popup-close");

    let fadeInterval = null;

    function fadeInAudio() {
        audio.volume = 0;
        audio.currentTime = 39.4;
        audio.play().catch(() => {});
        clearInterval(fadeInterval);
        fadeInterval = setInterval(() => {
            if (audio.volume < 0.8) {
                audio.volume = Math.min(audio.volume + 0.02, 0.8);
            } else {
                clearInterval(fadeInterval);
            }
        }, 100);
    }

    function toggleAudioPlayback() {
        if (audio.paused) {
            fadeInAudio();
            audioIcon.textContent = "∅";
        } else {
            audio.pause();
            audioIcon.textContent = "♬";
        }
    }

    function stopAndResetAudio() {
        audio.pause();
        audio.currentTime = 39.4;
        audio.volume = 0;
        audioIcon.textContent = "♬";
        clearInterval(fadeInterval);
    }

    if (popupToggle) {
        popupToggle.addEventListener("click", toggleAudioPlayback);
    }

    if (popupCloseBtn) {
        popupCloseBtn.addEventListener("click", stopAndResetAudio);
    }
});
