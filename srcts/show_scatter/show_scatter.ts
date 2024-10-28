import * as THREE from "three";
import * as tf from "@tensorflow/tfjs-core";
import { setWasmPaths } from "@tensorflow/tfjs-backend-wasm";
import { Camera, Dim, Mapping, Matrix, ProjectionMatrix } from "./types";
import { Timeline } from "./timeline";
import { SelectionHelper } from "./selection_helper";
import { AxisLabel } from "./axis_label";
import { ScatterControls } from "./controls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./style.css";
import Shiny from "shiny";

import wasmSimdPath from "../../node_modules/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm";
import wasmSimdThreadedPath from "../../node_modules/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm";
import wasmPath from "../../node_modules/@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm";

declare global {
  const crosstalk: any;
}

setWasmPaths({
  "tfjs-backend-wasm.wasm": wasmPath,
  "tfjs-backend-wasm-simd.wasm": wasmSimdPath,
  "tfjs-backend-wasm-threaded-simd.wasm": wasmSimdThreadedPath,
});

export interface DisplayScatterConfig {
  fps: number;
  duration: number;
  size: number;
  axisLabels: string[];
  axes: boolean;
  edges: Matrix;
  alpha: number;
  backgroundColour: string;
  paused: boolean;
  basisIndices: number[];
}
export interface DisplayScatterInputData {
  config: DisplayScatterConfig;
  dataset: Matrix;
  projectionMatrices: ProjectionMatrix[];
  mapping: Mapping;
  crosstalk: any;
}

export abstract class DisplayScatter {
  protected abstract camera: Camera;
  protected abstract addCamera(): void;
  protected abstract resizeCamera(aspect: number): void;
  protected abstract project(X: tf.Tensor2D, A: tf.Tensor2D): tf.Tensor2D;
  protected abstract getShaderOpts(
    pointSize: number
  ): THREE.ShaderMaterialParameters;
  protected abstract addOrbitControls(): void;
  protected abstract projectionMatrixToTensor(mat: Matrix): tf.Tensor2D;

  protected config: DisplayScatterConfig;
  protected width: number;
  protected height: number;
  protected minPointSize = 0.02;
  protected renderer: THREE.WebGLRenderer;
  protected orbitControls: OrbitControls;
  protected adjustPointSizeFromZoom?(): void;
  protected points: THREE.Points;
  protected pointAlphas: THREE.BufferAttribute;

  public container: HTMLDivElement;
  public canvas: HTMLCanvasElement = document.createElement("canvas");

  private n: number;
  private backgroundColour: number;
  private scene: THREE.Scene;
  private dataset: tf.Tensor2D;
  private projectionMatrices: tf.Tensor2D[];
  private clock = new THREE.Clock();
  private time: number;
  private currentFrame: number;
  private oldFrame: number;
  private axisSegments: THREE.LineSegments;
  private isPaused: boolean;
  private isSleeping: boolean;
  private colMeans: Matrix;
  private mapping: Mapping;
  private pointColours: THREE.BufferAttribute;
  private pickingColours: THREE.BufferAttribute;
  private currentFrameBuffer: THREE.BufferAttribute;
  private dim: Dim;
  private pickingTexture: THREE.WebGLRenderTarget;
  private selectionHelper: SelectionHelper;
  private selectedPointIndices: number[];
  private filteredPointIndices: number[];
  private hasAxes: boolean;
  private axisLabels: Array<AxisLabel>;
  private hasAxisLabels: boolean;
  private hasPointLabels: boolean;
  private hasEdges = false;
  private edges: number[];
  private edgeSegments: THREE.LineSegments;
  private toolTip: HTMLDivElement;
  private timeline: Timeline;
  private controls: ScatterControls;
  private crosstalkIndex?: string[];
  private crosstalkGroup?: string;
  private crosstalkSelectionHandle?: any;
  private crosstalkFilterHandle?: any;

