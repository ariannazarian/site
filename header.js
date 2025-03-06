document.addEventListener("DOMContentLoaded", function () {
    const imgElement = document.getElementById("header-img"); // The visible PNG fallback
    const sourceElement = document.getElementById("header-source"); // WebP source

    const images = [
        { webp: "assets/images/no-admittance.webp", png: "assets/images/no-admittance.png" },
        { webp: "assets/images/pinkfinger.webp", png: "assets/images/pinkfinger.png" }
    ];

    let currentIndex = 0; // Start at "no-admittance"

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
