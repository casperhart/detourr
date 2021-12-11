import * as THREE from "three";
import {
  Camera,
  Config,
  ControlType,
  Dim,
  Mapping,
  Matrix,
  ProjectionMatrix,
  ScatterInputData,
} from "./types";
import { Timeline } from "./timeline";
import { centerColumns, getColMeans } from "./utils";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SelectionBox } from "three/examples/jsm/interactive/SelectionBox.js";
import { SelectionHelper } from "three/examples/jsm/interactive/SelectionHelper.js";
import { brushIcon, orbitIcon, panIcon, resetIcon, selectIcon } from "./icons";
import "./style.css";

declare global {
  var crosstalk: any;
}

export abstract class DisplayScatter {
  protected abstract camera: Camera;
  protected abstract addCamera(): void;
  protected abstract resizeCamera(aspect: number): void;
  protected abstract multiply(a: Matrix, b: ProjectionMatrix): Matrix;
  protected abstract getShaderOpts(
    pointSize: number,
  ): THREE.ShaderMaterialParameters;
  protected abstract addOrbitControls(): void;
  protected abstract projectionMatrixToAxisLines(mat: Matrix): Matrix;

  protected width: number;
  protected height: number;
  protected minPointSize: number = 0.02;
  protected renderer: THREE.WebGLRenderer;
  protected orbitControls: OrbitControls;
  protected adjustPointSizeFromZoom?(): void;
  protected points: THREE.Points;

  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private scene: THREE.Scene;
  private config: Config;
  private dataset: Matrix;
  private projectionMatrices: Array<ProjectionMatrix>;
  private clock = new THREE.Clock();
  private time: number;
  private currentFrame: number;
  private oldFrame: number;
  private axisSegments: THREE.LineSegments;
  private isPaused: boolean;
  private colMeans: Matrix;
  private mapping: Mapping;
  private pointColours: THREE.BufferAttribute;
  private pointAlphas: THREE.BufferAttribute;
  private pickingColours: THREE.BufferAttribute;
  private currentFrameBuffer: THREE.BufferAttribute;
  private nextFrameBuffer: THREE.BufferAttribute;
  private dim: Dim;
  private controlType: ControlType;
  private pickingTexture: THREE.WebGLRenderTarget;
  private selectionBox: SelectionBox;
  private selectionHelper: SelectionHelper;
  private selectedPointIndices: number[];
  private hasAxes: boolean;
  private axisLabels: Array<AxisLabel>;
  private hasAxisLabels: boolean;
  private hasPointLabels: boolean;
  private hasEdges = false;
  private edges: number[];
  private edgeSegments: THREE.LineSegments;
  private toolTip: HTMLDivElement;
  private timeline: Timeline;
  private colourSelector: HTMLInputElement;
  private crosstalkIndex?: string[];
  private crosstalkGroup?: string;
  private crosstalkSelectionHandle?: any;

