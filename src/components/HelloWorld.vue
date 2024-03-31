<script setup lang="ts">
import { onMounted } from "vue";
import { fabric } from "fabric";

const props = defineProps<{
  src: string,
  width?: number,
  height?: number,
  points?: {x: number, y: number}[]
}>()

let fcanvas: fabric.Canvas
let overlay: fabric.Rect
let mask: fabric.Polygon


function getImage(src: string): Promise<fabric.Image> {
  return new Promise((resolve, reject) => {
    try {
      fabric.Image.fromURL(src, (oimg) => {
        resolve(oimg)
      })
    } catch (error) {
      reject(error)
    }
  })
}

function getScale(img: fabric.Image | fabric.Canvas) {
  if (props.width && props.width > 0)
    return props.width / img.width!

  if (props.height && props.height > 0)
    return props.height / img.height!

  return 1
}

async function setCanvas() {
  const oimg = await getImage("image.jpeg")
  const scale = getScale(oimg)

  fcanvas = new fabric.Canvas("CANVASID", {
    width: oimg.width! * scale,
    height: oimg.height! * scale,
    selection: false,
  })

  fcanvas.setOverlayImage(oimg, fcanvas.renderAll.bind(fcanvas), {
    scaleX: fcanvas.width! / oimg.width!,
    scaleY: fcanvas.height! / oimg.height!,
    globalCompositeOperation: 'destination-atop',
  })

  
  if (props.points) {
    return props.points.map(value => {
      return {
        x: value.x * scale,
        y: value.y * scale
      }
    })
  } else {
    return [
      {x: 0, y: 0},
      {x: fcanvas.width! * scale - 1, y: 0},
      {x: fcanvas.width! * scale - 1, y: fcanvas.height! * scale - 1},
      {x: 0, y: fcanvas.height! * scale - 1}
    ]
  }
}

function drawMask(points: {x: number, y:number}[]) {
  if (!overlay) {
    overlay = new fabric.Rect({
      left: 0,
      top: 0,
      width: fcanvas.width,
      height: fcanvas.height,
      fill: 'rgba(0, 0, 0, 0.7)',
      evented: false,
      globalCompositeOperation: 'source-over'
    })
    fcanvas.add(overlay)
  } 
  if (!mask) {
    mask = new fabric.Polygon(points, {
      evented: false,
      objectCaching: false,
      globalCompositeOperation: 'destination-out'
    })
    fcanvas.add(mask)
  } else {
    mask.set({points: points as fabric.Point[]}) 
  }
}

onMounted(async () => {
  const points = await setCanvas()

  const circles = points.map((value, index) => {
    return new fabric.Rect({
      left: value.x,
      top: value.y,
      originX: "center",
      originY: "center",
      width: 7,
      height: 7,
      padding: 15,
      fill: "white",
      hasControls: false,
      hasBorders: false,
      data: {
        index: index
      }
    })
  })

  const lines = circles.map((value, index, arr) => {
    const nextValue = index === arr.length - 1 ? arr[0] : arr[index + 1]
    const points = [value.left!, value.top!, nextValue.left!, nextValue.top!]

    return new fabric.Line(points, {
      stroke: "white",
      evented: false,
      strokeDashArray: [5, 5],
      data: {
        from: value.data.index,
        to: nextValue.data.index
      }
    })
  })
    
  fcanvas.on('object:moving', (e) => {
    const p = e.target

    const index = p?.data["index"]
    if (p?.left! < 0) {
      p?.set({left: 0})
    }
    if (p?.top! < 0) {
      p?.set({top: 0})
    }
    if (p?.left! >= Math.trunc(fcanvas.width!)) {
      p?.set({left: Math.trunc(fcanvas.width!) - 1})
    }
    if (p?.top! > Math.trunc(fcanvas.height!)) {
      p?.set({top: Math.trunc(fcanvas.height!) - 1})
    }

    const fromLine = lines.find((line) => line.data.from === index)
    const toLine = lines.find((line) => line.data.to === index)

    fromLine?.set({x1: p?.left, y1: p?.top})
    toLine?.set({ x2: p?.left, y2: p?.top })

    drawMask(circles.map(value => {
      return {
        x: value.left!,
        y: value.top!
      }
    }))
    fcanvas.renderAll()
  })
  drawMask(circles.map(value => {
    return {
      x: value.left!,
      y: value.top!
    }
  }))
  fcanvas.add( ...circles, ...lines)
})

</script>

<template>
<div>
  <canvas ref="main" id="CANVASID" ></canvas>
</div>  
<div style="height: 500px;">
  holgura
</div>
</template>


