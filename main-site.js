document.addEventListener("DOMContentLoaded", function () {
    const preventDefault = event => event.preventDefault();
    const devToolsKeys = ["i", "j", "c"];

    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("selectstart", preventDefault);
    document.addEventListener("dragstart", preventDefault);
    document.addEventListener("copy", preventDefault);
    document.addEventListener("cut", preventDefault);
    document.addEventListener("keydown", event => {
        const key = event.key.toLowerCase();
        const viewSourceShortcut =
            (event.ctrlKey && key === "u") ||
            (event.metaKey && event.altKey && key === "u");
        const devToolsShortcut =
            event.key === "F12" ||
            (event.ctrlKey && event.shiftKey && devToolsKeys.includes(key)) ||
            (event.metaKey && event.altKey && devToolsKeys.includes(key)) ||
            (event.metaKey && event.shiftKey && key === "c");
        const saveShortcut =
            (event.ctrlKey || event.metaKey) && key === "s";

        if (viewSourceShortcut || devToolsShortcut || saveShortcut) {
            event.preventDefault();
        }
    });

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
            new Image().src = activeImages[nextIndex];
        }

        imgElement.addEventListener("click", function () {
            currentIndex = (currentIndex + 1) % activeImages.length;
            imgElement.src = activeImages[currentIndex];
            preloadNextImage();
        });

        preloadNextImage();
    }

    const homePopupPairs = [
        ["popup-ariann", "popup-ariann-box"],
        ["popup-usc", "popup-usc-box"],
        ["popup-edu", "popup-edu-box"]
    ];
    const popupRadios = document.querySelectorAll(".popup-radio");

    if (popupRadios.length) {
        const syncHomePopupAria = () => {
            homePopupPairs.forEach(([radioId, popupId]) => {
                const radio = document.getElementById(radioId);
                const popup = document.getElementById(popupId);
                if (radio && popup) {
                    popup.setAttribute("aria-hidden", radio.checked ? "false" : "true");
                }
            });
        };

        popupRadios.forEach(radio => {
            radio.addEventListener("change", syncHomePopupAria);
        });
        syncHomePopupAria();
    }

    if (document.body.classList.contains("personal-page")) {
        setupVideoHandling();
    }
});

