document.addEventListener("DOMContentLoaded", function () {
    const imgElement = document.getElementById("header-img"); // Select the header image

    if (!imgElement) return; // Exit if no header image is found

    // Detect current page by checking the body class
    let images = [];

    if (document.body.classList.contains("work-page")) {
        // Work Page Images
        images = [
            "assets/images/lumondesk.webp",
            "assets/images/bighousebunny.webp",
            "assets/images/latexsnl.webp"
        ];
    } else if (document.body.classList.contains("personal-page")) {
        // Personal Page Images
        images = [
            "assets/images/riskybusiness.webp",
            "assets/images/foodfight.webp",
            "assets/images/pizzabros.webp"
        ];
    } else {
        // Default to Main Page Images
        images = [
            "assets/images/no-admittance.webp",
            "assets/images/pinkfinger.webp",
            "assets/images/anpiano.webp"
        ];
    }

    let currentIndex = 0; // Start at the first image

    imgElement.style.cursor = "pointer"; // Indicate interactivity

    imgElement.addEventListener("click", function () {
        currentIndex = (currentIndex + 1) % images.length; // Cycle through images
        imgElement.src = images[currentIndex]; // Update image source
    });
});