  constructor(containerElement: HTMLDivElement, width: number, height: number) {
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

    this.setDefaultPointColours();
    this.setDefaultPointSelection();

    this.pickingColours = this.getPickingColours();

    if (this.hasPointLabels) {
      this.addToolTip();
      this.canvas.addEventListener(
        "mousemove",
        (event: MouseEvent) => this.setTooltipFromHover(event),
      );
    }

    let pointsGeometry = new THREE.BufferGeometry();
    let pointSize = this.config.size / 10;

    let shaderOpts = this.getShaderOpts(pointSize);
    let pointsMaterial = new THREE.ShaderMaterial(shaderOpts);

    this.currentFrameBuffer = this.getPointsBuffer(0, this.config.center);
    this.nextFrameBuffer = this.getPointsBuffer(1, this.config.center);
    pointsGeometry.setAttribute("position", this.currentFrameBuffer);

    this.points = new THREE.Points(pointsGeometry, pointsMaterial);
    this.points.geometry.setAttribute("color", this.pointColours);
    this.pointAlphas = this.getPointAlphas();
    this.points.geometry.setAttribute(
      "alpha",
      this.pointAlphas,
    );
    this.scene.add(this.points);

    if (this.hasAxes) {
      this.addAxisSegments();
      this.addAxisLabels();
    }

    if (this.hasEdges) {
      this.addEdgeSegments(this.currentFrameBuffer);
    }
    this.addOrbitControls();

    // resize picking renderer
    let dpr = this.renderer.getPixelRatio();
    this.pickingTexture = new THREE.WebGLRenderTarget(
      this.width * dpr,
      this.height * dpr,
    );

    this.selectionBox = new SelectionBox(this.camera, this.scene);
    this.selectionHelper = new SelectionHelper(
      this.selectionBox,
      this.renderer,
      "disabled",
    );

    this.addTimeline();

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
    this.resizeCamera(aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(newWidth, newHeight);

    // resize picking renderer
    this.pickingTexture.setSize(
      newWidth * dpr,
      newHeight * dpr,
    );
    // scrubbing bar
    this.timeline.resize(
      newHeight,
      this.currentFrame / this.projectionMatrices.length,
    );

    this.axisLabels.map((x) => x.setDpr(dpr));
  }

  public renderValue(inputData: ScatterInputData) {
    this.config = inputData.config;
    this.dataset = inputData.dataset;

    this.crosstalkIndex = inputData.crosstalk.crosstalkIndex;
    this.crosstalkGroup = inputData.crosstalk.crosstalkGroup;

    if (this.crosstalkIndex) {
      this.crosstalkSelectionHandle = new crosstalk.SelectionHandle();

      this.crosstalkSelectionHandle.setGroup(this.crosstalkGroup);
      this.crosstalkSelectionHandle.on(
        "change",
        (e: any) => this.setPointIndicesFromCrosstalkEvent(e),
      );
    }

    this.projectionMatrices = inputData.projectionMatrices;
    this.dim = inputData.projectionMatrices[0][0].length;

    if (inputData.config.edges[0]) {
      this.hasEdges = true;
      this.edges = [].concat(...inputData.config.edges);
    }

    this.hasPointLabels = inputData.mapping.label.length == 0 ? false : true;
    this.hasAxes = this.config.axes;

    this.addCamera();
    this.mapping = inputData.mapping;

    this.constructPlot();
    this.animate();
  }

  public getContainerElement(): HTMLDivElement {
    return this.container;
  }

  private addAxisSegments() {
    let axisLinesGeometry = new THREE.BufferGeometry();
    let axisLinesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
    });

    let axisLinesBuffer = this.getAxisLinesBuffer(0);
    axisLinesGeometry.setAttribute("position", axisLinesBuffer);