  constructor(containerElement: HTMLDivElement, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.addContainerElement(containerElement);
    this.addCanvas();
    this.addScene();
    this.addRenderer();
    this.addSleepEventListeners();
  }

  private constructPlot() {
    this.n = this.dataset.shape[0];

    this.setDefaultPointColours();
    this.setDefaultFilterSelection();
    this.setDefaultPointSelection();

    this.pickingColours = this.getPickingColours();

    if (this.hasPointLabels) {
      this.addToolTip();
      this.canvas.addEventListener("mousemove", (event: MouseEvent) => {
          this.setTooltipFromHover(event);
        });
      this.canvas.addEventListener("click", (event: PointerEvent) => {
        const clickId = this.getIdfromClick(event);
        if(window.Shiny != null) {
          window.Shiny.setInputValue(
            `${this.getContainerElement().id}_detour_click`, 
            clickId == null ? -1: clickId
          );
        }
      })
    }

    const pointsGeometry = new THREE.BufferGeometry();
    const pointSize = this.config.size / 10;

    const shaderOpts = this.getShaderOpts(pointSize);
    const pointsMaterial = new THREE.ShaderMaterial(shaderOpts);
    this.pointAlphas = this.getPointAlphas();

    this.currentFrameBuffer = this.getPointsBuffer(0);
    pointsGeometry.setAttribute("position", this.currentFrameBuffer);

    this.points = new THREE.Points(pointsGeometry, pointsMaterial);
    this.points.geometry.setAttribute("color", this.pointColours);
    this.points.geometry.setAttribute("alpha", this.pointAlphas);
    this.scene.add(this.points);

    if (this.hasAxes) {
      this.addAxisSegments();
      this.addAxisLabels();
    }

    if (this.hasEdges) {
      this.addEdgeSegments(this.currentFrameBuffer);
    }

    this.addOrbitControls();
    this.selectionHelper = new SelectionHelper(this);
    this.controls = new ScatterControls(this);

    // resize picking renderer
    const dpr = this.renderer.getPixelRatio();
    this.pickingTexture = new THREE.WebGLRenderTarget(
      this.width * dpr,
      this.height * dpr
    );

    this.addTimeline();

    this.clock = new THREE.Clock();
    this.time = 0;
    this.oldFrame = -1;

    this.isPaused = false;
  }

  public clearPlot() {
    if (this.timeline) {
      this.timeline.clear();
    }
    if (this.controls) {
      this.controls.clear();
    }
    if (this.hasAxes) {
      this.axisLabels.map((x) => x.clear());
      this.axisLabels = [];
    }
    this.orbitButtonAction();
    this.scene.remove(...this.scene.children);
  }

