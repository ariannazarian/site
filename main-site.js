document.addEventListener("DOMContentLoaded", function () {
    const imgElement = document.getElementById("header-img"); // The visible PNG fallback
    const pictureElement = document.getElementById("header-image"); // The <picture> element

    const images = [
        { webp: "assets/images/no-admittance.webp", png: "assets/images/no-admittance.png" },
        { webp: "assets/images/pinkfinger.webp", png: "assets/images/pinkfinger.png" },
        { webp: "assets/images/anpiano.webp", png: "assets/images/anpiano.png" }
    ];

    let currentIndex = 0; // Start with "no-admittance"

    imgElement.style.cursor = "pointer"; // Show that the image is clickable

    imgElement.addEventListener("click", function () {
        // Toggle index to cycle through images
        currentIndex = (currentIndex + 1) % images.length;

        // Create a completely new <picture> element to force browser re-render
        const newPicture = document.createElement("picture");
        newPicture.id = "header-image";
        newPicture.setAttribute("role", "button");
        newPicture.setAttribute("aria-label", "Toggle header image");

        // Create new <source> for WebP
        const newSource = document.createElement("source");
        newSource.srcset = images[currentIndex].webp;
        newSource.type = "image/webp";

        // Create new <img> for PNG fallback
        const newImg = document.createElement("img");
        newImg.id = "header-img";
        newImg.src = images[currentIndex].png;
        newImg.alt = "Sign reading 'No Admittance Except on Party Business'"; // Keep description for accessibility
        newImg.classList.add("header-image");
        newImg.setAttribute("loading", "lazy");
        newImg.setAttribute("tabindex", "0");
        newImg.style.cursor = "pointer";

        // Append new elements to <picture>
        newPicture.appendChild(newSource);
        newPicture.appendChild(newImg);

        // Replace the old <picture> with the new one
        pictureElement.replaceWith(newPicture);

        // Re-add event listener to the new image
        newImg.addEventListener("click", arguments.callee);
    });
});
