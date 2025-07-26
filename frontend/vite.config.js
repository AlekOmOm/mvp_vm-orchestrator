import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
   plugins: [
      svelte({
         compilerOptions: {
            runes: true,
         },
      }),
   ],
   resolve: {
      alias: {
         $lib: path.resolve("./src/lib"),
      },
   },
   css: {
      postcss: "./postcss.config.js",
   },
   server: {
      port: 5174,
      proxy: {
         "/api": "http://localhost:3000",
         "/socket.io": {
            target: "http://localhost:3000",
            ws: true,
         },
      },
   },
});
