import { fabric } from "fabric";

import Cropper from "./cropper";

class PolygonCropper extends Cropper {
  private userPoints: { x: number; y: number }[];

  private handlers?: fabric.Rect[];
  private lines?: fabric.Line[];

  constructor(src: string, width: number = 0, height: number = 0, points: { x: number; y: number }[] = []) {
    super(src, width, height);
    this.userPoints = points;
  }

  protected getPoints() {
    if (this.userPoints.length > 0) {
      return this.userPoints.map((value) => {
        return {
          x: value.x * this.scale,
          y: value.y * this.scale,
        };
      });
    } else {
      return [
        { x: 0, y: 0 },
        { x: this.canvas!.width! - 1, y: 0 },
        { x: this.canvas!.width! - 1, y: this.canvas!.height! - 1 },
        { x: 0, y: this.canvas!.height! - 1 },
      ];
    }
  }

  public async render() {
    await this.setCanvas()
    const points = this.getPoints()
    
    this.handlers = points.map((value, index) => {
      return new fabric.Rect({
        left: value.x,
        top: value.y,
        originX: "center",
        originY: "center",
        width: 7,
        height: 7,
        padding: 10,
        fill: "#78a6f1",
        hasControls: false,
        hasBorders: false,
        data: {
          index: index,
        },
      });
    });
    this.lines = this.handlers.map((value, index, arr) => {
      const nextValue = index === arr.length - 1 ? arr[0] : arr[index + 1];
      const points = [value.left!, value.top!, nextValue.left!, nextValue.top!];
      return new fabric.Line(points, {
        stroke: "#78a6f1",
        evented: false,
        data: {
          from: value.data.index,
          to: nextValue.data.index,
        },
      });
    });
    this.objectMovingEvent();
    this.drawMask();

    this.canvas!.add(...this.handlers, ...this.lines);
    this.canvas?.renderAll()
  }

  private objectMovingEvent() {
    this.canvas!.on("object:moving", (e) => {
      const p = e.target;

      const index = p?.data["index"];
      if (p?.left! < 0) {
        p?.set({ left: 0 });
      }
      if (p?.top! < 0) {
        p?.set({ top: 0 });
      }
      if (p?.left! >= Math.trunc(this.canvas!.width!)) {
        p?.set({ left: Math.trunc(this.canvas!.width!) - 1 });
      }
      if (p?.top! > this.canvas!.height!) {
        p?.set({ top: this.canvas!.height! - 1 });
      }

      const fromLine = this.lines!.find((line) => line.data.from === index);
      const toLine = this.lines!.find((line) => line.data.to === index);

      fromLine?.set({ x1: p?.left, y1: p?.top });
      toLine?.set({ x2: p?.left, y2: p?.top });

      this.drawMask();
      this.canvas!.renderAll();
    });
  }

  protected drawMask() {
    super.drawMask();
    const points = this.handlers!.map((value) => {
      return {
        x: value.left!,
        y: value.top!,
      } as fabric.Point;
    });

    let mask = this.getObjectByName("mask") as fabric.Polygon;
    if (!mask) {
      mask = new fabric.Polygon(points, {
        name: "mask",
        evented: false,
        objectCaching: false,
        globalCompositeOperation: "destination-out",
      });
      this.canvas!.add(mask);
    } else {
      mask.set({ points: points });
    }
  }
}

export default PolygonCropper