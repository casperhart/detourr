import { DisplayScatter } from "./display_scatter";
import { pauseIcon, playIcon } from "./icons";

export class Timeline {
  private parentDiv: HTMLDivElement;
  private container: HTMLDivElement;
  private scatterWidget: DisplayScatter;
  private timeline: HTMLElement;
  private scrubber: HTMLElement;
  private playPauseButton: HTMLElement;
  private timelineWidth: number;
  private scrubberWidth: number = 16;
  private timelineThickness: number = 4;

  private mouseDown: boolean = false;
  private currentPosition: number;
  private candidatePosition: number;
  private lastMousePosition: number;

  constructor(scatterWidget: DisplayScatter) {
    this.scatterWidget = scatterWidget;
    this.parentDiv = scatterWidget.getContainerElement();

    let container = document.createElement("div");
    container.className = "timelineContainer";

    let timeline = document.createElement("div");
    timeline.className = "timeline";
    timeline.style.height = this.timelineThickness + "px";
    timeline.style.top = 15 - this.timelineThickness / 2 + "px";

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
      this.scatterWidget.setIsPaused(true);
    };

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
        this.scatterWidget.setTime(
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

    this.playPauseButton = this.addButton(
      "playPause",
      "Play / Pause",
      pauseIcon,
      () =>
        this.scatterWidget.setIsPaused(
          !this.scatterWidget.getIsPaused(),
        ),
    );

    timeline.appendChild(scrubber);
    container.appendChild(timeline);
    container.appendChild(this.playPauseButton);

    this.timeline = timeline;
    this.scrubber = scrubber;
    this.container = container;
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
    this.updatePosition(newPos);
  }
}
