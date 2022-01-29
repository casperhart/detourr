import * as THREE from "three";
import { Camera, Dim } from "./types";

export class AxisLabel {
  private container: HTMLDivElement;
  private div: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private text: string;
  private position: THREE.Vector3;
  private dim: Dim;
  private dpr: number;

  constructor(
    text: string,
    pos: number[],
    container: HTMLDivElement,
    canvas: HTMLCanvasElement,
    camera: Camera,
    dim: Dim,
    dpr: number
  ) {
    this.div = document.createElement("div");
    this.div.innerHTML = text;
    this.div.className = "axisLabel";

    this.canvas = canvas;
    this.text = text;
    this.position = new THREE.Vector3();
    this.dim = dim;
    this.dpr = dpr;
    this.container = container;

    container.appendChild(this.div);
    this.updatePosition(pos, camera);
  }

  public updatePosition(pos: number[], camera: Camera) {
    if (this.dim == 3) {
      this.position.set(pos[0], pos[1], pos[2]);
    } else {
      this.position.set(pos[0], 0, pos[1]);
    }
    var coords2d = this.get2DCoords(camera);

    this.div.style.left = coords2d.x + "px";
    this.div.style.top = coords2d.y + "px";
  }

  public setDpr(dpr: number) {
    this.dpr = dpr;
  }

  public clear() {
    this.container.removeChild(this.div);
  }

  private get2DCoords(camera: Camera) {
    var vector = this.position.project(camera);
    vector.x = ((vector.x + 1) * this.canvas.width) / (2 * this.dpr);
    vector.y = (-(vector.y - 1) * this.canvas.height) / (2 * this.dpr);
    return vector;
  }
}
