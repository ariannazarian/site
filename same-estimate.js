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

    // One representative level from each topologically distinct CE-loss regime.
    // The five levels generate 1, 2, 3, 2, and 1 connected components respectively.
    // Values are midpoints between the six critical loss values of the baseline surface.
    const CONTOURS = Object.freeze([
        3.6045067689677736e-06,
        6.001239635562796e-06,
        1.1009975767088122e-05,
        1.6782292205972878e-05,
        5.983344251669936e-05
    ]);

    const EXPECTED_CONTOUR_COMPONENTS = Object.freeze([1, 2, 3, 2, 1]);

    const TIMING = Object.freeze({
        staticBuild: 9400,
        canonical: 1200,
        canonicalHold: 300,
        realizationFirst: 500,
        realizationStep: 580,
        preResidue: 250
    });

    const GRID_TRI_DRAW = 0.065;
    const GRID_TRI_SPREAD = 0.022;
    const GRID_LEVELS = Object.freeze([0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9]);

    let W = 0;
    let H = 0;
    let DPR = 1;
    let vertices = [];
    let traceBox = null;
    let screenNodes = [];
    let contourSegments = [];
    let contourPaths = [];
    let constructionGridLines = [];
    let constructionTriangles = [];
    let boundaryMetrics = null;
    let fieldLayer = null;
    let labelHitBoxes = [];

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
    let showTrace = false; // retained for API compatibility; no lower diagnostic is rendered
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
        buildBoundaryMetrics();
        constructionGridLines = buildConstructionGridLines();
        contourPaths = CONTOURS.map((level, index) => buildContourPaths(level, contourSegments[index]));
        const contourCounts = contourPaths.map(paths => paths.length);
        contourCounts.forEach((count, index) => {
            if (count !== EXPECTED_CONTOUR_COMPONENTS[index]) {
                throw new Error(`Contour topology verification failed at level ${index}: expected ${EXPECTED_CONTOUR_COMPONENTS[index]} components, got ${count}.`);
            }
        });
        constructionTriangles = buildConstructionTriangles();
    }

    function meshEdgeKey(aCoord, bCoord) {
        const a = `${aCoord[0]},${aCoord[1]}`;
        const b = `${bCoord[0]},${bCoord[1]}`;
        return a < b ? `${a}|${b}` : `${b}|${a}`;
    }

    function isBoundaryMeshEdge(aCoord, bCoord) {
        const [ai, aj] = aCoord;
        const [bi, bj] = bCoord;
        return (ai === 0 && bi === 0)
            || (aj === 0 && bj === 0)
            || (ai + aj === GRID_N && bi + bj === GRID_N);
    }

    function collectContourSegments(level) {
        const segments = [];

        triangles.forEach(triangle => {
            const coords = triangle;
            const nodes = coords.map(coord => gridNode(...coord));
            const edges = [
                [0, 1],
                [1, 2],
                [2, 0]
            ];
            const hits = [];

            edges.forEach(([u, v]) => {
                const point = edgeCross(nodes[u], nodes[v], level);
                if (!point) return;
                const coordA = coords[u];
                const coordB = coords[v];
                hits.push({
                    point,
                    edgeKey: meshEdgeKey(coordA, coordB),
                    boundary: isBoundaryMeshEdge(coordA, coordB)
                });
            });

            // Deduplicate the rare case where a contour passes exactly through a mesh vertex.
            const unique = [];
            hits.forEach(hit => {
                const existing = unique.find(item => item.edgeKey === hit.edgeKey);
                if (!existing) unique.push(hit);
            });

            if (unique.length !== 2) return;
            segments.push({
                a: unique[0].point,
                b: unique[1].point,
                aKey: unique[0].edgeKey,
                bKey: unique[1].edgeKey,
                aBoundary: unique[0].boundary,
                bBoundary: unique[1].boundary
            });
        });

        return segments;
    }

    function buildBoundaryMetrics() {
        const apex = vertices[1];
        const high = vertices[2];
        const low = vertices[0];
        const segments = [
            { a: apex, b: high },
            { a: high, b: low },
            { a: low, b: apex }
        ].map(segment => ({
            ...segment,
            length: Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y)
        }));
        let cumulative = 0;
        segments.forEach(segment => {
            segment.start = cumulative;
            cumulative += segment.length;
        });
        boundaryMetrics = { segments, perimeter: cumulative };
    }

    function closestPointOnSegment(point, a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const denom = dx * dx + dy * dy || 1;
        const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / denom, 0, 1);
        const x = a.x + dx * t;
        const y = a.y + dy * t;
        return { x, y, t, distance: Math.hypot(point.x - x, point.y - y) };
    }

    function boundaryParamForPoint(point) {
        let best = null;
        boundaryMetrics.segments.forEach(segment => {
            const projection = closestPointOnSegment(point, segment.a, segment.b);
            if (!best || projection.distance < best.distance) {
                best = {
                    distance: projection.distance,
                    param: (segment.start + projection.t * segment.length) / boundaryMetrics.perimeter,
                    point: { x: projection.x, y: projection.y }
                };
            }
        });
        return best;
    }

    function boundaryPointAt(progress) {
        const distance = clamp(progress, 0, 1) * boundaryMetrics.perimeter;
        const segment = boundaryMetrics.segments.find(item => distance <= item.start + item.length + 1e-9)
            || boundaryMetrics.segments[boundaryMetrics.segments.length - 1];
        const t = clamp((distance - segment.start) / Math.max(1e-9, segment.length), 0, 1);
        return {
            x: lerp(segment.a.x, segment.b.x, t),
            y: lerp(segment.a.y, segment.b.y, t)
        };
    }

    function buildConstructionGridLines() {
        const raw = [];
        for (let axis = 0; axis < 3; axis += 1) {
            GRID_LEVELS.forEach(level => {
                const a = [0, 0, 0];
                const b = [0, 0, 0];
                a[axis] = level;
                b[axis] = level;
                const others = [0, 1, 2].filter(index => index !== axis);
                a[others[0]] = 0;
                a[others[1]] = 1 - level;
                b[others[0]] = 1 - level;
                b[others[1]] = 0;
                const p0 = xy(a);
                const p1 = xy(b);
                raw.push({ axis, level, a: p0, b: p1 });
            });
        }
        return raw;
    }


    function chainContourSegments(segments) {
        if (!segments.length) return [];

        const nodeMap = new Map();
        const segmentMap = new Map();

        function addNode(key, point, boundary) {
            if (!nodeMap.has(key)) {
                nodeMap.set(key, { key, point: { ...point }, boundary: Boolean(boundary), segments: [] });
            } else if (boundary) {
                nodeMap.get(key).boundary = true;
            }
        }

        segments.forEach((segment, index) => {
            addNode(segment.aKey, segment.a, segment.aBoundary);
            addNode(segment.bKey, segment.b, segment.bBoundary);
            nodeMap.get(segment.aKey).segments.push(index);
            nodeMap.get(segment.bKey).segments.push(index);
            segmentMap.set(index, segment);
        });

        const unvisited = new Set(segments.map((_, index) => index));
        const paths = [];

        while (unvisited.size) {
            const seedIndex = unvisited.values().next().value;
            const componentSegments = new Set();
            const componentNodes = new Set();
            const stack = [seedIndex];

            while (stack.length) {
                const index = stack.pop();
                if (componentSegments.has(index)) continue;
                componentSegments.add(index);
                unvisited.delete(index);
                const segment = segmentMap.get(index);
                [segment.aKey, segment.bKey].forEach(key => {
                    componentNodes.add(key);
                    nodeMap.get(key).segments.forEach(next => {
                        if (!componentSegments.has(next)) stack.push(next);
                    });
                });
            }

            const endpointNodes = [...componentNodes]
                .map(key => nodeMap.get(key))
                .filter(node => node.boundary || node.segments.filter(index => componentSegments.has(index)).length === 1);

            // A displayed loss arc should be the boundary-to-boundary component.
            // Prefer a genuine simplex-boundary endpoint, then any degree-one endpoint.
            let startNode = endpointNodes.find(node => node.boundary)
                || endpointNodes[0]
                || nodeMap.get(segmentMap.get(seedIndex).aKey);

            const orderedPoints = [{ ...startNode.point }];
            let currentKey = startNode.key;
            let previousSegment = null;
            const used = new Set();

            while (used.size < componentSegments.size) {
                const currentNode = nodeMap.get(currentKey);
                const nextSegmentIndex = currentNode.segments.find(index =>
                    componentSegments.has(index) && !used.has(index) && index !== previousSegment
                );
                if (nextSegmentIndex === undefined) break;

                used.add(nextSegmentIndex);
                const segment = segmentMap.get(nextSegmentIndex);
                const nextKey = segment.aKey === currentKey ? segment.bKey : segment.aKey;
                const nextNode = nodeMap.get(nextKey);
                orderedPoints.push({ ...nextNode.point });
                previousSegment = nextSegmentIndex;
                currentKey = nextKey;
            }

            const start = nodeMap.get(startNode.key);
            const end = nodeMap.get(currentKey);
            paths.push({
                points: orderedPoints,
                startBoundary: start.boundary,
                endBoundary: end.boundary
            });
        }

        return paths;
    }

    function buildContourPaths(level, segments) {
        const fraction = level / GLOBAL_MAX.R;
        const candidates = chainContourSegments(segments).map(pathData => {
            const points = [...pathData.points];
            if (points.length < 2) return null;

            const first = boundaryParamForPoint(points[0]);
            const last = boundaryParamForPoint(points[points.length - 1]);
            if (last.param < first.param) points.reverse();

            const startInfo = boundaryParamForPoint(points[0]);
            const endInfo = boundaryParamForPoint(points[points.length - 1]);
            const lengths = [0];
            let total = 0;
            for (let i = 1; i < points.length; i += 1) {
                total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
                lengths.push(total);
            }

            return {
                points,
                lengths,
                total,
                start: startInfo.param,
                end: Math.max(startInfo.param + 1e-4, endInfo.param),
                startDistance: startInfo.distance,
                endDistance: endInfo.distance,
                boundaryToBoundary: pathData.startBoundary && pathData.endBoundary,
                alpha: 0.075 + 0.19 * Math.pow(fraction, 0.72),
                width: fraction > 0.96 ? 0.95 : 0.62
            };
        }).filter(Boolean);

        // Every chosen baseline level consists only of genuine boundary-to-boundary
        // components. Preserve all of them: disconnectedness is part of the loss geometry,
        // not a rendering artifact. Sort by first clockwise boundary contact so animation
        // order is deterministic.
        const boundaryComponents = candidates
            .filter(path => path.boundaryToBoundary)
            .sort((a, b) => a.start - b.start);
        return boundaryComponents;
    }

    function lineSignature(a, b) {
        const p1 = `${a[0].toFixed(4)},${a[1].toFixed(4)},${a[2].toFixed(4)}`;
        const p2 = `${b[0].toFixed(4)},${b[1].toFixed(4)},${b[2].toFixed(4)}`;
        return [p1, p2].sort().join('|');
    }

    function buildConstructionTriangles() {
        const step = 0.1;
        const tris = [];
        const edgeOwners = new Map();

        function pushTri(pis) {
            const points = pis.map(pi => xy(pi));
            const centroid = {
                x: (points[0].x + points[1].x + points[2].x) / 3,
                y: (points[0].y + points[1].y + points[2].y) / 3
            };
            const clockwise = points
                .map((point, index) => ({ point, pi: pis[index], angle: Math.atan2(point.y - centroid.y, point.x - centroid.x) }))
                .sort((u, v) => v.angle - u.angle);
            const tri = {
                id: tris.length,
                pis: clockwise.map(item => item.pi),
                points: clockwise.map(item => item.point),
                centroid,
                start: Infinity,
                sourcePoint: null,
                neighbors: []
            };
            tris.push(tri);
        }

        for (let i = 0; i < 10; i += 1) {
            for (let j = 0; j < 10 - i; j += 1) {
                const A = [i * step, 1 - (i + j) * step, j * step];
                const B = [(i + 1) * step, 1 - ((i + 1) + j) * step, j * step];
                const C = [i * step, 1 - (i + (j + 1)) * step, (j + 1) * step];
                pushTri([A, B, C]);
                if (i + j <= 8) {
                    const D = [(i + 1) * step, 1 - ((i + 1) + (j + 1)) * step, (j + 1) * step];
                    pushTri([B, D, C]);
                }
            }
        }

        tris.forEach(tri => {
            tri.edgeKeys = [];
            for (let k = 0; k < 3; k += 1) {
                const piA = tri.pis[k];
                const piB = tri.pis[(k + 1) % 3];
                const key = lineSignature(piA, piB);
                tri.edgeKeys.push(key);
                if (!edgeOwners.has(key)) edgeOwners.set(key, []);
                edgeOwners.get(key).push({ tri: tri.id, edgeIndex: k });
            }
        });

        edgeOwners.forEach(owners => {
            if (owners.length === 2) {
                const a = owners[0];
                const b = owners[1];
                tris[a.tri].neighbors.push({ tri: b.tri, via: a.edgeIndex });
                tris[b.tri].neighbors.push({ tri: a.tri, via: b.edgeIndex });
            }
        });

        tris.forEach(tri => {
            for (let k = 0; k < 3; k += 1) {
                const piA = tri.pis[k];
                const piB = tri.pis[(k + 1) % 3];
                const supportA = piA.filter(value => value > 1e-8).length;
                const supportB = piB.filter(value => value > 1e-8).length;
                if (supportA <= 2 && supportB <= 2) {
                    const pointA = xy(piA);
                    const pointB = xy(piB);
                    const qa = boundaryParamForPoint(pointA);
                    const qb = boundaryParamForPoint(pointB);
                    if (qa.distance < 0.8 && qb.distance < 0.8) {
                        const chosen = qa.param <= qb.param ? { q: qa, point: pointA } : { q: qb, point: pointB };
                        if (chosen.q.param < tri.start) {
                            tri.start = chosen.q.param;
                            tri.sourcePoint = { ...chosen.point };
                        }
                    }
                }
            }
        });

        for (let pass = 0; pass < 60; pass += 1) {
            let changed = false;
            tris.forEach(tri => {
                if (!Number.isFinite(tri.start)) return;
                tri.neighbors.forEach(link => {
                    const neighbor = tris[link.tri];
                    const candidate = tri.start + GRID_TRI_SPREAD;
                    if (candidate + 1e-6 < neighbor.start) {
                        neighbor.start = candidate;
                        const a = tri.points[link.via];
                        const b = tri.points[(link.via + 1) % 3];
                        neighbor.sourcePoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                        changed = true;
                    }
                });
            });
            if (!changed) break;
        }

        tris.forEach(tri => {
            if (!Number.isFinite(tri.start)) tri.start = 0.5;
            const source = tri.sourcePoint || tri.points[0];
            let startIndex = 0;
            let best = Infinity;
            tri.points.forEach((point, index) => {
                const d = Math.hypot(point.x - source.x, point.y - source.y);
                if (d < best) { best = d; startIndex = index; }
            });
            tri.cycle = [
                tri.points[startIndex],
                tri.points[(startIndex + 1) % 3],
                tri.points[(startIndex + 2) % 3],
                tri.points[startIndex]
            ];
            tri.lengths = [0];
            let total = 0;
            for (let k = 1; k < tri.cycle.length; k += 1) {
                total += Math.hypot(tri.cycle[k].x - tri.cycle[k - 1].x, tri.cycle[k].y - tri.cycle[k - 1].y);
                tri.lengths.push(total);
            }
            tri.total = total;
        });

        return tris;
    }

    function drawPartialPolyline(points, lengths, total, distance) {
        if (!points.length || distance <= 0) return;
        const target = Math.min(distance, total);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) {
            if (lengths[i] <= target + 1e-9) {
                ctx.lineTo(points[i].x, points[i].y);
                continue;
            }
            const segmentStart = lengths[i - 1];
            const segmentLength = lengths[i] - segmentStart || 1;
            const t = clamp((target - segmentStart) / segmentLength, 0, 1);
            ctx.lineTo(
                lerp(points[i - 1].x, points[i].x, t),
                lerp(points[i - 1].y, points[i].y, t)
            );
            break;
        }
        ctx.stroke();
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
        const triBottom = H * (mobile ? 0.95 : 0.94);
        const triW = W - 2 * padX;
        const triH = Math.min(triBottom - padTop, triW * 0.72);
        const centerX = W / 2;
        const bottom = padTop + triH;

        vertices = [
            { x: centerX - triW / 2, y: bottom },
            { x: centerX, y: padTop },
            { x: centerX + triW / 2, y: bottom }
        ];

        traceBox = null;

        rebuildScreenGrid();
        rebuildStaticLayers();
        draw();
    }

    function rebuildStaticLayers() {
        fieldLayer = makeLayer();
        drawField(fieldLayer.ctx);
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

    }

    function drawCoordinateGrid(g) {
        g.save();
        g.strokeStyle = "rgba(255,255,255,.075)";
        g.lineWidth = 0.5;
        constructionGridLines.forEach(line => {
            g.beginPath();
            g.moveTo(line.a.x, line.a.y);
            g.lineTo(line.b.x, line.b.y);
            g.stroke();
        });
        g.restore();
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
        contourPaths.forEach(paths => {
            paths.forEach(path => {
                if (!path.points.length) return;
                g.beginPath();
                g.moveTo(path.points[0].x, path.points[0].y);
                for (let i = 1; i < path.points.length; i += 1) {
                    g.lineTo(path.points[i].x, path.points[i].y);
                }
                g.strokeStyle = `rgba(255,255,255,${path.alpha})`;
                g.lineWidth = path.width;
                g.stroke();
            });
        });
    }

    function drawTriangle() {
        if (boundaryProgress <= 0 || !boundaryMetrics) {
            return;
        }
        const p = clamp(boundaryProgress, 0, 1);
        const targetDistance = p * boundaryMetrics.perimeter;
        let remaining = targetDistance;

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,.61)";
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(vertices[1].x, vertices[1].y);
        for (const segment of boundaryMetrics.segments) {
            if (remaining <= 0) break;
            const amount = Math.min(segment.length, remaining);
            const t = amount / Math.max(1e-9, segment.length);
            ctx.lineTo(lerp(segment.a.x, segment.b.x, t), lerp(segment.a.y, segment.b.y, t));
            remaining -= amount;
            if (t < 1) break;
        }
        ctx.stroke();
        ctx.restore();
    }

    function drawBuildingField() {
        const p = clamp(fieldReveal, 0, 1);

        if (fieldLayer && p > 0.55) {
            ctx.save();
            ctx.globalAlpha = ease(clamp((p - 0.55) / 0.35, 0, 1)) * 0.95;
            ctx.drawImage(
                fieldLayer.canvas,
                0, 0, fieldLayer.canvas.width, fieldLayer.canvas.height,
                0, 0, W, H
            );
            ctx.restore();
        }

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,.055)";
        ctx.lineWidth = 0.5;
        constructionTriangles.forEach(tri => {
            const local = clamp((p - tri.start) / GRID_TRI_DRAW, 0, 1);
            if (local <= 0) return;
            drawPartialPolyline(tri.cycle, tri.lengths, tri.total, tri.total * ease(local));
        });
        ctx.restore();

        ctx.save();
        contourPaths.forEach(paths => {
            paths.forEach(path => {
                const local = clamp((p - path.start) / Math.max(1e-4, path.end - path.start), 0, 1);
                if (local <= 0) return;
                ctx.strokeStyle = `rgba(255,255,255,${path.alpha})`;
                ctx.lineWidth = path.width;
                drawPartialPolyline(path.points, path.lengths, path.total, path.total * local);
            });
        });
        ctx.restore();
    }

    function drawPiSuperscriptLabel(point, superscript, options = {}) {
        const mobile = W < 520;
        const alpha = options.alpha ?? 0.78;
        const color = options.color ?? `rgba(255,255,255,${alpha})`;
        const dx = options.dx ?? 7;
        const dy = options.dy ?? -8;
        const baseSize = mobile ? 9 : 10;
        const smallSize = mobile ? 6.5 : 7.2;
        const x = point.x + dx;
        const y = point.y + dy;

        ctx.save();
        ctx.fillStyle = color;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = `${baseSize}px "Courier New",Courier,monospace`;
        ctx.fillText("π", x, y);
        const baseWidth = ctx.measureText("π").width;
        ctx.font = `${smallSize}px "Courier New",Courier,monospace`;
        ctx.fillText(superscript, x + baseWidth + 0.5, y - baseSize * 0.32);
        ctx.restore();
    }

    function drawPiSubscriptLabel(point, subscript, options = {}) {
        const mobile = W < 520;
        const alpha = options.alpha ?? 0.88;
        const color = options.color ?? `rgba(255,255,255,${alpha})`;
        const dx = options.dx ?? 8;
        const dy = options.dy ?? -9;
        const baseSize = mobile ? 9 : 10;
        const smallSize = mobile ? 6.5 : 7.2;
        const x = point.x + dx;
        const y = point.y + dy;

        ctx.save();
        ctx.fillStyle = color;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = `${baseSize}px "Courier New",Courier,monospace`;
        ctx.fillText("π", x, y);
        const baseWidth = ctx.measureText("π").width;
        ctx.font = `${smallSize}px "Courier New",Courier,monospace`;
        ctx.fillText(subscript, x + baseWidth + 0.5, y + baseSize * 0.34);
        ctx.restore();
    }

    function drawFiberLabel(m) {
        if (!showFiber) return;
        const [pa, pb] = fixedMeanSegment(m);
        const a = xy(pa);
        const b = xy(pb);
        const t = 0.40;
        const x = lerp(a.x, b.x, t);
        const y = lerp(a.y, b.y, t);
        const mobile = W < 520;
        const text = phase === "canonical"
            ? "m(π)=2"
            : `m(πₜ)=${m.toFixed(2)}`;
        ctx.save();
        ctx.font = `${mobile ? 8 : 9}px "Courier New",Courier,monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = phase === "canonical"
            ? "rgba(0,122,255,.72)"
            : "rgba(0,122,255,.66)";
        ctx.fillText(text, x + 5, y - 5);
        ctx.restore();
    }

    function drawVertexLabels() {
        labelHitBoxes = [];
        if (boundaryProgress <= 0 || !boundaryMetrics) {
            return;
        }
        const mobile = W < 520;
        const p = clamp(boundaryProgress, 0, 1);
        const edge1 = boundaryMetrics.segments[0].length / boundaryMetrics.perimeter;
        const edge2 = (boundaryMetrics.segments[0].length + boundaryMetrics.segments[1].length) / boundaryMetrics.perimeter;
        const midAlpha = clamp(p / 0.08, 0, 1);
        const highAlpha = clamp((p - edge1) / 0.06, 0, 1);
        const lowAlpha = clamp((p - edge2) / 0.06, 0, 1);
        const fontSize = mobile ? 9 : 10;
        const pad = mobile ? 6 : 7;

        function drawLabel(text, x, y, align, alpha) {
            if (alpha <= 0) return;
            ctx.fillStyle = `rgba(255,255,255,${0.52 * alpha})`;
            ctx.textAlign = align;
            ctx.fillText(text, x, y);

            const metrics = ctx.measureText(text);
            const width = metrics.width;
            const height = fontSize + 4;
            let left = x;
            if (align === "center") left = x - width / 2;
            else if (align === "right") left = x - width;
            labelHitBoxes.push({
                left: left - pad,
                right: left + width + pad,
                top: y - height / 2 - pad,
                bottom: y + height / 2 + pad
            });
        }

        ctx.save();
        ctx.font = `${fontSize}px "Courier New",Courier,monospace`;
        ctx.textBaseline = "middle";
        drawLabel("MID 2", vertices[1].x, vertices[1].y - (mobile ? 13 : 14), "center", midAlpha);

        if (mobile) {
            drawLabel("HIGH 8", vertices[2].x - 3, vertices[2].y + 12, "right", highAlpha);
            drawLabel("LOW .5", vertices[0].x + 3, vertices[0].y + 12, "left", lowAlpha);
        } else {
            drawLabel("HIGH 8", vertices[2].x + 8, vertices[2].y + 3, "left", highAlpha);
            drawLabel("LOW .5", vertices[0].x - 8, vertices[0].y + 3, "right", lowAlpha);
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
        drawFiberLabel(m);
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
        if (gp > 0.72) {
            drawPiSuperscriptLabel(point, "*", {
                alpha: 0.68 * clamp((gp - 0.72) / 0.28, 0, 1),
                dx: 9,
                dy: -2
            });
        }
    }

    function drawCanonical() {
        // The web piece does not display the paper-specific canonical beliefs pi^C and pi^U.
        // The canonical phase retains only the fixed-mean fiber m(pi)=2.
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
            drawPiSubscriptLabel(point, "t", { alpha: 0.88, dx: 9, dy: -10 });
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
        ctx.strokeStyle = "rgba(255,255,255,.075)";
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
            drawCoordinateGrid(ctx);
            drawContours(ctx);
        } else {
            drawBuildingField();
        }

        drawTriangle();
        drawVertexLabels();
        drawFiber(mean);
        drawGlobalMax();
        drawCanonical();
        drawPosteriorPath();
    }

    function canvasPointFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        return {
            x: (event.clientX - rect.left) * (W / rect.width),
            y: (event.clientY - rect.top) * (H / rect.height)
        };
    }

    function pointInTriangle(point, a, b, c) {
        const sign = (p1, p2, p3) =>
            (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
        const d1 = sign(point, a, b);
        const d2 = sign(point, b, c);
        const d3 = sign(point, c, a);
        const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
        const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
        return !(hasNeg && hasPos);
    }

    function distanceToSegment(point, a, b) {
        return closestPointOnSegment(point, a, b).distance;
    }

    function pointInArtwork(point) {
        if (!point || vertices.length !== 3) return false;
        if (pointInTriangle(point, vertices[0], vertices[1], vertices[2])) return true;

        const halo = 4;
        if (distanceToSegment(point, vertices[0], vertices[1]) <= halo
            || distanceToSegment(point, vertices[1], vertices[2]) <= halo
            || distanceToSegment(point, vertices[2], vertices[0]) <= halo) {
            return true;
        }

        return labelHitBoxes.some(box =>
            point.x >= box.left && point.x <= box.right
            && point.y >= box.top && point.y <= box.bottom
        );
    }

    function updateArtworkHover(event) {
        const qualified = completed && active && pointInArtwork(canvasPointFromEvent(event));
        wrap.classList.toggle("is-artwork-hovered", qualified);
        return qualified;
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
        wrap.classList.remove("is-resettable", "is-artwork-hovered");
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

    async function runStaticBuild(token) {
        phase = "build";
        boundaryProgress = 0;
        fieldReveal = 0;
        fieldAlpha = 1;
        showGlobal = false;
        globalProgress = 0;
        draw();

        return animateValue(0, 1, TIMING.staticBuild, token, value => {
            boundaryProgress = value;
            fieldReveal = value;
            const arrival = 0.72;
            showGlobal = value >= arrival;
            globalProgress = clamp((value - arrival) / 0.12, 0, 1);
            draw();
        }, t => t);
    }

    async function runCanonical(token) {
        phase = "canonical";
        showGlobal = true;
        globalProgress = 1;
        showFiber = true;
        showCanonical = false;
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
        phaseProgress = 1;
        showFiber = true;
        showPosterior = true;
        showTrace = false;
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
        showCanonical = false;
        phaseProgress = 1;
        showFiber = true;
        showPosterior = true;
        showTrace = false;
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
        showCanonical = false;
        phaseProgress = 1;
        showFiber = true;
        showPosterior = true;
        showTrace = false;

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

        if (!(await runStaticBuild(token))) {
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

    canvas.addEventListener("pointermove", function (event) {
        updateArtworkHover(event);
    });

    canvas.addEventListener("pointerleave", function () {
        wrap.classList.remove("is-artwork-hovered");
    });

    canvas.addEventListener("click", function (event) {
        if (completed && active && pointInArtwork(canvasPointFromEvent(event))) {
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
