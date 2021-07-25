export interface ScatterInputData {
    config: Config;
    dataset: Matrix;
    projectionMatrices: Array<ProjectionMatrix>;
    mapping: { colour: string[] }
}

export interface Config { fps: number, duration: number, cacheFrames: boolean, center: boolean };

export type Matrix = Array<Array<number>>;

export type ProjectionMatrix = Array<[number, number, number]> | Array<[number, number]>

export type Dim = 2 | 3;