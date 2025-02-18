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

    document.querySelector("#eternal-title").addEventListener("click", toggleEternalWatch);
    document.querySelector("#current-time").addEventListener("click", toggleEternalWatch);

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
        }).catch(error => console.error("Audio playback prevented:", error));
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

    function encryptText(text) {
        return btoa(text);
    }

    function decryptText(encodedText) {
        return atob(encodedText);
    }

    let encryptedMessage = encryptText("This is my dynamically loaded content.");
    document.getElementById("encrypted-text").innerText = decryptText(encryptedMessage);

    document.addEventListener("contextmenu", event => event.preventDefault());
    document.addEventListener("copy", event => event.preventDefault());
    document.addEventListener("paste", event => event.preventDefault());
    document.addEventListener("selectstart", event => event.preventDefault());
});
