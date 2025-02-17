// Store the frozen time when the page loads
const frozenTime = new Date();

// Function to get frozen date & time in fixed UTC-8 (PST without DST), excluding the year
function getFrozenPSTDate() {
    let now = new Date(frozenTime); // Use the frozen timestamp
    let utcOffset = now.getTimezoneOffset() / 60;  // Get local offset in hours
    let pstOffset = 8;  // Fixed UTC-8 offset (no DST adjustment)
    
    now.setHours(now.getHours() + (utcOffset - pstOffset));  // Adjust to fixed PST
    
    let options = { 
        weekday: "long", 
        month: "long", 
        day: "numeric", 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit", 
        hour12: true 
    };
    
    return now.toLocaleString("en-US", options); // Format date without year
}

// Function to check if a year is a leap year
function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

// Function to get the correct weekday using JavaScript’s Date object
function getDayOfWeek(day, month, year) {
    if (month === 2 && day === 29 && !isLeapYear(year)) {
        return null;
    }
    return new Date(year, month - 1, day).getDay();
}

// Function to find matching years for the given date and weekday (excluding current year)
function matchingYears(month, day, targetWeekday, startYear, endYear) {
    let years = [];
    let currentYear = new Date().getFullYear();

    for (let year = startYear; year <= endYear; year++) {
        if (year !== currentYear && getDayOfWeek(day, month, year) === targetWeekday) {
            years.push(year);
        }
    }
    return years;
}

// Function to update the clock and matching years once on page load
function updateClockAndYearsOnce() {
    let now = new Date(frozenTime);  // Use the frozen timestamp
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let weekday = now.getDay();

    document.getElementById("current-time").innerText = getFrozenPSTDate();
}

// Run once on page load (no interval)
updateClockAndYearsOnce();

// Add click event listeners to reveal text when clicked
document.getElementById("eternal-title").addEventListener("click", () => {
    document.getElementById("hidden-text").style.display = "block";
});

document.getElementById("current-time").addEventListener("click", () => {
    document.getElementById("hidden-text").style.display = "block";
});

// Reveal matching years when clicking on "Q U O..." or "This time traveler's watch..."
document.getElementById("reveal-matching").addEventListener("click", () => {
    revealMatchingYears();
});

document.getElementById("reveal-matching-alt").addEventListener("click", () => {
    revealMatchingYears();
});

function revealMatchingYears() {
    let now = new Date(frozenTime);  // Use the frozen timestamp
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let weekday = now.getDay();
    let currentYear = now.getFullYear();

    let years = matchingYears(month, day, weekday, 1892, currentYear);
    document.getElementById("matching-years").innerText = `Matching years: ${years.join(', ')}`;
    document.getElementById("matching-years").style.display = "block";
}
