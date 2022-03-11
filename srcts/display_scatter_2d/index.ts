import * as THREE from "three";
import { DisplayScatter } from "../display_scatter";
import { Matrix, ProjectionMatrix } from "../display_scatter/types";
import { VERTEX_SHADER_2D } from "./shaders";
import { FRAGMENT_SHADER } from "../display_scatter/shaders";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class DisplayScatter2d extends DisplayScatter {
  public camera: THREE.OrthographicCamera;

  constructor(containerElement: HTMLDivElement, width: number, height: number) {
    super(containerElement, width, height);
  }

  protected addCamera() {
    const aspect = this.width / this.height;
    const camera = new THREE.OrthographicCamera(
      -1 * aspect,
      1 * aspect,
      1,
      -1,
      -1000,
      1000
    );
    // orbit controls don't rotate along camera z axis at all, so as a hack, we disable rotation
    // on the y axis and change the camera view
    camera.position.setY(4);
    camera.up.set(0, -1, 0);
    this.camera = camera;
  }

  protected addOrbitControls() {
    const orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    // We can only disable rotation on the x and y axes, so to get around this, we need
    // to disable rotation on y, and modify the camera view to be top-down
    orbitControls.minPolarAngle = Math.PI;
    orbitControls.maxPolarAngle = Math.PI;
    this.orbitControls = orbitControls;
  }

  public resizeCamera(aspect: number) {
    (this.camera as THREE.OrthographicCamera).left = -1 * aspect;
    (this.camera as THREE.OrthographicCamera).right = 1 * aspect;
    (this.camera as THREE.OrthographicCamera).top = 1;
    (this.camera as THREE.OrthographicCamera).bottom = -1;
  }

  protected project(a: Matrix, b: ProjectionMatrix): Matrix {
    // TODO: return flattened result as Float32Array for performance
    const aRows = a.length;
    const aCols = a[0].length;
    const result = new Array(aRows);
    for (let r = 0; r < aRows; ++r) {
      const row = new Array(3);
      result[r] = row;
      const ar = a[r];
      for (let c = 0; c < 2; c++) {
        let sum = 0;
        for (let i = 0; i < aCols; ++i) {
          sum += ar[i] * b[i][c];
        }
        row[c * 2] = sum;
      }
      row[1] = 0; // no y dimension for 2D
    }
    return result;
  }

  protected getShaderOpts(pointSize: number) {
    const shaderOpts: THREE.ShaderMaterialParameters = {
      uniforms: {
        size: { value: Math.max(pointSize, this.minPointSize) },
        zoom: { value: this.camera.zoom },
        picking: { value: 0 },
      },
      vertexShader: VERTEX_SHADER_2D,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: true,
      depthWrite: true,
    };

    return shaderOpts;
  }

  protected projectionMatrixToAxisLines(m: Matrix): Matrix {
    return m.map((row) => [0, 0, 0, row[0], 0, row[1]]);
  }

  protected adjustPointSizeFromZoom() {
    (this.points.material as THREE.ShaderMaterial).uniforms.zoom.value =
      this.camera.zoom;
  }
}
