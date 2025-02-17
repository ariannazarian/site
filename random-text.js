document.addEventListener("DOMContentLoaded", () => {
    function generateRandomText(length) {
        const characters = "abcdefghijklmnopqrstuvwxyz ";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Fill wall of random text
    const babelWall = document.querySelector(".babel-wall");
    if (babelWall) {
        let text = "";
        const lines = 300; // Increase for more density
        const charsPerLine = 120;

        for (let i = 0; i < lines; i++) {
            text += generateRandomText(charsPerLine) + "\n";
        }

        babelWall.textContent = text;
    }

    /* 
    🔹 ERASE & REWRITE EFFECT (Balanced Chaos)
    - Uses Fibonacci & Golden Ratio for dynamic effect
    */
    function eraseAndRewrite() {
        document.querySelectorAll(".babel-wall").forEach(element => {
            if (Math.random() < 0.618) { // Golden Ratio Probability
                element.style.opacity = 0;
                setTimeout(() => {
                    let newText = "";
                    for (let i = 0; i < lines; i++) {
                        newText += generateRandomText(charsPerLine) + "\n";
                    }
                    element.textContent = newText;
                    element.style.opacity = 1;
                }, 500);
            }
        });

        setTimeout(eraseAndRewrite, 1618); // Golden Ratio refresh cycle
    }

    setTimeout(eraseAndRewrite, 1618); // Start cycle
});

