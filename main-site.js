document.addEventListener("DOMContentLoaded", function () {
    // 🔹 Handle Right-Click & Drag Prevention
    document.addEventListener("contextmenu", function (event) {
        event.preventDefault(); // Disable right-click globally
    });

    document.addEventListener("dragstart", function (event) {
        event.preventDefault(); // Prevent dragging
    });

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
    document.querySelectorAll(".video-title").forEach((title, index) => {
        title.addEventListener("click", function () {
            toggleVideo(index);
        });
    });

    document.querySelectorAll('.video-thumbnail').forEach((thumbnail) => {
        thumbnail.dataset.originalContent = thumbnail.innerHTML;

        // 🔹 Add event listener for play button clicks
        thumbnail.addEventListener("click", function () {
            let videoId = this.querySelector("img").src.split("/vi/")[1].split("/")[0];
            loadVideo(this, videoId);
        });
    });
}

function loadVideo(el, videoId) {
    console.log("loadVideo called for videoId:", videoId); // Debugging

    // Ensure the clicked element is a video thumbnail and has an image
    let img = el.querySelector("img");
    if (!img || !img.src.includes("img.youtube.com")) {
        console.error("Thumbnail image is missing or incorrect.");
        return;
    }

    // Stop all other playing videos before loading a new one
    document.querySelectorAll('.video-thumbnail').forEach(vid => {
        if (vid !== el && vid.dataset.originalContent) {
            vid.innerHTML = vid.dataset.originalContent; // Restore original thumbnail
        }
    });

    if (!el.dataset.originalContent) {
        el.dataset.originalContent = el.innerHTML;
    }

    el.dataset.videoId = videoId;
    const width = el.offsetWidth;

    console.log("Replacing thumbnail with iframe"); // Debugging

    el.innerHTML = `<iframe class="video-iframe" loading="lazy" width="${width}" height="${width * 9 / 16}" 
                    src="https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0"
                    frameborder="0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>`;
}


function toggleVideo(index) {
    const videos = document.querySelectorAll('.video-container');
    const arrows = document.querySelectorAll('.toggle-arrow');
    const videoTitles = document.querySelectorAll(".video-title");

    let video = videos[index]; 
    let arrow = arrows[index];
    let title = videoTitles[index];

    console.log(`Toggling video container ${index}`); // Debugging

    if (video.classList.contains("hidden")) {
        video.classList.remove("hidden");
        video.classList.add("force-visible"); // Ensure visibility
    } else {
        video.classList.add("hidden");
        video.classList.remove("force-visible"); // Hide properly
    }
    

    arrow.textContent = video.classList.contains("hidden") ? "▼" : "▲";

    // Stop blinking after first click
    arrow.classList.remove("blink-arrow");
    arrow.style.animation = "none";

    // Update ARIA attributes for accessibility
    title.setAttribute("aria-expanded", video.classList.contains("hidden") ? "false" : "true");
}


