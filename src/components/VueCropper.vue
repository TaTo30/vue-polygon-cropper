<script setup lang="ts">
import { watch } from "vue";
import { PolygonCropper } from "./croppers";

const props = defineProps<{
  src: string,
  width?: number,
  height?: number,
  points?: {x: number, y: number}[]
}>()


const cropper = new PolygonCropper(props.src, props.width, props.height, props.points)
cropper.render()


watch(() => [props.src, props.width], () => {
  cropper.src = props.src
  cropper.width = props.width!
  cropper.render()
})

</script>

<template>
  <div>
    <canvas id="CANVASID" ></canvas>
  </div>  
</template>


