document.addEventListener("DOMContentLoaded", () => {
    const frozenTime = new Date();
    const audio = document.querySelector("#eternal-audio");
    let audioPlayed = false;

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

    function toggleElementVisibility(element, arrow) {
        const expanded = element.style.display === "block";
        element.style.display = expanded ? "none" : "block";
        arrow.innerText = expanded ? "▼" : "▲";
    }

    function playAudioWithFadeIn() {
        if (!audioPlayed) {
            audio.volume = 0.0;
            audio.play();
            audioPlayed = true;

            let fadeDuration = 20000;
            let startTime = performance.now();

            function fadeInAudio(currentTime) {
                let elapsedTime = currentTime - startTime;
                let progress = elapsedTime / fadeDuration;
                audio.volume = Math.min(progress, 1.0);
                if (progress < 1) requestAnimationFrame(fadeInAudio);
            }

            requestAnimationFrame(fadeInAudio);
        }
    }

    function getMatchingYears() {
        let now = new Date(frozenTime);
        let month = now.getMonth() + 1;
        let day = now.getDate();
        let weekday = now.getDay();
        let currentYear = new Date().getFullYear();

        return Array.from({ length: currentYear - 1892 }, (_, i) => i + 1892)
            .filter(year => new Date(year, month - 1, day).getDay() === weekday);
    }

    function displayMatchingYears() {
        const years = getMatchingYears();
        let outputElement = document.querySelector("#matching-years");

        outputElement.innerHTML = `<strong>Coordinate reflections:</strong> ` + 
            years.map(year => `<span class="year-item">${year}</span>`).join(", ");

        outputElement.style.display = "block";
    }

    document.querySelector("#eternal-title").addEventListener("click", () => {
        toggleElementVisibility(document.querySelector("#hidden-text"), document.querySelector("#eternal-arrow"));
        playAudioWithFadeIn();
    });

    document.querySelector("#reveal-matching-alt").addEventListener("click", () => {
        let matchingYearsElement = document.querySelector("#matching-years");
        if (matchingYearsElement.style.display === "none") {
            displayMatchingYears();
        } else {
            matchingYearsElement.style.display = "none";
        }
    });

    document.body.addEventListener("click", () => {
        if (!audioPlayed) playAudioWithFadeIn();
    }, { once: true });
});
