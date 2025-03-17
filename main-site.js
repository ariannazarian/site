document.addEventListener("DOMContentLoaded", function () {
    // 🔹 Prevent Right-Click & Dragging
    document.addEventListener("contextmenu", event => event.preventDefault());
    document.addEventListener("dragstart", event => event.preventDefault());

    // 🔹 Block DevTools & View Source Shortcuts
    document.addEventListener("keydown", event => {
        const blockedKeys = ["F12", "u"];
        if (blockedKeys.includes(event.key) || 
            (event.ctrlKey && event.shiftKey && event.key === "I") || 
            (event.metaKey && event.altKey && event.key === "I")) {
            event.preventDefault();
        }
    });

    // 🔹 DevTools Warning Detection (Non-Breaking)
    (() => {
        const devToolsWarning = new Image();
        Object.defineProperty(devToolsWarning, "id", {
            get: () => {
                console.clear();
                alert("DevTools are disabled on this site.");
            }
        });
    })();

    // 🔹 Handle Image Cycling for Header
    const imgElement = document.getElementById("header-img");
    if (imgElement) {
        const pageType = document.body.className;
        const images = {
            "work-page": ["assets/images/lumondesk.webp", "assets/images/bighousebunny.webp", "assets/images/latexsnl.webp"],
            "personal-page": ["assets/images/riskybusiness.webp", "assets/images/foodfight.webp", "assets/images/pizzabros.webp"],
            "default": ["assets/images/no-admittance.webp", "assets/images/pinkfinger.webp", "assets/images/anpiano.webp"]
        };

        let currentIndex = 0;
        const activeImages = images[pageType] || images["default"];
        imgElement.style.cursor = "pointer";

        function preloadNextImage() {
            const nextIndex = (currentIndex + 1) % activeImages.length;
            new Image().src = activeImages[nextIndex]; // Preload next image
        }

        imgElement.addEventListener("click", function () {
            currentIndex = (currentIndex + 1) % activeImages.length;
            imgElement.src = activeImages[currentIndex];
            preloadNextImage();
        });

        preloadNextImage();
    }

    // 🔹 Ensure ARIA Updates for Pop-ups
    document.querySelectorAll(".popup-radio").forEach(radio => {
        radio.addEventListener("change", () => {
            document.querySelectorAll(".popup").forEach(popup => {
                popup.setAttribute("aria-hidden", !radio.checked);
            });
        });
    });

    // 🔹 Setup Video Handling on Personal Page
    if (document.body.classList.contains("personal-page")) {
        setupVideoHandling();
    }
});

// 🔹 VIDEO FUNCTIONS (Ensuring Click Listeners Are Attached)
function setupVideoHandling() {
    document.querySelectorAll(".video-title").forEach((title) => {
        title.addEventListener("click", function () {
            let index = parseInt(this.dataset.index);
            toggleVideo(index);
        });
    });

    document.querySelectorAll('.video-thumbnail').forEach((thumbnail) => {
        thumbnail.dataset.originalContent = thumbnail.innerHTML;

        // Attach event listener dynamically to load video correctly
        thumbnail.addEventListener("click", function () {
            let videoId = this.dataset.videoId;
            loadVideo(this, videoId);
        });
    });
}

function loadVideo(el, videoId) {
    console.log("loadVideo called for videoId:", videoId); // Debugging

    // Ensure the clicked element has a valid video ID
    if (!videoId) {
        console.error("No valid video ID found.");
        return;
    }

    // Stop all other playing videos before loading a new one
    document.querySelectorAll('.video-thumbnail').forEach(vid => {
        if (vid !== el && vid.dataset.originalContent) {
            vid.innerHTML = vid.dataset.originalContent;
        }
    });

    if (!el.dataset.originalContent) {
        el.dataset.originalContent = el.innerHTML;
    }

    el.dataset.videoId = videoId;
    const width = el.offsetWidth;


    el.innerHTML = `
        <iframe class="video-iframe" loading="lazy" width="${width}" height="${width * 9 / 16}" 
        src="https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0"
        frameborder="0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>`;
}

