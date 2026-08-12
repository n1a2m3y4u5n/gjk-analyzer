// shapes.js - 도형 클래스 정의

class ConvexShape {
    constructor(position = {x: 0, y: 0}) {
        this.position = position;
        this.color = '#6495ED'; // Cornflower Blue
    }

    getSupport(direction) {
        throw new Error('getSupport must be implemented');
    }

    getVertices() {
        throw new Error('getVertices must be implemented');
    }

    setPosition(pos) {
        this.position = pos;
    }
}

class Polygon extends ConvexShape {
    constructor(vertices, position = {x: 0, y: 0}) {
        super(position);
        this.localVertices = vertices; // 상대 좌표
        this.color = '#6495ED';
    }

    getSupport(direction) {
        // 방향 정규화
        const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        const normDir = {
            x: direction.x / (len + 1e-10),
            y: direction.y / (len + 1e-10)
        };

        let maxDot = -Infinity;
        let supportVertex = this.localVertices[0];

        for (const vertex of this.localVertices) {
            const globalVertex = {
                x: this.position.x + vertex.x,
                y: this.position.y + vertex.y
            };
            const dot = normDir.x * globalVertex.x + normDir.y * globalVertex.y;

            if (dot > maxDot) {
                maxDot = dot;
                supportVertex = vertex;
            }
        }

        return {
            x: this.position.x + supportVertex.x,
            y: this.position.y + supportVertex.y
        };
    }

    getVertices() {
        return this.localVertices.map(v => ({
            x: this.position.x + v.x,
            y: this.position.y + v.y
        }));
    }
}

class Ellipse extends ConvexShape {
    constructor(a, b, position = {x: 0, y: 0}) {
        super(position);
        this.a = a; // 장축
        this.b = b; // 단축
        this.color = '#90EE90'; // Light Green
    }

    getSupport(direction) {
        const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        const normDir = {
            x: direction.x / (len + 1e-10),
            y: direction.y / (len + 1e-10)
        };

        // 타원의 지지 함수: θ = atan2(-b*dy, a*dx)
        const theta = Math.atan2(-this.b * normDir.y, this.a * normDir.x);

        const localSupport = {
            x: this.a * Math.cos(theta),
            y: this.b * Math.sin(theta)
        };

        return {
            x: this.position.x + localSupport.x,
            y: this.position.y + localSupport.y
        };
    }

    getVertices(numSegments = 32) {
        const vertices = [];
        for (let i = 0; i < numSegments; i++) {
            const theta = (2 * Math.PI * i) / numSegments;
            vertices.push({
                x: this.position.x + this.a * Math.cos(theta),
                y: this.position.y + this.b * Math.sin(theta)
            });
        }
        return vertices;
    }
}

// 헬퍼 함수들
function createRegularPolygon(n, radius, position) {
    const vertices = [];
    for (let i = 0; i < n; i++) {
        const theta = (2 * Math.PI * i) / n - Math.PI / 2;
        vertices.push({
            x: radius * Math.cos(theta),
            y: radius * Math.sin(theta)
        });
    }
    return new Polygon(vertices, position);
}

function createRectangle(width, height, position) {
    const hw = width / 2;
    const hh = height / 2;
    const vertices = [
        {x: -hw, y: -hh},
        {x: hw, y: -hh},
        {x: hw, y: hh},
        {x: -hw, y: hh}
    ];
    return new Polygon(vertices, position);
}
