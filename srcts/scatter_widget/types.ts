export interface ScatterInputData {
    config: Config;
    dataset: Matrix;
    projectionMatrices: Array<ProjectionMatrix>;
    mapping: { colour: string[] };
}

export interface Config {
    fps: number;
    duration: number;
    center: boolean;
    size: number;
    labels: string[];
    axes: boolean;
    edges: Matrix;
};

export type Matrix = number[][];

export type ProjectionMatrix = Array<[number, number, number]> | Array<[number, number]>

export type Dim = 2 | 3;

export type ControlType = "PAN" | "ORBIT" | "SELECT";

export type Camera = THREE.PerspectiveCamera | THREE.OrthographicCamera;

export interface BoxSelection {
    x: number;
    y: number;
    width: number;
    height: number;
}