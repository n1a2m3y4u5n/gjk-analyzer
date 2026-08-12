// sat.js - SAT (Separating Axis Theorem) 알고리즘 구현

function getPolygonAxes(polygon) {
    const axes = [];
    const vertices = polygon.getVertices();
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
        const edge = {
            x: vertices[(i + 1) % n].x - vertices[i].x,
            y: vertices[(i + 1) % n].y - vertices[i].y
        };

        // 변에 수직인 벡터 (90도 회전)
        const normal = {x: -edge.y, y: edge.x};

        // 정규화
        const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        if (length > 1e-10) {
            axes.push({
                x: normal.x / length,
                y: normal.y / length
            });
        }
    }

    return axes;
}

function projectPolygonOntoAxis(polygon, axis) {
    const vertices = polygon.getVertices();
    const projections = vertices.map(v => v.x * axis.x + v.y * axis.y);

    return {
        min: Math.min(...projections),
        max: Math.max(...projections)
    };
}

function intervalsOverlap(a, b) {
    return !(a.max < b.min || b.max < a.min);
}

function satAlgorithm(shapeA, shapeB) {
    // SAT는 다각형에만 적용 가능
    if (!(shapeA instanceof Polygon) || !(shapeB instanceof Polygon)) {
        return {
            collision: null,
            axesChecked: 0,
            error: 'SAT는 다각형에만 적용 가능'
        };
    }

    const axesA = getPolygonAxes(shapeA);
    const axesB = getPolygonAxes(shapeB);
    const allAxes = [...axesA, ...axesB];

    let axesChecked = 0;

    for (const axis of allAxes) {
        axesChecked++;

        const projA = projectPolygonOntoAxis(shapeA, axis);
        const projB = projectPolygonOntoAxis(shapeB, axis);

        if (!intervalsOverlap(projA, projB)) {
            // 분리축 발견!
            return {
                collision: false,
                axesChecked: axesChecked
            };
        }
    }

    // 모든 축에서 겹침 → 충돌
    return {
        collision: true,
        axesChecked: axesChecked
    };
}
