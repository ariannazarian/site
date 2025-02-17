document.addEventListener("DOMContentLoaded", () => {
    const randomTextElements = document.querySelectorAll(".decorative-text");

    function generateRandomText(length) {
        const characters = "abcdefghijklmnopqrstuvwxyz";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    randomTextElements.forEach(element => {
        element.textContent = generateRandomText(30);
    });
});
