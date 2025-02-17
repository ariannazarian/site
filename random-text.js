document.addEventListener("DOMContentLoaded", () => {
    function generateRandomText(length) {
        const characters = "abcdefghijklmnopqrstuvwxyz ";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Fill each babel-line with random text
    document.querySelectorAll(".babel-line").forEach(element => {
        element.textContent = generateRandomText(80);
    });

    // Insert random inline text around meaningful words
    document.querySelectorAll(".babel-inline").forEach(element => {
        element.textContent = generateRandomText(10);
    });

    /* 
    🔹 ERASE & REWRITE EFFECT
    - Occasionally fully replaces a line with a new random line
    */
    function eraseAndRewrite() {
        document.querySelectorAll(".babel-line").forEach(element => {
            if (Math.random() < 0.1) { // 10% chance to refresh any given line
                element.style.opacity = 0; // Fade out
                setTimeout(() => {
                    element.textContent = generateRandomText(80); // Replace text
                    element.style.opacity = 1; // Fade back in
                }, 500);
            }
        });
    }
    setInterval(eraseAndRewrite, 5000); // Runs every 5 seconds
});
