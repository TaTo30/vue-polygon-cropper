import type { Plugin } from "vue";
import VuePolygonCropper from "./components/VuePolygonCropper.vue";

export const VuePolygonCropperPlugin: Plugin = {
  install(Vue) {
    Vue.component(VuePolygonCropper.name!, VuePolygonCropper);
  },
};

export * from "./components";
export default VuePolygonCropperPlugin;
