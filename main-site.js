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
        }, 10); // Small delay to ensure the reflow applies
    }

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
    let antSize = 5; // Ensuring visible size is correct

    // ✅ Scale normal ants properly while adding 2 for special ants
    let numAnts = Math.min(maxAnts, Math.floor(stickWidth / (maxStickWidth / maxAnts)));
    let ants = [];
    let specialAnts = [];
    let startTime = null;
    let timerInterval = null;

    // ✅ Ensure stick visually matches the simulation
    stick.style.width = `${stickWidth}px`;

    function resetSimulation() {
        stick.innerHTML = "";
        ants = [];
        specialAnts = [];
        startTime = performance.now();
    
        // Wait for layout to stabilize (mobile-safe)
        requestAnimationFrame(() => {
            setTimeout(() => {
                let stickRect = stick.getBoundingClientRect();
    
                // Ensure special ants container
                let specialAntsContainer = document.getElementById("special-ants");
                if (!specialAntsContainer) {
                    specialAntsContainer = document.createElement("div");
                    specialAntsContainer.id = "special-ants";
                    document.body.appendChild(specialAntsContainer);
                }
                specialAntsContainer.innerHTML = "";
                specialAntsContainer.style.position = "absolute";
                specialAntsContainer.style.left = `${stickRect.left}px`;
                specialAntsContainer.style.width = `${stickWidth}px`;
                specialAntsContainer.style.top = `${stickRect.bottom + 5}px`;
    
                // 🐜 Spawn random ants above the line
                for (let i = 0; i < numAnts; i++) {
                    let position = Math.random() * (stickWidth - antSize);
                    let direction = Math.random() < 0.5 ? -1 : 1;
                    let symbol = direction === -1 ? "◀" : "▶";
    
                    let ant = document.createElement("div");
                    ant.className = "ant";
                    ant.textContent = symbol;
                    ant.style.left = `${position}px`;
                    stick.appendChild(ant);
    
                    ants.push({ element: ant, position, direction });
                }
    
                // 🧭 Special left ant (cyan, starts at 0)
                let leftAnt = document.createElement("div");
                leftAnt.className = "special-ant left";
                leftAnt.textContent = "▶";
                leftAnt.style.left = "0px";
                specialAntsContainer.appendChild(leftAnt);
    
                // 🔴 Special right ant (red, starts at max)
                let rightAnt = document.createElement("div");
                rightAnt.className = "special-ant right";
                rightAnt.textContent = "◀";
                rightAnt.style.left = `${stickWidth - antSize}px`;
                specialAntsContainer.appendChild(rightAnt);
    
                specialAnts = [
                    { element: leftAnt, position: 0, direction: 1 },
                    { element: rightAnt, position: stickWidth - antSize, direction: -1 }
                ];
    
                updateRemainingAnts();
                startTimer();
                moveAnts();
            }, 100); // Slightly longer delay for mobile layout stability
        });
    }    
    

    function moveAnts() {
        let lastUpdateTime = performance.now();
        let lastCollisionTime = 0;
        const EPSILON = 0.1;
    
        let moveInterval = setInterval(() => {
            let currentTime = performance.now();
            let elapsedTime = (currentTime - lastUpdateTime) / 1000;
            lastUpdateTime = currentTime;
    
            let distanceToMove = pixelsPerSecond * elapsedTime;
    
            // Move random ants
            ants.forEach(ant => {
                ant.position += ant.direction * distanceToMove;
                ant.element.style.left = `${ant.position}px`;
            });
    
            // Move special ants
            if (specialAnts.length === 2) {
                let leftAnt = specialAnts[0];
                let rightAnt = specialAnts[1];
    
                leftAnt.position += leftAnt.direction * distanceToMove;
                rightAnt.position += rightAnt.direction * distanceToMove;
    
                leftAnt.element.style.left = `${leftAnt.position}px`;
                rightAnt.element.style.left = `${rightAnt.position}px`;
    
                let collisionThreshold = Math.max(antSize / 2, distanceToMove * 1.1);
                if (Math.abs(leftAnt.position - rightAnt.position) <= collisionThreshold) {
                    let now = performance.now();
                    if (now - lastCollisionTime > 100) { // Cooldown to prevent bounce loops
                        lastCollisionTime = now;
    
                        [leftAnt.direction, rightAnt.direction] = [rightAnt.direction, leftAnt.direction];
                        leftAnt.element.textContent = leftAnt.direction === -1 ? "◀" : "▶";
                        rightAnt.element.textContent = rightAnt.direction === -1 ? "◀" : "▶";
    
                        // Flash yellow
                        leftAnt.element.classList.add("flash");
                        rightAnt.element.classList.add("flash");
                        setTimeout(() => {
                            leftAnt.element.classList.remove("flash");
                            rightAnt.element.classList.remove("flash");
                        }, 100);
                    }
                }
            }
    
            // Remove ants when they fall off
            let prevCount = ants.length + specialAnts.length;
            function removeAnts(array) {
                return array.filter(ant => {
                    if (
                        (ant.direction === -1 && ant.position + antSize <= 0 + EPSILON) ||
                        (ant.direction === 1 && ant.position >= stickWidth - EPSILON)
                    ) {
                        ant.element.remove();
                        return false;
                    }
                    return true;
                });
            }
    
            ants = removeAnts(ants);
            specialAnts = removeAnts(specialAnts);
    
            if (ants.length + specialAnts.length !== prevCount) {
                updateRemainingAnts();
            }
    
            // Stop timer and animation when complete
            if (ants.length === 0 && specialAnts.length === 0) {
                clearInterval(moveInterval);
                stopTimer();
                updateRemainingAnts();
            }
    
            // Debug: check for overrun
            let elapsed = (performance.now() - startTime) / 1000;
            if (elapsed > stickWidth / pixelsPerSecond + 1) {
                console.warn("⚠️ Simulation running longer than theoretical max time");
            }
        }, 50);
    }
    
    

    function updateRemainingAnts() {
        let totalAnts = numAnts + 2; // ✅ Add 2 special ants to total count
        let remainingAnts = ants.length + specialAnts.length; // ✅ Count remaining normal + special ants
        remainingAntsDisplay.textContent = `${remainingAnts}/${totalAnts}`;
    }

    function startTimer() {
        let maxTime = (stickWidth / pixelsPerSecond).toFixed(2);
    
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            let elapsed = (performance.now() - startTime) / 1000;
    
            if (ants.length === 0) {
                clearInterval(timerInterval);
                return; // 🔹 Prevent unnecessary updates
            }
    
            timerDisplay.textContent = `${elapsed.toFixed(2)} / ${maxTime}`;
        }, 100);
    }
    

    function stopTimer() {
        clearInterval(timerInterval);
    }

    resetSimulation();

    // 🖱️ Allow restarting simulation on click, but only after it's finished
    document.getElementById("ants-on-line").addEventListener("click", () => {
        if (ants.length === 0 && specialAnts.length === 0) {
            resetSimulation();
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const targets = {
      'link-personal': document.querySelector('#link-personal'),
      'link-work': document.querySelector('#link-work'),
      'label-ariann': document.querySelector('#label-ariann'),
      'label-usc': document.querySelector('#label-usc'),
      'label-edu': document.querySelector('#label-edu'),
      'header-img': document.querySelector('#header-img')
    };
  
    const unclicked = new Set(Object.keys(targets));
    let lastAnimated = null;
    let secondLastAnimated = null;
    const animationDuration = 1200;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
    for (const [id, element] of Object.entries(targets)) {
      if (element) {
        element.addEventListener('click', () => {
          unclicked.delete(id);
        });
      }
    }
  
    const animateRandom = () => {
      if (unclicked.size === 0) return;
  
      const unclickedArray = Array.from(unclicked);
      let candidates = [...unclickedArray];
  
      if (unclickedArray.length > 2) {
        candidates = candidates.filter(id => id !== lastAnimated && id !== secondLastAnimated);
      } else if (unclickedArray.length === 2 && lastAnimated !== null) {
        candidates = candidates.filter(id => id !== lastAnimated);
      }
  
      if (candidates.length === 0) {
        candidates = unclickedArray;
        lastAnimated = null;
        secondLastAnimated = null;
      }
  
      const randomId = candidates[Math.floor(Math.random() * candidates.length)];
      const element = targets[randomId];
      if (!element) return;
  
      element.classList.remove('wiggle', 'reduced-text');
      void element.offsetWidth;
  
      if (!prefersReduced) {
        element.classList.add('wiggle');
      }
  
      if (prefersReduced) {
        if (element.id === 'header-img') {
          const container = element.parentElement;
          container.style.position = 'relative';
  
          const sectionCount = 6;
          const stepDelay = 40;         // 40ms per section
          const fadeDuration = 300;     // fade-in duration
          const totalHoldTime = 1800;   // total display time from start
  
          for (let i = 0; i < sectionCount; i++) {
            const overlay = document.createElement('div');
            overlay.className = `highlight-overlay step-${i + 1}`;
            overlay.style.left = `${i * (100 / sectionCount)}%`;
            overlay.style.width = `${100 / sectionCount}%`;
            overlay.style.animationDelay = `${i * stepDelay}ms`;
            overlay.style.animationDuration = `${fadeDuration}ms`;
            overlay.style.animationFillMode = 'forwards';
            container.appendChild(overlay);
          }
  
          setTimeout(() => {
            const overlays = container.querySelectorAll('.highlight-overlay');
            overlays.forEach(overlay => overlay.remove());
          }, totalHoldTime);
  
        } else {
          const originalText = element.textContent;
          const chars = [...originalText];
  
          element.innerHTML = '';
          chars.forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.animationDelay = `${i * 40}ms`;
            element.appendChild(span);
          });
  
          element.classList.add('reduced-text');
          void element.offsetWidth;
        }
      }
  
      const cleanupTime = prefersReduced ? 1800 : animationDuration;
  
      setTimeout(() => {
        element.classList.remove('wiggle', 'reduced-text');
        if (prefersReduced && element.id !== 'header-img') {
          element.textContent = element.textContent;
        }
      }, cleanupTime);
  
      secondLastAnimated = lastAnimated;
      lastAnimated = randomId;
    };
  
    setTimeout(() => {
      animateRandom();
      setInterval(animateRandom, 3300);
    }, 3800);
  });
  