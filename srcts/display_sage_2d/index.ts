import * as THREE from "three";
import { DisplayScatter2d } from "../display_scatter_2d";
import { Matrix, ProjectionMatrix } from "../display_scatter/types";
import { DisplayScatterConfig } from "../display_scatter/display_scatter";

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
    return Math.sqrt((1 - (1 - (r / R) ** 2) ** (p / 2)))
  }

  protected project(a: Matrix, b: ProjectionMatrix): Matrix {
    // TODO: return flattened result as Float32Array for performance
    const aRows = a.length;
    const aCols = a[0].length;
    const result = new Array(aRows);
    let r: number;
    let rad: number;
    let scale_factor: number

    for (let rw = 0; rw < aRows; ++rw) {
      const row = new Array(3);
      result[rw] = row;
      const ar = a[rw];
      for (let c = 0; c < 2; c++) {
        let sum = 0;
        for (let i = 0; i < aCols; ++i) {
          sum += ar[i] * b[i][c];
        }
        row[c * 2] = sum;
      }

      // radius correction for sage tour
      r = Math.min(this.config.R, Math.sqrt((row[0] ** 2) + (row[2] ** 2)))
      rad = this.cumulative_radial_2d(r, this.config.R, this.config.effectiveInputDim);
      scale_factor = rad / r

      row[0] = row[0] * scale_factor
      row[1] = 0; // no y dimension for 2D
      row[2] = row[2] * scale_factor
    }
    return result;
  }
}
