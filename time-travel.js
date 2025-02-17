// Function to get current date & time in PST (UTC-8, ignoring DST)
function getCurrentPSTDate() {
    let now = new Date();
    let utcOffset = now.getTimezoneOffset() / 60;  // Get user's local offset in hours
    let pstOffset = 8;  // Fixed PST offset (UTC-8, no DST adjustment)
    now.setHours(now.getHours() + (utcOffset - pstOffset));

    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return now.toLocaleString('en-US', options);
}

// Function to get the correct weekday using JavaScript's built-in `Date` object
function getDayOfWeek(day, month, year) {
    let date = new Date(year, month - 1, day);

    // Ensure leap years are correctly handled
    if (month === 2 && day === 29) {
        if (!(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0))) {
            return null; // Skip invalid leap years
        }
    }

    return date.getDay(); // Returns 0=Sunday, ..., 6=Saturday
}

// Function to find matching years for the given date and weekday
function matchingYears(month, day, targetWeekday, startYear, endYear) {
    let years = [];
    for (let year = startYear; year <= endYear; year++) {
        if (getDayOfWeek(day, month, year) === targetWeekday) {
            years.push(year);
        }
    }
    return years;
}

// Function to update the live clock and matching years
function updateClockAndYears() {
    let now = new Date();
    let utcOffset = now.getTimezoneOffset() / 60;
    let pstOffset = 8;
    now.setHours(now.getHours() + (utcOffset - pstOffset));

    let month = now.getMonth() + 1;  // JavaScript months are 0-based
    let day = now.getDate();
    let weekday = now.getDay();  // 0=Sunday, 1=Monday, ..., 6=Saturday

    document.getElementById("current-time").innerText = getCurrentPSTDate();

    let currentYear = now.getFullYear(); // Get current year dynamically
    let years = matchingYears(month, day, weekday, 1892, currentYear);
    document.getElementById("matching-years").innerText = `Matching years: ${years.join(', ')}`;
}

// Update clock and matching years every second
setInterval(updateClockAndYears, 1000);
updateClockAndYears(); // Run immediately on page load