  public resize(newWidth: number, newHeight: number) {
    const aspect = newWidth / newHeight;
    const dpr = this.renderer.getPixelRatio();
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.resizeCamera(aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(newWidth, newHeight);

    // resize picking renderer
    this.pickingTexture.setSize(newWidth * dpr, newHeight * dpr);
    // scrubbing bar
    this.timeline.resize(
      newHeight,
      this.currentFrame / this.projectionMatrices.length
    );
    if (this.hasAxisLabels) {
      this.axisLabels.map((x) => x.setDpr(dpr));
    }
    if (this.isSleeping) {
      this.animate();
    }
  }

  protected preConstructPlotCallback(): void {
    return;
  }

  private async renderValue(inputData: DisplayScatterInputData) {
    if (tf.getBackend() == null) {
      await tf.setBackend("wasm");
    }

    await tf.ready().then(() => {
      if (this.config !== undefined) {
        this.clearPlot();
      }
      this.config = inputData.config;
      this.dataset = tf.tensor(inputData.dataset);

      this.crosstalkIndex = inputData.crosstalk.crosstalkIndex;
      this.crosstalkGroup = inputData.crosstalk.crosstalkGroup;

      if (this.crosstalkIndex) {
        this.crosstalkSelectionHandle = new crosstalk.SelectionHandle();
        this.crosstalkSelectionHandle.setGroup(this.crosstalkGroup);
        this.crosstalkSelectionHandle.on("change", (e: any) =>
          this.setPointSelectionFromCrosstalkEvent(e)
        );

        this.crosstalkFilterHandle = new crosstalk.FilterHandle();
        this.crosstalkFilterHandle.setGroup(this.crosstalkGroup);
        this.crosstalkFilterHandle.on("change", (e: any) =>
          this.setPointFilterFromCrosstalkEvent(e)
        );
      }

      this.projectionMatrices = inputData.projectionMatrices.map((x) =>
        this.projectionMatrixToTensor(x)
      );

      this.dim = inputData.projectionMatrices[0][0].length;

      if (inputData.config.edges[0]) {
        this.hasEdges = true;
        this.edges = inputData.config.edges.flat();
      }

      this.hasPointLabels = inputData.mapping.label.length == 0 ? false : true;
      this.hasAxes = this.config.axes;

      this.addCamera();
      this.mapping = inputData.mapping;

      this.scene.background = new THREE.Color(
        inputData.config.backgroundColour
      );
      this.backgroundColour = parseInt(
        inputData.config.backgroundColour.substring(1),
        16
      );

      this.preConstructPlotCallback();
      this.constructPlot();
      this.animate();

      this.setIsPaused(this.config.paused);
    });
  }

  public getContainerElement(): HTMLDivElement {
    return this.container;
  }

  public resetButtonAction() {
    // reset everything, but keep current time / frame and
    // selected colour
    this.orbitControls.reset();
    this.setDefaultPointColours();
    this.setDefaultPointSelection();
  }

  public orbitButtonAction() {
    this.orbitControls.enabled = true;
    this.selectionHelper.disable();
    this.orbitControls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
  }

  public panButtonAction() {
    this.orbitControls.enabled = true;
    this.selectionHelper.disable();
    this.orbitControls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
  }

  public selectButtonAction() {
    this.orbitControls.enabled = false;
    this.selectionHelper.enable();
  }

  public brushButtonAction() {
    this.setSelectedPointColour();
  }

  public exportButtonAction() {
    const data = this.dataset.arraySync();
    let csv_content = "data:text/csv;charset=utf-8,";
    let pointColours = this.pointColours.array;
    let row;

    if (this.hasAxisLabels) {
      csv_content += this.config.axisLabels.join(",") + ",colour\n";
    } else {
      csv_content +=
        data[0].map((x: number, i: number) => `col_${i}`).join(",") +
        ",colour\n";
    }

    data.forEach(function (row_array, i) {
      row =
        row_array.join(",") +
        "," +
        new THREE.Color(
          pointColours[i * 3],
          pointColours[i * 3 + 1],
          pointColours[i * 3 + 2]
        )
          .getHex()
          .toString(16)
          .padStart(6, "0");
      //console.log(pointColours[i].getHex());
      csv_content += row + "\n";
    });

    const encoded_uri = encodeURI(csv_content);
    const link = document.createElement("a");
    link.setAttribute("href", encoded_uri);
    link.setAttribute("download", "detourr_export.csv");
    document.body.appendChild(link); // Required for FF

    link.click();
  }

  private addAxisSegments() {
    const axisLinesGeometry = new THREE.BufferGeometry();
    const axisLinesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
    });

    const axisLinesBuffer = this.getAxisLinesBuffer(0);
    axisLinesGeometry.setAttribute("position", axisLinesBuffer);

