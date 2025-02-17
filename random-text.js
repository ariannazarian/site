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
        element.setAttribute("data-random-text", generateRandomText(120));
        element.textContent = generateRandomText(120);
    });

    // Insert random inline text around meaningful words
    document.querySelectorAll(".babel-inline").forEach(element => {
        element.textContent = generateRandomText(15);
    });

    /* 
    🔹 ERASE & REWRITE EFFECT (Golden Ratio & Fibonacci Timing)
    - Uses Fibonacci for time intervals (1, 2, 3, 5, 8… sec cycles)
    - Uses Golden Ratio (61.8%) for probability of change
    */
    let fibonacci = [1, 2, 3, 5, 8, 13]; // Fibonacci time cycle
    let index = 0; // Track current Fibonacci index

    function eraseAndRewrite() {
        document.querySelectorAll(".babel-line").forEach(element => {
            if (Math.random() < 0.618) { // Golden Ratio Probability
                element.style.opacity = 0; // Fade out
                setTimeout(() => {
                    element.textContent = generateRandomText(120); // Replace text
                    element.style.opacity = 1; // Fade back in
                }, 500);
            }
        });

        // Update refresh rate based on Fibonacci sequence
        let nextInterval = fibonacci[index % fibonacci.length] * 1000; // Convert sec to ms
        index++;
        setTimeout(eraseAndRewrite, nextInterval);
    }

    setTimeout(eraseAndRewrite, 1000); // Start first cycle at 1 sec
});