    this.axisSegments = new THREE.LineSegments(
      axisLinesGeometry,
      axisLinesMaterial,
    );
    this.scene.add(this.axisSegments);
  }

  private addEdgeSegments(pointsBuffer: THREE.BufferAttribute) {
    let edgesGeometry = new THREE.BufferGeometry();
    let edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
    });

    let edgesBuffer = this.getEdgesBuffer(pointsBuffer);
    edgesGeometry.setAttribute("position", edgesBuffer);

    this.edgeSegments = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    this.scene.add(this.edgeSegments);
  }

  private addContainerElement(containerElement: HTMLDivElement) {
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

  private addRenderer() {
    // antialiasing here works for axis lines. For points, this is done in shaders.ts
    let renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.width, this.height);
    this.renderer = renderer;
  }

  private addToolTip() {
    let toolTip = document.createElement("div");
    let toolTipText = document.createElement("span");
    toolTip.appendChild(toolTipText);
    toolTipText.innerHTML = "hello";
    toolTip.className = "tooltip";
    this.container.appendChild(toolTip);
    this.toolTip = toolTip;
  }

  private addTimeline() {
    this.timeline = new Timeline(this);
    this.container.appendChild(this.timeline.getElement());
    this.timeline.resize(
      this.height,
      this.currentFrame / this.projectionMatrices.length,
    );
  }

  private getPointsBuffer(i: number, center: boolean): THREE.BufferAttribute {
    let positionMatrix: Matrix = this.multiply(
      this.dataset,
      this.projectionMatrices[i],
    );

    if (center) {
      let colMeans = this.multiply(this.colMeans, this.projectionMatrices[i]);
      positionMatrix = centerColumns(positionMatrix, colMeans);
    }

    let flattenedPositionMatrix = new Float32Array(
      [].concat(...positionMatrix),
    );
    return new THREE.BufferAttribute(flattenedPositionMatrix, 3);
  }

  private getAxisLinesBuffer(i: number): THREE.BufferAttribute {
    let projectionMatrix = this.projectionMatrices[i];
    let linesBufferMatrix = this.projectionMatrixToAxisLines(
      projectionMatrix,
    );
    return new THREE.BufferAttribute(
      new Float32Array([].concat(...linesBufferMatrix)),
      3,
    );
  }

  private getEdgesBuffer(frameBuffer: THREE.BufferAttribute) {
    let bufferArray = new Float32Array(this.edges.length * 3);
    let edgesBuffer = new THREE.BufferAttribute(bufferArray, 3);

    // `edges` contains indices with format [from, to, from, to, ...]
    // `edgesBuffer` has format [fromX, fromY, fromZ, toX, toY, toZ, ...]

    for (let i = 0; i < this.edges.length; i++) {
      edgesBuffer.set([
        frameBuffer.getX(this.edges[i] - 1),
        frameBuffer.getY(this.edges[i] - 1),
        frameBuffer.getZ(this.edges[i] - 1),
      ], i * 3);
    }
    return edgesBuffer;
  }

  private coloursToBufferAttribute(colours: string[]): THREE.BufferAttribute {
    let colour = new THREE.Color();
    let bufferArray = new Float32Array(this.dataset.length * 3);

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
      new Float32Array(this.dataset.length).fill(this.config.alpha),
      1,
    );
  }

  private getPickingColours(): THREE.BufferAttribute {
    // picking colours are just sequential IDs converted to RGB values
    let bufferArray = new Float32Array(this.dataset.length * 3);
    let j = 0;
    for (let i = 1; i <= this.dataset.length; i++) {
      // bit masking
      bufferArray[j] = ((i >> 16) & 0xff) / 255;
      bufferArray[j + 1] = ((i >> 8) & 0xff) / 255;
      bufferArray[j + 2] = (i & 0xff) / 255;
      j += 3;
    }
    return new THREE.BufferAttribute(bufferArray, 3);
  }

  private addControls() {
    this.addButton(
      "reset",
      "Reset camera position",
      resetIcon,
      () => {
        // reset everything, but keep current time / frame and
        // selected colour
        this.orbitControls.reset();
        this.setDefaultPointColours();
        this.setDefaultPointSelection();
        this.setControlType("ORBIT");
      },
    );
    this.addButton(
      "pan",
      "Switch to pan controls",
      panIcon,
      () => this.setControlType("PAN"),
    );
    this.addButton(
      "orbit",
      "Switch to orbit controls",
      orbitIcon,
      () => this.setControlType("ORBIT"),
    );
    this.addButton(
      "select",
      "Switch to selection controls",
      selectIcon,
      () => this.setControlType("SELECT"),
    );
    this.addButton(
      "brush",
      "Colour selected points",
      brushIcon,
      () => this.setSelectedPointColour(),
    );
    this.addColourSelector();

    // set orbit as default
    this.controlType = "ORBIT";
    let currentButton: HTMLButtonElement = this.container.querySelector(
      `.orbitButton`,
    );
    currentButton.className = "orbitButton selected";
  }

  private addButton(
    name: string,
    hoverText: string,
    icon: string,
    buttonCallback: Function,
  ) {
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
    colourSelector.setAttribute(
      "title",
      "Select colour to apply using selection box",
    );
    colourSelector.addEventListener(
      "change",
      () => this.setSelectedPointColour(),
    );
    this.container.appendChild(colourSelector);
    this.colourSelector = colourSelector;
  }

  private addAxisLabels() {
    let dpr = this.renderer.getPixelRatio();
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
          dpr,
        );
      });
    }
  }

  private setPointIndicesFromBoxSelection(
    selection: SelectionBox,
    shiftKey: boolean,
  ) {
    const { pickingTexture, renderer, canvas } = this;
    const dpr = renderer.getPixelRatio();

    let canvas_coords = canvas.getBoundingClientRect();
    let x = (Math.min(selection.startPoint.x, selection.endPoint.x) -
      canvas_coords.left) * dpr;
    let y = (Math.max(selection.startPoint.y, selection.endPoint.y) -
      canvas_coords.top) * dpr;
    let width = Math.abs(selection.startPoint.x - selection.endPoint.x) * dpr;
    let height = Math.abs(selection.startPoint.y - selection.endPoint.y) * dpr;

    let pixelBuffer = new Uint8Array(4 * width * height);

    renderer.readRenderTargetPixels(
      pickingTexture,
      x,
      pickingTexture.height - y,
      width,
      height,
      pixelBuffer,
    );

    let selectedPointSet = new Set<number>();
    let id;
    for (let i = 0; i < width * height; i++) {
      id = (pixelBuffer[4 * i] << 16) |
        (pixelBuffer[4 * i + 1] << 8) |
        (pixelBuffer[4 * i + 2]);
      if (id != 0 && id != 0xffffff) {
        selectedPointSet.add(id - 1);
      }
    }

    if (shiftKey) {
      this.selectedPointIndices.map((v) => selectedPointSet.add(v));
    }

    this.selectedPointIndices = Array.from(selectedPointSet);

    if (this.crosstalkIndex) {
      this.crosstalkSelectionHandle.set(
        this.selectedPointIndices.map((i) => this.crosstalkIndex[i]),
      );
    }
  }

  private setPointIndicesFromCrosstalkEvent(e: any) {
    if (e.sender == this.crosstalkSelectionHandle) {
      return;
    }

    let newSelection = e.value.map((v: string) =>
      this.crosstalkIndex.indexOf(v)
    );

    // persistent selection with plotly
    let ctOpts = crosstalk.var("plotlyCrosstalkOpts").get() || {};
    if (ctOpts.persistent === true) {
      newSelection = this.selectedPointIndices.concat(newSelection);
    }

    this.selectedPointIndices = newSelection;
    this.highlightSelectedPoints();
  }

  private setTooltipFromHover(event: MouseEvent) {
    const { pickingTexture, renderer, canvas } = this;
    const dpr = renderer.getPixelRatio();

    let canvas_coords = canvas.getBoundingClientRect();
    let x = (event.x - canvas_coords.left) * dpr;
    let y = (event.y - canvas_coords.top) * dpr;
    let width = 1;
    let height = 1;

    let pixelBuffer = new Uint8Array(12);

    renderer.readRenderTargetPixels(
      pickingTexture,
      x,
      pickingTexture.height - y,
      width,
      height,
      pixelBuffer,
    );

    let id = (pixelBuffer[0] << 16) |
      (pixelBuffer[1] << 8) |
      (pixelBuffer[2]);
    if (id != 0 && id != 0xffffff) {
      let toolTipCoords = this.toolTip.getBoundingClientRect();
      this.toolTip.style.left = `${Math.floor(x / dpr) -
        toolTipCoords.width}px`;
      this.toolTip.style.top = `${Math.floor(y / dpr) -
        toolTipCoords.height}px`;
      this.toolTip.className = "tooltip visible";
      let span = this.toolTip.querySelector("span");
      span.innerHTML = `${this.mapping.label[id - 1]}`;
    } else {
      this.toolTip.className = "tooltip";
    }
  }

  // TODO: break away chunks in to separate functions
  private animate() {
    let delta = this.clock.getDelta();

    if (!this.getIsPaused()) {
      this.time += delta;
    }

    if (this.time >= this.config.duration) this.time = 0;

    let currentFrame = Math.floor(this.time * this.config.fps);
    this.currentFrame = currentFrame;

    if (currentFrame != this.oldFrame) {
      this.currentFrameBuffer = this.nextFrameBuffer;

      this.points.geometry.setAttribute("position", this.currentFrameBuffer);
      this.points.geometry.attributes.position.needsUpdate = true;

      // precalculate point positions for the next frame
      this.nextFrameBuffer = this.getPointsBuffer(
        (currentFrame + 1) % this.projectionMatrices.length,
        this.config.center,
      );

      if (this.hasAxes) {
        this.axisSegments.geometry.setAttribute(
          "position",
          this.getAxisLinesBuffer(currentFrame),
        );
        this.axisSegments.geometry.attributes.position.needsUpdate = true;
      }
      if (this.hasEdges) {
        let edgesBuffer = this.getEdgesBuffer(this.currentFrameBuffer);
        this.edgeSegments.geometry.setAttribute("position", edgesBuffer);
      }

      this.oldFrame = currentFrame;
      this.timeline.updatePosition(
        currentFrame / this.projectionMatrices.length,
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
    // disable antialiasing and alpha in picking scene
    (this.points.material as THREE.ShaderMaterial).uniforms.antialias.value = 0;
    this.renderer.setRenderTarget(this.pickingTexture);
    this.renderer.render(this.scene, this.camera);

    // reset from picking scene
    this.renderer.setRenderTarget(null);
    this.points.geometry.setAttribute("color", this.pointColours);
    (this.points.material as THREE.ShaderMaterial).uniforms.antialias.value = 1;

    // update axis labels
    if (this.hasAxisLabels) {
      this.axisLabels.map((x, i) =>
        x.updatePosition(this.projectionMatrices[currentFrame][i], this.camera)
      );
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
    } else {
    }
    this.timeline.updatePlayPauseIcon(isPaused);
  }

  public setTime(newTimePercent: number) {
    this.time = this.config.duration * newTimePercent;
  }

  private setControlType(controlType: ControlType) {
    let currentButtonClassName =
      `${this.controlType.toString().toLowerCase()}Button`;
    let selectedButtonClassName =
      `${controlType.toString().toLowerCase()}Button`;

    let currentButton: HTMLButtonElement = this.container.querySelector(
      `.${currentButtonClassName}`,
    );
    let selectedButton: HTMLButtonElement = this.container.querySelector(
      `.${selectedButtonClassName}`,
    );

    switch (controlType) {
      case "ORBIT": {
        if (this.controlType == "SELECT") {
          this.setSelectionMode(false);
        }
        this.orbitControls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        };
        break;
      }
      case "PAN": {
        if (this.controlType == "SELECT") {
          this.setSelectionMode(false);
        }
        this.orbitControls.mouseButtons = {
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        };
        break;
      }
      case "SELECT": {
        this.setSelectionMode(true);
      }
      default: {
        break;
      }
    }
    this.controlType = controlType;
    currentButton.className = `${currentButtonClassName} unselected`;
    selectedButton.className = `${selectedButtonClassName} selected`;
  }

  private selectionStartEventListener = (event: MouseEvent) => {
    this.selectionBox.startPoint.set(
      Math.floor(event.clientX),
      Math.floor(event.clientY),
      0,
    );
  };

  private selectionMoveEventListener = (event: MouseEvent) => {
    if (this.selectionHelper.isDown) {
      this.selectionBox.endPoint.set(
        Math.floor(event.clientX),
        Math.floor(event.clientY),
        0,
      );
    }
  };

  private selectionEndEventListener = (event: MouseEvent) => {
    this.selectionBox.endPoint.set(
      Math.floor(event.clientX),
      Math.floor(event.clientY),
      0,
    );
    this.setPointIndicesFromBoxSelection(this.selectionBox, event.shiftKey);
    //this.setSelectedPointColour();
    this.highlightSelectedPoints();
  };

  private setSelectedPointColour() {
    let colour = new THREE.Color(this.colourSelector.value);

    for (const ind of this.selectedPointIndices) {
      this.pointColours.set([colour.r, colour.g, colour.b], ind * 3);
    }
    this.pointColours.needsUpdate = true;
  }

  private setDefaultPointColours() {
    this.pointColours = this.coloursToBufferAttribute(this.mapping.colour);
  }

  private setDefaultPointSelection() {
    this.selectedPointIndices = Array(this.dataset.length)
      .fill(0)
      .map((_, i) => i);
  }

  private highlightSelectedPoints() {
    // reset to default
    if (this.selectedPointIndices.length == 0) {
      this.pointAlphas.set(
        new Float32Array(this.dataset.length).fill(this.config.alpha),
        0,
      );
    } else {
      for (let i = 0; i < this.dataset.length; i++) {
        if (!this.selectedPointIndices.includes(i)) {
          this.pointAlphas.set([this.config.alpha / 4], i);
        } else {
          this.pointAlphas.set([this.config.alpha], i);
        }
      }
    }
    this.pointAlphas.needsUpdate = true;
  }

  private setSelectionMode(enable: boolean) {
    let selectButton = this.container.querySelector("button.selectButton");

    if (enable) {
      this.orbitControls.enabled = false;
      selectButton.className = "selectButton selected";
      this.selectionHelper.element.className = "selectBox enabled";

      this.renderer.domElement.addEventListener(
        "pointerdown",
        this.selectionStartEventListener,
      );
      this.renderer.domElement.addEventListener(
        "pointermove",
        this.selectionMoveEventListener,
      );
      this.renderer.domElement.addEventListener(
        "pointerup",
        this.selectionEndEventListener,
      );
    } else {
      selectButton.className = "selectButton unselected";
      this.orbitControls.enabled = true;
      this.renderer.domElement.removeEventListener(
        "pointerdown",
        this.selectionStartEventListener,
      );
      this.renderer.domElement.removeEventListener(
        "pointermove",
        this.selectionMoveEventListener,
      );
      this.renderer.domElement.removeEventListener(
        "pointerup",
        this.selectionEndEventListener,
      );

      // make selection box invisible
      this.selectionHelper.element.className = "selectBox disabled";
    }
  }

  private resetClock() {
    this.time = 0;
  }
}

class AxisLabel {
  private div: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private text: string;
  private position: THREE.Vector3;
  private dim: Dim;
  private dpr: number;

  constructor(
    text: string,
    pos: number[],
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    camera: Camera,
    dim: Dim,
    dpr: number,
  ) {
    this.div = document.createElement("div");
    this.div.innerHTML = text;
    this.div.className = "axisLabel";

    this.canvas = canvas;
    this.text = text;
    this.position = new THREE.Vector3();
    this.dim = dim;
    this.dpr = dpr;

    container.appendChild(this.div);
    this.updatePosition(pos, camera);
  }

  public updatePosition(pos: number[], camera: Camera) {
    if (this.dim == 3) {
      this.position.set(pos[0], pos[1], pos[2]);
    } else {
      this.position.set(pos[0], 0, pos[1]);
    }
    var coords2d = this.get2DCoords(camera);

    this.div.style.left = coords2d.x + "px";
    this.div.style.top = coords2d.y + "px";
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
}
