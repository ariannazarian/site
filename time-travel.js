// Store the frozen time when the page loads
const frozenTime = new Date();

function getFrozenPSTDate() {
    let now = new Date(frozenTime);
    let utcOffset = now.getTimezoneOffset() / 60;
    let pstOffset = 8;
    
    now.setHours(now.getHours() + (utcOffset - pstOffset));
    
    return now.toLocaleString("en-US", { 
        weekday: "long", 
        month: "long", 
        day: "numeric", 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit", 
        hour12: false
    });
}

// Update frozen time on page load
document.getElementById("current-time").innerText = getFrozenPSTDate();

// Toggle visibility
document.getElementById("eternal-title").addEventListener("click", () => {
    let hiddenText = document.getElementById("hidden-text");
    let arrow = document.getElementById("eternal-arrow");
    
    hiddenText.style.display = hiddenText.style.display === "block" ? "none" : "block";
    arrow.innerText = hiddenText.style.display === "block" ? "▲" : "▼";
});

// Toggle matching years visibility
document.getElementById("reveal-matching-alt").addEventListener("click", () => {
    let matchingYears = document.getElementById("matching-years");
    let arrow = document.getElementById("watch-arrow");

    matchingYears.style.display = matchingYears.style.display === "block" ? "none" : "block";
    arrow.innerText = matchingYears.style.display === "block" ? "▲" : "▼";
});
