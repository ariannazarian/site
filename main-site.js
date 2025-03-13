document.addEventListener("DOMContentLoaded", function () {
    // 🔹 Handle Right-Click & Drag Prevention
    document.addEventListener("contextmenu", function (event) {
        event.preventDefault(); // Disable right-click globally
    });

    document.addEventListener("dragstart", function (event) {
        event.preventDefault(); // Prevent dragging
    });

    // 🔹 Block DevTools Shortcuts (F12 & Ctrl+Shift+I, Cmd+Option+I)
    document.addEventListener("keydown", function (event) {
        if (event.key === "F12" || 
            (event.ctrlKey && event.shiftKey && event.key === "I") || 
            (event.metaKey && event.altKey && event.key === "I")) {
            event.preventDefault();
        }
    });

    // 🔹 Block View Source Shortcut (Ctrl+U)
    document.addEventListener("keydown", function (event) {
        if (event.ctrlKey && event.key === "u") {
            event.preventDefault();
        }
    });

    // 🔹 Detect DevTools Open (Only Show Warning, No Function Breakage)
    (function() {
        let element = new Image();
        Object.defineProperty(element, "id", {
            get: function() {
                console.clear();
                alert("DevTools are disabled on this site.");
            }
        });
    })();

    // 🔹 Handle Image Cycling
    const imgElement = document.getElementById("header-img");
    if (imgElement) {
        let pageType = document.body.className;
        const images = {
            "work-page": [
                "assets/images/lumondesk.webp",
                "assets/images/bighousebunny.webp",
                "assets/images/latexsnl.webp"
            ],
            "personal-page": [
                "assets/images/riskybusiness.webp",
                "assets/images/foodfight.webp",
                "assets/images/pizzabros.webp"
            ],
            "default": [
                "assets/images/no-admittance.webp",
                "assets/images/pinkfinger.webp",
                "assets/images/anpiano.webp"
            ]
        };

        let currentIndex = 0;
        let activeImages = images[pageType] || images["default"];

        imgElement.style.cursor = "pointer";

        function preloadNextImage(index) {
            let img = new Image();
            img.src = activeImages[(index + 1) % activeImages.length];
        }

        imgElement.addEventListener("click", function () {
            currentIndex = (currentIndex + 1) % activeImages.length;
            imgElement.src = activeImages[currentIndex];
            preloadNextImage(currentIndex);
        });

        preloadNextImage(currentIndex);
    }

    // 🔹 Ensure ARIA updates dynamically for pop-ups
    document.querySelectorAll(".popup-radio").forEach((radio) => {
        radio.addEventListener("change", () => {
            document.querySelectorAll(".popup").forEach((popup) => {
                popup.setAttribute("aria-hidden", !radio.checked);
            });
        });
    });

    // 🔹 Setup Video Handling on Personal Page
    if (document.body.classList.contains("personal-page")) {
        setupVideoHandling();
    }
});

// 🔹 VIDEO FUNCTIONS (Ensuring Click Listeners Are Attached)
function setupVideoHandling() {
    document.querySelectorAll(".video-title").forEach((title) => {
        title.addEventListener("click", function () {
            let index = parseInt(this.dataset.index);
            toggleVideo(index);
        });
    });

    document.querySelectorAll('.video-thumbnail').forEach((thumbnail) => {
        thumbnail.dataset.originalContent = thumbnail.innerHTML;

        // Attach event listener dynamically to load video correctly
        thumbnail.addEventListener("click", function () {
            let videoId = this.dataset.videoId;
            loadVideo(this, videoId);
        });
    });
}

function loadVideo(el, videoId) {
    console.log("loadVideo called for videoId:", videoId); // Debugging

    // Ensure the clicked element has a valid video ID
    if (!videoId) {
        console.error("No valid video ID found.");
        return;
    }

    // Stop all other playing videos before loading a new one
    document.querySelectorAll('.video-thumbnail').forEach(vid => {
        if (vid !== el && vid.dataset.originalContent) {
            vid.innerHTML = vid.dataset.originalContent;
        }
    });

    if (!el.dataset.originalContent) {
        el.dataset.originalContent = el.innerHTML;
    }

    el.dataset.videoId = videoId;
    const width = el.offsetWidth;

    console.log("Replacing thumbnail with iframe"); // Debugging

    el.innerHTML = `
        <iframe class="video-iframe" loading="lazy" width="${width}" height="${width * 9 / 16}" 
        src="https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0"
        frameborder="0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>`;
}


function toggleVideo(index) {
    const videos = document.querySelectorAll('.video-container');
    const arrows = document.querySelectorAll('.toggle-arrow');
    const videoTitles = document.querySelectorAll(".video-title");

    let videoContainer = videos[index];
    let arrow = arrows[index];
    let title = videoTitles[index];

    // Toggle visibility
    let isExpanded = videoContainer.classList.contains("hidden");
    videoContainer.classList.toggle("hidden", !isExpanded);

    // Ensure video appears properly by resetting inline display (if needed)
    if (!isExpanded) {
        videoContainer.style.display = "block";
    } else {
        videoContainer.style.display = "none";

        // 🔹 Pause the video if it's currently playing
        let iframe = videoContainer.querySelector("iframe");
        if (iframe) {
            let videoSrc = iframe.src;
            iframe.src = ""; // Reset src to stop video playback
            iframe.src = videoSrc; // Restore src (prevents YouTube from keeping it playing)
        }
    }

    // Toggle arrow direction
    arrow.textContent = isExpanded ? "▼" : "▲";

    // Stop blinking after first click
    arrow.classList.remove("blink-arrow");
    arrow.style.animation = "none";

    // Update ARIA attributes for accessibility
    title.setAttribute("aria-expanded", !isExpanded);
}

