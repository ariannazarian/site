document.addEventListener("DOMContentLoaded", function () {
    let currentIndex = 0;

    const images = [
        { webp: "assets/images/no-admittance.webp", png: "assets/images/no-admittance.png" },
        { webp: "assets/images/pinkfinger.webp", png: "assets/images/pinkfinger.png" },
        { webp: "assets/images/anpiano.webp", png: "assets/images/anpiano.png" }
    ];

    document.body.addEventListener("click", function (event) {
        const pictureElement = document.getElementById("header-image");

        // Ensure the click is on the header image
        if (!pictureElement || !event.target.closest("#header-img")) return;

        // Toggle index to cycle through images
        currentIndex = (currentIndex + 1) % images.length;

        // Create a new <picture> element
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
        newImg.alt = "Sign reading 'No Admittance Except on Party Business'";
        newImg.classList.add("header-image");
        newImg.setAttribute("loading", "lazy");
        newImg.setAttribute("tabindex", "0");
        newImg.style.cursor = "pointer";

        // Append new elements to <picture>
        newPicture.appendChild(newSource);
        newPicture.appendChild(newImg);

        // Replace the old <picture> with the new one
        pictureElement.replaceWith(newPicture);
    });
});
