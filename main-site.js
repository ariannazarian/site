document.addEventListener("DOMContentLoaded", function () {
    const imgElement = document.getElementById("header-img"); // Select the header image
    if (!imgElement) return; // Exit if no header image is found

    // Detect current page by checking the body class once
    let pageType = document.body.className;

    // Define images based on page type
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
    let activeImages = images[pageType] || images["default"]; // Select correct image set

    imgElement.style.cursor = "pointer"; // Indicate interactivity

    // Preload the next image in sequence to improve swap speed
    function preloadNextImage(index) {
        let img = new Image();
        img.src = activeImages[(index + 1) % activeImages.length];
    }

    // Handle image cycling
    imgElement.addEventListener("click", function () {
        currentIndex = (currentIndex + 1) % activeImages.length;
        imgElement.src = activeImages[currentIndex];
        preloadNextImage(currentIndex); // Preload the next image in sequence
    });

    // 🔹 Ensure ARIA updates dynamically for pop-ups
    document.querySelectorAll(".popup-radio").forEach((radio) => {
        radio.addEventListener("change", () => {
            document.querySelectorAll(".popup").forEach((popup) => {
                popup.setAttribute("aria-hidden", !radio.checked);
            });
        });
    });

    // Preload the next image initially
    preloadNextImage(currentIndex);
});

document.addEventListener("DOMContentLoaded", function () {
    // Store the original HTML content of each video thumbnail when the page loads
    document.querySelectorAll('.video-thumbnail').forEach(vid => {
        vid.dataset.originalContent = vid.innerHTML;
    });
});

function loadVideo(el, videoId) {
    // Stop all other playing videos before loading a new one
    document.querySelectorAll('.video-thumbnail').forEach(vid => {
        if (vid !== el && vid.dataset.originalContent) {
            vid.innerHTML = vid.dataset.originalContent; // Restore original thumbnail
        }
    });

    // Ensure the clicked element stores its original content
    if (!el.dataset.originalContent) {
        el.dataset.originalContent = el.innerHTML;
    }

    // Store the video ID for future toggles
    el.dataset.videoId = videoId;

    // Set the width of the iframe to match the original thumbnail width
    const width = el.offsetWidth;

    // Replace thumbnail with iframe (keeping the same width)
    el.innerHTML = `<iframe class="video-iframe" loading="lazy" width="${width}" height="${width * 9 / 16}" 
                    src="https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0"
                    frameborder="0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>`;
}

function toggleVideo(index) {
    const videos = document.querySelectorAll('.video-container');
    const arrows = document.querySelectorAll('.toggle-arrow');
    const videoThumbnail = videos[index].querySelector(".video-thumbnail");

    if (videos[index].style.display === "none" || videos[index].style.display === "") {
        videos[index].style.display = "block";
        arrows[index].textContent = "▲"; // Change arrow to up

        // If the video was previously played and removed, reload its original thumbnail (but NOT autoplay)
        if (videoThumbnail.dataset.videoId) {
            loadVideo(videoThumbnail, videoThumbnail.dataset.videoId);
        }
    } else {
        videos[index].style.display = "none";
        arrows[index].textContent = "▼"; // Change arrow to down

        // Find and pause the video inside the container
        const iframe = videos[index].querySelector("iframe");
        if (iframe) {
            iframe.src = ""; // Reset the iframe's src to stop the video
        }
    }

    // Stop blinking after first click
    arrows[index].classList.remove("blink-arrow");
    arrows[index].style.animation = "none"; // Ensures blinking stops completely
}

document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("contextmenu", function (event) {
        event.preventDefault(); // Disable right-click globally
    });

    document.addEventListener("dragstart", function (event) {
        event.preventDefault(); // Prevent dragging any element
    });

    document.addEventListener("dragenter", function (event) {
        event.preventDefault(); // Prevent files from being dragged onto the page
    });

    document.addEventListener("dragover", function (event) {
        event.preventDefault(); // Prevent default behavior when dragging
    });

    document.addEventListener("drop", function (event) {
        event.preventDefault(); // Prevent files from being dropped onto the page
    });

    // 🔹 Block DevTools Shortcuts (F12 & Ctrl+Shift+I)
    document.addEventListener("keydown", function (event) {
        if (event.key === "F12" || (event.ctrlKey && event.shiftKey && event.key === "I")) {
            event.preventDefault();
        }
    });

    // 🔹 Block View Source Shortcut (Ctrl+U)
    document.addEventListener("keydown", function (event) {
        if (event.ctrlKey && event.key === "u") {
            event.preventDefault();
        }
    });

    // 🔹 Detect DevTools Open & Clear Console
    (function() {
        let devtools = false;
        let element = new Image();
        Object.defineProperty(element, "id", {
            get: function() {
                devtools = true;
                throw new Error("DevTools detected!");
            }
        });

        setInterval(function() {
            if (devtools) {
                console.clear();
                alert("DevTools are disabled on this site.");
            }
        }, 1000);
    })();
});
