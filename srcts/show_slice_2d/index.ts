import { DisplayScatter2d } from "../show_scatter_2d";
import { DisplayScatterConfig } from "../show_scatter/show_scatter";
import * as tf from "@tensorflow/tfjs-core";

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

  protected project(X: tf.Tensor2D, A: tf.Tensor2D): tf.Tensor2D {
    const projected = tf.matMul(X, A);

    // update point alphas for slice tour
    const dists = tf
      .sqrt(
        tf.sum(tf.square(tf.sub(X, tf.matMul(projected, tf.transpose(A)))), 1)
      )
      .dataSync();

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

    return projected as tf.Tensor2D;
  }
}
