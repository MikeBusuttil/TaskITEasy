import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
const svgrConfig = {
  svgrOptions: { exportType: "default", ref: true, svgo: false, titleProp: true },
   include: "**/*.svg",
}

export default defineConfig({
  plugins: [remix(), svgr(svgrConfig)],
});
