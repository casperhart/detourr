import * as THREE from 'three';
import { ProjectionMatrix, ScatterInputData, Config, Matrix, Dim, ControlType } from './data';
import { multiply2, multiply3, centerColumns, getColMeans } from './utils'
import { FRAGMENT_SHADER, VERTEX_SHADER_2D, VERTEX_SHADER_3D } from './shaders';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { playIcon, pauseIcon, resetIcon, panIcon, orbitIcon } from './icons'
import './style.css'

export class ScatterWidget {
    private container: HTMLElement;
    private canvas: HTMLCanvasElement = document.createElement("canvas");
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
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
    private colMeans: Matrix;
    private mapping: { colour: string[] };
    private pointColours: THREE.BufferAttribute;
    private width: number;
    private height: number;
    private dim: Dim;
    private multiply: Function;
    private controlType: ControlType;

    constructor(containerElement: HTMLElement, width: number, height: number) {
        this.width = width;
        this.height = height;
        this.addContainerElement(containerElement);
        this.addCanvas();
        this.addScene();

        this.addRenderer();
        this.addControls();
    }

    private constructPlot() {

        this.colMeans = getColMeans(this.dataset);

        this.pointColours = this.coloursToBufferAttribute(this.mapping.colour)

        let pointsGeometry = new THREE.BufferGeometry();
        let pointSize: number = this.dataset.length ** (-1 / 3)

        let shaderOpts = this.getShaderOpts(pointSize, this.dim);
        let pointsMaterial = new THREE.ShaderMaterial(shaderOpts);

        let pointsBuffer = this.getPointsBuffer(0, this.config.center)
        pointsGeometry.setAttribute('position', pointsBuffer);

        if (this.config.cacheFrames) {
            this.pointsBuffers.push(pointsBuffer)
        }

        this.points = new THREE.Points(pointsGeometry, pointsMaterial)
        this.points.geometry.setAttribute('color', this.pointColours)
        this.scene.add(this.points)

        let axisLinesGeometry = new THREE.BufferGeometry()
        let axisLinesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })

        let axisLinesBuffer = this.getAxisLinesBuffer(0)
        axisLinesGeometry.setAttribute('position', axisLinesBuffer)

        this.axisSegments = new THREE.LineSegments(axisLinesGeometry, axisLinesMaterial)
        this.scene.add(this.axisSegments)

        this.orbitControls = this.addOrbitControls(this.camera, this.renderer.domElement, this.dim);

        this.clock = new THREE.Clock();
        this.time = 0;
        this.oldFrame = -1;

        this.isPaused = false;
    }

    public resize(newWidth: number, newHeight: number) {
        let aspect = newWidth / newHeight;
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        if (this.dim == 3) {
            (this.camera as THREE.PerspectiveCamera).aspect = aspect;
        }
        else {
            (this.camera as THREE.OrthographicCamera).left = - 1 * aspect;
            (this.camera as THREE.OrthographicCamera).right = 1 * aspect;
            (this.camera as THREE.OrthographicCamera).top = 1;
            (this.camera as THREE.OrthographicCamera).bottom = - 1;
        }
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(newWidth, newHeight)
    }

    public renderValue(inputData: ScatterInputData) {
        this.config = inputData.config;
        this.dataset = inputData.dataset;
        this.projectionMatrices = inputData.projectionMatrices;
        this.dim = inputData.projectionMatrices[0][0].length;
        if (this.dim == 3) {
            this.multiply = multiply3
        } else {
            this.multiply = multiply2
        }
        this.addCamera(this.dim);
        this.mapping = inputData.mapping

        this.constructPlot();
        this.animate();
    }

    private addContainerElement(containerElement: HTMLElement) {
        containerElement.className = "scatterWidgetContainer";
        this.container = containerElement;
    }

    private addScene() {
        let scene = new THREE.Scene();
        scene.background = new THREE.Color(0xfffffff);
        const light = new THREE.AmbientLight(0x404040); // soft white light
        scene.add(light);
        this.scene = scene;
    }

    private addCanvas() {
        let canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.id = `${this.container.id}-canvas`;
        canvas.className = "scatterWidgetCanvas";
        this.container.appendChild(canvas);
        this.canvas = canvas;
    }

    private addCamera(dim: Dim) {
        let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
        let aspect = this.width / this.height;
        if (dim == 3) {
            camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 1000);
            camera.position.setZ(4);
        }
        else {
            camera = new THREE.OrthographicCamera(-1 * aspect, 1 * aspect, 1, -1, -1000, 1000);
            // orbit controls don't rotate along camera z axis at all, so as a hack, we disable rotation
            // on the y axis and change the camera view
            camera.position.setY(4);
            camera.up.set(0, -1, 0)
        }
        this.camera = camera;
    }

    private addRenderer() {
        let renderer = new THREE.WebGLRenderer({
            canvas: this.canvas
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(this.width, this.height);
        this.renderer = renderer;
    }

    private addOrbitControls(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, el: HTMLElement, dim: Dim): OrbitControls {
        let orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        if (dim == 2) {
            // We can only disable rotation on the x and y axes, so to get around this, we need 
            // to disable rotation on y, and modify the camera view to be top-down
            orbitControls.minPolarAngle = Math.PI;
            orbitControls.maxPolarAngle = Math.PI;
        }
        return orbitControls
    }

    private getShaderOpts(pointSize: number, dim: Dim) {
        let shaderOpts: any;
        if (dim == 2) {
            shaderOpts = {
                uniforms: {
                    size: { value: Math.max(pointSize, this.minPointSize) },
                    zoom: { value: this.camera.zoom },
                },
                vertexShader: VERTEX_SHADER_2D,
                fragmentShader: FRAGMENT_SHADER,
            }
        }
        else {
            shaderOpts = {
                uniforms: {
                    size: { value: Math.max(pointSize, this.minPointSize) },
                },
                vertexShader: VERTEX_SHADER_3D,
                fragmentShader: FRAGMENT_SHADER,
            }
        }
        return shaderOpts
    }

    private getPointsBuffer(i: number, center: boolean): THREE.BufferAttribute {
        let positionMatrix: Matrix = this.multiply(this.dataset, this.projectionMatrices[i]);

        if (center) {
            let colMeans = this.multiply(this.colMeans, this.projectionMatrices[i]);
            positionMatrix = centerColumns(positionMatrix, colMeans)
        }

        let flattenedPositionMatrix = new Float32Array([].concat(...positionMatrix));
        return new THREE.BufferAttribute(flattenedPositionMatrix, 3)
    }

    private getAxisLinesBuffer(i: number): THREE.BufferAttribute {
        let projectionMatrix = this.projectionMatrices[i]
        let linesBufferMatrix;
        if (this.dim == 3) {
            linesBufferMatrix = projectionMatrix.map(row => [0, 0, 0].concat(row))
        } else if (this.dim == 2) {
            linesBufferMatrix = projectionMatrix.map(row => [0, 0, 0, row[0], 0, row[1]])
        }
        return new THREE.BufferAttribute(new Float32Array([].concat(...linesBufferMatrix)), 3)
    }

    private coloursToBufferAttribute(colours: string[]): THREE.BufferAttribute {
        let colour = new THREE.Color;
        let bufferArray = new Float32Array(this.dataset.length * 3)

        if (colours.length > 0) {
            let j = 0;
            for (let i = 0; i < colours.length; i++) {
                j = 3 * i;
                colour.set(colours[i])
                bufferArray[j] = colour.r
                bufferArray[j + 1] = colour.g
                bufferArray[j + 2] = colour.b
            }
        }
        return new THREE.BufferAttribute(bufferArray, 3)
    }

    private addControls() {
        this.addButton("playPause", "Play / Pause", pauseIcon, () => this.setIsPaused(!this.getIsPaused()));
        this.addButton("reset", "Restart tour", resetIcon, () => this.resetClock());
        this.addButton("pan", "Switch to pan controls", panIcon, () => this.setControlType(this.controlType == "PAN" ? "ORBIT" : "PAN"))
    }

    private addButton(name: string, hoverText: string, icon: string, buttonCallback: Function) {
        let button = document.createElement("button");
        button.innerHTML = icon;
        button.title = hoverText;
        button.className = `${name}Button`;
        button.onclick = () => buttonCallback();
        this.container.appendChild(button);
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
        if (this.dim == 2) {
            (this.points.material as THREE.ShaderMaterial).uniforms.zoom.value = this.camera.zoom;
        }
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => this.animate());
    }

    private getIsPaused(): boolean {
        return this.isPaused
    }

    private setIsPaused(isPaused: boolean) {
        this.isPaused = isPaused
        let playPauseButton = this.container.querySelector('.playPauseButton')

        if (!isPaused) {
            this.animate()
            playPauseButton.innerHTML = pauseIcon
        }
        else {
            playPauseButton.innerHTML = playIcon
        }
    }

    private setControlType(controlType: ControlType) {
        let buttonClassName = controlType == "ORBIT" ? ".orbitButton" : ".panButton"
        let orbitPanButton: HTMLButtonElement = this.container.querySelector(buttonClassName);
        if (controlType == "ORBIT") {
            orbitPanButton.innerHTML = panIcon;
            orbitPanButton.title = "Switch to pan controls"
            orbitPanButton.className = "panButton"
            this.orbitControls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            }
        }
        else {
            orbitPanButton.innerHTML = orbitIcon;
            orbitPanButton.title = "Switch to orbit controls";
            orbitPanButton.className = "orbitButton";
            this.orbitControls.mouseButtons = {
                LEFT: THREE.MOUSE.PAN,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.ROTATE
            }
        }
        this.controlType = controlType;
    }

    private resetClock() {
        this.time = 0
    }
}