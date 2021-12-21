import { pauseIcon, playIcon } from "./icons";

interface TimelineableWidget {
  getContainerElement(): HTMLDivElement;
  getBasisIndices?(): number[];
  getNumBases?(): number;
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
  private scrubberWidth: number = 16;
  private timelineThickness: number = 4;
  private numBases: number;
  private basisIndices: number[];
  private hasBasisIndicators = true;
  private basisIndicators: HTMLElement[] = [];
  private basisIndicatorDiameter = 4;

  private mouseDown: boolean = false;
  private currentPosition: number;
  private candidatePosition: number;
  private lastMousePosition: number;

  constructor(widget: TimelineableWidget) {
    this.widget = widget;
    this.parentDiv = widget.getContainerElement();

    this.addContainer();
    this.addTimeline();
    this.addScrubber();
    this.addPlayPauseButton();
    this.addBasisIndicators();
    this.addEventListerners();
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
    buttonCallback: Function,
  ) {
    let button = document.createElement("button");
    button.innerHTML = icon;
    button.title = hoverText;
    button.className = `${name}Button`;
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
          (this.basisIndices[i] / (this.numBases)) * (this.timelineWidth) +
          this.scrubberWidth / 2 -
          this.basisIndicatorDiameter / 2 + "px";
      }
    }
    this.updatePosition(newPos);
  }

  private addContainer() {
    let container = document.createElement("div");
    container.className = "timelineContainer";
    this.container = container;
  }

  private addTimeline() {
    let timeline = document.createElement("div");
    timeline.className = "timeline";
    timeline.style.height = this.timelineThickness + "px";
    timeline.style.top = 15 - this.timelineThickness / 2 + "px";
    this.container.appendChild(timeline);
    this.timeline = timeline;
  }

  private addBasisIndicators() {
    if (!this.widget.getBasisIndices || !this.widget.getNumBases) {
      this.hasBasisIndicators = false;
      return;
    }

    this.basisIndices = this.widget.getBasisIndices();
    this.numBases = this.widget.getNumBases();

    for (let i = 0; i < this.basisIndices.length; i++) {
      let basisIndicator = document.createElement("div");
      basisIndicator.className = "basisIndicator";
      basisIndicator.style.width = this.basisIndicatorDiameter + "px";
      basisIndicator.style.height = this.basisIndicatorDiameter + "px";
      this.basisIndicators.push(basisIndicator);
      this.timeline.appendChild(basisIndicator);
    }
  }

  private addScrubber() {
    let scrubber = document.createElement("div");
    scrubber.style.left = "0px";
    scrubber.style.width = this.scrubberWidth + "px";
    scrubber.style.height = this.scrubberWidth + "px";
    scrubber.className = "scrubber";
    scrubber.style.top = this.timelineThickness / 2 -
      this.scrubberWidth / 2 + "px";
    scrubber.onmousedown = (e) => {
      this.mouseDown = true;
      this.lastMousePosition = e.clientX;
      this.widget.setIsPaused(true);
    };
    this.timeline.appendChild(scrubber);
    this.scrubber = scrubber;
  }

  private addEventListerners() {
    this.parentDiv.onmousemove = (e) => {
      e.preventDefault();
      if (this.mouseDown) {
        this.currentPosition = parseInt(this.scrubber.style.left);

        this.candidatePosition = this.currentPosition +
          (e.clientX - this.lastMousePosition);
        this.candidatePosition = Math.min(
          this.timelineWidth,
          this.candidatePosition,
        );
        this.candidatePosition = Math.max(0, this.candidatePosition);
        this.scrubber.style.left = this.candidatePosition + "px";
        this.widget.setTime(
          this.candidatePosition / (this.timelineWidth + 1),
        );
        this.lastMousePosition = e.clientX;
      }
    };

    // document element so mouseup can be from anywhere
    document.documentElement.onmouseup = () => {
      this.mouseDown = false;
    };

    // prevent scrubber 'sticking' to mouse if the mouse leaves the page
    document.documentElement.onmouseleave = () => {
      this.mouseDown = false;
    };
  }

  private addPlayPauseButton() {
    this.playPauseButton = this.addButton(
      "playPause",
      "Play / Pause",
      pauseIcon,
      () =>
        this.widget.setIsPaused(
          !this.widget.getIsPaused(),
        ),
    );

    this.container.appendChild(this.playPauseButton);
  }
}
