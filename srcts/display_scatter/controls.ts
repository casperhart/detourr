import { brushIcon, orbitIcon, panIcon, resetIcon, selectIcon } from "./icons";
import { Color } from "three";

interface ScatterControlableWidget {
  container: HTMLDivElement;
  resetButtonAction?(): void;
  panButtonAction?(): void;
  orbitButtonAction?(): void;
  selectButtonAction?(): void;
  brushButtonAction?(): void;
}

export class ScatterControls {
  private widget: ScatterControlableWidget;
  private container: HTMLDivElement;
  private resetButton?: HTMLButtonElement;
  private panButton?: HTMLButtonElement;
  private orbitButton?: HTMLButtonElement;
  private selectButton?: HTMLButtonElement;
  private brushButton?: HTMLButtonElement;
  private colourSelector?: HTMLInputElement;
  private selectedButton: HTMLButtonElement;

  constructor(widget: ScatterControlableWidget) {
    this.widget = widget;
    this.container = document.createElement("div");
    this.widget.container.appendChild(this.container);

    this.resetButton = this.widget.resetButtonAction
      ? this.createButton(
          "resetButton",
          "Reset camera position",
          resetIcon,
          () => {
            this.widget.resetButtonAction();
            this.setSelectedButton(this.orbitButton);
            this.widget.orbitButtonAction();
          }
        )
      : null;

    this.panButton = this.widget.panButtonAction
      ? this.createButton(
          "panButton",
          "Switch to pan controls",
          panIcon,
          () => {
            this.setSelectedButton(this.panButton);
            this.widget.panButtonAction();
          }
        )
      : null;

    this.orbitButton = this.widget.orbitButtonAction
      ? this.createButton(
          "orbitButton",
          "Switch to orbit controls",
          orbitIcon,
          () => {
            this.setSelectedButton(this.orbitButton);
            this.widget.orbitButtonAction();
          }
        )
      : null;

    this.selectButton = this.widget.selectButtonAction
      ? this.createButton(
          "selectButton",
          "Switch to selection controls",
          selectIcon,
          () => {
            this.setSelectedButton(this.selectButton);
            this.widget.selectButtonAction();
          }
        )
      : null;

    if (this.widget.brushButtonAction) {
      this.brushButton = this.createButton(
        "brushButton",
        "Colour selected points",
        brushIcon,
        () => this.widget.brushButtonAction()
      );
      this.addColourSelector();
    }

    this.setSelectedButton(this.orbitButton);
    this.widget.orbitButtonAction();
  }

  public getSelectedColour() {
    return new Color(this.colourSelector.value);
  }

  public clear() {
    this.widget.container.removeChild(this.container);
  }

  private createButton(
    className: string,
    hoverText: string,
    icon: string,
    buttonCallback: Function
  ) {
    const button = document.createElement("button");
    button.innerHTML = icon;
    button.title = hoverText;
    button.className = `detourrButton ${className}`;
    button.onclick = () => buttonCallback();
    this.container.appendChild(button);
    return button;
  }

  private setSelectedButton(button: HTMLButtonElement) {
    button.className = button.className + " selected";
    if (this.selectedButton) {
      this.selectedButton.className = this.selectedButton.className.slice(
        0,
        -9
      );
    }
    this.selectedButton = button;
  }

  private addColourSelector() {
    // add colour picker
    const colourSelector = document.createElement("input");
    colourSelector.setAttribute("type", "color");
    colourSelector.className = "colourSelector";
    colourSelector.setAttribute("value", "#619CFF");
    colourSelector.setAttribute(
      "title",
      "Select colour to apply using selection box"
    );
    colourSelector.addEventListener("change", () =>
      this.widget.brushButtonAction()
    );
    this.container.appendChild(colourSelector);
    this.colourSelector = colourSelector;
  }
}
