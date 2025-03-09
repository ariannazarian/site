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
