import * as THREE from "three";
import { DisplayScatter } from "../display_scatter";
import { Matrix, ProjectionMatrix } from "../display_scatter/types";
import { VERTEX_SHADER_3D } from "./shaders";
import { FRAGMENT_SHADER } from "../display_scatter/shaders";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class DisplayScatter3d extends DisplayScatter {
  public camera: THREE.PerspectiveCamera;

  constructor(containerElement: HTMLDivElement, width: number, height: number) {
    super(containerElement, width, height);
  }

  protected addCamera() {
    let aspect = this.width / this.height;
    let camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 1000);
    camera.position.setZ(4);
    this.camera = camera;
  }

  protected addOrbitControls() {
    let orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
    );
    this.orbitControls = orbitControls;
  }

  protected resizeCamera(aspect: number) {
    this.camera.aspect = aspect;
  }

  protected multiply(a: Matrix, b: ProjectionMatrix): Matrix {
    // TODO: return flattened result as Float32Array for performance
    let aRows = a.length;
    let aCols = a[0].length;
    let result = new Array(aRows);
    for (let r = 0; r < aRows; ++r) {
      const row = new Array(3);
      result[r] = row;
      const ar = a[r];
      for (let c = 0; c < 3; ++c) {
        let sum = 0.;
        for (let i = 0; i < aCols; ++i) {
          sum += ar[i] * b[i][c];
        }
        row[c] = sum;
      }
    }
    return result;
  }

  protected getShaderOpts(pointSize: number): THREE.ShaderMaterialParameters {
    let shaderOpts: THREE.ShaderMaterialParameters;
    shaderOpts = {
      uniforms: {
        size: { value: Math.max(pointSize, this.minPointSize) },
        antialias: { value: 1 },
      },
      vertexShader: VERTEX_SHADER_3D,
      fragmentShader: FRAGMENT_SHADER,
      extensions: { derivatives: true },
      transparent: true,
      depthTest: false,
    };
    return shaderOpts;
  }

  protected projectionMatrixToAxisLines(m: Matrix): Matrix {
    return m.map((row) => [0, 0, 0].concat(row));
  }
}
