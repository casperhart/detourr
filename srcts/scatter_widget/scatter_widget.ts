import * as THREE from 'three';
import { ProjectionMatrix, ScatterInputData, Config, Matrix, Dim, ControlType, Camera, BoxSelection } from './types';
import { multiply2, multiply3, centerColumns, getColMeans } from './utils'
import { FRAGMENT_SHADER, VERTEX_SHADER_2D, VERTEX_SHADER_3D } from './shaders';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';
import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionHelper.js';
import { playIcon, pauseIcon, resetIcon, panIcon, orbitIcon, selectIcon } from './icons'
import './style.css'

export class ScatterWidget {
    private container: HTMLElement;
    private canvas: HTMLCanvasElement = document.createElement("canvas");
    private scene: THREE.Scene;
    private camera: Camera;
    private renderer: THREE.WebGLRenderer;
    private config: Config;
    private dataset: Matrix;
    private projectionMatrices: Array<ProjectionMatrix>;
    private clock = new THREE.Clock();
    private time: number;
    private oldFrame: number;
    private points: THREE.Points;
    private axisSegments: THREE.LineSegments;
    private minPointSize: number = 0.02;
    private orbitControls: OrbitControls;
    private isPaused: boolean;
    private colMeans: Matrix;
    private mapping: { colour: string[] };
    private pointColours: THREE.BufferAttribute;
    private pickingColours: THREE.BufferAttribute;
    private width: number;
    private height: number;
    private dim: Dim;
    private multiply: Function;
    private controlType: ControlType;
    private pickingTexture: THREE.WebGLRenderTarget;
    private selectionBox: SelectionBox;
    private selectionHelper: SelectionHelper
    private selectedPointIndices: number[];
    private isSelecting = false;
    private axisLabels: Array<AxisLabel>;
    private hasAxisLabels: boolean;

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

        this.pointColours = this.coloursToBufferAttribute(this.mapping.colour);
        this.pickingColours = this.getPickingColours();

        let pointsGeometry = new THREE.BufferGeometry();
        let pointSize = this.config.size / 10;

        let shaderOpts = this.getShaderOpts(pointSize, this.dim);
        let pointsMaterial = new THREE.ShaderMaterial(shaderOpts);

        let pointsBuffer = this.getPointsBuffer(0, this.config.center)
        pointsGeometry.setAttribute('position', pointsBuffer);

        this.points = new THREE.Points(pointsGeometry, pointsMaterial)
        this.points.geometry.setAttribute('color', this.pointColours)
        this.scene.add(this.points)

