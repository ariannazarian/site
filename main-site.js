document.addEventListener("DOMContentLoaded", function () {
    const imgElement = document.getElementById("header-img"); // The visible PNG fallback
    const sourceElement = document.getElementById("header-source"); // WebP source

    if (!imgElement || !sourceElement) return; // Exit if header image elements are missing

    // Detect current page by checking the body class
    let images = [];

    if (document.body.classList.contains("work-page")) {
        // Work Page Images
        images = [
            { webp: "assets/images/lumondesk.webp", png: "assets/images/lumondesk.png" },
            { webp: "assets/images/bighousebunny.webp", png: "assets/images/bighousebunny.png" },
            { webp: "assets/images/latexsnl.webp", png: "assets/images/latexsnl.png" }
        ];
    } else if (document.body.classList.contains("personal-page")) {
        // Personal Page Images (Example: Modify as needed)
        images = [
            { webp: "assets/images/riskybusiness.webp", png: "assets/images/riskybusiness.png" },
            { webp: "assets/images/foodfight.webp", png: "assets/images/foodfight.png" },
            { webp: "assets/images/pizzabros.webp", png: "assets/images/pizzabros.png" }
        ];
    } else {
        // Default to Main Page Images
        images = [
            { webp: "assets/images/no-admittance.webp", png: "assets/images/no-admittance.png" },
            { webp: "assets/images/pinkfinger.webp", png: "assets/images/pinkfinger.png" },
            { webp: "assets/images/anpiano.webp", png: "assets/images/anpiano.png" }
        ];
    }

    let currentIndex = 0; // Start with "no-admittance"

    imgElement.style.cursor = "pointer"; // Show that the image is clickable

    imgElement.addEventListener("click", function () {
        // Toggle index between 0 and 1
        currentIndex = (currentIndex + 1) % images.length;

        // Update WebP and PNG sources
        sourceElement.srcset = images[currentIndex].webp;
        imgElement.src = images[currentIndex].png;

        // Force the browser to reload the image (fixes caching issues)
        imgElement.removeAttribute("src");
        imgElement.setAttribute("src", images[currentIndex].png);
    });
});
