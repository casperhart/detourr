import * as THREE from "three";
import { DisplayScatter2d } from "../show_scatter_2d";
import { DisplayScatterConfig } from "../show_scatter/show_scatter";
import * as tf from "@tensorflow/tfjs-core";

interface DisplaySage2dConfig extends DisplayScatterConfig {
  effectiveInputDim: number;
  R: number;
}

export class DisplaySage2d extends DisplayScatter2d {
  public camera: THREE.OrthographicCamera;
  protected config: DisplaySage2dConfig;

  constructor(containerElement: HTMLDivElement, width: number, height: number) {
    super(containerElement, width, height);
  }

  private cumulative_radial_2d(r: number, R: number, p: number) {
    return Math.sqrt(1 - (1 - (r / R) ** 2) ** (p / 2));
  }

  private scaleRadii(projected: tf.Tensor2D): tf.Tensor2D {
    const projectedArray = projected.dataSync();
    let r_trim: number;
    let r_prime: number;
    let r: number;
    for (let i = 0; i < projectedArray.length / 3; i++) {
      r = Math.sqrt(
        projectedArray[i * 3] ** 2 + projectedArray[i * 3 + 2] ** 2
      );
      r_trim = Math.min(this.config.R, r);
      r_prime = this.cumulative_radial_2d(
        r_trim,
        this.config.R,
        this.config.effectiveInputDim
      );
      projectedArray[i * 3] = (projectedArray[i * 3] * r_prime) / r;
      projectedArray[i * 3 + 1] = 0;
      projectedArray[i * 3 + 2] = (projectedArray[i * 3 + 2] * r_prime) / r;
    }
    return tf.tensor(projectedArray);
  }

  protected project(X: tf.Tensor2D, A: tf.Tensor2D): tf.Tensor2D {
    return this.scaleRadii(tf.matMul(X, A)) as tf.Tensor2D;
  }
}
