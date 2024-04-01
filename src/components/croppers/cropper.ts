import { fabric } from "fabric";

abstract class Cropper {
  protected image?: fabric.Image
  protected canvas?: fabric.Canvas

  public src: string
  public width: number
  public height: number

  constructor(src: string, width: number = 0, height: number = 0) {
    this.src = src
    this.width = width
    this.height = height
  }

  protected getObjectByName(name: string): fabric.Object | null {
    const objects = this.canvas!.getObjects().filter(value => value.name == name) 
    if (objects.length > 0) return objects[0]
    return null
  }

  public async render() {}

  protected async setCanvas() {
    this.image = await this.createImage(this.src);
    
    if (!this.canvas) {
      // Instance of canvas if not exists
      this.canvas = new fabric.Canvas("CANVASID", { selection: false });
    } else {
      // If instance of canvas exists clear all data and draw objects from scratch
      this.canvas.clear()
      this.canvas.remove(...this.canvas.getObjects())
    }

    this.canvas.setDimensions({
      width: this.image.width! * this.scale,
      height: this.image.height! * this.scale,
    })
    
    this.canvas.setOverlayImage(this.image, this.canvas.renderAll.bind(this.canvas), {
      scaleX: this.canvas.width! / this.image.width!,
      scaleY: this.canvas.height! / this.image.height!,
      globalCompositeOperation: "destination-atop",
    });
  }

  private createImage(src: string): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      try {
        fabric.Image.fromURL(src, (oimg) => {
          resolve(oimg);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  protected drawMask() {
    let overlay = this.getObjectByName("overlay")
    if (!overlay) {
      overlay = new fabric.Rect({
        name: "overlay",
        left: 0,
        top: 0,
        width: this.canvas!.width,
        height: this.canvas!.height,
        fill: "rgba(0, 0, 0, 0.7)",
        evented: false,
        globalCompositeOperation: "source-over",
      });
      this.canvas!.add(overlay);
    }
  }

  get scale() {
    if (this.image) {
      if (this.width > 0) 
        return this.width / this.image.width!
      if (this.height > 0) 
        return this.height / this.image.height!
      return 1
    }
    return 1
  }
}

export default Cropper