        let axisLinesGeometry = new THREE.BufferGeometry()
        let axisLinesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })

        let axisLinesBuffer = this.getAxisLinesBuffer(0)
        axisLinesGeometry.setAttribute('position', axisLinesBuffer)

        this.axisSegments = new THREE.LineSegments(axisLinesGeometry, axisLinesMaterial)
        this.scene.add(this.axisSegments)

        this.addAxisLabels();

        this.addOrbitControls();

        // resize picking renderer
        let dpr = this.renderer.getPixelRatio();
        this.pickingTexture = new THREE.WebGLRenderTarget(
            this.width * dpr,
            this.height * dpr
        );

        this.selectionBox = new SelectionBox(this.camera, this.scene);
        this.selectionHelper = new SelectionHelper(this.selectionBox, this.renderer, 'disabled');

        this.clock = new THREE.Clock();
        this.time = 0;
        this.oldFrame = -1;

        this.isPaused = false;
    }

    public resize(newWidth: number, newHeight: number) {
        let aspect = newWidth / newHeight;
        let dpr = this.renderer.getPixelRatio();
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

        // resize picking renderer
        this.pickingTexture.setSize(
            newWidth * dpr,
            newHeight * dpr
        );

        this.axisLabels.map(x => x.setDpr(dpr));
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
        let camera: Camera;
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

    private addOrbitControls() {
        let orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        if (this.dim == 2) {
            // We can only disable rotation on the x and y axes, so to get around this, we need 
            // to disable rotation on y, and modify the camera view to be top-down
            orbitControls.minPolarAngle = Math.PI;
            orbitControls.maxPolarAngle = Math.PI;
        }
        this.orbitControls = orbitControls;
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

    private getPickingColours(): THREE.BufferAttribute {
        // picking colours are just sequential IDs converted to RGB values
        let bufferArray = new Float32Array(this.dataset.length * 3)
        let j = 0;
        for (let i = 1; i <= this.dataset.length; i++) {
            // bit masking
            bufferArray[j] = ((i >> 16) & 0xff) / 255
            bufferArray[j + 1] = ((i >> 8) & 0xff) / 255
            bufferArray[j + 2] = (i & 0xff) / 255
            j += 3;
        }
        return new THREE.BufferAttribute(bufferArray, 3)
    }

    private addControls() {
        this.addButton("playPause", "Play / Pause", pauseIcon, () => this.setIsPaused(!this.getIsPaused()));
        this.addButton("reset", "Restart tour", resetIcon, () => this.resetClock());
        this.addButton("pan", "Switch to pan controls", panIcon, () => this.setControlType("PAN"));
        this.addButton("orbit", "Switch to orbit controls", orbitIcon, () => this.setControlType("ORBIT"));
        this.addButton("select", "Switch to selection controls", selectIcon, () => this.setControlType("SELECT"));
        this.addColourSelector();

        // set orbit as default
        this.controlType = "ORBIT";
        let currentButton: HTMLButtonElement = this.container.querySelector(`.orbitButton`);
        currentButton.className = 'orbitButton selected';
    }

    private addButton(name: string, hoverText: string, icon: string, buttonCallback: Function) {
        let button = document.createElement("button");
        button.innerHTML = icon;
        button.title = hoverText;
        button.className = `${name}Button`;
        button.onclick = () => buttonCallback();
        this.container.appendChild(button);
    }

    private addColourSelector() {
        // add colour picker
        let colourSelector = document.createElement("input");
        colourSelector.setAttribute("type", "color");
        colourSelector.className = "colourSelector";
        colourSelector.setAttribute("value", "#619CFF");
        colourSelector.setAttribute("title", "Select colour to apply using selection box")
        this.container.appendChild(colourSelector)
    }

    private addAxisLabels() {
        let dpr = this.renderer.getPixelRatio();
        if (this.config.labels == []) {
            this.hasAxisLabels = false
        } else {
            this.hasAxisLabels = true
            this.axisLabels = this.config.labels.map(label => {
                return new AxisLabel(label, [0, 0, 0], this.container, this.canvas, this.camera, this.dim, dpr)
            });
        }
    };

    private setPointIndicesFromBoxSelection(selection: SelectionBox) {
        const { pickingTexture, renderer, canvas } = this;
        const dpr = renderer.getPixelRatio();

        let canvas_coords = canvas.getBoundingClientRect();
        let x = (Math.min(selection.startPoint.x, selection.endPoint.x) - canvas_coords.left) * dpr;
        let y = (Math.max(selection.startPoint.y, selection.endPoint.y) - canvas_coords.top) * dpr;
        let width = Math.abs(selection.startPoint.x - selection.endPoint.x) * dpr;
        let height = Math.abs(selection.startPoint.y - selection.endPoint.y) * dpr;


        let pixelBuffer = new Uint8Array(4 * width * height);

        this.renderer.readRenderTargetPixels(
            pickingTexture,
            x,
            pickingTexture.height - y,
            width,
            height,
            pixelBuffer);

        let selectedPointIndices = new Set<number>()
        let id;
        for (let i = 0; i < width * height; i++) {
            id =
                (pixelBuffer[4 * i] << 16) |
                (pixelBuffer[4 * i + 1] << 8) |
                (pixelBuffer[4 * i + 2]);
            if (id != 0 && id != 0xffffff) {
                selectedPointIndices.add(id);
            }
        }

        this.selectedPointIndices = Array.from(selectedPointIndices)
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

            frameBuffer = this.getPointsBuffer(currentFrame, this.config.center)

            this.points.geometry.setAttribute('position', frameBuffer);
            this.points.geometry.attributes.position.needsUpdate = true;

            this.axisSegments.geometry.setAttribute('position', this.getAxisLinesBuffer(currentFrame))
            this.axisSegments.geometry.attributes.position.needsUpdate = true;

            this.oldFrame = currentFrame;
        }
        if (this.dim == 2) {
            (this.points.material as THREE.ShaderMaterial).uniforms.zoom.value = this.camera.zoom;
        }

        // render the picking scene for box selection
        this.points.geometry.setAttribute('color', this.pickingColours)
        this.renderer.setRenderTarget(this.pickingTexture)
        this.renderer.render(this.scene, this.camera);

        // render the scene
        this.renderer.setRenderTarget(null);
        this.points.geometry.setAttribute('color', this.pointColours)
        this.renderer.render(this.scene, this.camera);

        // update axis labels
        if (this.hasAxisLabels) {
            this.axisLabels.map((x, i) => x.updatePosition(this.projectionMatrices[currentFrame][i], this.camera))
        }
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
        let currentButtonClassName = `${this.controlType.toString().toLowerCase()}Button`;
        let selectedButtonClassName = `${controlType.toString().toLowerCase()}Button`;

        let currentButton: HTMLButtonElement = this.container.querySelector(`.${currentButtonClassName}`);
        let selectedButton: HTMLButtonElement = this.container.querySelector(`.${selectedButtonClassName}`);

        switch (controlType) {
            case "ORBIT": {
                if (this.controlType == "SELECT") {
                    this.setSelectionMode(false);
                }
                this.orbitControls.mouseButtons = {
                    LEFT: THREE.MOUSE.ROTATE,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT: THREE.MOUSE.PAN
                }
                break;
            }
            case "PAN": {
                if (this.controlType == "SELECT") {
                    this.setSelectionMode(false);
                }
                this.orbitControls.mouseButtons = {
                    LEFT: THREE.MOUSE.PAN,
                    MIDDLE: THREE.MOUSE.DOLLY,
                    RIGHT: THREE.MOUSE.ROTATE
                }
                break;
            }
            case "SELECT": {
                this.setSelectionMode(true);
            }
            default: {
                break;
            }
        }
        this.controlType = controlType
        currentButton.className = `${currentButtonClassName} unselected`;
        selectedButton.className = `${selectedButtonClassName} selected`
    }

    private selectionStartEventListener = (event: MouseEvent) => {
        this.selectionBox.startPoint.set(
            Math.floor(event.clientX),
            Math.floor(event.clientY),
            0);
    }

    private selectionMoveEventListener = (event: MouseEvent) => {
        if (this.selectionHelper.isDown) {
            this.selectionBox.endPoint.set(
                Math.floor(event.clientX),
                Math.floor(event.clientY),
                0);
        }
    }

    private selectionEndEventListener = (event: MouseEvent) => {
        this.selectionBox.endPoint.set(
            Math.floor(event.clientX),
            Math.floor(event.clientY),
            0);
        this.setPointIndicesFromBoxSelection(this.selectionBox);
        this.setSelectedPointColour();
    }

    private setSelectedPointColour() {
        let selector: HTMLInputElement = this.container.querySelector(".colourSelector");
        let colour = new THREE.Color(selector.value);

        for (const ind of this.selectedPointIndices) {
            this.pointColours.set([colour.r, colour.g, colour.b], (ind - 1) * 3)
            this.pointColours.needsUpdate = true
        }
    }

    private setSelectionMode(enable: boolean) {

        let selectButton = this.container.querySelector("button.selectButton");

        if (enable) {

            this.orbitControls.enabled = false;
            selectButton.className = "selectButton selected";
            this.selectionHelper.element.className = "selectBox enabled";

            this.renderer.domElement.addEventListener('pointerdown', this.selectionStartEventListener);
            this.renderer.domElement.addEventListener('pointermove', this.selectionMoveEventListener)
            this.renderer.domElement.addEventListener('pointerup', this.selectionEndEventListener);

        } else {

            selectButton.className = "selectButton unselected"
            this.orbitControls.enabled = true;
            this.renderer.domElement.removeEventListener('pointerdown', this.selectionStartEventListener);
            this.renderer.domElement.removeEventListener('pointermove', this.selectionMoveEventListener)
            this.renderer.domElement.removeEventListener('pointerup', this.selectionEndEventListener)

            // make selection box invisible
            this.selectionHelper.element.className = "selectBox disabled"

        }

        this.isSelecting = enable;
    }

    private resetClock() {
        this.time = 0
    }
}


