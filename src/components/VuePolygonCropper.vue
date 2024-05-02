<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { fabric } from "fabric";

import type { Handler, Line, Point, ResizeEventPayload } from "./types";

const props = withDefaults(
  defineProps<{
    src: string;
    width?: number;
    height?: number;
    removeBackground?: boolean;
    backgroundColor?: string;
    points?: Point[];
    lines?: Line;
    handler?: Handler;
  }>(),
  {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  }
);

const emits = defineEmits<{
  (event: "loaded"): void;
  (event: "resize", payload: ResizeEventPayload): void;
}>();

const canvas = ref<fabric.Canvas>();
const image = ref<fabric.Image>();
const points = ref<Point[]>();

const scale = computed(() => {
  if (image.value) {
    if (props.width && props.width > 0) return props.width / image.value.width!;
    if (props.height && props.height > 0) return props.height / image.value.height!;
  }
  return 1;
});
const canvasWidth = computed(() => {
  return Math.trunc(canvas.value?.width!) || 0;
});
const canvasHeight = computed(() => {
  return Math.trunc(canvas.value?.height!) || 0;
});
const lineProps = computed(() => {
  return Object.assign(
    {},
    {
      color: "white",
      width: 1.5,
      dash: [7, 5],
    },
    props.lines
  );
});
const handlerProps = computed(() => {
  return Object.assign(
    {},
    {
      type: "rect",
      color: "white",
      borderColor: "#78a6f1",
      borderWidth: 0.5,
      padding: 10,
      width: 10,
      height: 10,
      radius: 5,
    }
  );
});

function getObjectByName(name: string): fabric.Object | null {
  const objects = canvas.value!.getObjects().filter((value) => value.name == name);
  if (objects.length > 0) return objects[0];
  return null;
}

