// Function to get current date & time in PST (UTC-8, ignoring DST)
function getCurrentPSTDate() {
    let now = new Date();
    let utcOffset = now.getTimezoneOffset() / 60;  // Get user's local offset in hours
    let pstOffset = 8;  // Fixed PST offset (UTC-8, no DST adjustment)
    now.setHours(now.getHours() + (utcOffset - pstOffset));

    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return now.toLocaleString('en-US', options);
}

// Function to calculate matching years using Zeller’s Congruence
function zellersCongruence(day, month, year) {
    if (month < 3) { month += 12; year -= 1; }
    let K = year % 100; // Last two digits of year
    let J = Math.floor(year / 100); // First two digits of year
    let h = (day + Math.floor((13 * (month + 1)) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) + (5 * J)) % 7;

    return (h + 7) % 7; // Ensures positive values
}


// Function to find matching years
function matchingYears(month, day, targetWeekday, startYear, endYear) {
    let years = [];
    for (let year = startYear; year <= endYear; year++) {
        if (zellersCongruence(day, month, year) === targetWeekday) {
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

