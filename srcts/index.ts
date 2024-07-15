import { DisplaySage2d } from "./show_sage_2d";
import { DisplaySage3d } from "./show_sage_3d";
import { DisplayScatter2d } from "./show_scatter_2d";
import { DisplayScatter3d } from "./show_scatter_3d";
import { DisplaySlice2d } from "./show_slice_2d";
import { DisplaySlice3d } from "./show_slice_3d";
import { DisplayScatterInputData } from "./show_scatter/show_scatter";

interface DetourrInputData extends DisplayScatterInputData {
    widgetType: string
}

export class Detourr {
    private inner?: DisplaySage2d | DisplaySage3d |
        DisplayScatter2d | DisplayScatter3d |
        DisplaySlice2d | DisplaySlice3d;

    private width: number;
    private height: number;
    private el: HTMLDivElement;

    constructor(el: HTMLDivElement, width: number, height: number) {
        this.el = el;
        this.width = width;
        this.height = height;
    };

    public renderValue(inputData: DetourrInputData) {

        switch (inputData.widgetType) {
            case 'DisplaySage2d':
                this.inner = new DisplaySage2d(this.el, this.width, this.height);
                break
            case 'DisplaySage3d':
                this.inner = new DisplaySage3d(this.el, this.width, this.height);
                break
            case 'DisplayScatter2d':
                this.inner = new DisplayScatter2d(this.el, this.width, this.height);
                break
            case 'DisplayScatter3d':
                this.inner = new DisplayScatter3d(this.el, this.width, this.height);
                break
            case 'DisplaySlice2d':
                this.inner = new DisplaySlice2d(this.el, this.width, this.height);
                break
            case 'DisplaySlice3d':
                this.inner = new DisplaySlice3d(this.el, this.width, this.height);
                break
            default:
                console.error(`Widget type ${inputData.widgetType} is not available`)
        }
        this.inner.renderValue(inputData)
    }

    public resize(width: number, height: number) {
        this.inner.resize(width, height)
    }
}