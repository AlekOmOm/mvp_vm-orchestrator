// vite.config.js
import { defineConfig } from "file:///Users/alek/code/work/vm/vm-orchestrator/mvp_vm-orchestrator/frontend/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///Users/alek/code/work/vm/vm-orchestrator/mvp_vm-orchestrator/frontend/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import path from "path";
var vite_config_default = defineConfig({
  root: "./src",
  plugins: [
    svelte({
      compilerOptions: {
        runes: true
      }
    })
  ],
  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
      "lucide-svelte": "@lucide/svelte"
    }
  },
  css: {
    postcss: "./postcss.config.js"
  },
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:3000",
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYWxlay9jb2RlL3dvcmsvdm0vdm0tb3JjaGVzdHJhdG9yL212cF92bS1vcmNoZXN0cmF0b3IvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hbGVrL2NvZGUvd29yay92bS92bS1vcmNoZXN0cmF0b3IvbXZwX3ZtLW9yY2hlc3RyYXRvci9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYWxlay9jb2RlL3dvcmsvdm0vdm0tb3JjaGVzdHJhdG9yL212cF92bS1vcmNoZXN0cmF0b3IvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSBcIkBzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICByb290OiBcIi4vc3JjXCIsXG4gICBwbHVnaW5zOiBbXG4gICAgICBzdmVsdGUoe1xuICAgICAgICAgY29tcGlsZXJPcHRpb25zOiB7XG4gICAgICAgICAgICBydW5lczogdHJ1ZSxcbiAgICAgICAgIH0sXG4gICAgICB9KSxcbiAgIF0sXG4gICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAgJGxpYjogcGF0aC5yZXNvbHZlKFwiLi9zcmMvbGliXCIpLFxuICAgICAgICAgJ2x1Y2lkZS1zdmVsdGUnOiAnQGx1Y2lkZS9zdmVsdGUnLFxuICAgICAgfSxcbiAgIH0sXG4gICBjc3M6IHtcbiAgICAgIHBvc3Rjc3M6IFwiLi9wb3N0Y3NzLmNvbmZpZy5qc1wiLFxuICAgfSxcbiAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogNTE3NCxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICBcIi9hcGlcIjogXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIixcbiAgICAgICAgIFwiL3NvY2tldC5pb1wiOiB7XG4gICAgICAgICAgICB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCIsXG4gICAgICAgICAgICB3czogdHJ1ZSxcbiAgICAgICAgIH0sXG4gICAgICB9LFxuICAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpWSxTQUFTLG9CQUFvQjtBQUM5WixTQUFTLGNBQWM7QUFDdkIsT0FBTyxVQUFVO0FBRWpCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3pCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNKLGlCQUFpQjtBQUFBLFFBQ2QsT0FBTztBQUFBLE1BQ1Y7QUFBQSxJQUNILENBQUM7QUFBQSxFQUNKO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDSixNQUFNLEtBQUssUUFBUSxXQUFXO0FBQUEsTUFDOUIsaUJBQWlCO0FBQUEsSUFDcEI7QUFBQSxFQUNIO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDRixTQUFTO0FBQUEsRUFDWjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0osUUFBUTtBQUFBLE1BQ1IsY0FBYztBQUFBLFFBQ1gsUUFBUTtBQUFBLFFBQ1IsSUFBSTtBQUFBLE1BQ1A7QUFBQSxJQUNIO0FBQUEsRUFDSDtBQUNILENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
