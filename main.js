// main.js - 메인 애플리케이션 로직

class MinkowskiGJKAnalyzer {
    constructor() {
        this.worldCanvas = document.getElementById('worldCanvas');
        this.configCanvas = document.getElementById('configCanvas');
        this.worldCtx = this.worldCanvas.getContext('2d');
        this.configCtx = this.configCanvas.getContext('2d');

        // 알고리즘 모드
        this.algorithmMode = 'GJK'; // 'GJK', 'SAT', 'BOTH'

        // 도형 초기화 (충돌 상태)
        this.shapeA = createRegularPolygon(6, 60, {x: 380, y: 320});
        this.shapeA.color = '#6495ED';

        this.shapeB = new Ellipse(70, 50, {x: 320, y: 280});
        this.shapeB.color = '#90EE90';

        // 드래그 상태
        this.dragging = null;
        this.dragOffset = {x: 0, y: 0};

        // 결과
        this.gjkResult = null;
        this.satResult = null;
        this.gjkTime = 0;
        this.satTime = 0;
        this.minkowskiPoints = [];

        // 이벤트 리스너
        this.setupEventListeners();

        // 초기 계산
        this.updateAlgorithms();

        // 렌더링 시작
        this.render();
    }

    setupEventListeners() {
        // 마우스 이벤트 (월드 캔버스)
        this.worldCanvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.worldCanvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.worldCanvas.addEventListener('mouseup', () => this.onMouseUp());
        this.worldCanvas.addEventListener('mouseleave', () => this.onMouseUp());

        // 버튼 이벤트
        document.getElementById('modeGJK').addEventListener('click', () => this.setMode('GJK'));
        document.getElementById('modeSAT').addEventListener('click', () => this.setMode('SAT'));
        document.getElementById('modeBOTH').addEventListener('click', () => this.setMode('BOTH'));
        document.getElementById('btnRandom').addEventListener('click', () => this.randomizeShapes());
        document.getElementById('btnReset').addEventListener('click', () => this.reset());
    }

    setMode(mode) {
        this.algorithmMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('mode' + mode).classList.add('active');
        this.updateAlgorithms();
        this.render();
    }

    updateAlgorithms() {
        // GJK는 시각화를 위해 항상 실행
        const startGJK = performance.now();
        this.gjkResult = gjkAlgorithm(this.shapeA, this.shapeB);
        this.gjkTime = performance.now() - startGJK;
        this.minkowskiPoints = computeMinkowskiDifference(this.shapeA, this.shapeB, 100);

        // SAT는 SAT/BOTH 모드일 때만
        if (this.algorithmMode === 'SAT' || this.algorithmMode === 'BOTH') {
            const startSAT = performance.now();
            this.satResult = satAlgorithm(this.shapeA, this.shapeB);
            this.satTime = performance.now() - startSAT;
        } else {
            this.satResult = null;
            this.satTime = 0;
        }
    }

