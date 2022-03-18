import { DisplayScatter2d } from "../display_scatter_2d";
import { DisplayScatterConfig } from "../display_scatter/display_scatter";
import {
  matMul,
  transpose,
  Tensor2D,
  square,
  sub,
  sqrt,
  sum,
} from "@tensorflow/tfjs-core";

interface DisplaySlice2dConfig extends DisplayScatterConfig {
  epsilon: number;
}

export class DisplaySlice2d extends DisplayScatter2d {
  protected config: DisplaySlice2dConfig;

  constructor(containerElement: HTMLDivElement, width: number, height: number) {
    super(containerElement, width, height);

    // hide select and brush buttons
    this.selectButtonAction = null;
    this.brushButtonAction = null;
  }

  protected project(X: Tensor2D, A: Tensor2D): Float32Array {
    const projected = matMul(X, A);

    // update point alphas for slice tour
    const dists = sqrt(
      sum(square(sub(X, matMul(projected, transpose(A)))), 1)
    ).dataSync();

    this.pointAlphas.set(
      dists.map((x) => {
        if (x < this.config.epsilon) {
          return 1;
        } else {
          return 0.1;
        }
      })
    );
    this.pointAlphas.needsUpdate = true;

    return projected.dataSync() as Float32Array;
  }
}
