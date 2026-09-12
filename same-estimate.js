"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const title = document.getElementById("same-estimate-title");
    const arrow = document.getElementById("same-estimate-arrow");
    const content = document.getElementById("same-estimate-content");
    const artwork = document.getElementById("same-estimate-artwork");
    const wrap = document.getElementById("same-estimate-wrap");
    const canvas = document.getElementById("same-estimate-canvas");

    if (!title || !arrow || !content || !artwork || !wrap || !canvas) {
        return;
    }

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
        return;
    }

    const ACCENT = "#007aff";
    const TOL = 1e-12;
    const TIE_TOL = 2e-12;
    const GRID_N = 120;
    const SCENARIO_STEPS = 15;

    const MODEL = Object.freeze({
        lambda: Object.freeze([0.5, 2.0, 8.0]),
        P: Object.freeze([
            Object.freeze([0.70, 0.30, 0.00]),
            Object.freeze([0.20, 0.75, 0.05]),
            Object.freeze([0.00, 0.30, 0.70])
        ]),
        rho: 1.0,
        eta: 0.8,
        alpha: 0.6,
        beta: 0.7
    });

    const SWITCHES = Object.freeze([
        0.5531911753186032,
        6.729133639083313
    ]);

    const GLOBAL_MAX = Object.freeze({
        m: 2.3804626434630194,
        pi: Object.freeze([0.749271647538264, 0.0, 0.2507283524617359]),
        R: 0.00010124584572835554
    });

    const CANONICAL = Object.freeze({
        certainMiddle: Object.freeze([0.0, 1.0, 0.0]),
        lowHigh: Object.freeze([0.8, 0.0, 0.2])
    });

    const CONTOURS = Object.freeze([
        1.0124584572835554e-05,
        2.5311461432088884e-05,
        5.062292286417777e-05,
        7.593438429626665e-05,
        9.112126115551999e-05,
        9.820847035650486e-05,
        0.00010073961649971376
    ]);

    const TIMING = Object.freeze({
        boundary: 600,
        field: 1050,
        canonical: 850,
        canonicalHold: 220,
        realizationFirst: 260,
        realizationStep: 280,
        preResidue: 320
    });

    let W = 0;
    let H = 0;
    let DPR = 1;
    let vertices = [];
    let traceBox = null;
    let fieldLayer = null;
    let screenNodes = [];
    let contourSegments = [];

    let gridValues = null;
    let gridIndex = null;
    let triangles = null;

    let mean = 2;
    let boundaryProgress = 0;
    let fieldReveal = 0;
    let fieldAlpha = 0;
    let fiberProgress = 1;
    let showGlobal = false;
    let showFiber = false;
    let showCanonical = false;
    let showPosterior = false;
    let showTrace = false;
    let phase = "idle";
    let phaseProgress = 0;
    let globalProgress = 0;
    let realizationProgress = 1;
    let completed = false;
    let active = false;
    let hasToggledOnce = false;

    let posterior = null;
    let posteriorPath = [];
    let playedEvents = [];
    let currentEvent = null;
    let currentSeed = 0;
    let scenario = [];

    let runToken = 0;
    let pendingTimers = new Set();
    let animationRaf = 0;
    let resizeTimer = 0;

    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));
    const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
    const matmulRow = (vector, matrix) => matrix[0].map((_, column) =>
        vector.reduce((sum, value, row) => sum + value * matrix[row][column], 0)
    );

    function normalizeBelief(pi) {
        if (!Array.isArray(pi) || pi.length !== 3 || pi.some(value => !Number.isFinite(value))) {
            throw new Error("Belief has invalid dimension or entries.");
        }
        if (pi.some(value => value < -1e-10) || Math.abs(pi.reduce((a, b) => a + b, 0) - 1) > 1e-10) {
            throw new Error("Belief must lie in the probability simplex.");
        }
        const clipped = pi.map(value => Math.max(0, Math.min(1, value)));
        const sum = clipped.reduce((a, b) => a + b, 0);
        return clipped.map(value => value / sum);
    }

    function meanImpact(pi) {
        return dot(normalizeBelief(pi), MODEL.lambda);
    }

    function predict(pi) {
        return matmulRow(normalizeBelief(pi), MODEL.P);
    }

    function observationMatrix() {
        const off = (1 - MODEL.eta) / 2;
        return [
            [MODEL.eta, off, off],
            [off, MODEL.eta, off],
            [off, off, MODEL.eta]
        ];
    }

    function posteriorAfterSignal(pi, signal) {
        if (!Number.isInteger(signal) || signal < 0 || signal > 2) {
            throw new Error("Signal index out of range.");
        }
        const predictive = predict(pi);
        const observation = observationMatrix();
        const weights = predictive.map((value, state) => value * observation[state][signal]);
        const probability = weights.reduce((a, b) => a + b, 0);
        if (probability <= TOL) {
            throw new Error("Requested signal has zero probability.");
        }
        return weights.map(value => value / probability);
    }

    function posteriorMeanDistribution(pi) {
        const predictive = predict(pi);
        const observation = observationMatrix();
        const output = [];

        for (let signal = 0; signal < 3; signal += 1) {
            const weights = predictive.map((value, state) => value * observation[state][signal]);
            const probability = weights.reduce((a, b) => a + b, 0);
            if (probability <= TOL) {
                continue;
            }
            const updated = weights.map(value => value / probability);
            output.push({
                probability,
                mean: dot(updated, MODEL.lambda)
            });
        }
        return output;
    }

    function gValue(x) {
        const A = MODEL.rho + MODEL.alpha;
        const denominator = A + (1 + MODEL.beta) * x;
        if (denominator <= 0) {
            throw new Error("Bellman denominator is nonpositive.");
        }
        return x * (A + MODEL.beta * x) / denominator;
    }

    function informationPremium(pi) {
        const m = meanImpact(pi);
        const mu = MODEL.alpha + MODEL.beta * m;
        let expected = 0;
        posteriorMeanDistribution(pi).forEach(row => {
            expected += row.probability * gValue(row.mean);
        });
        const J = gValue(mu) - expected;
        return Math.abs(J) < 5e-15 ? 0 : J;
    }

    function BValue(m) {
        return MODEL.rho + gValue(MODEL.alpha + MODEL.beta * m);
    }

    function xCE(m) {
        const B = BValue(m);
        return B / (m + B);
    }

    function xFullH2(pi) {
        const m = meanImpact(pi);
        const J = informationPremium(pi);
        const K = BValue(m) - J;
        return K / (m + K);
    }

    function actionDistortion(pi) {
        const m = meanImpact(pi);
        const J = informationPremium(pi);
        const B = BValue(m);
        return m * J / ((m + B) * (m + B - J));
    }

    function ceLoss(pi) {
        const m = meanImpact(pi);
        const J = informationPremium(pi);
        const B = BValue(m);
        return J * J * m * m / ((m + B) ** 2 * (m + B - J));
    }

    function pairBelief(i, j, m) {
        const low = MODEL.lambda[i];
        const high = MODEL.lambda[j];
        if (m < low - TOL || m > high + TOL) {
            throw new Error("Mean is outside the pair's feasible interval.");
        }
        const mm = Math.min(Math.max(m, low), high);
        const pi = [0, 0, 0];
        pi[i] = (high - mm) / (high - low);
        pi[j] = (mm - low) / (high - low);
        return pi;
    }

    function fixedMeanCandidates(m) {
        const output = [];
        for (let i = 0; i < 3; i += 1) {
            for (let j = i + 1; j < 3; j += 1) {
                if (MODEL.lambda[i] - TOL <= m && m <= MODEL.lambda[j] + TOL) {
                    const pi = pairBelief(i, j, m);
                    output.push({ pair: [i, j], pi, R: ceLoss(pi) });
                }
            }
        }
        return output;
    }

    function fixedMeanWorst(m) {
        const candidates = fixedMeanCandidates(m);
        if (!candidates.length) {
            throw new Error("No feasible fixed-mean candidates.");
        }
        return candidates.reduce((best, candidate) =>
            candidate.R > best.R + 1e-18 ? candidate : best,
            candidates[0]
        );
    }

    function fixedMeanSegment(m) {
        const points = [];
        fixedMeanCandidates(m).forEach(candidate => {
            if (!points.some(existing => Math.max(...existing.map((value, index) => Math.abs(value - candidate.pi[index]))) <= 1e-10)) {
                points.push(candidate.pi);
            }
        });
        if (points.length === 1) {
            return [points[0], points[0]];
        }
        if (points.length !== 2) {
            throw new Error(`Expected 2 unique fixed-mean endpoints, got ${points.length}.`);
        }
        return points;
    }

    function barycentricToXY(pi) {
        const p = normalizeBelief(pi);
        return {
            x: p[0] * vertices[0].x + p[1] * vertices[1].x + p[2] * vertices[2].x,
            y: p[0] * vertices[0].y + p[1] * vertices[1].y + p[2] * vertices[2].y
        };
    }

    function assertClose(actual, expected, tolerance, label) {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(`${label} verification failed.`);
        }
    }

    function verifyLockedMath() {
        const plambda = MODEL.P.map(row => dot(row, MODEL.lambda));
        MODEL.lambda.forEach((lambda, index) => {
            assertClose(plambda[index], MODEL.alpha + MODEL.beta * lambda, 1e-12, "Affine mean dynamics");
        });

        assertClose(meanImpact(CANONICAL.certainMiddle), 2, 1e-12, "Canonical middle mean");
        assertClose(meanImpact(CANONICAL.lowHigh), 2, 1e-12, "Canonical low/high mean");
        assertClose(informationPremium(CANONICAL.certainMiddle), 0.009732682280890304, 2e-12, "Canonical middle information premium");
        assertClose(informationPremium(CANONICAL.lowHigh), 0.04203742517789322, 2e-12, "Canonical low/high information premium");
        assertClose(ceLoss(CANONICAL.certainMiddle), 5.126072843851974e-06, 2e-12, "Canonical middle CE loss");
        assertClose(ceLoss(CANONICAL.lowHigh), 9.637248313972116e-05, 2e-12, "Canonical low/high CE loss");
        assertClose(ceLoss(GLOBAL_MAX.pi), GLOBAL_MAX.R, 2e-12, "Global maximum landmark");

        const lowPair = fixedMeanWorst(0.54).pair.join("");
        const middlePair = fixedMeanWorst(2.0).pair.join("");
        const highPair = fixedMeanWorst(7.0).pair.join("");
        if (lowPair !== "01" || middlePair !== "02" || highPair !== "12") {
            throw new Error("Fixed-mean support ordering verification failed.");
        }
    }

    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a |= 0;
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function sampleCategorical(probabilities, rng) {
        const u = rng();
        let cumulative = 0;
        for (let i = 0; i < probabilities.length; i += 1) {
            cumulative += probabilities[i];
            if (u < cumulative || i === probabilities.length - 1) {
                return i;
            }
        }
        return probabilities.length - 1;
    }

    function signalProbabilities(state) {
        const off = (1 - MODEL.eta) / 2;
        return MODEL.lambda.map((_, signal) => signal === state ? MODEL.eta : off);
    }

    function decisionDiagnostic(pi) {
        const m = meanImpact(pi);
        const full = xFullH2(pi);
        const ce = xCE(m);
        return {
            mean: m,
            J: informationPremium(pi),
            R: ceLoss(pi),
            deltaX: actionDistortion(pi),
            retainedFull: 1 - full,
            retainedCE: 1 - ce
        };
    }

    function generateScenario(seed) {
        const rng = mulberry32(seed);
        let currentPosterior = [...CANONICAL.lowHigh];
        let hiddenState = sampleCategorical(currentPosterior, rng);
        let signal = null;
        const events = [];

        for (let t = 0; t < SCENARIO_STEPS; t += 1) {
            const diagnostic = decisionDiagnostic(currentPosterior);
            events.push({
                t,
                seed,
                hiddenState,
                signal,
                posterior: [...currentPosterior],
                mean: diagnostic.mean,
                decision: {
                    retainedFull: diagnostic.retainedFull,
                    retainedCE: diagnostic.retainedCE
                }
            });

            if (t === SCENARIO_STEPS - 1) {
                break;
            }

            hiddenState = sampleCategorical(MODEL.P[hiddenState], rng);
            signal = sampleCategorical(signalProbabilities(hiddenState), rng);
            currentPosterior = posteriorAfterSignal(currentPosterior, signal);
        }
        return events;
    }

    function randomSeed() {
        if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
            return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
        }
        return (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
    }

    function ensureGrid() {
        if (gridValues) {
            return;
        }

        gridValues = [];
        gridIndex = new Map();
        triangles = [];

        for (let i = 0; i <= GRID_N; i += 1) {
            for (let j = 0; j <= GRID_N - i; j += 1) {
                const pi = [i / GRID_N, j / GRID_N, 1 - (i + j) / GRID_N];
                const record = { i, j, pi, R: ceLoss(pi) };
                gridIndex.set(`${i},${j}`, gridValues.length);
                gridValues.push(record);
            }
        }

        for (let i = 0; i < GRID_N; i += 1) {
            for (let j = 0; j < GRID_N - i; j += 1) {
                triangles.push([[i, j], [i + 1, j], [i, j + 1]]);
                if (i + j <= GRID_N - 2) {
                    triangles.push([[i + 1, j], [i + 1, j + 1], [i, j + 1]]);
                }
            }
        }
    }

    function xy(pi) {
        return barycentricToXY(pi);
    }

    function rebuildScreenGrid() {
        screenNodes = gridValues.map(record => {
            const point = xy(record.pi);
            return { ...record, x: point.x, y: point.y };
        });
        contourSegments = CONTOURS.map(level => collectContourSegments(level));
    }

    function collectContourSegments(level) {
        const segments = [];
        forEachTriangle((a, b, c) => {
            const points = uniquePoints([
                edgeCross(a, b, level),
                edgeCross(b, c, level),
                edgeCross(c, a, level)
            ]);
            if (points.length !== 2) {
                return;
            }
            const midX = (points[0].x + points[1].x) / 2;
            const midY = (points[0].y + points[1].y) / 2;
            segments.push({
                a: points[0],
                b: points[1],
                angle: Math.atan2(midY - H * 0.42, midX - W * 0.5)
            });
        });
        segments.sort((u, v) => u.angle - v.angle);
        return segments;
    }

    function gridNode(i, j) {
        return screenNodes[gridIndex.get(`${i},${j}`)];
    }

    function forEachTriangle(callback) {
        triangles.forEach(triangle => {
            callback(
                gridNode(...triangle[0]),
                gridNode(...triangle[1]),
                gridNode(...triangle[2])
            );
        });
    }

    function makeLayer() {
        const layer = document.createElement("canvas");
        layer.width = Math.round(W * DPR);
        layer.height = Math.round(H * DPR);
        const layerContext = layer.getContext("2d");
        layerContext.setTransform(DPR, 0, 0, DPR, 0, 0);
        return { canvas: layer, ctx: layerContext };
    }

    function layout() {
        if (!active || content.style.display === "none") {
            return;
        }

        ensureGrid();

        const rect = canvas.getBoundingClientRect();
        const width = Math.round(rect.width || wrap.getBoundingClientRect().width || 640);
        const height = Math.round(rect.height || width / 1.24);
        if (width < 2 || height < 2) {
            return;
        }

        const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
        const nextW = Math.max(280, width);
        const nextH = Math.max(280, height);

        if (fieldLayer && W === nextW && H === nextH && DPR === nextDpr) {
            draw();
            return;
        }

        DPR = nextDpr;
        W = nextW;
        H = nextH;
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        const mobile = W < 520;
        const padX = mobile ? Math.max(27, W * 0.075) : W * 0.08;
        const padTop = mobile ? 34 : 42;
        const traceTop = H * (mobile ? 0.80 : 0.805);
        const triBottom = H * (mobile ? 0.70 : 0.705);
        const triW = W - 2 * padX;
        const triH = Math.min(triBottom - padTop, triW * 0.72);
        const centerX = W / 2;
        const bottom = padTop + triH;

        vertices = [
            { x: centerX - triW / 2, y: bottom },
            { x: centerX, y: padTop },
            { x: centerX + triW / 2, y: bottom }
        ];

        traceBox = {
            left: mobile ? 28 : 44,
            right: W - (mobile ? 28 : 44),
            top: traceTop,
            bottom: H - (mobile ? 21 : 27)
        };

        rebuildScreenGrid();
        rebuildStaticLayers();
        draw();
    }

    function rebuildStaticLayers() {
        fieldLayer = makeLayer();
        drawField(fieldLayer.ctx);
        drawContours(fieldLayer.ctx);
    }

    function drawField(g) {
        g.fillStyle = "#000";
        g.fillRect(0, 0, W, H);

        forEachTriangle((a, b, c) => {
            const z = clamp((a.R + b.R + c.R) / (3 * GLOBAL_MAX.R), 0, 1);
            const shaped = Math.pow(z, 0.68);
            const value = Math.round(3 + 25 * shaped);
            g.beginPath();
            g.moveTo(a.x, a.y);
            g.lineTo(b.x, b.y);
            g.lineTo(c.x, c.y);
            g.closePath();
            g.fillStyle = `rgb(${value},${value},${value})`;
            g.fill();
        });

        for (let i = 0; i <= GRID_N; i += 2) {
            for (let j = 0; j <= GRID_N - i; j += 2) {
                const record = gridNode(i, j);
                const z = clamp(record.R / GLOBAL_MAX.R, 0, 1);
                if (z < 0.07) {
                    continue;
                }
                const radius = 0.22 + 0.68 * Math.pow(z, 0.72);
                g.beginPath();
                g.arc(record.x, record.y, radius, 0, Math.PI * 2);
                g.fillStyle = `rgba(255,255,255,${0.025 + 0.13 * Math.pow(z, 0.86)})`;
                g.fill();
            }
        }
    }

    function edgeCross(p1, p2, level) {
        const z1 = p1.R - level;
        const z2 = p2.R - level;
        if (Math.abs(z1) < 1e-16 && Math.abs(z2) < 1e-16) {
            return null;
        }
        if ((z1 < 0 && z2 < 0) || (z1 > 0 && z2 > 0) || Math.abs(p2.R - p1.R) < 1e-18) {
            return null;
        }
        const t = (level - p1.R) / (p2.R - p1.R);
        if (t < -1e-10 || t > 1.0000000001) {
            return null;
        }
        return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
    }

    function uniquePoints(points) {
        const output = [];
        points.forEach(point => {
            if (point && !output.some(existing => Math.hypot(point.x - existing.x, point.y - existing.y) < 0.35)) {
                output.push(point);
            }
        });
        return output;
    }

    function drawContours(g) {
        CONTOURS.forEach(level => {
            const fraction = level / GLOBAL_MAX.R;
            g.strokeStyle = `rgba(255,255,255,${0.075 + 0.19 * Math.pow(fraction, 0.72)})`;
            g.lineWidth = fraction > 0.96 ? 0.95 : 0.62;

            forEachTriangle((a, b, c) => {
                const points = uniquePoints([
                    edgeCross(a, b, level),
                    edgeCross(b, c, level),
                    edgeCross(c, a, level)
                ]);
                if (points.length !== 2) {
                    return;
                }
                g.beginPath();
                g.moveTo(points[0].x, points[0].y);
                g.lineTo(points[1].x, points[1].y);
                g.stroke();
            });
        });
    }

    function drawTriangle() {
        if (boundaryProgress <= 0) {
            return;
        }

        const points = [vertices[0], vertices[1], vertices[2], vertices[0]];
        const lengths = [];
        let perimeter = 0;
        for (let i = 0; i < 3; i += 1) {
            const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
            lengths.push(len);
            perimeter += len;
        }
        let remaining = clamp(boundaryProgress, 0, 1) * perimeter;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < 3 && remaining > 0; i += 1) {
            const take = Math.min(1, remaining / lengths[i]);
            ctx.lineTo(
                lerp(points[i].x, points[i + 1].x, take),
                lerp(points[i].y, points[i + 1].y, take)
            );
            remaining -= lengths[i];
            if (take < 1) {
                break;
            }
        }
        ctx.strokeStyle = "rgba(255,255,255,.61)";
        ctx.lineWidth = 1.05;
        ctx.stroke();
        ctx.restore();
    }

    function drawBuildingField() {
        if (fieldReveal <= 0 || fieldReveal >= 0.9995) {
            return;
        }

        const r = clamp(fieldReveal, 0, 1);
        ctx.save();

        // The field is built in exact loss order. Each micro-triangle grows
        // geometrically from its centroid rather than simply fading on.
        forEachTriangle((a, b, c) => {
            const z = clamp((a.R + b.R + c.R) / (3 * GLOBAL_MAX.R), 0, 1);
            const gate = clamp((r - 0.80 * z) / 0.20, 0, 1);
            if (gate <= 0) {
                return;
            }
            const shaped = Math.pow(z, 0.68);
            const value = Math.round(3 + 25 * shaped);
            const cx = (a.x + b.x + c.x) / 3;
            const cy = (a.y + b.y + c.y) / 3;
            const grow = ease(gate);
            const ax = lerp(cx, a.x, grow);
            const ay = lerp(cy, a.y, grow);
            const bx = lerp(cx, b.x, grow);
            const by = lerp(cy, b.y, grow);
            const cx2 = lerp(cx, c.x, grow);
            const cy2 = lerp(cy, c.y, grow);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.lineTo(cx2, cy2);
            ctx.closePath();
            ctx.fillStyle = `rgb(${value},${value},${value})`;
            ctx.fill();
        });

        // Contours are traced progressively along their actual level-set
        // segments once the corresponding loss level has been reached.
        CONTOURS.forEach((level, index) => {
            const fraction = level / GLOBAL_MAX.R;
            const startAt = 0.58 * fraction + 0.10;
            const local = clamp((r - startAt) / Math.max(0.12, 0.92 - startAt), 0, 1);
            if (local <= 0) {
                return;
            }
            const segments = contourSegments[index] || [];
            const count = local * segments.length;
            ctx.strokeStyle = `rgba(255,255,255,${0.075 + 0.19 * Math.pow(fraction, 0.72)})`;
            ctx.lineWidth = fraction > 0.96 ? 0.95 : 0.62;
            for (let i = 0; i < Math.ceil(count); i += 1) {
                const segment = segments[i];
                if (!segment) {
                    continue;
                }
                const tail = i === Math.floor(count) ? count - Math.floor(count) : 1;
                ctx.beginPath();
                ctx.moveTo(segment.a.x, segment.a.y);
                ctx.lineTo(
                    lerp(segment.a.x, segment.b.x, tail),
                    lerp(segment.a.y, segment.b.y, tail)
                );
                ctx.stroke();
            }
        });
        ctx.restore();
    }

    function drawVertexLabels() {
        if (boundaryProgress < 0.86) {
            return;
        }
        const mobile = W < 520;
        ctx.save();
        ctx.font = `${mobile ? 9 : 10}px "Courier New",Courier,monospace`;
        ctx.fillStyle = "rgba(255,255,255,.52)";
        ctx.textBaseline = "middle";
        if (mobile) {
            ctx.textAlign = "left";
            ctx.fillText("LOW .5", vertices[0].x + 3, vertices[0].y + 12);
            ctx.textAlign = "center";
            ctx.fillText("MID 2", vertices[1].x, vertices[1].y - 13);
            ctx.textAlign = "right";
            ctx.fillText("HIGH 8", vertices[2].x - 3, vertices[2].y + 12);
        } else {
            ctx.textAlign = "right";
            ctx.fillText("LOW .5", vertices[0].x - 8, vertices[0].y + 3);
            ctx.textAlign = "center";
            ctx.fillText("MID 2", vertices[1].x, vertices[1].y - 14);
            ctx.textAlign = "left";
            ctx.fillText("HIGH 8", vertices[2].x + 8, vertices[2].y + 3);
        }
        ctx.restore();
    }

    function activeCandidates(m) {
        const candidates = fixedMeanCandidates(m);
        const maxR = Math.max(...candidates.map(candidate => candidate.R));
        return candidates.filter(candidate =>
            Math.abs(candidate.R - maxR) <= Math.max(TIE_TOL, maxR * 1e-9)
        );
    }

    function drawFiber(m) {
        if (!showFiber) {
            return;
        }

        const [pa, pb] = fixedMeanSegment(m);
        const a = xy(pa);
        const b = xy(pb);
        const winners = activeCandidates(m);
        const winner = fixedMeanWorst(m);

        ctx.save();
        ctx.strokeStyle = phase === "realization" || phase === "residue"
            ? "rgba(0,122,255,.76)"
            : "rgba(0,122,255,.82)";
        ctx.lineWidth = 1.35;
        const fp = phase === "canonical" ? clamp(fiberProgress, 0, 1)
            : phase === "realization" ? clamp(realizationProgress, 0, 1)
            : 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(lerp(a.x, b.x, fp), lerp(a.y, b.y, fp));
        ctx.stroke();

        const markerProgress = phase === "canonical"
            ? clamp((fiberProgress - 0.68) / 0.32, 0, 1)
            : phase === "realization"
                ? clamp((realizationProgress - 0.55) / 0.45, 0, 1)
                : 1;

        if (markerProgress > 0) [pa, pb].forEach(pi => {
            const point = xy(pi);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * markerProgress);
            ctx.strokeStyle = "rgba(255,255,255,.58)";
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        if (markerProgress > 0.30) winners.forEach(candidate => {
            const point = xy(candidate.pi);
            const wp = clamp((markerProgress - 0.30) / 0.70, 0, 1);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5.0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,122,255,${0.82 * wp})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * wp);
            ctx.strokeStyle = "rgba(0,122,255,.25)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.moveTo(vertices[winner.pair[0]].x, vertices[winner.pair[0]].y);
        ctx.lineTo(vertices[winner.pair[1]].x, vertices[winner.pair[1]].y);
        ctx.strokeStyle = "rgba(0,122,255,.17)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
    }

    function drawGlobalMax() {
        if (!showGlobal || globalProgress <= 0) {
            return;
        }
        const point = xy(GLOBAL_MAX.pi);
        const gp = clamp(globalProgress, 0, 1);
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4.1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * gp);
        ctx.strokeStyle = "rgba(255,255,255,.78)";
        ctx.lineWidth = 1.05;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 7.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * gp);
        ctx.strokeStyle = "rgba(255,255,255,.13)";
        ctx.stroke();
        ctx.restore();
    }

    function drawCanonical() {
        if (!showCanonical) {
            return;
        }

        const cp = clamp((phaseProgress - 0.55) / 0.45, 0, 1);
        if (cp <= 0) {
            return;
        }
        const points = [
            { pi: CANONICAL.certainMiddle, label: "πC" },
            { pi: CANONICAL.lowHigh, label: "πU" }
        ];

        ctx.save();
        ctx.font = `${W < 520 ? 9 : 10}px "Courier New",Courier,monospace`;
        ctx.textBaseline = "middle";
        points.forEach(item => {
            const point = xy(item.pi);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3.1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cp);
            ctx.strokeStyle = `rgba(255,255,255,${0.86 * cp})`;
            ctx.lineWidth = 1.05;
            ctx.stroke();
            if (cp > 0.55) {
                const labelAlpha = clamp((cp - 0.55) / 0.45, 0, 1);
                ctx.fillStyle = `rgba(255,255,255,${0.78 * labelAlpha})`;
                ctx.fillText(item.label, point.x + 7, point.y - 8);
            }
        });
        ctx.restore();
    }

    function drawPosteriorPath() {
        if (!showPosterior || posteriorPath.length === 0) {
            return;
        }

        ctx.save();
        if (posteriorPath.length > 1) {
            for (let k = 1; k < posteriorPath.length; k += 1) {
                const a = xy(posteriorPath[k - 1]);
                const b = xy(posteriorPath[k]);
                const age = k / (posteriorPath.length - 1);
                const isLatest = k === posteriorPath.length - 1 && phase === "realization";
                const segmentProgress = isLatest ? clamp(realizationProgress, 0, 1) : 1;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(lerp(a.x, b.x, segmentProgress), lerp(a.y, b.y, segmentProgress));
                ctx.strokeStyle = `rgba(255,255,255,${0.08 + 0.30 * Math.pow(age, 1.6)})`;
                ctx.lineWidth = 0.72 + 0.42 * age;
                ctx.stroke();
            }
        }

        for (let k = 0; k < posteriorPath.length - 1; k += 1) {
            const point = xy(posteriorPath[k]);
            const age = (k + 1) / posteriorPath.length;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1.15 + 0.75 * age, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.10 + 0.30 * age})`;
            ctx.fill();
        }

        // The current posterior itself appears only at its exact Bayesian state.
        // Only the visual evidence of the jump (the connecting segment) is drawn smoothly.
        if (posterior) {
            const point = xy(posterior);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4.6, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(point.x, point.y, 7.9, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,255,255,.20)";
            ctx.lineWidth = 1.15;
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawDecisionResidue() {
        if (!showTrace || playedEvents.length < 1 || !traceBox) {
            return;
        }

        const { left, right, top, bottom } = traceBox;
        const innerW = Math.max(1, right - left);
        const innerH = Math.max(1, bottom - top);
        const yMin = 0.32;
        const yMax = 0.75;
        const xOf = index => left + (SCENARIO_STEPS <= 1 ? 0 : index / (SCENARIO_STEPS - 1)) * innerW;
        const yOf = retained => bottom - clamp((retained - yMin) / (yMax - yMin), 0, 1) * innerH;
        const lastIndex = playedEvents.length - 1;
        const latestProgress = phase === "realization" ? clamp(realizationProgress, 0, 1) : 1;

        function pointFor(index, key) {
            const event = playedEvents[index];
            if (index === lastIndex && index > 0 && phase === "realization") {
                const prev = playedEvents[index - 1];
                return {
                    x: lerp(xOf(index - 1), xOf(index), latestProgress),
                    y: lerp(yOf(prev.decision[key]), yOf(event.decision[key]), latestProgress)
                };
            }
            return { x: xOf(index), y: yOf(event.decision[key]) };
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.strokeStyle = "rgba(255,255,255,.055)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Exact FULL-versus-MEAN difference. The blue ribbon is not magnified:
        // its thickness is the literal separation between the retained fractions.
        if (playedEvents.length > 1) {
            ctx.beginPath();
            for (let index = 0; index < playedEvents.length; index += 1) {
                const p = pointFor(index, "retainedFull");
                if (index === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            for (let index = playedEvents.length - 1; index >= 0; index -= 1) {
                const p = pointFor(index, "retainedCE");
                ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            ctx.fillStyle = "rgba(0,122,255,.13)";
            ctx.fill();
        }

        // Draw MEAN first, then FULL so the white full-information trace cannot
        // disappear underneath the blue line when the two are nearly identical.
        function drawSeries(key, stroke, width) {
            ctx.beginPath();
            playedEvents.forEach((event, index) => {
                const p = pointFor(index, key);
                if (index === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            });
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.stroke();
        }

        drawSeries("retainedCE", "rgba(0,122,255,.82)", 1.05);
        drawSeries("retainedFull", "rgba(255,255,255,.82)", 1.05);

        // Eventwise connectors make the exact compression-induced action gap
        // perceptible without changing either series' numerical scale.
        playedEvents.forEach((event, index) => {
            if (index === lastIndex && phase === "realization" && latestProgress < 1) {
                return;
            }
            const x = xOf(index);
            ctx.beginPath();
            ctx.moveTo(x, yOf(event.decision.retainedFull));
            ctx.lineTo(x, yOf(event.decision.retainedCE));
            ctx.strokeStyle = "rgba(0,122,255,.34)";
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        const last = playedEvents[lastIndex];
        const fullPoint = pointFor(lastIndex, "retainedFull");
        const meanPoint = pointFor(lastIndex, "retainedCE");
        [[meanPoint, ACCENT], [fullPoint, "#fff"]].forEach(([point, fill]) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();
        });

        ctx.font = `${W < 520 ? 8 : 9}px "Courier New",Courier,monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "rgba(255,255,255,.48)";
        ctx.fillText("FULL", left, bottom + (W < 520 ? 12 : 14));
        ctx.fillStyle = "rgba(0,122,255,.66)";
        ctx.fillText("MEAN", left + (W < 520 ? 31 : 38), bottom + (W < 520 ? 12 : 14));
        ctx.restore();
    }

    function drawCompletionMark() {
        if (!completed) {
            return;
        }
        const x = W - (W < 520 ? 20 : 27);
        const y = H - (W < 520 ? 17 : 23);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,122,255,.72)";
        ctx.fill();
        ctx.restore();
    }

    function draw() {
        if (!W || !H) {
            return;
        }

        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        if (fieldLayer && fieldReveal >= 0.9995 && fieldAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = fieldAlpha;
            ctx.drawImage(
                fieldLayer.canvas,
                0, 0, fieldLayer.canvas.width, fieldLayer.canvas.height,
                0, 0, W, H
            );
            ctx.restore();
        } else {
            drawBuildingField();
        }

        drawTriangle();
        drawVertexLabels();
        drawFiber(mean);
        drawGlobalMax();
        drawCanonical();
        drawPosteriorPath();
        drawDecisionResidue();
        drawCompletionMark();
    }

    function setMean(value) {
        mean = clamp(Number(value), MODEL.lambda[0], MODEL.lambda[2]);
        draw();
    }

    function clearTimers() {
        pendingTimers.forEach(id => clearTimeout(id));
        pendingTimers.clear();
        if (animationRaf) {
            cancelAnimationFrame(animationRaf);
            animationRaf = 0;
        }
    }

    function stopInternal() {
        runToken += 1;
        clearTimers();
    }

    function wait(ms, token) {
        return new Promise(resolve => {
            if (token !== runToken) {
                resolve(false);
                return;
            }
            const id = setTimeout(() => {
                pendingTimers.delete(id);
                resolve(token === runToken);
            }, ms);
            pendingTimers.add(id);
        });
    }

    function animateValue(from, to, duration, token, setter, easing = ease) {
        return new Promise(resolve => {
            const start = performance.now();

            function frame(now) {
                if (token !== runToken || !active) {
                    animationRaf = 0;
                    resolve(false);
                    return;
                }
                const t = clamp((now - start) / Math.max(1, duration), 0, 1);
                setter(lerp(from, to, easing(t)), t);
                if (t >= 1) {
                    animationRaf = 0;
                    resolve(true);
                    return;
                }
                animationRaf = requestAnimationFrame(frame);
            }

            animationRaf = requestAnimationFrame(frame);
        });
    }

    function resetTransient() {
        mean = 2;
        boundaryProgress = 0;
        fieldReveal = 0;
        fieldAlpha = 0;
        fiberProgress = 1;
        showGlobal = false;
        showFiber = false;
        showCanonical = false;
        showPosterior = false;
        showTrace = false;
        posterior = null;
        posteriorPath = [];
        playedEvents = [];
        currentEvent = null;
        phaseProgress = 0;
        globalProgress = 0;
        realizationProgress = 1;
        completed = false;
        wrap.classList.remove("is-resettable");
        canvas.tabIndex = -1;
        canvas.setAttribute("role", "img");
        canvas.setAttribute(
            "aria-label",
            "Triangle of possible liquidity beliefs. A blue line groups different beliefs with the same reported estimate, while the grayscale field shows the execution cost of compressing the full belief to that estimate."
        );
    }

    function applyScenarioEvent(event) {
        currentEvent = event;
        posterior = [...event.posterior];
        posteriorPath.push([...event.posterior]);
        playedEvents.push(event);
        mean = event.mean;
        draw();
    }

    async function runBoundary(token) {
        phase = "boundary";
        boundaryProgress = 0;
        fieldReveal = 0;
        draw();
        return animateValue(0, 1, TIMING.boundary, token, value => {
            boundaryProgress = value;
            draw();
        }, t => t);
    }

    async function runFieldBuild(token) {
        phase = "field";
        boundaryProgress = 1;
        fieldReveal = 0;
        fieldAlpha = 1;
        return animateValue(0, 1, TIMING.field, token, value => {
            fieldReveal = value;
            showGlobal = value > 0.88;
            globalProgress = clamp((value - 0.88) / 0.12, 0, 1);
            draw();
        }, t => t);
    }

    async function runCanonical(token) {
        phase = "canonical";
        showGlobal = true;
        globalProgress = 1;
        showFiber = true;
        showCanonical = true;
        fiberProgress = 0;
        setMean(2);
        const built = await animateValue(0, 1, TIMING.canonical, token, (_, t) => {
            fiberProgress = t;
            phaseProgress = t;
            draw();
        }, t => t);
        if (!built) {
            return false;
        }
        return wait(TIMING.canonicalHold, token);
    }

    async function runRealization(token) {
        phase = "realization";
        showGlobal = true;
        showCanonical = false;
        showFiber = true;
        showPosterior = true;
        showTrace = true;
        fiberProgress = 1;
        posterior = null;
        posteriorPath = [];
        playedEvents = [];
        currentEvent = null;

        for (let i = 0; i < scenario.length; i += 1) {
            if (token !== runToken || !active) {
                return false;
            }
            realizationProgress = 0;
            applyScenarioEvent(scenario[i]);
            const delay = i === 0 ? TIMING.realizationFirst : TIMING.realizationStep;
            const animated = await animateValue(0, 1, delay, token, value => {
                realizationProgress = value;
                draw();
            }, t => t);
            if (!animated) {
                return false;
            }
        }
        realizationProgress = 1;
        return true;
    }

    function finishResidue() {
        phase = "residue";
        globalProgress = 1;
        realizationProgress = 1;
        completed = true;
        showFiber = true;
        showPosterior = true;
        showTrace = true;
        wrap.classList.add("is-resettable");
        canvas.tabIndex = 0;
        canvas.setAttribute("role", "button");
        canvas.setAttribute(
            "aria-label",
            "Completed Same Estimate, Different Information visualization. Activate to generate a new seeded Bayesian realization."
        );
        draw();
    }

    function renderInstantResidue(seed) {
        stopInternal();
        resetTransient();
        active = true;
        currentSeed = seed >>> 0;
        scenario = generateScenario(currentSeed);
        boundaryProgress = 1;
        fieldReveal = 1;
        fieldAlpha = 1;
        showGlobal = true;
        globalProgress = 1;
        realizationProgress = 1;
        phase = "residue";
        showFiber = true;
        showPosterior = true;
        showTrace = true;

        scenario.forEach(event => {
            currentEvent = event;
            posterior = [...event.posterior];
            posteriorPath.push([...event.posterior]);
            playedEvents.push(event);
            mean = event.mean;
        });
        finishResidue();
    }

    async function startFresh(seed = null) {
        stopInternal();
        resetTransient();
        active = true;
        layout();
        currentSeed = (seed === null ? randomSeed() : seed) >>> 0;
        scenario = generateScenario(currentSeed);
        const token = runToken;

        if (!(await runBoundary(token))) {
            return;
        }
        if (!(await runFieldBuild(token))) {
            return;
        }
        if (!(await runCanonical(token))) {
            return;
        }
        if (!(await runRealization(token))) {
            return;
        }
        if (!(await wait(TIMING.preResidue, token))) {
            return;
        }
        if (token !== runToken) {
            return;
        }
        finishResidue();
    }

    function clearArtwork() {
        active = false;
        stopInternal();
        resetTransient();
        phase = "idle";
        if (W && H) {
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, W, H);
        }
    }

    function openArtwork(seed = null) {
        active = true;
        startFresh(seed);
    }

    function restartArtwork(seed = null) {
        if (!active) {
            active = true;
        }
        startFresh(seed);
    }

    function toggleSection() {
        const isOpen = title.getAttribute("aria-expanded") === "true";

        if (!hasToggledOnce) {
            arrow.classList.remove("blink-arrow");
            hasToggledOnce = true;
        }

        if (isOpen) {
            clearArtwork();
            content.style.display = "none";
            arrow.textContent = "▼";
            title.setAttribute("aria-expanded", "false");
        } else {
            content.style.display = "block";
            arrow.textContent = "▲";
            title.setAttribute("aria-expanded", "true");
            openArtwork();
        }
    }

    verifyLockedMath();
    content.style.display = "none";
    title.addEventListener("click", toggleSection);

    canvas.addEventListener("click", function () {
        if (completed && active) {
            restartArtwork();
        }
    });

    canvas.addEventListener("keydown", function (event) {
        if (!completed || !active) {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            restartArtwork();
        }
    });

    window.addEventListener("resize", function () {
        if (!active) {
            return;
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layout, 90);
    });

    window.addEventListener("pagehide", function () {
        if (title.getAttribute("aria-expanded") === "true") {
            clearArtwork();
        }
    });

    window.addEventListener("pageshow", function (event) {
        if (event.persisted && title.getAttribute("aria-expanded") === "true") {
            openArtwork();
        }
    });

    window.sameEstimateArtwork = Object.freeze({
        open(seed = null) {
            if (title.getAttribute("aria-expanded") !== "true") {
                content.style.display = "block";
                arrow.textContent = "▲";
                arrow.classList.remove("blink-arrow");
                title.setAttribute("aria-expanded", "true");
                hasToggledOnce = true;
            }
            openArtwork(seed);
        },
        close() {
            clearArtwork();
            content.style.display = "none";
            arrow.textContent = "▼";
            title.setAttribute("aria-expanded", "false");
        },
        restart(seed = null) {
            restartArtwork(seed);
        },
        renderInstant(seed = 20260911) {
            if (title.getAttribute("aria-expanded") !== "true") {
                content.style.display = "block";
                arrow.textContent = "▲";
                arrow.classList.remove("blink-arrow");
                title.setAttribute("aria-expanded", "true");
                hasToggledOnce = true;
            }
            active = true;
            layout();
            renderInstantResidue(seed >>> 0);
        },
        getState() {
            return {
                phase,
                completed,
                active,
                seed: currentSeed,
                mean,
                eventIndex: currentEvent ? currentEvent.t : null,
                pathLength: posteriorPath.length,
                scenarioSteps: SCENARIO_STEPS,
                posterior: posterior ? [...posterior] : null
            };
        }
    });
});
