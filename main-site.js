document.addEventListener("DOMContentLoaded", function () {
    const imgElement = document.getElementById("header-img");
    if (!imgElement) return;

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

    document.querySelectorAll(".popup-radio").forEach((radio) => {
        radio.addEventListener("change", () => {
            document.querySelectorAll(".popup").forEach((popup) => {
                popup.setAttribute("aria-hidden", !radio.checked);
            });
        });
    });

    preloadNextImage(currentIndex);

    // 🔹 Video Handling (Only Run on Personal Page)
    if (document.body.classList.contains("personal-page")) {
        setupVideoHandling();
    }
});

// 🔹 VIDEO FUNCTIONS (Fixed Play Button & Toggle Issues)
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

    el.innerHTML = `<iframe class="video-iframe" loading="lazy" width="${width}" height="${width * 9 / 16}" 
                    src="https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0"
                    frameborder="0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>`;
}

function toggleVideo(index) {
    const videos = document.querySelectorAll('.video-container');
    const arrows = document.querySelectorAll('.toggle-arrow');
    const videoTitles = document.querySelectorAll(".video-title");
    const videoThumbnail = videos[index].querySelector(".video-thumbnail");

    let isExpanded = videos[index].style.display !== "none";

    videos[index].style.display = isExpanded ? "none" : "block";
    arrows[index].textContent = isExpanded ? "▼" : "▲";

    if (!isExpanded && videoThumbnail.dataset.videoId) {
        loadVideo(videoThumbnail, videoThumbnail.dataset.videoId);
    }

    const iframe = videos[index].querySelector("iframe");
    if (isExpanded && iframe) {
        iframe.src = ""; 
    }

    arrows[index].classList.remove("blink-arrow");
    arrows[index].style.animation = "none";

    // 🔹 Update ARIA attribute dynamically
    videoTitles[index].setAttribute("aria-expanded", !isExpanded);
}
