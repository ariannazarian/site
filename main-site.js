document.addEventListener("DOMContentLoaded", function () {
    const imgElement = document.getElementById("header-img"); // The visible PNG fallback
    const sourceElement = document.getElementById("header-source"); // WebP source
    const pictureElement = document.getElementById("header-image"); // The entire <picture> element

    const images = [
        { webp: "assets/images/no-admittance.webp", png: "assets/images/no-admittance.png" },
        { webp: "assets/images/pinkfinger.webp", png: "assets/images/pinkfinger.png" },
        { webp: "assets/images/anpiano.webp", png: "assets/images/anpiano.png" }
    ];

    let currentIndex = 0; // Start with "no-admittance"

    imgElement.style.cursor = "pointer"; // Show that the image is clickable

    imgElement.addEventListener("click", function () {
        // Toggle index between 0 and 1
        currentIndex = (currentIndex + 1) % images.length;

        // Create a new <source> element to properly update WebP
        const newSource = document.createElement("source");
        newSource.id = "header-source";
        newSource.srcset = images[currentIndex].webp;
        newSource.type = "image/webp";

        // Replace the old source element
        sourceElement.replaceWith(newSource);

        // Update PNG fallback
        imgElement.src = images[currentIndex].png;

        // Ensure browser reloads the new image (fixes caching issues)
        imgElement.removeAttribute("src");
        imgElement.setAttribute("src", images[currentIndex].png);
    });
});
