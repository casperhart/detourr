import * as THREE from 'three';
import { ProjectionMatrix, ScatterInputData, Config, Dataset } from './data'
import { multiply } from 'mathjs';

export class ScatterWidget {
    private container: HTMLElement;
    private canvas: HTMLCanvasElement = document.createElement("canvas");
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private renderer: THREE.WebGLRenderer;
    private config: Config;
    private dataset: Dataset;
    private projectionMatrices: Array<ProjectionMatrix>;
    private clock = new THREE.Clock();
    private time: number;
    private oldFrame: number;
    private frames: THREE.BufferAttribute[];
    private points: THREE.Points

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

        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
        this.camera.position.setZ(4);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.renderer.render(this.scene, this.camera);
    }

    constructAnimationKeyFrameTracks() {
        // TODO: tidy up this function
        // TODO: investigate calculating frames on the fly to reduce memory usage
        this.frames = this.projectionMatrices.map(
            (projectionMatrix: ProjectionMatrix) => {
                let positionMatrix = multiply(this.dataset, projectionMatrix);
                let flattenedPositionMatrix = new Float32Array([].concat(...positionMatrix));
                return new THREE.BufferAttribute(flattenedPositionMatrix, 3)
            });

        let geometry = new THREE.BufferGeometry();
        let material = new THREE.PointsMaterial()

        // TODO: calculate size dynamically based on number of points
        material.size = 0.05

        geometry.setAttribute('position', this.frames[0]);
        this.points = new THREE.Points(geometry, material)
        this.scene.add(this.points)

        this.clock = new THREE.Clock();
        this.time = 0;
        this.oldFrame = -1;
    }

    public resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    public renderValue(inputData: ScatterInputData) {
        this.config = inputData.config;
        this.dataset = inputData.dataset;
        this.projectionMatrices = inputData.projectionMatrices;

        this.constructAnimationKeyFrameTracks();
        this.animate();
    }

    private animate() {
        // todo: calculate frames on the fly for the first run, rather than all at the start
        let delta = this.clock.getDelta();
        this.time += delta;

        if (this.time >= this.config.duration) this.time = 0;
        let frame = Math.floor(this.time * this.config.fps);
        if (frame != this.oldFrame) { // a very rough approach of managing the time keys
            this.points.geometry.setAttribute('position', this.frames[frame]); // set the data of points
            this.points.geometry.attributes.position.needsUpdate = true;
            this.oldFrame = frame;
        }

        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => this.animate());
    }

}