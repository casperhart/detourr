import * as THREE from "three";
import { DisplayScatter2d } from "../display_scatter_2d";
import { DisplayScatterConfig } from "../display_scatter/display_scatter";
import { matMul, Tensor2D } from "@tensorflow/tfjs-core";

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

  private scaleRadii(projected: Float32Array): Float32Array {
    let r: number;
    let rad: number;
    for (let i = 0; i < projected.length / 3; i++) {
      r = Math.min(
        this.config.R,
        Math.sqrt(projected[i * 3] ** 2 + projected[i * 3 + 2] ** 2)
      );
      rad = this.cumulative_radial_2d(
        r,
        this.config.R,
        this.config.effectiveInputDim
      );
      projected[i * 3] = (projected[i * 3] * rad) / r;
      projected[i * 3 + 1] = 0;
      projected[i * 3 + 2] = (projected[i * 3 + 2] * rad) / r;
    }
    return projected;
  }

  protected project(a: Tensor2D, b: Tensor2D): Float32Array {
    return this.scaleRadii(matMul(a, b).dataSync() as Float32Array);
  }
}
