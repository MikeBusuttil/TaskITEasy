import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [remix(), svgr()],
});