class AxisLabel {
    private div: HTMLDivElement;
    private canvas: HTMLCanvasElement;
    private text: string;
    private position: THREE.Vector3;
    private dim: Dim;
    private dpr: number;

    constructor(text: string, pos: number[],
        container: HTMLElement, canvas: HTMLCanvasElement, camera: Camera, dim: Dim, dpr: number) {
        this.div = document.createElement('div');
        this.div.innerHTML = text;
        this.div.className = "axisLabel"

        this.canvas = canvas;
        this.text = text;
        this.position = new THREE.Vector3();
        this.dim = dim;
        this.dpr = dpr;

        container.appendChild(this.div);
        this.updatePosition(pos, camera);
    }

    public updatePosition(pos: number[], camera: Camera,) {
        if (this.dim == 3) {
            this.position.set(pos[0], pos[1], pos[2])
        } else {
            this.position.set(pos[0], 0, pos[1])
        }
        var coords2d = this.get2DCoords(camera);

        this.div.style.left = coords2d.x + 'px';
        this.div.style.top = coords2d.y + 'px';
    }

    public setDpr(dpr: number) {
        this.dpr = dpr;
    }

    private get2DCoords(camera: Camera) {
        var vector = this.position.project(camera);
        vector.x = (vector.x + 1) * this.canvas.width / (2 * this.dpr);
        vector.y = -(vector.y - 1) * this.canvas.height / (2 * this.dpr);
        return vector;
    }
};
