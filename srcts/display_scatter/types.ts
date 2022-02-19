export interface ScatterInputData {
  config: Config;
  dataset: Matrix;
  projectionMatrices: Array<ProjectionMatrix>;
  mapping: Mapping;
  crosstalk: any;
}

export interface Config {
  fps: number;
  duration: number;
  size: number;
  axisLabels: string[];
  axes: boolean;
  edges: Matrix;
  alpha: number;
  backgroundColour: string;
  paused: boolean;
  basisIndices: number[];
}

export interface Mapping {
  colour: string[];
  label: string[];
}

export type Matrix = number[][];

export type ProjectionMatrix =
  | Array<[number, number, number]>
  | Array<[number, number]>;

export type Dim = 2 | 3;

export type Camera = THREE.PerspectiveCamera | THREE.OrthographicCamera;

export interface BoxSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}