function loadVideo(el, videoId) {
    if (!videoId) {
        console.error("No valid video ID found.");
        return;
    }

    document.querySelectorAll(".video-thumbnail").forEach(thumbnail => {
        if (thumbnail !== el && thumbnail.dataset.originalContent) {
            thumbnail.innerHTML = thumbnail.dataset.originalContent;
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

function setVideoExpanded(videoContainer, expanded) {
    videoContainer.classList.toggle("hidden", !expanded);
    videoContainer.style.display = expanded ? "block" : "none";
}

function resetVideoPlayback(videoContainer) {
    const iframe = videoContainer.querySelector("iframe");
    if (iframe) {
        iframe.parentNode.innerHTML = iframe.parentNode.innerHTML;
    }
}

function toggleVideo(index) {
    const videos = document.querySelectorAll(".video-container");
    const arrows = document.querySelectorAll(".toggle-arrow");
    const videoTitles = document.querySelectorAll(".video-title");
    const videoContainer = videos[index];
    const arrow = arrows[index];
    const title = videoTitles[index];
    const isExpanded = !videoContainer.classList.contains("hidden");

    setVideoExpanded(videoContainer, !isExpanded);
    if (isExpanded) {
        resetVideoPlayback(videoContainer);
    }

    arrow.textContent = isExpanded ? "▼" : "▲";
    arrow.classList.remove("blink-arrow");
    arrow.style.animation = "none";
    title.setAttribute("aria-expanded", String(!isExpanded));
}

function setupVideoHandling() {
    const sectionTitle = document.getElementById("short-films-title");
    const sectionArrow = document.getElementById("short-films-arrow");
    const sectionContent = document.getElementById("short-films-content");
    const videoContainers = document.querySelectorAll(".video-container");
    const videoTitles = document.querySelectorAll(".video-title");
    const arrows = document.querySelectorAll(".toggle-arrow");

    videoContainers.forEach(videoContainer => {
        setVideoExpanded(videoContainer, false);
    });

    videoTitles.forEach(title => {
        title.setAttribute("aria-expanded", "false");
        title.addEventListener("click", function () {
            toggleVideo(parseInt(this.dataset.index, 10));
        });
    });

    document.querySelectorAll(".video-thumbnail").forEach(thumbnail => {
        thumbnail.dataset.originalContent = thumbnail.innerHTML;
        thumbnail.addEventListener("click", function () {
            loadVideo(this, this.dataset.videoId);
        });
    });

    if (sectionTitle) {
        sectionTitle.addEventListener("click", function () {
            const isHidden = sectionContent.classList.toggle("hidden");
            sectionArrow.textContent = isHidden ? "▼" : "▲";
            sectionArrow.classList.remove("blink-arrow");

            if (isHidden) {
                videoContainers.forEach(videoContainer => {
                    setVideoExpanded(videoContainer, false);
                    resetVideoPlayback(videoContainer);
                });
                arrows.forEach(arrow => {
                    arrow.textContent = "▼";
                });
                videoTitles.forEach(title => {
                    title.setAttribute("aria-expanded", "false");
                });
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const antsTitle = document.getElementById("ants-title");
    const antsArrow = document.getElementById("ants-arrow");
    const antsContent = document.getElementById("ants-content");
    const antsSection = document.getElementById("ants-on-line");
    const stick = document.getElementById("stick");
    const specialAntsContainer = document.getElementById("special-ants");
    const remainingAntsDisplay = document.getElementById("remaining-ants");
    const timerDisplay = document.getElementById("timer");
    if (
        !antsTitle || !antsArrow || !antsContent || !antsSection ||
        !stick || !specialAntsContainer || !remainingAntsDisplay || !timerDisplay
    ) {
        return;
    }

    const pixelsPerSecond = 20;
    const maxStickWidth = 500;
    const maxAnts = 50;

    let stickWidth = 0;
    let numAnts = 0;
    let ants = [];
    let specialAnts = [];
    let startTime = null;
    let whiteCompletionTime = 0;
    let theoreticalMaxTime = 0;
    let timerInterval = null;
    let moveInterval = null;
    let collisionFlashTimeout = null;
    let specialCollisionFlashed = false;
    let simulationComplete = false;
    let hasToggledAntsOnce = false;

    function stopTimer() {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function stopMovement() {
        if (moveInterval !== null) {
            clearInterval(moveInterval);
            moveInterval = null;
        }
    }

    function stopCollisionFlash() {
        if (collisionFlashTimeout !== null) {
            clearTimeout(collisionFlashTimeout);
            collisionFlashTimeout = null;
        }
    }

    function stopAndClearSimulation() {
        stopMovement();
        stopTimer();
        stopCollisionFlash();

        stick.querySelectorAll(".ant").forEach(ant => ant.remove());
        specialAntsContainer.replaceChildren();

        ants = [];
        specialAnts = [];
        startTime = null;
        whiteCompletionTime = 0;
        theoreticalMaxTime = 0;
        specialCollisionFlashed = false;
        simulationComplete = false;
        antsSection.classList.remove("is-resettable");

        remainingAntsDisplay.textContent = "0";
        timerDisplay.textContent = "0.00";
    }

    function updateRemainingAnts() {
        remainingAntsDisplay.textContent = `${ants.length}/${numAnts}`;
    }

    function startTimer() {
        const maxTimeText = theoreticalMaxTime.toFixed(2);
        timerDisplay.textContent = `0.00 / ${maxTimeText}`;

        stopTimer();
        timerInterval = setInterval(() => {
            if (startTime === null) {
                return;
            }

            const elapsed = (performance.now() - startTime) / 1000;
            if (elapsed >= whiteCompletionTime) {
                timerDisplay.textContent = `${whiteCompletionTime.toFixed(2)} / ${maxTimeText}`;
                stopTimer();
                return;
            }

            timerDisplay.textContent = `${elapsed.toFixed(2)} / ${maxTimeText}`;
        }, 100);
    }

    function randomOpenUnit() {
        let value = Math.random();
        while (value === 0) {
            value = Math.random();
        }
        return value;
    }

    function flashSpecialAnts(leftAnt, rightAnt) {
        if (specialCollisionFlashed) {
            return;
        }

        specialCollisionFlashed = true;
        leftAnt.element.classList.add("flash");
        rightAnt.element.classList.add("flash");

        stopCollisionFlash();
        collisionFlashTimeout = setTimeout(() => {
            leftAnt.element.classList.remove("flash");
            rightAnt.element.classList.remove("flash");
            collisionFlashTimeout = null;
        }, 100);
    }

    function moveAnts() {
        stopMovement();
        moveInterval = setInterval(() => {
            if (startTime === null) {
                return;
            }

            const elapsed = (performance.now() - startTime) / 1000;
            let whiteCountChanged = false;
            ants = ants.filter(ant => {
                if (elapsed >= ant.exitTime) {
                    ant.element.remove();
                    whiteCountChanged = true;
                    return false;
                }

                ant.position = ant.startPosition + ant.direction * pixelsPerSecond * elapsed;
                ant.element.style.left = `${ant.position}px`;
                return true;
            });

            if (whiteCountChanged) {
                updateRemainingAnts();
                if (ants.length === 0) {
                    timerDisplay.textContent = `${whiteCompletionTime.toFixed(2)} / ${theoreticalMaxTime.toFixed(2)}`;
                    stopTimer();
                }
            }
            if (specialAnts.length === 2) {
                const leftAnt = specialAnts[0];
                const rightAnt = specialAnts[1];
                const collisionTime = theoreticalMaxTime / 2;

                if (elapsed >= theoreticalMaxTime) {
                    leftAnt.element.style.left = "0px";
                    rightAnt.element.style.left = `${stickWidth}px`;
                    leftAnt.element.remove();
                    rightAnt.element.remove();
                    specialAnts = [];

                    stopMovement();
                    stopTimer();
                    updateRemainingAnts();
                    simulationComplete = true;
                    antsSection.classList.add("is-resettable");
                    return;
                }

                if (elapsed < collisionTime) {
                    leftAnt.position = pixelsPerSecond * elapsed;
                    rightAnt.position = stickWidth - pixelsPerSecond * elapsed;
                } else {
                    const sinceCollision = elapsed - collisionTime;

                    if (!specialCollisionFlashed) {
                        leftAnt.direction = -1;
                        rightAnt.direction = 1;
                        leftAnt.element.textContent = "◀";
                        rightAnt.element.textContent = "▶";
                        flashSpecialAnts(leftAnt, rightAnt);
                    }

                    leftAnt.position = stickWidth / 2 - pixelsPerSecond * sinceCollision;
                    rightAnt.position = stickWidth / 2 + pixelsPerSecond * sinceCollision;
                }

                leftAnt.element.style.left = `${leftAnt.position}px`;
                rightAnt.element.style.left = `${rightAnt.position}px`;
            }
        }, 50);
    }

    function startSimulation() {
        stopAndClearSimulation();

        stickWidth = Math.min(window.innerWidth * 0.9, maxStickWidth);
        numAnts = Math.max(1, Math.min(maxAnts, Math.floor(stickWidth / (maxStickWidth / maxAnts))));
        stick.style.width = `${stickWidth}px`;
        theoreticalMaxTime = stickWidth / pixelsPerSecond;

        for (let i = 0; i < numAnts; i++) {
            const position = randomOpenUnit() * stickWidth;
            const direction = Math.random() < 0.5 ? -1 : 1;
            const exitDistance = direction === -1 ? position : stickWidth - position;
            const exitTime = exitDistance / pixelsPerSecond;

            const ant = document.createElement("div");
            ant.className = "ant";
            ant.textContent = direction === -1 ? "◀" : "▶";
            ant.style.left = `${position}px`;
            stick.insertBefore(ant, specialAntsContainer);

            ants.push({
                element: ant,
                startPosition: position,
                position,
                direction,
                exitTime
            });
        }

        whiteCompletionTime = Math.max(...ants.map(ant => ant.exitTime));

        const leftAnt = document.createElement("div");
        leftAnt.className = "special-ant left";
        leftAnt.textContent = "▶";
        leftAnt.style.left = "0px";
        specialAntsContainer.appendChild(leftAnt);

        const rightAnt = document.createElement("div");
        rightAnt.className = "special-ant right";
        rightAnt.textContent = "◀";
        rightAnt.style.left = `${stickWidth}px`;
        specialAntsContainer.appendChild(rightAnt);

        specialAnts = [
            { element: leftAnt, position: 0, direction: 1 },
            { element: rightAnt, position: stickWidth, direction: -1 }
        ];

        specialCollisionFlashed = false;
        simulationComplete = false;
        startTime = performance.now();
        updateRemainingAnts();
        startTimer();
        moveAnts();
    }

    function toggleAnts() {
        const isOpen = antsTitle.getAttribute("aria-expanded") === "true";

        if (!hasToggledAntsOnce) {
            antsArrow.classList.remove("blink-arrow");
            hasToggledAntsOnce = true;
        }

        if (isOpen) {
            stopAndClearSimulation();
            antsContent.style.display = "none";
            antsArrow.textContent = "▼";
            antsTitle.setAttribute("aria-expanded", "false");
        } else {
            antsContent.style.display = "block";
            antsArrow.textContent = "▲";
            antsTitle.setAttribute("aria-expanded", "true");
            startSimulation();
        }
    }

    antsTitle.addEventListener("click", toggleAnts);

    antsSection.addEventListener("click", () => {
        if (simulationComplete) {
            startSimulation();
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const isIndexPage = document.body.id === "index-page";
    if (!isIndexPage) return;

    const targets = {
        "link-personal": document.querySelector("#link-personal"),
        "link-work": document.querySelector("#link-work"),
        "label-ariann": document.querySelector("#label-ariann"),
        "label-usc": document.querySelector("#label-usc"),
        "label-edu": document.querySelector("#label-edu"),
        "header-img": document.querySelector("#header-img")
    };

    const unclicked = new Set(Object.keys(targets));
    let lastAnimated = null;
    let secondLastAnimated = null;
    const animationDuration = 1200;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const [id, element] of Object.entries(targets)) {
        if (element) {
            element.addEventListener("click", () => {
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

        element.classList.remove("wiggle", "reduced-text");
        void element.offsetWidth;

        if (!prefersReduced) {
            element.classList.add("wiggle");
        }

        if (prefersReduced) {
            if (element.id === "header-img") {
                const container = element.parentElement;
                container.style.position = "relative";

                const sectionCount = 6;
                const stepDelay = 40;
                const fadeDuration = 300;
                const totalHoldTime = 1800;

                for (let i = 0; i < sectionCount; i++) {
                    const overlay = document.createElement("div");
                    overlay.className = `highlight-overlay step-${i + 1}`;
                    overlay.style.left = `${i * (100 / sectionCount)}%`;
                    overlay.style.width = `${100 / sectionCount}%`;
                    overlay.style.animationDelay = `${i * stepDelay}ms`;
                    overlay.style.animationDuration = `${fadeDuration}ms`;
                    overlay.style.animationFillMode = "forwards";
                    container.appendChild(overlay);
                }

                setTimeout(() => {
                    const overlays = container.querySelectorAll(".highlight-overlay");
                    overlays.forEach(overlay => overlay.remove());
                }, totalHoldTime);
            } else {
                const originalText = element.textContent;
                const chars = [...originalText];

                element.innerHTML = "";
                chars.forEach((char, i) => {
                    const span = document.createElement("span");
                    span.textContent = char;
                    span.style.animationDelay = `${i * 40}ms`;
                    element.appendChild(span);
                });

                element.classList.add("reduced-text");
                void element.offsetWidth;
            }
        }

        const cleanupTime = prefersReduced ? 1800 : animationDuration;

        setTimeout(() => {
            element.classList.remove("wiggle", "reduced-text");
            if (prefersReduced && element.id !== "header-img") {
                element.textContent = element.textContent;
            }
        }, cleanupTime);

        secondLastAnimated = lastAnimated;
        lastAnimated = randomId;
    };

    setTimeout(() => {
        animateRandom();
        setInterval(animateRandom, 5400);
    }, 9600);
});

document.addEventListener("DOMContentLoaded", function () {
    if (!document.body.classList.contains("personal-page")) return;

    const graphicsTitle = document.getElementById("graphics-title");
    const graphicsArrow = document.getElementById("graphics-arrow");
    const graphicsContent = document.getElementById("graphics-content");
    const fairUseTitle = document.getElementById("fair-use-title");
    const fairUseArrow = document.getElementById("fair-use-arrow");
    const fairUseContent = document.getElementById("fair-use-content");
    const modelIsTitle = document.getElementById("model-is-title");
    const modelIsArrow = document.getElementById("model-is-arrow");
    const modelIsContent = document.getElementById("model-is-content");
    const modelIsTyped = document.getElementById("model-is-typed");

    const fairUseItems = Array.from(document.querySelectorAll(".fair-use-item"));
    const popup = document.getElementById("fair-use-popup");
    const shield = document.getElementById("fair-use-shield");
    const art = document.getElementById("fair-use-art");
    const caption = document.getElementById("fair-use-caption");
    const previousButton = document.getElementById("fair-use-prev");
    const nextButton = document.getElementById("fair-use-next");
    const thumbnailContainer = document.getElementById("fair-use-thumbnails");
    const closeButton = document.getElementById("fair-use-close");

    if (
        !graphicsTitle || !graphicsArrow || !graphicsContent ||
        !fairUseTitle || !fairUseArrow || !fairUseContent ||
        !modelIsTitle || !modelIsArrow || !modelIsContent || !modelIsTyped ||
        fairUseItems.length === 0 || !popup || !shield || !art || !caption ||
        !previousButton || !nextButton || !thumbnailContainer || !closeButton
    ) {
        return;
    }

    const works = fairUseItems.map(item => ({
        base: item.dataset.base,
        title: item.dataset.title,
        year: item.dataset.year || ""
    }));

    let currentIndex = 0;
    let thumbnailsReady = false;
    let fairUseRevealStarted = false;
    let modelIsTypingStarted = false;
    const preloadedArtwork = new Set();
    const shirtRevealStaggerMs = 90;
    const modelIsTypingIntervalMs = 55;
    const modelIsMessage = "under construction";

    function activateWithKeyboard(element, action) {
        element.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                action();
            }
        });
    }

    function setPanel(title, arrow, content, open) {
        content.classList.toggle("hidden", !open);
        title.setAttribute("aria-expanded", open ? "true" : "false");
        arrow.textContent = open ? "▲" : "▼";
    }

    function toggleGraphics() {
        const opening = graphicsTitle.getAttribute("aria-expanded") !== "true";
        graphicsArrow.classList.remove("blink-arrow");
        setPanel(graphicsTitle, graphicsArrow, graphicsContent, opening);

        if (!opening) {
            setPanel(fairUseTitle, fairUseArrow, fairUseContent, false);
            setPanel(modelIsTitle, modelIsArrow, modelIsContent, false);
        }
    }

    function wait(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    function waitForInitialShirtPaint() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
    }

    function prepareShirtImage(item) {
        const image = item.querySelector("img[data-src]");
        if (!image) {
            return Promise.resolve(false);
        }

        const source = image.dataset.src;
        if (!source) {
            return Promise.resolve(false);
        }

        return new Promise(resolve => {
            let settled = false;

            const finish = success => {
                if (settled) return;
                settled = true;
                image.removeEventListener("load", handleLoad);
                image.removeEventListener("error", handleError);
                resolve(success);
            };

            const handleLoad = async () => {
                if (typeof image.decode === "function") {
                    try {
                        await image.decode();
                    } catch (_) {
                    }
                }
                finish(image.naturalWidth > 0);
            };

            const handleError = () => finish(false);

            image.addEventListener("load", handleLoad);
            image.addEventListener("error", handleError);
            image.src = source;
            image.removeAttribute("data-src");
            if (image.complete) {
                queueMicrotask(() => {
                    if (settled) return;
                    if (image.naturalWidth > 0) {
                        handleLoad();
                    } else {
                        handleError();
                    }
                });
            }
        });
    }

    async function revealFairUseShirtsOnce() {
        if (fairUseRevealStarted) return;
        fairUseRevealStarted = true;
        const readiness = fairUseItems.map(prepareShirtImage);
        await waitForInitialShirtPaint();

        let lastRevealAt = null;

        for (let index = 0; index < fairUseItems.length; index += 1) {
            const loaded = await readiness[index];
            if (!loaded) continue;

            if (lastRevealAt !== null) {
                const elapsed = performance.now() - lastRevealAt;
                if (elapsed < shirtRevealStaggerMs) {
                    await wait(shirtRevealStaggerMs - elapsed);
                }
            }

            fairUseItems[index].classList.add("is-revealed");
            lastRevealAt = performance.now();
        }
    }

    function toggleFairUse() {
        const opening = fairUseTitle.getAttribute("aria-expanded") !== "true";
        fairUseArrow.classList.remove("blink-arrow");
        setPanel(fairUseTitle, fairUseArrow, fairUseContent, opening);

        if (opening) {
            revealFairUseShirtsOnce();
        }
    }

    async function typeModelIsOnce() {
        if (modelIsTypingStarted) return;
        modelIsTypingStarted = true;

        modelIsTyped.textContent = "";
        modelIsTyped.classList.remove("is-complete");
        for (const character of modelIsMessage) {
            await wait(modelIsTypingIntervalMs);
            modelIsTyped.textContent += character;
        }

        modelIsTyped.classList.add("is-complete");
    }

    function toggleModelIs() {
        const opening = modelIsTitle.getAttribute("aria-expanded") !== "true";
        modelIsArrow.classList.remove("blink-arrow");
        setPanel(modelIsTitle, modelIsArrow, modelIsContent, opening);

        if (opening) {
            typeModelIsOnce();
        }
    }

    graphicsTitle.addEventListener("click", toggleGraphics);
    fairUseTitle.addEventListener("click", toggleFairUse);
    modelIsTitle.addEventListener("click", toggleModelIs);
    activateWithKeyboard(graphicsTitle, toggleGraphics);
    activateWithKeyboard(fairUseTitle, toggleFairUse);
    activateWithKeyboard(modelIsTitle, toggleModelIs);

    function fullArtworkPath(work) {
        return `assets/images/${work.base}.webp`;
    }

    function thumbnailPath(work) {
        return `assets/images/${work.base}-thumb.webp`;
    }

    function updateCaption(work) {
        const title = document.createElement("em");
        title.textContent = work.title;
        caption.replaceChildren(title);
        if (work.year) {
            caption.appendChild(document.createTextNode(`, ${work.year}`));
        }
    }

    function buildThumbnails() {
        if (thumbnailsReady) return;

        works.forEach((work, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "fair-use-thumb";
            button.setAttribute("aria-label", `View ${work.title}`);

            const image = document.createElement("img");
            image.src = thumbnailPath(work);
            image.alt = `${work.title} gallery thumbnail`;
            image.loading = "lazy";
            image.decoding = "async";
            image.draggable = false;

            button.appendChild(image);
            button.addEventListener("click", () => {
                if (index !== currentIndex) showWork(index);
            });
            thumbnailContainer.appendChild(button);
        });

        thumbnailsReady = true;
    }

    function updateActiveThumbnail() {
        if (!thumbnailsReady) return;

        Array.from(thumbnailContainer.children).forEach((button, index) => {
            const active = index === currentIndex;
            button.classList.toggle("is-active", active);
            if (active) {
                button.setAttribute("aria-current", "true");
            } else {
                button.removeAttribute("aria-current");
            }
        });
    }

    function preloadArtwork(index) {
        const normalizedIndex = (index + works.length) % works.length;
        const work = works[normalizedIndex];
        const path = fullArtworkPath(work);

        if (preloadedArtwork.has(path)) return;
        preloadedArtwork.add(path);
        const image = new Image();
        image.src = path;
    }

    function preloadAdjacentArtwork() {
        preloadArtwork(currentIndex - 1);
        preloadArtwork(currentIndex + 1);
    }

    function showWork(index) {
        currentIndex = (index + works.length) % works.length;
        const work = works[currentIndex];

        art.src = fullArtworkPath(work);
        art.alt = `${work.title} graphic`;
        updateCaption(work);
        updateActiveThumbnail();
        preloadAdjacentArtwork();
    }

    function openPopup(index) {
        buildThumbnails();
        showWork(index);
        popup.setAttribute("aria-hidden", "false");
        shield.classList.add("is-active");
    }

    function closePopup() {
        popup.setAttribute("aria-hidden", "true");
        shield.classList.remove("is-active");
        art.style.cursor = "default";
    }

    function showPrevious() {
        showWork(currentIndex - 1);
    }

    function showNext() {
        showWork(currentIndex + 1);
    }

    fairUseItems.forEach((item, index) => {
        item.addEventListener("click", () => openPopup(index));
    });

    previousButton.addEventListener("click", showPrevious);
    nextButton.addEventListener("click", showNext);
    closeButton.addEventListener("click", closePopup);
    art.addEventListener("click", event => {
        if (popup.getAttribute("aria-hidden") !== "false") return;

        const rect = art.getBoundingClientRect();
        if (rect.width === 0) return;
        const position = (event.clientX - rect.left) / rect.width;

        if (position < 0.47) {
            showPrevious();
        } else if (position > 0.53) {
            showNext();
        }
    });
    art.addEventListener("mousemove", event => {
        const rect = art.getBoundingClientRect();
        if (rect.width === 0) return;
        const position = (event.clientX - rect.left) / rect.width;
        art.style.cursor = position < 0.47 || position > 0.53 ? "pointer" : "default";
    });

    art.addEventListener("mouseleave", () => {
        art.style.cursor = "default";
    });

    document.addEventListener("keydown", event => {
        if (popup.getAttribute("aria-hidden") !== "false") return;

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            showPrevious();
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            showNext();
        }
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    const fairUsePopup = document.getElementById("fair-use-popup");
    const fairUseClose = document.getElementById("fair-use-close");
    if (fairUsePopup && fairUsePopup.getAttribute("aria-hidden") === "false" && fairUseClose) {
        event.preventDefault();
        fairUseClose.click();
        return;
    }

    const workPopup = document.getElementById("popup-years-box");
    const workClose = document.getElementById("popup-close");
    if (workPopup && workPopup.getAttribute("aria-hidden") === "false" && workClose) {
        event.preventDefault();
        workClose.click();
        return;
    }

    const popupReset = document.getElementById("popup-reset");
    if (popupReset && !popupReset.checked) {
        event.preventDefault();
        popupReset.checked = true;
        popupReset.dispatchEvent(new Event("change", { bubbles: true }));
    }
});