    getMousePos(e) {
        const rect = this.worldCanvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    pointInShape(point, shape) {
        const dx = point.x - shape.position.x;
        const dy = point.y - shape.position.y;
        return Math.sqrt(dx * dx + dy * dy) < 80; // 대략적
    }

    onMouseDown(e) {
        const pos = this.getMousePos(e);

        if (this.pointInShape(pos, this.shapeA)) {
            this.dragging = this.shapeA;
            this.dragOffset = {
                x: this.shapeA.position.x - pos.x,
                y: this.shapeA.position.y - pos.y
            };
        } else if (this.pointInShape(pos, this.shapeB)) {
            this.dragging = this.shapeB;
            this.dragOffset = {
                x: this.shapeB.position.x - pos.x,
                y: this.shapeB.position.y - pos.y
            };
        }
    }

    onMouseMove(e) {
        if (this.dragging) {
            const pos = this.getMousePos(e);
            this.dragging.setPosition({
                x: pos.x + this.dragOffset.x,
                y: pos.y + this.dragOffset.y
            });
            this.updateAlgorithms();
            this.render();
        }
    }

    onMouseUp() {
        this.dragging = null;
    }

    randomizeShapes() {
        const shapes = ['triangle', 'square', 'pentagon', 'hexagon', 'octagon', 'decagon'];
        const shapeA = shapes[Math.floor(Math.random() * shapes.length)];
        const shapeB = shapes[Math.floor(Math.random() * shapes.length)];

        const posAX = 200 + Math.random() * 300;
        const posAY = 200 + Math.random() * 200;

        // 50% 충돌 케이스
        let posBX, posBY;
        if (Math.random() < 0.5) {
            // 충돌
            posBX = posAX + (Math.random() - 0.5) * 80;
            posBY = posAY + (Math.random() - 0.5) * 80;
        } else {
            // 비충돌
            posBX = 100 + Math.random() * 500;
            posBY = 100 + Math.random() * 400;
        }

        this.shapeA = this.createShapeByName(shapeA, {x: posAX, y: posAY});
        this.shapeA.color = '#6495ED';

        // 타원도 포함
        if (Math.random() < 0.3) {
            this.shapeB = new Ellipse(
                60 + Math.random() * 40,
                40 + Math.random() * 40,
                {x: posBX, y: posBY}
            );
        } else {
            this.shapeB = this.createShapeByName(shapeB, {x: posBX, y: posBY});
        }
        this.shapeB.color = '#90EE90';

        this.updateAlgorithms();
        this.render();
    }

    createShapeByName(name, pos) {
        const sizeMap = {
            triangle: 3,
            square: 4,
            pentagon: 5,
            hexagon: 6,
            octagon: 8,
            decagon: 10
        };
        return createRegularPolygon(sizeMap[name], 50 + Math.random() * 30, pos);
    }

    reset() {
        this.shapeA = createRegularPolygon(6, 60, {x: 380, y: 320});
        this.shapeA.color = '#6495ED';
        this.shapeB = new Ellipse(70, 50, {x: 320, y: 280});
        this.shapeB.color = '#90EE90';
        this.updateAlgorithms();
        this.render();
    }

    render() {
        this.renderWorldSpace();
        this.renderConfigSpace();
        this.renderUI();
    }

    renderWorldSpace() {
        const ctx = this.worldCtx;
        const canvas = this.worldCanvas;

        // 배경
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 그리드
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Shape A
        this.drawShape(ctx, this.shapeA);

        // Shape B
        this.drawShape(ctx, this.shapeB);

        // 라벨
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('A', this.shapeA.position.x - 5, this.shapeA.position.y - 50);
        ctx.fillText('B', this.shapeB.position.x - 5, this.shapeB.position.y - 50);
    }

    renderConfigSpace() {
        const ctx = this.configCtx;
        const canvas = this.configCanvas;

        // 배경
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 좌표 변환 (원점을 중앙으로)
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(1, -1); // Y축 반전

        // 그리드
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        for (let x = -canvas.width / 2; x < canvas.width / 2; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, -canvas.height / 2);
            ctx.lineTo(x, canvas.height / 2);
            ctx.stroke();
        }
        for (let y = -canvas.height / 2; y < canvas.height / 2; y += 50) {
            ctx.beginPath();
            ctx.moveTo(-canvas.width / 2, y);
            ctx.lineTo(canvas.width / 2, y);
            ctx.stroke();
        }

        // 민코프스키 차
        if (this.minkowskiPoints.length > 0) {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.beginPath();
            ctx.moveTo(this.minkowskiPoints[0].x, this.minkowskiPoints[0].y);
            for (let i = 1; i < this.minkowskiPoints.length; i++) {
                ctx.lineTo(this.minkowskiPoints[i].x, this.minkowskiPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 원점
        ctx.fillStyle = '#dc143c';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, 2 * Math.PI);
        ctx.fill();

        // GJK 단체
        if (this.gjkResult && this.gjkResult.simplex) {
            ctx.strokeStyle = '#ff8c00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const simplex = this.gjkResult.simplex;
            if (simplex.length > 0) {
                ctx.moveTo(simplex[0].x, simplex[0].y);
                for (let i = 1; i < simplex.length; i++) {
                    ctx.lineTo(simplex[i].x, simplex[i].y);
                }
                if (simplex.length === 3) {
                    ctx.closePath();
                }
                ctx.stroke();

                // 꼭짓점
                ctx.fillStyle = '#ff8c00';
                for (const point of simplex) {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }

        ctx.restore();

        // 라벨
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Origin (0, 0)', canvas.width / 2 + 10, canvas.height / 2 - 10);
    }

    drawShape(ctx, shape) {
        const vertices = shape.getVertices();

        ctx.fillStyle = shape.color + '80'; // 반투명
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    renderUI() {
        const collisionDiv = document.getElementById('collisionStatus');
        const gjkDiv = document.getElementById('gjkInfo');
        const satDiv = document.getElementById('satInfo');

        // 충돌 상태
        let collision = false;
        if (this.algorithmMode === 'SAT' && this.satResult && this.satResult.collision !== null) {
            collision = this.satResult.collision;
        } else if (this.gjkResult) {
            collision = this.gjkResult.collision;
        }

        collisionDiv.textContent = collision ? '🔴 충돌 감지됨 (COLLISION)' : '🟢 충돌 없음 (NO COLLISION)';
        collisionDiv.className = collision ? 'status-text status-collision' : 'status-text status-no-collision';

        // 알고리즘 정보
        if (this.algorithmMode === 'GJK' && this.gjkResult) {
            gjkDiv.textContent = `GJK: ${this.gjkResult.iterations}회 반복, ${this.gjkTime.toFixed(3)}ms`;
            satDiv.textContent = '';
        } else if (this.algorithmMode === 'SAT' && this.satResult) {
            gjkDiv.textContent = '';
            if (this.satResult.error) {
                satDiv.textContent = `SAT: ${this.satResult.error}`;
            } else {
                satDiv.textContent = `SAT: ${this.satResult.axesChecked}개 축 검사, ${this.satTime.toFixed(3)}ms`;
            }
        } else if (this.algorithmMode === 'BOTH') {
            if (this.gjkResult) {
                gjkDiv.textContent = `GJK: ${this.gjkResult.iterations}회 반복, ${this.gjkTime.toFixed(3)}ms`;
            }
            if (this.satResult) {
                if (this.satResult.error) {
                    satDiv.textContent = `SAT: ${this.satResult.error}`;
                } else {
                    satDiv.textContent = `SAT: ${this.satResult.axesChecked}개 축 검사, ${this.satTime.toFixed(3)}ms`;
                }
            }
        }
    }
}

// 앱 시작
window.addEventListener('load', () => {
    new MinkowskiGJKAnalyzer();
});
