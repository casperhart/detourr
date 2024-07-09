import * as THREE from "three";
import { DisplayScatter } from "../show_scatter";
import { Matrix } from "../show_scatter/types";
import { VERTEX_SHADER_3D } from "./shaders";
import { FRAGMENT_SHADER } from "../show_scatter/shaders";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as tf from "@tensorflow/tfjs-core";

export class DisplayScatter3d extends DisplayScatter {
  public camera: THREE.PerspectiveCamera;

  constructor(containerElement: HTMLDivElement, width: number, height: number) {
    super(containerElement, width, height);
  }

  protected addCamera() {
    const aspect = this.width / this.height;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 1000);
    camera.position.setZ(4);
    this.camera = camera;
  }

  protected addOrbitControls() {
    const orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.orbitControls = orbitControls;
  }

  protected resizeCamera(aspect: number) {
    this.camera.aspect = aspect;
  }

  protected project(X: tf.Tensor2D, A: tf.Tensor2D): tf.Tensor2D {
    return tf.matMul(X, A);
  }

  protected projectionMatrixToTensor(mat: Matrix): tf.Tensor2D {
    return tf.tensor(mat);
  }

  protected getShaderOpts(pointSize: number): THREE.ShaderMaterialParameters {
    const shaderOpts: THREE.ShaderMaterialParameters = {
      uniforms: {
        size: { value: Math.max(pointSize, this.minPointSize) },
        picking: { value: 0 },
        shrink: { value: 0 }
      },
      vertexShader: VERTEX_SHADER_3D,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: true,
      depthWrite: true,
    };
    return shaderOpts;
  }
}
