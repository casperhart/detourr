export interface ScatterInputData {
    config: Config;
    dataset: Dataset;
    projectionMatrices: Array<ProjectionMatrix>;
}

export interface Config { fps: number, duration: number, cacheFrames: boolean };

export type Dataset = Array<Array<number>>;

export type ProjectionMatrix = Array<[number, number, number]>