// 🔹 Toggle Short Films Section
document.addEventListener("DOMContentLoaded", function () {
    const sectionTitle = document.getElementById("short-films-title");
    const sectionArrow = document.getElementById("short-films-arrow");
    const sectionContent = document.getElementById("short-films-content");

    if (sectionTitle) {
        sectionTitle.addEventListener("click", function () {
            const isHidden = sectionContent.classList.toggle("hidden");
            sectionArrow.textContent = isHidden ? "▼" : "▲";

            // Stop blinking after first click
            sectionArrow.classList.remove("blink-arrow");

            if (isHidden) {
                // 🔹 Collapse all open video sections
                document.querySelectorAll("#short-films-content .video-container").forEach(videoContainer => {
                    videoContainer.classList.add("hidden");
                    videoContainer.style.display = "none"; // Ensure videos are fully collapsed
                });

                // 🔹 Pause any playing videos inside the section
                document.querySelectorAll("#short-films-content iframe").forEach(iframe => {
                    iframe.parentNode.innerHTML = iframe.parentNode.innerHTML; // Fully remove & reinsert to stop playback
                });

                // 🔹 Reset all toggle arrows inside section
                document.querySelectorAll("#short-films-content .toggle-arrow").forEach(arrow => {
                    arrow.textContent = "▼";
                });
            }
        });
    }
});

function toggleVideo(index) {
    const videos = document.querySelectorAll('.video-container');
    const arrows = document.querySelectorAll('.toggle-arrow');
    const videoTitles = document.querySelectorAll(".video-title");

    let videoContainer = videos[index];
    let arrow = arrows[index];
    let title = videoTitles[index];

    // Log current state before toggling
    console.log(`Before toggle: index=${index}, hidden=${videoContainer.classList.contains("hidden")}, display=${videoContainer.style.display}`);

    // Toggle visibility
    let isExpanded = !videoContainer.classList.contains("hidden");

    if (isExpanded) {
        videoContainer.classList.add("hidden");
        videoContainer.style.display = "none";
    } else {
        videoContainer.classList.remove("hidden");

        // Force display change
        videoContainer.style.display = "block";

        // Debugging reflow
        setTimeout(() => {
            videoContainer.style.display = "block";
            console.log(`Reflow applied: index=${index}, display=${videoContainer.style.display}`);
        }, 10); // Small delay to ensure the reflow applies
    }

    // Log updated state
    console.log(`After toggle: index=${index}, hidden=${videoContainer.classList.contains("hidden")}, display=${videoContainer.style.display}`);

    // Pause the video when hiding
    const iframe = videoContainer.querySelector("iframe");
    if (iframe && isExpanded) {
        iframe.parentNode.innerHTML = iframe.parentNode.innerHTML; // Fully remove & reinsert to stop playback
    }

    // Toggle arrow direction
    arrow.textContent = isExpanded ? "▼" : "▲";

    // Stop blinking after first click
    arrow.classList.remove("blink-arrow");
    arrow.style.animation = "none";

    // Update ARIA attributes for accessibility
    title.setAttribute("aria-expanded", !isExpanded);
}

