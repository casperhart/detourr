import * as THREE from 'three';
import { ProjectionMatrix, ScatterInputData, Config, Matrix } from './data';
import { multiply, centerColumns } from './utils'
import { FRAGMENT_SHADER, VERTEX_SHADER } from './shaders';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class ScatterWidget {
    private container: HTMLElement;
    private canvas: HTMLCanvasElement = document.createElement("canvas");
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private renderer: THREE.WebGLRenderer;
    private config: Config;
    private dataset: Matrix;
    private projectionMatrices: Array<ProjectionMatrix>;
    private clock = new THREE.Clock();
    private time: number;
    private oldFrame: number;
    private pointsBuffers: THREE.BufferAttribute[] = [];
    private points: THREE.Points;
    private axisSegments: THREE.LineSegments;
    private minPointSize: number = 0.02;
    private orbitControls: OrbitControls;
    private isPaused: boolean;

    constructor(containerElement: HTMLElement, width: number, height: number) {

        this.scene = new THREE.Scene()

        const light = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(light);

        this.canvas.width = width;
        this.canvas.height = height;

        this.container = containerElement;
        this.container.appendChild(this.canvas)

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas
        });

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
        this.camera.position.setZ(4);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.renderer.render(this.scene, this.camera);
    }

    private constructPlot() {

        //todo: implement this check in the R code
        if (this.projectionMatrices[0][0].length != 3) {
            throw new TypeError(`Projection matrix must be of dimension 3. got ${this.projectionMatrices[0][0].length}`)
        }

        let pointsGeometry = new THREE.BufferGeometry();
        let pointSize: number = this.dataset.length ** (-1 / 3)

        let pointsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                size: { value: Math.max(pointSize, this.minPointSize) }
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
        });

        let pointsBuffer = this.getPointsBuffer(0, this.config.center)
        pointsGeometry.setAttribute('position', pointsBuffer);

        if (this.config.cacheFrames) {
            this.pointsBuffers.push(pointsBuffer)
        }

        this.points = new THREE.Points(pointsGeometry, pointsMaterial)
        this.scene.add(this.points)

        let axisLinesGeometry = new THREE.BufferGeometry()
        let axisLinesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 })

        let axisLinesBuffer = this.getAxisLinesBuffer(0)
        axisLinesGeometry.setAttribute('position', axisLinesBuffer)

        this.axisSegments = new THREE.LineSegments(axisLinesGeometry, axisLinesMaterial)
        this.scene.add(this.axisSegments)

        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.time = 0;
        this.oldFrame = -1;

        this.isPaused = false;

        // todo: set up proper controls to avoid orbit controls triggering play/pause
        this.container.addEventListener('click', () => this.setIsPaused(!this.isPaused), false);
    }

    public resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    public renderValue(inputData: ScatterInputData) {
        this.config = inputData.config;
        this.dataset = inputData.dataset;
        this.projectionMatrices = inputData.projectionMatrices;

        this.constructPlot();
        this.animate();
    }

    private getPointsBuffer(i: number, center: boolean): THREE.BufferAttribute {
        let positionMatrix: Matrix = multiply(this.dataset, this.projectionMatrices[i]);

        if (center) {
            positionMatrix = centerColumns(positionMatrix)
        }

        let flattenedPositionMatrix = new Float32Array([].concat(...positionMatrix));
        return new THREE.BufferAttribute(flattenedPositionMatrix, 3)
    }

    private getAxisLinesBuffer(i: number): THREE.BufferAttribute {
        let projectionMatrix = this.projectionMatrices[i]
        let linesBufferMatrix = projectionMatrix.map(row => [0, 0, 0].concat(row))
        return new THREE.BufferAttribute(new Float32Array([].concat(...linesBufferMatrix)), 3)
    }



    private animate() {
        let delta = this.clock.getDelta();

        if (!this.getIsPaused()) {
            this.time += delta;
        }

        if (this.time >= this.config.duration) this.time = 0;

        let currentFrame = Math.floor(this.time * this.config.fps);

        if (currentFrame != this.oldFrame) {
            let frameBuffer: THREE.BufferAttribute

            if (this.pointsBuffers[currentFrame] == undefined) {
                frameBuffer = this.getPointsBuffer(currentFrame, this.config.center)
                if (this.config.cacheFrames) {
                    this.pointsBuffers[currentFrame] = frameBuffer
                }
            }
            else {
                frameBuffer = this.pointsBuffers[currentFrame]
            }

            this.points.geometry.setAttribute('position', frameBuffer);
            this.points.geometry.attributes.position.needsUpdate = true;

            this.axisSegments.geometry.setAttribute('position', this.getAxisLinesBuffer(currentFrame))
            this.axisSegments.geometry.attributes.position.needsUpdate = true;

            this.oldFrame = currentFrame;
        }

        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => this.animate());
    }

    private getIsPaused(): boolean {
        return this.isPaused
    }

    private setIsPaused(isPaused: boolean) {
        this.isPaused = isPaused

        if (!isPaused) {
            this.animate()
        }
    }
}