async function createImage(src: string): Promise<fabric.Image> {
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

function getPointsWithoutOffset(handlers: (fabric.Rect | fabric.Circle)[]) {
  const points = handlers.map((value) => {
    const loffset = value.data.loffset;
    const toffset = value.data.toffset;
    return {
      x: value.left! + loffset,
      y: value.top! + toffset,
    };
  });
  return points;
}

function getPoints(): Point[] {
  if (props.points && props.points.length > 0) {
    return props.points.map((value) => {
      return {
        x: value.x * scale.value,
        y: value.y * scale.value,
      };
    });
  } else {
    // Line width and height are added as offset in order to render the lines inside canvas' bounds
    // otherwise the lines will render outside canvas' bounds
    return [
      { x: 0, y: 0 },
      { x: canvasWidth.value - lineProps.value.width, y: 0 },
      { x: canvasWidth.value - lineProps.value.width, y: canvasHeight.value - lineProps.value.width },
      { x: 0, y: canvasHeight.value - lineProps.value.width },
    ];
  }
}

function drawMask(handlers: (fabric.Rect | fabric.Circle)[]) {
  if (props.removeBackground) return;

  let overlay = getObjectByName("overlay");
  if (!overlay) {
    overlay = new fabric.Rect({
      name: "overlay",
      left: 0,
      top: 0,
      width: canvasWidth.value,
      height: canvasHeight.value,
      fill: props.backgroundColor,
      evented: false,
      globalCompositeOperation: "source-over",
    });
    canvas.value!.add(overlay);
  }
  const points = getPointsWithoutOffset(handlers);

  let mask = getObjectByName("mask") as fabric.Polygon;
  if (!mask) {
    mask = new fabric.Polygon(points, {
      name: "mask",
      evented: false,
      objectCaching: false,
      globalCompositeOperation: "destination-out",
    });
    canvas.value!.add(mask);
  } else {
    mask.set({ points: points as fabric.Point[] });
  }
}

async function setCanvas() {
  image.value = await createImage(props.src);

  if (!canvas.value) {
    // Instance of canvas if not exists
    canvas.value = new fabric.Canvas("vpolcropper", { selection: false });
  } else {
    // If instance of canvas exists clear all data and draw objects from scratch
    canvas.value.clear();
    canvas.value.remove(...canvas.value.getObjects());
  }

  canvas.value.setDimensions({
    width: image.value.width! * scale.value,
    height: image.value.height! * scale.value,
  });

  canvas.value.setOverlayImage(image.value, canvas.value.renderAll.bind(canvas.value), {
    scaleX: canvasWidth.value / image.value.width!,
    scaleY: canvasHeight.value / image.value.height!,
    globalCompositeOperation: "destination-atop",
  });
}

function objectMovingEvent(lines: fabric.Line[], handlers: (fabric.Rect | fabric.Circle)[]) {
  canvas.value!.on("object:moving", (e) => {
    const p = e.target;

    const odata = p?.data;
    const index = odata["index"];

    odata["loffset"] = 0; // Reset the offset of the line width
    odata["toffset"] = 0;
    if (p?.left! < 0) {
      p?.set({ left: 0 });
    }
    if (p?.top! < 0) {
      p?.set({ top: 0 });
    }
    if (p?.left! > canvasWidth.value) {
      p?.set({ left: canvasWidth.value - lineProps.value.width });
      odata["loffset"] = lineProps.value.width; // Set the offset of the line width
    }
    if (p?.top! > canvasHeight.value) {
      p?.set({ top: canvasHeight.value - lineProps.value.width });
      odata["toffset"] = lineProps.value.width;
    }

    const fromLine = lines!.find((line) => line.data.from === index);
    const toLine = lines!.find((line) => line.data.to === index);

    fromLine?.set({ x1: p?.left, y1: p?.top });
    toLine?.set({ x2: p?.left, y2: p?.top });

    drawMask(handlers);
    canvas.value!.renderAll();

    const scaledPoints = getPointsWithoutOffset(handlers);
    points.value = scaledPoints;

    emits("resize", {
      canvas: scaledPoints,
      image: scaledPoints.map((value) => {
        return {
          x: Math.fround(value.x / scale.value),
          y: Math.fround(value.y / scale.value),
        };
      }),
    });
  });
}

async function render(keepPoints = false) {
  await setCanvas();

  if (keepPoints) {
    if (!points.value) points.value = getPoints();
  } else {
    points.value = getPoints();
  }

  const handlers = points.value!.map((value, index) => {
    const options = {
      left: value.x,
      top: value.y,
      originX: "center",
      originY: "center",
      width: handlerProps.value.width,
      height: handlerProps.value.height,
      radius: handlerProps.value.radius,
      padding: handlerProps.value.padding,
      fill: handlerProps.value.color,
      stroke: handlerProps.value.borderColor,
      strokeWidth: handlerProps.value.borderWidth,
      hasControls: false,
      hasBorders: false,
      data: {
        index: index,
        loffset: value.x === 0 ? 0 : lineProps.value.width,
        toffset: value.y === 0 ? 0 : lineProps.value.width,
      },
    };
    if (handlerProps.value.type === "circle") return new fabric.Circle(options);
    else return new fabric.Rect(options);
  });

  const lines = handlers.map((value, index, arr) => {
    const nextValue = index === arr.length - 1 ? arr[0] : arr[index + 1];
    const points = [value.left!, value.top!, nextValue.left!, nextValue.top!];
    return new fabric.Line(points, {
      stroke: lineProps.value.color,
      strokeWidth: lineProps.value.width,
      strokeDashArray: lineProps.value.dash,
      evented: false,
      data: {
        from: value.data.index,
        to: nextValue.data.index,
      },
    });
  });

  objectMovingEvent(lines, handlers);
  drawMask(handlers);

  canvas.value!.add(...handlers, ...lines);
  canvas.value!.renderAll();
  emits("loaded");
}

watch(
  () => [props.src, props.width, props.points],
  () => {
    render();
  },
  { deep: true }
);

watch(
  () => [props.removeBackground, props.backgroundColor],
  () => {
    render(true);
  }
);

// onCreate
render();
</script>

<template>
  <canvas id="vpolcropper"></canvas>
</template>
