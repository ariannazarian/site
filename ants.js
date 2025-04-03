document.addEventListener("DOMContentLoaded", function () {
    const stick = document.getElementById("stick");
    const remainingAntsDisplay = document.getElementById("remaining-ants");
    const timerDisplay = document.getElementById("timer");
    const antsSection = document.getElementById("ants-on-line");
    const antsTitle = document.getElementById("ants-title");
    const antsArrow = document.getElementById("ants-arrow");

    let pixelsPerSecond = 20;
    let maxStickWidth = 500;
    let stickWidth = Math.min(window.innerWidth * 0.9, maxStickWidth);
    let maxAnts = 50;
    let antSize = 5;

    let numAnts = Math.min(maxAnts, Math.floor(stickWidth / (maxStickWidth / maxAnts)));
    let ants = [];
    let specialAnts = [];
    let startTime = null;
    let timerInterval = null;
    let moveInterval = null;

    stick.style.width = `${stickWidth}px`;

    function resetSimulation() {
        clearInterval(timerInterval);
        clearInterval(moveInterval);
        stopTimer();

        stick.innerHTML = "";
        ants = [];
        specialAnts = [];
        startTime = performance.now();

        requestAnimationFrame(() => {
            setTimeout(() => {
                let stickRect = stick.getBoundingClientRect();
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

                // Special ants
                let leftAnt = document.createElement("div");
                leftAnt.className = "special-ant left";
                leftAnt.textContent = "▶";
                leftAnt.style.left = "0px";
                specialAntsContainer.appendChild(leftAnt);

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
            }, 100);
        });
    }

    function moveAnts() {
        let lastUpdateTime = performance.now();
        let lastCollisionTime = 0;
        const EPSILON = 0.1;

        moveInterval = setInterval(() => {
            let currentTime = performance.now();
            let elapsedTime = (currentTime - lastUpdateTime) / 1000;
            lastUpdateTime = currentTime;

            let distanceToMove = pixelsPerSecond * elapsedTime;

            ants.forEach(ant => {
                ant.position += ant.direction * distanceToMove;
                ant.element.style.left = `${ant.position}px`;
            });

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
                    if (now - lastCollisionTime > 100) {
                        lastCollisionTime = now;

                        [leftAnt.direction, rightAnt.direction] = [rightAnt.direction, leftAnt.direction];
                        leftAnt.element.textContent = leftAnt.direction === -1 ? "◀" : "▶";
                        rightAnt.element.textContent = rightAnt.direction === -1 ? "◀" : "▶";

                        leftAnt.element.classList.add("flash");
                        rightAnt.element.classList.add("flash");
                        setTimeout(() => {
                            leftAnt.element.classList.remove("flash");
                            rightAnt.element.classList.remove("flash");
                        }, 100);
                    }
                }
            }

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

            let prevCount = ants.length + specialAnts.length;
            ants = removeAnts(ants);
            specialAnts = removeAnts(specialAnts);

            if (ants.length + specialAnts.length !== prevCount) {
                updateRemainingAnts();
            }

            if (ants.length === 0 && specialAnts.length === 0) {
                clearInterval(moveInterval);
                stopTimer();
                updateRemainingAnts();
            }

            let elapsed = (performance.now() - startTime) / 1000;
            if (elapsed > stickWidth / pixelsPerSecond + 1) {
                console.warn("⚠️ Simulation running longer than theoretical max time");
            }
        }, 50);
    }

    function updateRemainingAnts() {
        let totalAnts = numAnts + 2;
        let remainingAnts = ants.length + specialAnts.length;
        remainingAntsDisplay.textContent = `${remainingAnts}/${totalAnts}`;
    }

    function startTimer() {
        let maxTime = (stickWidth / pixelsPerSecond).toFixed(2);
        clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            let elapsed = (performance.now() - startTime) / 1000;
            if (ants.length === 0 && specialAnts.length === 0) {
                clearInterval(timerInterval);
                return;
            }
            timerDisplay.textContent = `${elapsed.toFixed(2)} / ${maxTime}`;
        }, 100);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    // Toggle behavior
    if (antsTitle && antsSection && antsArrow) {
        antsTitle.addEventListener("click", () => {
            const isHidden = antsSection.classList.toggle("hidden");
            antsTitle.setAttribute("aria-expanded", String(!isHidden));
            antsArrow.textContent = isHidden ? "▼" : "▲";
            antsArrow.classList.remove("blink-arrow");

            if (!isHidden) {
                resetSimulation(); // Start when shown
            } else {
                clearInterval(moveInterval);
                stopTimer();
                stick.innerHTML = "";
                document.getElementById("special-ants").innerHTML = "";
                remainingAntsDisplay.textContent = "0";
                timerDisplay.textContent = "0.00 / 0.00";
            }
        });
    }

    // Allow manual restart on click (after sim ends)
    antsSection.addEventListener("click", () => {
        if (ants.length === 0 && specialAnts.length === 0) {
            resetSimulation();
        }
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const antsTitle = document.getElementById("ants-title");
    const antsArrow = document.getElementById("ants-arrow");
    const antsSection = document.getElementById("ants-on-line");

    if (antsTitle && antsSection && antsArrow) {
        antsTitle.addEventListener("click", () => {
            const isHidden = antsSection.classList.toggle("hidden");

            // Update aria-expanded
            antsTitle.setAttribute("aria-expanded", String(!isHidden));

            // Change arrow direction and stop blinking after first click
            antsArrow.textContent = isHidden ? "▼" : "▲";
            antsArrow.classList.remove("blink-arrow");
        });
    }
});
