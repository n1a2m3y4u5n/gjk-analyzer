// gjk.js - GJK 알고리즘 구현

function minkowskiSupport(shapeA, shapeB, direction) {
    const supportA = shapeA.getSupport(direction);
    const supportB = shapeB.getSupport({x: -direction.x, y: -direction.y});
    return {
        x: supportA.x - supportB.x,
        y: supportA.y - supportB.y
    };
}

function dotProduct(a, b) {
    return a.x * b.x + a.y * b.y;
}

function normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len < 1e-10) return {x: 0, y: 0};
    return {x: v.x / len, y: v.y / len};
}

function perpendicular(v) {
    return {x: -v.y, y: v.x};
}

function perpendicularTowardOrigin(edge, pointOnEdge) {
    let perp = perpendicular(edge);
    const toOrigin = {x: -pointOnEdge.x, y: -pointOnEdge.y};

    if (dotProduct(perp, toOrigin) < 0) {
        perp = {x: -perp.x, y: -perp.y};
    }

    return perp;
}

function handleLineSimplex(simplex) {
    const a = simplex[simplex.length - 1];
    const b = simplex[0];

    const ab = {x: b.x - a.x, y: b.y - a.y};
    const ao = {x: -a.x, y: -a.y};

    if (dotProduct(ab, ao) > 0) {
        const direction = perpendicularTowardOrigin(ab, a);
        return {containsOrigin: false, direction: direction};
    } else {
        simplex.splice(0, 1); // b 제거
        return {containsOrigin: false, direction: ao};
    }
}

function handleTriangleSimplex(simplex) {
    const a = simplex[2];
    const b = simplex[1];
    const c = simplex[0];

    const ab = {x: b.x - a.x, y: b.y - a.y};
    const ac = {x: c.x - a.x, y: c.y - a.y};
    const ao = {x: -a.x, y: -a.y};

    // AB 외향 수직
    let abPerp = perpendicularTowardOrigin(ab, a);
    if (dotProduct(abPerp, ac) > 0) {
        abPerp = {x: -abPerp.x, y: -abPerp.y};
    }

    // AC 외향 수직
    let acPerp = perpendicularTowardOrigin(ac, a);
    if (dotProduct(acPerp, ab) > 0) {
        acPerp = {x: -acPerp.x, y: -acPerp.y};
    }

    // AC 영역
    if (dotProduct(ac, ao) > 0 && dotProduct(acPerp, ao) > 0) {
        simplex.splice(1, 1); // b 제거, [c, a] 남음
        return {containsOrigin: false, direction: acPerp};
    }

    // AB 영역
    if (dotProduct(ab, ao) > 0 && dotProduct(abPerp, ao) > 0) {
        simplex.splice(0, 1); // c 제거, [b, a] 남음
        return {containsOrigin: false, direction: abPerp};
    }

    // 삼각형 내부!
    return {containsOrigin: true, direction: {x: 0, y: 0}};
}

function handleSimplex(simplex) {
    if (simplex.length === 2) {
        return handleLineSimplex(simplex);
    } else if (simplex.length === 3) {
        return handleTriangleSimplex(simplex);
    }

    // 1개 점
    const a = simplex[0];
    return {containsOrigin: false, direction: {x: -a.x, y: -a.y}};
}

function gjkAlgorithm(shapeA, shapeB, maxIterations = 20) {
    const simplex = [];

    // 초기 방향
    let direction = {
        x: shapeB.position.x - shapeA.position.x,
        y: shapeB.position.y - shapeA.position.y
    };

    const dirLen = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (dirLen < 1e-10) {
        direction = {x: 1, y: 0};
    }

    // 첫 번째 점
    let supportPoint = minkowskiSupport(shapeA, shapeB, direction);
    simplex.push(supportPoint);

    direction = {x: -supportPoint.x, y: -supportPoint.y};

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        supportPoint = minkowskiSupport(shapeA, shapeB, direction);

        // 조기 종료
        if (dotProduct(supportPoint, direction) < 0) {
            return {
                collision: false,
                iterations: iteration + 1,
                simplex: simplex
            };
        }

        simplex.push(supportPoint);

        const result = handleSimplex(simplex);

        if (result.containsOrigin) {
            return {
                collision: true,
                iterations: iteration + 1,
                simplex: simplex
            };
        }

        direction = result.direction;

        const dirLen = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (dirLen < 1e-10) {
            return {
                collision: true,
                iterations: iteration + 1,
                simplex: simplex
            };
        }
    }

    return {
        collision: false,
        iterations: maxIterations,
        simplex: simplex
    };
}

function computeMinkowskiDifference(shapeA, shapeB, numSamples = 100) {
    const points = [];
    for (let i = 0; i < numSamples; i++) {
        const angle = (2 * Math.PI * i) / numSamples;
        const direction = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
        const support = minkowskiSupport(shapeA, shapeB, direction);
        points.push(support);
    }
    return points;
}
