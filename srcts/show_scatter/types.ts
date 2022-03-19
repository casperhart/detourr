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
