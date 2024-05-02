<script setup lang="ts">
import { ref } from 'vue';
import { VuePolygonCropper } from '../src'


const points = ref()

const initialPoints = ref([
  { x: 149, y: 1626 },
  { x: 1321, y: 1248 },
  { x: 1437, y: 41 },
  { x: 132, y: 212 }
])
const width = ref(500)
const bgshow = ref(false)
const imagen = ref("image2.jpeg")
</script>

<template>
  <button @click="initialPoints.pop()">Quitar punto</button>
  <button @click="initialPoints.push({ x: 600, y: 350 })">Agregar punto</button>
  <button @click="width -= 100">Quitar ancho</button>
  <button @click="width += 100">Agregar ancho</button>
  <button @click="bgshow = !bgshow">Cambiar background</button>
  <button @click="imagen = imagen === 'image.jpeg'? 'image2.jpeg': 'image.jpeg'">Cambiar imagen</button>
  
  <div class="container">
    <vue-polygon-cropper :src="imagen" :width="width" :points="initialPoints" :remove-background="bgshow" @resize="points = $event" />
  </div>
  {{ points }}
</template>

<style>
.container {
  align-items: center;
  display: flex;
  flex-direction: column;
}
</style>