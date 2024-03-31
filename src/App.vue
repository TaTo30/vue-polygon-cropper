<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <HelloWorld src="image.jpeg" :width="750" :points="[
    {
      x: 10,
      y: 25
  },
  {
    x: 876,
    y: 79
  },
  {
    x: 1700,
  y: 2000
  },
  {
    x: 3400,
  y: 3000
  },
  {
    x: 200,
  y: 2690
}
  ]" />
</template>