    this.axisSegments = new THREE.LineSegments(
      axisLinesGeometry,
      axisLinesMaterial
    );
    this.scene.add(this.axisSegments);
  }

  private addEdgeSegments(pointsBuffer: THREE.BufferAttribute) {
    const edgesGeometry = new THREE.BufferGeometry();
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
    });

    const edgesBuffer = this.getEdgesBuffer(pointsBuffer);
    edgesGeometry.setAttribute("position", edgesBuffer);

    this.edgeSegments = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    this.scene.add(this.edgeSegments);
  }

  private addContainerElement(containerElement: HTMLDivElement) {
    containerElement.className = "scatterWidgetContainer";
    this.container = containerElement;
  }

  private addScene() {
    const scene = new THREE.Scene();
    const light = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(light);
    this.scene = scene;
  }

  private addCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.id = `${this.container.id}-canvas`;
    canvas.className = "scatterWidgetCanvas";
    this.container.appendChild(canvas);
    this.canvas = canvas;
  }

  private addRenderer() {
    // antialiasing here works for axis lines. For points, this is done in shaders.ts
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.width, this.height);
    this.renderer = renderer;
  }

  private addToolTip() {
    const toolTip = document.createElement("div");
    const toolTipText = document.createElement("span");
    toolTip.appendChild(toolTipText);
    toolTip.className = "detourrTooltip";
    this.container.appendChild(toolTip);
    this.toolTip = toolTip;
  }

  private addTimeline() {
    this.timeline = new Timeline(this);
    this.container.appendChild(this.timeline.getElement());
    this.timeline.resize(
      this.height,
      this.currentFrame / this.projectionMatrices.length
    );
  }

  private getPointsBuffer(i: number): THREE.BufferAttribute {
    // flattened projection matrix
    const position = tf.tidy(() => {
      return this.project(this.dataset, this.projectionMatrices[i]);
    });
    const positionArray = position.dataSync();
    position.dispose();

    return new THREE.BufferAttribute(positionArray, 3);
  }

  private projectionMatrixToAxisLines(m: tf.Tensor2D): Float32Array {
    const zeros = tf.zeros(m.shape);
    const coords = tf.concat([zeros, m], 1);
    const coordsArray = coords.dataSync();
    coords.dispose();
    zeros.dispose();
    return coordsArray as Float32Array;
  }

  private getAxisLinesBuffer(i: number): THREE.BufferAttribute {
    const linesBufferArray = this.projectionMatrixToAxisLines(
      this.projectionMatrices[i]
    );
    return new THREE.BufferAttribute(linesBufferArray, 3);
  }

  private getEdgesBuffer(frameBuffer: THREE.BufferAttribute) {
    const bufferArray = new Float32Array(this.edges.length * 3);
    const edgesBuffer = new THREE.BufferAttribute(bufferArray, 3);

    // `edges` contains indices with format [from, to, from, to, ...]
    // `edgesBuffer` has format [fromX, fromY, fromZ, toX, toY, toZ, ...]

    for (let i = 0; i < this.edges.length; i++) {
      edgesBuffer.set(
        [
          frameBuffer.getX(this.edges[i] - 1),
          frameBuffer.getY(this.edges[i] - 1),
          frameBuffer.getZ(this.edges[i] - 1),
        ],
        i * 3
      );
    }
    return edgesBuffer;
  }

  private coloursToBufferAttribute(colours: string[]): THREE.BufferAttribute {
    const colour = new THREE.Color();
    const bufferArray = new Float32Array(this.n * 3);

    if (colours.length > 0) {
      let j = 0;
      for (let i = 0; i < colours.length; i++) {
        j = 3 * i;
        colour.set(colours[i]);
        bufferArray[j] = colour.r;
        bufferArray[j + 1] = colour.g;
        bufferArray[j + 2] = colour.b;
      }
    }
    return new THREE.BufferAttribute(bufferArray, 3);
  }

  private getPointAlphas(): THREE.BufferAttribute {
    return new THREE.BufferAttribute(
      new Float32Array(this.n).fill(this.config.alpha),
      1
    );
  }

  private getPickingColours(): THREE.BufferAttribute {
    // picking colours are just sequential IDs converted to RGB values
    const bufferArray = new Float32Array(this.n * 3);
    let j = 0;
    for (let i = 1; i <= this.n; i++) {
      // bit masking
      bufferArray[j] = ((i >> 16) & 0xff) / 255;
      bufferArray[j + 1] = ((i >> 8) & 0xff) / 255;
      bufferArray[j + 2] = (i & 0xff) / 255;
      j += 3;
    }
    return new THREE.BufferAttribute(bufferArray, 3);
  }

  private addAxisLabels() {
    const dpr = this.renderer.getPixelRatio();
    if (this.config.axisLabels == []) {
      this.hasAxisLabels = false;
    } else {
      this.hasAxisLabels = true;
      this.axisLabels = this.config.axisLabels.map((label) => {
        return new AxisLabel(
          label,
          [0, 0, 0],
          this.container,
          this.canvas,
          this.camera,
          this.dim,
          dpr
        );
      });
    }
  }

  private addSleepEventListeners() {
    this.container.addEventListener("mouseover", () =>
      this.wakeEventListener()
    );
    this.container.addEventListener("scroll", () => this.wakeEventListener());
    this.container.addEventListener("keydown", () => this.wakeEventListener());

    this.container.addEventListener("mouseleave", () =>
      this.sleepEventListener()
    );
  }

  public setPointSelectionFromBox(
    topLeft: THREE.Vector2,
    bottomRight: THREE.Vector2,
    shiftKey: boolean
  ) {
    const { pickingTexture, renderer } = this;
    const dpr = renderer.getPixelRatio();

    const x = topLeft.x * dpr;
    const y = bottomRight.y * dpr;

    const width = (bottomRight.x - topLeft.x) * dpr;
    const height = (bottomRight.y - topLeft.y) * dpr;

    const pixelBuffer = new Uint8Array(4 * width * height);

    // re-render the picking scene with smaller points to prevent overplotting 
    // when picking
    this.points.geometry.setAttribute("color", this.pickingColours);
    (this.points.material as THREE.ShaderMaterial).uniforms.picking.value = 1;
    (this.points.material as THREE.ShaderMaterial).uniforms.shrink.value = 1;
    this.renderer.setRenderTarget(this.pickingTexture);
    this.renderer.render(this.scene, this.camera);

    renderer.readRenderTargetPixels(
      pickingTexture,
      x,
      pickingTexture.height - y,
      width,
      height,
      pixelBuffer
    );

    // reset from picking scene
    this.renderer.setRenderTarget(null);
    this.points.geometry.setAttribute("color", this.pointColours);
    (this.points.material as THREE.ShaderMaterial).uniforms.picking.value = 0;
    (this.points.material as THREE.ShaderMaterial).uniforms.shrink.value = 0;

    const selectedPointSet = new Set<number>();
    let id;
    for (let i = 0; i < width * height; i++) {
      id =
        (pixelBuffer[4 * i] << 16) |
        (pixelBuffer[4 * i + 1] << 8) |
        pixelBuffer[4 * i + 2];
      if (
        id != 0 &&
        id != this.backgroundColour &&
        this.filteredPointIndices.includes(id - 1)
      ) {
        selectedPointSet.add(id - 1);
      }
    }

    if (shiftKey) {
      this.selectedPointIndices.map((v) => selectedPointSet.add(v));
    }

    this.selectedPointIndices = Array.from(selectedPointSet);

    if (this.selectedPointIndices.length == 0) {
      this.setDefaultPointSelection();

      // try block in case error thrown in linked visual e.g. plotly.
      // In this case, set selection to all points
      if (this.crosstalkIndex) {
        try {
          this.crosstalkSelectionHandle.clear();
        } catch (e) {
          console.error(e);
          this.crosstalkSelectionHandle.set(null);
        }
      }
    } else if (this.crosstalkIndex) {
      this.crosstalkSelectionHandle.set(
        this.selectedPointIndices.map((i) => this.crosstalkIndex[i])
      );
    }

    this.highlightSelectedPoints();
  }

  private setPointSelectionFromCrosstalkEvent(e: any) {
    if (e.sender == this.crosstalkSelectionHandle) {
      return;
    }

    let newSelection = e.value
      ? e.value.map((v: string) => this.crosstalkIndex.indexOf(v))
      : [];

    // persistent selection with plotly
    const ctOpts = crosstalk.var("plotlyCrosstalkOpts").get() || {};
    if (ctOpts.persistent === true) {
      newSelection = this.selectedPointIndices.concat(newSelection);
    }

    if (newSelection.length == 0) {
      this.setDefaultPointSelection();
    } else {
      this.selectedPointIndices = newSelection;
    }

    this.highlightSelectedPoints();
    if (this.isSleeping) {
      this.animate();
    }
  }

  private setPointFilterFromCrosstalkEvent(e: any) {
    if (!e.value || e.value.length == 0) this.setDefaultFilterSelection();
    else {
      this.filteredPointIndices = e.value.map((v: string) =>
        this.crosstalkIndex.indexOf(v)
      );
    }
    this.filterPoints();
    if (this.isSleeping) {
      this.animate();
    }
  }

  private scaleX() {
    return this.canvas.clientWidth / this.canvas.getBoundingClientRect().width;
  }

  private scaleY() {
    return (
      this.canvas.clientHeight / this.canvas.getBoundingClientRect().height
    );
  }

  private setTooltipFromHover(event: MouseEvent) {
    const { pickingTexture, renderer, canvas } = this;
    const dpr = renderer.getPixelRatio();

    const canvas_coords = canvas.getBoundingClientRect();
    const x = (event.x - canvas_coords.left) * dpr * this.scaleX();
    const y = (event.y - canvas_coords.top) * dpr * this.scaleY();
    const width = 1;
    const height = 1;

    const pixelBuffer = new Uint8Array(12);

    renderer.readRenderTargetPixels(
      pickingTexture,
      x,
      pickingTexture.height - y,
      width,
      height,
      pixelBuffer
    );

    const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];
    if (
      id != 0 &&
      id != this.backgroundColour &&
      this.filteredPointIndices.includes(id - 1)
    ) {
      const toolTipCoords = this.toolTip.getBoundingClientRect();
      this.toolTip.style.left = `${Math.floor(x / dpr) - toolTipCoords.width
        }px`;
      this.toolTip.style.top = `${Math.floor(y / dpr) - toolTipCoords.height
        }px`;
      this.toolTip.className = "detourrTooltip visible";
      const span = this.toolTip.querySelector("span");
      span.innerHTML = `${this.mapping.label[id - 1]}`;
    } else {
      this.toolTip.className = "detourrTooltip";
    }
  }
  private getCoordsfromClick(event: PointerEvent, canvas: HTMLCanvasElement, dpr: number) {
    const canvas_coords = canvas.getBoundingClientRect();
    const x = (event.x - canvas_coords.left) * dpr * this.scaleX();
    const y = (event.y - canvas_coords.top) * dpr * this.scaleY();
    const width = 1;
    const height = 1;
    return {x: x, y: y, width: width, height: height};
  }

  private getIdfromClick(event: PointerEvent) : number {
    const { pickingTexture, renderer, canvas } = this;
    const dpr = renderer.getPixelRatio();
    const { x, y, width, height } = this.getCoordsfromClick(event, canvas, dpr);
    const pixelBuffer = new Uint8Array(12);

    renderer.readRenderTargetPixels(
      pickingTexture,
      x,
      pickingTexture.height - y,
      width,
      height,
      pixelBuffer
    );

    const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];
    if (
      id != 0 &&
      id != this.backgroundColour &&
      this.filteredPointIndices.includes(id - 1)
    ) {
      return(id);
    } else {
      return(null);
    }
    
  }

  // TODO: break away chunks in to separate functions
  private animate() {
    const delta = this.clock.getDelta();

    if (!this.getIsPaused()) {
      this.time += delta;
    }

    if (this.time >= this.config.duration) this.time = 0;

    const currentFrame = Math.floor(this.time * this.config.fps);
    this.currentFrame = currentFrame;

    if (currentFrame != this.oldFrame) {
      this.currentFrameBuffer = this.getPointsBuffer(
        currentFrame % this.projectionMatrices.length
      );

      this.points.geometry.setAttribute("position", this.currentFrameBuffer);

      if (this.hasAxes) {
        this.axisSegments.geometry.setAttribute(
          "position",
          this.getAxisLinesBuffer(currentFrame)
        );
      }
      if (this.hasEdges) {
        const edgesBuffer = this.getEdgesBuffer(this.currentFrameBuffer);
        this.edgeSegments.geometry.setAttribute("position", edgesBuffer);
      }

      this.oldFrame = currentFrame;
      this.timeline.updatePosition(
        currentFrame / (this.projectionMatrices.length - 1)
      );
    }

    // required for 2d plot as points aren't auto scaled with zoom
    if (this.adjustPointSizeFromZoom) {
      this.adjustPointSizeFromZoom();
    }

    // render the scene
    this.renderer.render(this.scene, this.camera);

    // render the picking scene for box selection
    this.points.geometry.setAttribute("color", this.pickingColours);
    (this.points.material as THREE.ShaderMaterial).uniforms.picking.value = 1;
    this.renderer.setRenderTarget(this.pickingTexture);
    this.renderer.render(this.scene, this.camera);

    // reset from picking scene
    this.renderer.setRenderTarget(null);
    this.points.geometry.setAttribute("color", this.pointColours);
    (this.points.material as THREE.ShaderMaterial).uniforms.picking.value = 0;

    // update axis labels
    if (this.hasAxisLabels) {
      this.axisLabels.map((x, i) =>
        x.updatePosition(
          this.projectionMatrices[currentFrame].arraySync()[i],
          this.camera
        )
      );
    }

    if (this.isSleeping) {
      return;
    }

    requestAnimationFrame(() => this.animate());
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public setIsPaused(isPaused: boolean) {
    this.isPaused = isPaused;

    if (!isPaused) {
      this.animate();
    }

    this.timeline.updatePlayPauseIcon(isPaused);
  }

  private setSleep(sleep: boolean) {
    this.isSleeping = sleep;
  }

  public setTime(newTimePercent: number) {
    this.time = this.config.duration * newTimePercent;
  }

  public getBasisIndices(): number[] {
    return this.config.basisIndices;
  }

  public getNumAnimationFrames(): number {
    return this.projectionMatrices.length;
  }

  // pause animation loop if no interactions
  private sleepEventListener() {
    if (this.isPaused) {
      this.setSleep(true);
    }
  }

  private wakeEventListener() {
    if (this.isSleeping) {
      this.setSleep(false);
      this.animate();
    }
  }

  private setSelectedPointColour() {
    const colour = this.controls.getSelectedColour();

    for (const ind of this.selectedPointIndices) {
      this.pointColours.set([colour.r, colour.g, colour.b], ind * 3);
    }
    this.pointColours.needsUpdate = true;
  }

  private setDefaultPointColours() {
    this.pointColours = this.coloursToBufferAttribute(this.mapping.colour);
  }

  private setDefaultPointSelection() {
    this.selectedPointIndices = Array(this.n)
      .fill(0)
      .map((_, i) => i);
  }

  private setDefaultFilterSelection() {
    this.filteredPointIndices = Array(this.n)
      .fill(0)
      .map((_, i) => i);
  }

  private highlightSelectedPoints() {
    for (const i of this.filteredPointIndices) {
      if (!this.selectedPointIndices.includes(i)) {
        this.pointAlphas.set([this.config.alpha / 8], i);
      } else {
        this.pointAlphas.set([this.config.alpha], i);
      }
    }
    this.pointAlphas.needsUpdate = true;
  }

  private filterPoints() {
    for (let i = 0; i < this.n; i++) {
      if (!this.filteredPointIndices.includes(i)) {
        this.pointAlphas.set([0], i);
      }
    }
    this.highlightSelectedPoints();
  }
}
