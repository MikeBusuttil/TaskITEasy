import { defineConfig } from "vite";
import react from '@vitejs/plugin-react'

import svgr from "vite-plugin-svgr";
const svgrConfig = {
  svgrOptions: { exportType: "default", ref: true, svgo: false, titleProp: true },
   include: "**/*.svg",
}

export default defineConfig({
  plugins: [react(), svgr()],
});
