// Function to get current date & time in PST (UTC-8, ignoring DST)
function getCurrentPSTDate() {
    let now = new Date();
    let pstOffset = -8 * 60; // PST is UTC-8
    now = new Date(now.getTime() + (pstOffset - now.getTimezoneOffset()) * 60000);

    return now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

// Function to update the live clock and matching years
function updateClockAndYears() {
    let now = new Date();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let weekday = now.getDay();

    document.getElementById("current-time").innerText = getCurrentPSTDate();

    let currentYear = now.getFullYear();
    let years = matchingYears(month, day, weekday, 1892, currentYear);
    document.getElementById("matching-years").innerText = `Matching years: ${years.join(', ')}`;
}

// Update clock and matching years every second
setInterval(updateClockAndYears, 1000);
updateClockAndYears();
