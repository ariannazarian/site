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
document.getElementById("reveal-matching").addEventListener("click", toggleMatchingYears);
document.getElementById("reveal-matching-alt").addEventListener("click", toggleMatchingYears);

function toggleMatchingYears() {
    let matchingYears = document.getElementById("matching-years");
    let arrow = document.getElementById("watch-arrow");

    if (matchingYears.style.display === "none" || matchingYears.style.display === "") {
        revealMatchingYears();
        matchingYears.style.display = "block";
        arrow.innerText = "▲";
    } else {
        matchingYears.style.display = "none";
        arrow.innerText = "▼";
    }
}

function revealMatchingYears() {
    let now = new Date(frozenTime);
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let weekday = now.getDay();
    let currentYear = now.getFullYear();

    let years = Array.from({ length: currentYear - 1892 }, (_, i) => i + 1892).filter(year => new Date(year, month - 1, day).getDay() === weekday);

    document.getElementById("matching-years").innerText = `Matching years: ${years.join(', ')}`;
}
