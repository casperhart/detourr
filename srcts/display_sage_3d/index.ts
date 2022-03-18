import * as THREE from "three";
import { DisplayScatter3d } from "../display_scatter_3d";
import { matMul, Tensor2D } from "@tensorflow/tfjs-core";
import { DisplayScatterConfig } from "../display_scatter/display_scatter";
import betainc from "@stdlib/math-base-special-betainc";

interface DisplaySage3dConfig extends DisplayScatterConfig {
  effectiveInputDim: number;
  R: number;
}

export class DisplaySage3d extends DisplayScatter3d {
  public camera: THREE.PerspectiveCamera;
  protected config: DisplaySage3dConfig;

  constructor(containerElement: HTMLDivElement, width: number, height: number) {
    super(containerElement, width, height);
  }

  private cumulative_radial_3d(r: number, R: number, p: number) {
    return betainc(r ** 2 / R ** 2, 3 / 2, (p - 1) / 2) ** (1 / 3);
  }

  private scaleRadii(projected: Float32Array): Float32Array {
    let r: number;
    let rad: number;
    for (let i = 0; i < projected.length / 3; i++) {
      r = Math.min(
        this.config.R,
        Math.sqrt(
          projected[i * 3] ** 2 +
            projected[i * 3 + 1] ** 2 +
            projected[i * 3 + 2] ** 2
        )
      );
      rad = this.cumulative_radial_3d(
        r,
        this.config.R,
        this.config.effectiveInputDim
      );
      projected[i * 3] = (projected[i * 3] * rad) / r;
      projected[i * 3 + 1] = (projected[i * 3 + 1] * rad) / r;
      projected[i * 3 + 2] = (projected[i * 3 + 2] * rad) / r;
    }
    return projected;
  }

  protected project(X: Tensor2D, A: Tensor2D): Float32Array {
    return this.scaleRadii(matMul(X, A).dataSync() as Float32Array);
  }
}
