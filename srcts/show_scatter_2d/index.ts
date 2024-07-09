import * as THREE from "three";
import { DisplayScatter } from "../show_scatter";
import { Matrix } from "../show_scatter/types";
import { VERTEX_SHADER_2D } from "./shaders";
import { FRAGMENT_SHADER } from "../show_scatter/shaders";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as tf from "@tensorflow/tfjs-core";

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

  protected project(X: tf.Tensor2D, A: tf.Tensor2D): tf.Tensor2D {
    return tf.matMul(X, A);
  }

  protected projectionMatrixToTensor(mat: Matrix): tf.Tensor2D {
    // convert 2 projection matrix in to 3D by adding a column
    // of zeros in the middle
    const matTensor = tf.tensor(mat);
    const zeros = tf.tensor([
      [1, 0, 0],
      [0, 0, 1],
    ]);
    const result = tf.matMul(matTensor, zeros);
    matTensor.dispose();
    zeros.dispose();
    return result as tf.Tensor2D;
  }

  protected getShaderOpts(pointSize: number) {
    const shaderOpts: THREE.ShaderMaterialParameters = {
      uniforms: {
        size: { value: Math.max(pointSize, this.minPointSize) },
        zoom: { value: this.camera.zoom },
        picking: { value: 0 },
        shrink: { value: 0 }
      },
      vertexShader: VERTEX_SHADER_2D,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: true,
      depthWrite: true,
    };

    return shaderOpts;
  }

  protected adjustPointSizeFromZoom() {
    (this.points.material as THREE.ShaderMaterial).uniforms.zoom.value =
      this.camera.zoom;
  }
}
