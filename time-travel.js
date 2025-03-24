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
            toggleMusicIcon(false); // 🔇 Show sound off
            pauseAudio();
        } else {
            hiddenText.style.display = "block";
            arrow.innerText = "▲";
            toggleMusicIcon(true); // 🎵 Show sound on
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

    function toggleMusicIcon(isOpen) {
        const musicIcon = document.getElementById("eternal-music-icon");
        musicIcon.textContent = isOpen ? "∅" : "♬";
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
                    el.style.transition = "none";
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
    
        let now = new Date(frozenTime);
        let month = now.getMonth() + 1;
        let day = now.getDate();
        let weekday = now.getDay();
        let currentYear = new Date().getFullYear();
    
        let years = Array.from({ length: currentYear - 1880 }, (_, i) => i + 1880)
                         .filter(year => new Date(year, month - 1, day).getDay() === weekday);
    
        if (years.length > 0) {
            // Add "Coordinate Reflections:" before the first year
            let label = document.createElement("strong");
            label.textContent = "Coordinate Reflections: ";
            label.classList.add("clickable", "bold-text");
    
            // Make "Coordinate Reflections" also trigger the pop-up
            label.addEventListener("click", () => {
                document.getElementById("popup-years").checked = true;
            });
    
            matchingYearsList.appendChild(label);
        }
    
        years.forEach((year, index) => {
            let span = document.createElement("span");
            span.textContent = `${year}${index < years.length - 1 ? ", " : ""}`;
            span.classList.add("year-item", "clickable");
            span.dataset.year = year;
            span.style.opacity = 0;
            span.style.transition = "opacity 1.8s ease-in";
    
            // Click event to show the same singular pop-up
            span.addEventListener("click", () => {
                document.getElementById("popup-years").checked = true;
            });
    
            matchingYearsList.appendChild(span);
    
            setTimeout(() => {
                span.style.opacity = 1;
                if (index === years.length - 1 && callback) {
                    setTimeout(callback, 600);
                }
            }, index * 600);
        });
    
        setTimeout(() => {
            document.querySelectorAll(".year-item").forEach(el => {
                el.style.transition = "none";
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
            watchText.style.display = "block";
            setTimeout(() => {
                watchText.style.opacity = 1;
                setTimeout(() => {
                    watchText.style.transition = "none";
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
                    watchText.style.display = "none";
                }, 50);
            } else {
                watchText.style.display = "block";
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

    function playAudioWithFadeIn() {
        if (!audio) return;
    
        if (!hasStartedOnce) {
            audio.currentTime = 38.5;
            hasStartedOnce = true;
        }
    
        audio.volume = 0.0;
    
        const targetVolume = 0.5;
        const fadeDuration = 20000;
        const startTime = performance.now();
    
        function fadeInAudio(currentTime) {
            let elapsedTime = currentTime - startTime;
            let progress = elapsedTime / fadeDuration;
            audio.volume = Math.min(progress * targetVolume, targetVolume);
            if (progress < 1) {
                requestAnimationFrame(fadeInAudio);
            }
        }
    
        // 👇 Play only if not already playing
        if (!isAudioPlaying) {
            audio.play().then(() => {
                isAudioPlaying = true;
                requestAnimationFrame(fadeInAudio); // 👈 Begin fading only if playback succeeded
            }).catch(err => {
                console.warn("Audio play failed:", err);
            });
        }
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

document.addEventListener("DOMContentLoaded", function () {
    const popupYears = document.getElementById("popup-years");
    const popupReset = document.getElementById("popup-reset");
    const popupYearsBox = document.getElementById("popup-years-box");
    const video = document.getElementById("popup-video");

    const eternalTitle = document.getElementById("eternal-title");
    const hiddenText = document.getElementById("hidden-text");

    // Toggle Eternal Watch
    eternalTitle.addEventListener("click", function () {
        const isExpanded = eternalTitle.getAttribute("aria-expanded") === "true";

        if (isExpanded) {
            // Collapse Eternal Watch
            hiddenText.classList.add("hidden");
            eternalTitle.setAttribute("aria-expanded", "false");

            // ✅ Close popup (which visually hides video)
            popupReset.checked = true;

            // ✅ After a short delay, pause + reset video
            setTimeout(() => {
                const video = document.getElementById("popup-video");
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            }, 100);
        } else {
            // Expand Eternal Watch
            hiddenText.classList.remove("hidden");
            eternalTitle.setAttribute("aria-expanded", "true");
        }
    });

    // When popup is opened
    popupYears.addEventListener("change", function () {
        if (popupYears.checked) {
            popupYearsBox.setAttribute("aria-hidden", "false");

            const video = document.getElementById("popup-video");
            if (video) {
                video.classList.remove("hidden");

                // ✅ Let the browser autoplay naturally
                setTimeout(() => {
                    video.play().catch(err => {
                        console.warn("Autoplay blocked:", err);
                    });
                }, 50);
            }
        }
    });

    // When popup is closed
    popupReset.addEventListener("change", function () {
        if (popupReset.checked) {
            popupYearsBox.setAttribute("aria-hidden", "true");

            const video = document.getElementById("popup-video");
            if (video) {
                video.classList.add("hidden");

                // ✅ Pause + reset after hiding to avoid freeze
                setTimeout(() => {
                    video.pause();
                    video.currentTime = 0;
                }, 100);
            }
        }
    });
});
