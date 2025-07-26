import { defineConfig } from "vitest/config";
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
   test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./test/setup.js",
      transformMode: { web: [/\.svelte$/] },
      include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)", "**/*.svelte.{test,spec}"],
   },
   resolve: process.env.VITEST
      ? {
           conditions: ["browser"],
           alias: {
              $lib: path.resolve("./src/lib"),
           },
        }
      : {
           alias: {
              $lib: path.resolve("./src/lib"),
           },
        },
});