function setupVideoHandling() {
    document.querySelectorAll(".video-container").forEach(videoContainer => {
        // 🔹 Ensure videos are correctly marked as hidden
        if (!videoContainer.classList.contains("hidden")) {
            console.log("Fixing missing .hidden class for video:", videoContainer);
            videoContainer.classList.add("hidden");
            videoContainer.style.display = "none"; 
        }
    });

    document.querySelectorAll(".video-title").forEach((title) => {
        title.addEventListener("click", function () {
            let index = parseInt(this.dataset.index);
            toggleVideo(index);
        });
    });

    document.querySelectorAll('.video-thumbnail').forEach((thumbnail) => {
        thumbnail.dataset.originalContent = thumbnail.innerHTML;

        thumbnail.addEventListener("click", function () {
            let videoId = this.dataset.videoId;
            loadVideo(this, videoId);
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const stick = document.getElementById("stick");
    const remainingAntsDisplay = document.getElementById("remaining-ants");
    const timerDisplay = document.getElementById("timer");

    let pixelsPerSecond = 20; // Fixed speed: 20 pixels per second
    let maxStickWidth = 500; // Max stick length
    let stickWidth = Math.min(window.innerWidth * 0.9, maxStickWidth); // Stick scales up to 500px max
    let maxAnts = 50; // Max number of normal ants
    let antSize = 10; // Ensuring visible size is correct

    let numAnts = Math.min(maxAnts, Math.floor(stickWidth / (maxStickWidth / maxAnts)));
    let ants = [];
    let specialAnts = [];
    let startTime = null;
    let timerInterval = null;

    // ✅ Ensure stick visually matches the simulation
    stick.style.width = `${stickWidth}px`;

    function positionSpecialAntsContainer() {
        let specialAntsContainer = document.getElementById("special-ants");
        if (!specialAntsContainer) return;

        let stickRect = stick.getBoundingClientRect();

        // ✅ Ensure `#special-ants` is correctly positioned relative to the stick
        specialAntsContainer.style.position = "absolute";
        specialAntsContainer.style.left = `${stickRect.left}px`;
        specialAntsContainer.style.width = `${stickWidth}px`;
        specialAntsContainer.style.top = `${stickRect.bottom + 5}px`; // ✅ Ensure it's always below the stick
    }

    function resetSimulation() {
        stick.innerHTML = "";
        ants = [];
        specialAnts = [];
        startTime = performance.now();

        // ✅ Spawn random ants above the line
        for (let i = 0; i < numAnts; i++) {
            let position = Math.random() * (stickWidth - antSize);
            let direction = Math.random() < 0.5 ? -1 : 1;
            let symbol = direction === -1 ? "◀" : "▶";

            let ant = document.createElement("div");
            ant.className = "ant";
            ant.textContent = symbol;
            ant.style.left = position + "px";
            stick.appendChild(ant);

            ants.push({ element: ant, position, direction });
        }

        // ✅ Ensure `#special-ants` exists
        let specialAntsContainer = document.getElementById("special-ants");
        if (!specialAntsContainer) {
            specialAntsContainer = document.createElement("div");
            specialAntsContainer.id = "special-ants";
            stick.parentElement.appendChild(specialAntsContainer);
        }
        specialAntsContainer.innerHTML = "";

        // ✅ Ensure page is fully rendered before positioning special ants
        setTimeout(() => {
            positionSpecialAntsContainer();

            // ✅ Special left ant (starts at position 0, facing right)
            let leftAnt = document.createElement("div");
            leftAnt.className = "special-ant";
            leftAnt.textContent = "▶";
            leftAnt.style.left = "0px";
            specialAntsContainer.appendChild(leftAnt);

            // ✅ Special right ant (starts at max position, facing left)
            let rightAnt = document.createElement("div");
            rightAnt.className = "special-ant";
            rightAnt.textContent = "◀";
            rightAnt.style.left = `${stickWidth - antSize}px`;
            specialAntsContainer.appendChild(rightAnt);

            // ✅ Store special ants for movement
            specialAnts = [
                { element: leftAnt, position: 0, direction: 1 }, // Left ant moves right
                { element: rightAnt, position: stickWidth - antSize, direction: -1 } // Right ant moves left
            ];

            updateRemainingAnts();
            startTimer();
            moveAnts();
        }, 50); // ✅ Small delay ensures proper alignment on first load
    }

    function moveAnts() {
        let lastUpdateTime = performance.now();

        let moveInterval = setInterval(() => {
            let currentTime = performance.now();
            let elapsedTime = (currentTime - lastUpdateTime) / 1000;
            lastUpdateTime = currentTime;

            let distanceToMove = pixelsPerSecond * elapsedTime;

            // ✅ Step 1: Move All Random Ants at Constant Speed
            ants.forEach(ant => {
                ant.position += ant.direction * distanceToMove;
                ant.element.style.left = `${ant.position}px`;
            });

            // ✅ Step 2: Move Special Ants and Handle Their Collision
            if (specialAnts.length === 2) {
                let leftAnt = specialAnts[0];
                let rightAnt = specialAnts[1];

                leftAnt.position += leftAnt.direction * distanceToMove;
                rightAnt.position += rightAnt.direction * distanceToMove;

                leftAnt.element.style.left = `${leftAnt.position}px`;
                rightAnt.element.style.left = `${rightAnt.position}px`;

                // ✅ Fix collision detection and swapping logic
                if (Math.abs(leftAnt.position - rightAnt.position) <= antSize) {
                    [leftAnt.direction, rightAnt.direction] = [rightAnt.direction, leftAnt.direction];

                    leftAnt.element.textContent = leftAnt.direction === -1 ? "◀" : "▶";
                    rightAnt.element.textContent = rightAnt.direction === -1 ? "◀" : "▶";
                }
            }
        }, 50);
    }

    window.onload = () => {
        resetSimulation();
    }; 

    function updateRemainingAnts() {
        let totalAnts = numAnts + 2; // ✅ Add 2 special ants to total count
        let remainingAnts = ants.length + specialAnts.length; // ✅ Count remaining normal + special ants
        remainingAntsDisplay.textContent = `${remainingAnts}/${totalAnts}`;
    }

    function startTimer() {
        let maxTime = (stickWidth / pixelsPerSecond).toFixed(2); // ✅ Max time based on stick width
    
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            let elapsed = (performance.now() - startTime) / 1000;
    
            // ✅ Only update timer if normal ants are still on the stick
            if (ants.length > 0) {
                timerDisplay.textContent = `${elapsed.toFixed(2)} / ${maxTime}`;
            } else {
                clearInterval(timerInterval);
                timerDisplay.textContent = `${elapsed.toFixed(2)} / ${maxTime}`; // ✅ Now correctly stops at real elapsed time
            }
        }, 100);
    }    

    function stopTimer() {
        clearInterval(timerInterval);
    }

    resetSimulation();
});
