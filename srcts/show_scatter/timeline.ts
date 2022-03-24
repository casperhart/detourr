import { pauseIcon, playIcon } from "./icons";

interface TimelineableWidget {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  getBasisIndices?(): number[];
  getNumAnimationFrames?(): number;
  getIsPaused(): boolean;
  setIsPaused(isPaused: boolean): void;
  setTime(time: number): void;
}

export class Timeline {
  private parentDiv: HTMLDivElement;
  private container: HTMLDivElement;
  private widget: TimelineableWidget;
  private timeline: HTMLElement;
  private scrubber: HTMLElement;
  private playPauseButton: HTMLElement;
  private timelineWidth: number;
  private scrubberWidth = 16;
  private timelineThickness = 4;
  private numAnimationFrames: number;
  private basisIndices: number[];
  private hasBasisIndicators = true;
  private basisIndicators: HTMLDivElement[] = [];
  private basisIndicatorDiameter = 4;
  private tooltip: HTMLDivElement;

  private mouseDown = false;
  private currentPosition: number;
  private candidatePosition: number;
  private lastMousePosition: number;

  constructor(widget: TimelineableWidget) {
    this.widget = widget;
    this.parentDiv = widget.container;

    this.addContainer();
    this.addTimeline();
    this.addScrubber();
    this.addPlayPauseButton();
    this.addBasisIndicators();
    this.addEventListeners();
    this.addTooltip();
  }

  public updatePosition(newPos: number) {
    if (!this.mouseDown) {
      this.scrubber.style.left = Math.floor(this.timelineWidth * newPos) + "px";
    }
  }

  public updatePlayPauseIcon(isPaused: boolean) {
    if (isPaused) {
      this.playPauseButton.innerHTML = playIcon;
    } else {
      this.playPauseButton.innerHTML = pauseIcon;
    }
  }

  private addButton(
    name: string,
    hoverText: string,
    icon: string,
    buttonCallback: Function
  ) {
    const button = document.createElement("button");
    button.innerHTML = icon;
    button.title = hoverText;
    button.className = `detourrButton ${name}Button`;
    button.onclick = () => buttonCallback();
    return button;
  }

  public getElement() {
    return this.container;
  }

  public resize(newHeight: number, newPos: number) {
    // newHeight-40 is the top of the play/pause button, which is 30px tall
    this.container.style.top = newHeight - 40 + "px";
    this.timelineWidth = this.timeline.offsetWidth - this.scrubberWidth;
    if (this.hasBasisIndicators) {
      for (let i = 0; i < this.basisIndices.length; i++) {
        this.basisIndicators[i].style.left =
          (this.basisIndices[i] / (this.numAnimationFrames - 1)) *
            this.timelineWidth +
          this.scrubberWidth / 2 -
          this.basisIndicatorDiameter / 2 +
          "px";
      }
    }
    this.updatePosition(newPos);
  }

  public clear() {
    this.widget.container.removeChild(this.container);
  }

  private addContainer() {
    const container = document.createElement("div");
    container.className = "timelineContainer";
    this.container = container;
  }

  private addTimeline() {
    const timeline = document.createElement("div");
    timeline.className = "timeline";
    timeline.style.height = this.timelineThickness + "px";
    timeline.style.top = 15 - this.timelineThickness / 2 + "px";
    this.container.appendChild(timeline);
    this.timeline = timeline;
  }

  private addBasisIndicators() {
    if (!this.widget.getBasisIndices || !this.widget.getNumAnimationFrames) {
      this.hasBasisIndicators = false;
      return;
    }

    this.basisIndices = this.widget.getBasisIndices();
    this.numAnimationFrames = this.widget.getNumAnimationFrames();

    for (let i = 0; i < this.basisIndices.length; i++) {
      const basisIndicator = document.createElement("div");
      basisIndicator.className = "basisIndicator";
      basisIndicator.style.width = this.basisIndicatorDiameter + "px";
      basisIndicator.style.height = this.basisIndicatorDiameter + "px";
      basisIndicator.addEventListener("mouseover", (event: MouseEvent) =>
        this.basisIndicatorHoverCallback(event, i)
      );
      basisIndicator.addEventListener("click", (event: MouseEvent) =>
        this.basisIndicatorClickCallback(event, i)
      );
      this.basisIndicators.push(basisIndicator);
      this.timeline.appendChild(basisIndicator);
    }
  }

  private addTooltip() {
    const tooltip = document.createElement("div");
    const tooltipText = document.createElement("span");
    tooltip.appendChild(tooltipText);
    tooltip.className = "detourrTooltip";
    tooltip.style.top = "-20px";
    this.container.appendChild(tooltip);
    this.tooltip = tooltip;
  }

  private basisIndicatorHoverCallback(event: MouseEvent, ind: number) {
    const span = this.tooltip.querySelector("span");
    span.innerHTML = `Basis ${ind + 1}`;
    const canvasCoords = this.container.getBoundingClientRect();
    const tooltipCoords = this.tooltip.getBoundingClientRect();

    const x = event.clientX - canvasCoords.left;
    this.tooltip.className = "detourrTooltip visible";
    this.tooltip.style.left = `${Math.floor(x) - tooltipCoords.width}px`;
    setTimeout(() => (this.tooltip.className = "detourrTooltip"), 3000);
  }

  private basisIndicatorClickCallback(event: MouseEvent, ind: number) {
    this.widget.setTime(this.basisIndices[ind] / this.numAnimationFrames);
  }

  private addScrubber() {
    const scrubber = document.createElement("div");
    scrubber.style.left = "0px";
    scrubber.style.width = this.scrubberWidth + "px";
    scrubber.style.height = this.scrubberWidth + "px";
    scrubber.className = "scrubber";
    scrubber.style.top =
      this.timelineThickness / 2 - this.scrubberWidth / 2 + "px";
    scrubber.onmousedown = (e) => {
      this.mouseDown = true;
      this.lastMousePosition = e.clientX;
      this.widget.setIsPaused(true);
    };
    this.timeline.appendChild(scrubber);
    this.scrubber = scrubber;
  }

  private setTimeFromMousePosition(e: MouseEvent) {
    this.currentPosition = parseInt(this.scrubber.style.left);

    this.candidatePosition =
      this.currentPosition + (e.clientX - this.lastMousePosition);
    this.candidatePosition = Math.min(
      this.timelineWidth,
      this.candidatePosition
    );
    this.candidatePosition = Math.max(0, this.candidatePosition);
    this.scrubber.style.left = this.candidatePosition + "px";
    this.widget.setTime(this.candidatePosition / (this.timelineWidth + 1));
    this.lastMousePosition = e.clientX;
  }

  private addEventListeners() {
    this.parentDiv.addEventListener("mousemove", (e) => {
      if (this.mouseDown) {
        this.setTimeFromMousePosition(e);
      }
    });

    // document element so mouseup can be from anywhere
    document.body.addEventListener("mouseup", () => {
      this.mouseDown = false;
    });

    // prevent scrubber 'sticking' to mouse if the mouse leaves the page
    document.body.addEventListener("mouseleave", () => {
      this.mouseDown = false;
    });
  }

  private addPlayPauseButton() {
    this.playPauseButton = this.addButton(
      "playPause",
      "Play / Pause",
      pauseIcon,
      () => this.widget.setIsPaused(!this.widget.getIsPaused())
    );

    this.container.appendChild(this.playPauseButton);
  }
}
