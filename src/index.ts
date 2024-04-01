import type { Plugin } from "vue";
import VueCropper from "./components/VueCropper.vue";

export const VueCropperPlugin: Plugin = {
  install(Vue) {
    Vue.component(VueCropper.name, VueCropper);
  },
};

export * from "./components";
export default VueCropperPlugin;
