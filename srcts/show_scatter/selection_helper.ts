import { Vector2 } from "three";

interface SelectableWidget {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  setPointSelectionFromBox(
    topLeft: Vector2,
    bottomRight: Vector2,
    shiftKey: boolean
  ): void;
}

export class SelectionHelper {
  public element: HTMLDivElement;
  public isDown: boolean;
  public enabled: boolean;

  private widget: SelectableWidget;

  private startPoint = new Vector2();
  private pointTopLeft = new Vector2();
  private pointBottomRight = new Vector2();

  constructor(widget: SelectableWidget) {
    this.widget = widget;
    this.element = document.createElement("div");
    this.element.className = "selectionBox";
    this.element.style.pointerEvents = "none";

    this.isDown = false;

    this.widget.container.addEventListener(
      "pointerdown",
      (event: MouseEvent) => {
        this.onSelectStart(event);
      }
    );

    this.widget.container.addEventListener(
      "pointermove",
      (event: MouseEvent) => {
        if (this.isDown) {
          this.onSelectMove(event);
        }
      }
    );

    this.widget.container.addEventListener("pointerup", (event: MouseEvent) => {
      if (this.isDown) {
        this.isDown = false;
        this.onSelectOver(event);
      }
    });
  }

  public disable() {
    this.enabled = false;
  }

  public enable() {
    this.enabled = true;
  }

  private scaleX() {
    return (
      this.widget.canvas.clientWidth /
      this.widget.canvas.getBoundingClientRect().width
    );
  }

  private scaleY() {
    return (
      this.widget.canvas.clientHeight /
      this.widget.canvas.getBoundingClientRect().height
    );
  }

  private onSelectStart(event: MouseEvent) {
    // prevent selection from firing if we click a button, timeline, etc.
    if (this.enabled && event.target === this.widget.canvas) {
      this.isDown = true;
      this.widget.container.appendChild(this.element);
      const pos = this.widget.canvas.getBoundingClientRect();

      this.element.style.left =
        (event.clientX - pos.left) * this.scaleX() + "px";
      this.element.style.top = (event.clientY - pos.top) * this.scaleY() + "px";
      this.element.style.width = "0px";
      this.element.style.height = "0px";

      this.startPoint.x = (event.clientX - pos.left) * this.scaleX();
      this.startPoint.y = (event.clientY - pos.top) * this.scaleY();
    }
  }

  private onSelectMove(event: MouseEvent) {
    if (this.enabled) {
      const pos = this.widget.canvas.getBoundingClientRect();

      this.pointBottomRight.x = Math.max(
        this.startPoint.x,
        (event.clientX - pos.left) * this.scaleX()
      );
      this.pointBottomRight.y = Math.max(
        this.startPoint.y,
        (event.clientY - pos.top) * this.scaleY()
      );
      this.pointTopLeft.x = Math.min(
        this.startPoint.x,
        (event.clientX - pos.left) * this.scaleX()
      );
      this.pointTopLeft.y = Math.min(
        this.startPoint.y,
        (event.clientY - pos.top) * this.scaleY()
      );

      this.element.style.left = this.pointTopLeft.x + "px";
      this.element.style.top = this.pointTopLeft.y + "px";
      this.element.style.width =
        this.pointBottomRight.x - this.pointTopLeft.x + "px";
      this.element.style.height =
        this.pointBottomRight.y - this.pointTopLeft.y + "px";
    }
  }

  private onSelectOver(event: MouseEvent) {
    if (this.enabled) {
      this.onSelectMove(event);
      this.widget.setPointSelectionFromBox(
        this.pointTopLeft,
        this.pointBottomRight,
        event.shiftKey
      );
      this.element.parentElement.removeChild(this.element);
    }
  }
}
