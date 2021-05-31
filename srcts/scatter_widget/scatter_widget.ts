
export class ScatterWidget {
    private container: HTMLElement;
    private width: bigint;
    private height: bigint;


    constructor(containerElement: HTMLElement, width: bigint, height: bigint) {
        this.container = containerElement;
        this.width = width;
        this.height = height;
    }

    public resize(width: bigint, height: bigint) {
        this.width = width;
        this.height = height;
    }

    public renderValue(x: string) {
        console.log(x)
    }
}