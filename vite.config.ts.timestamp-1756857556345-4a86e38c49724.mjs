// vite.config.ts
import { defineConfig } from "file:///C:/Users/oj/Desktop/my-chat-console-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/oj/Desktop/my-chat-console-main/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/oj/Desktop/my-chat-console-main/node_modules/lovable-tagger/dist/index.js";
import { visualizer } from "file:///C:/Users/oj/Desktop/my-chat-console-main/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "C:\\Users\\oj\\Desktop\\my-chat-console-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && visualizer({
      filename: "dist/bundle-analysis.html",
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@radix-ui/react-tabs", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          "chart-vendor": ["recharts"],
          "query-vendor": ["@tanstack/react-query"],
          "supabase-vendor": ["@supabase/supabase-js"],
          // Feature chunks
          "drone-control": ["./src/components/DroneControl"],
          "ai-mission": ["./src/components/AIMissionPlanner"],
          "media-library": ["./src/components/DroneMediaLibrary"],
          "farm-overview": ["./src/components/FarmSensorOverview"],
          "ai-agents": ["./src/components/AIAgentManager"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3,
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js"
    ]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxvalxcXFxEZXNrdG9wXFxcXG15LWNoYXQtY29uc29sZS1tYWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxvalxcXFxEZXNrdG9wXFxcXG15LWNoYXQtY29uc29sZS1tYWluXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9vai9EZXNrdG9wL215LWNoYXQtY29uc29sZS1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSBcInJvbGx1cC1wbHVnaW4tdmlzdWFsaXplclwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODAsXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiZcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcbiAgICBtb2RlID09PSAncHJvZHVjdGlvbicgJiZcbiAgICB2aXN1YWxpemVyKHtcbiAgICAgIGZpbGVuYW1lOiAnZGlzdC9idW5kbGUtYW5hbHlzaXMuaHRtbCcsXG4gICAgICBvcGVuOiB0cnVlLFxuICAgICAgZ3ppcFNpemU6IHRydWUsXG4gICAgICBicm90bGlTaXplOiB0cnVlLFxuICAgIH0pLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBWZW5kb3IgY2h1bmtzXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndWktdmVuZG9yJzogWydAcmFkaXgtdWkvcmVhY3QtdGFicycsICdAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJywgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51J10sXG4gICAgICAgICAgJ2NoYXJ0LXZlbmRvcic6IFsncmVjaGFydHMnXSxcbiAgICAgICAgICAncXVlcnktdmVuZG9yJzogWydAdGFuc3RhY2svcmVhY3QtcXVlcnknXSxcbiAgICAgICAgICAnc3VwYWJhc2UtdmVuZG9yJzogWydAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXSxcbiAgICAgICAgICAvLyBGZWF0dXJlIGNodW5rc1xuICAgICAgICAgICdkcm9uZS1jb250cm9sJzogWycuL3NyYy9jb21wb25lbnRzL0Ryb25lQ29udHJvbCddLFxuICAgICAgICAgICdhaS1taXNzaW9uJzogWycuL3NyYy9jb21wb25lbnRzL0FJTWlzc2lvblBsYW5uZXInXSxcbiAgICAgICAgICAnbWVkaWEtbGlicmFyeSc6IFsnLi9zcmMvY29tcG9uZW50cy9Ecm9uZU1lZGlhTGlicmFyeSddLFxuICAgICAgICAgICdmYXJtLW92ZXJ2aWV3JzogWycuL3NyYy9jb21wb25lbnRzL0Zhcm1TZW5zb3JPdmVydmlldyddLFxuICAgICAgICAgICdhaS1hZ2VudHMnOiBbJy4vc3JjL2NvbXBvbmVudHMvQUlBZ2VudE1hbmFnZXInXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScsXG4gICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJyxcbiAgICBdLFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvVCxTQUFTLG9CQUFvQjtBQUNqVixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsa0JBQWtCO0FBSjNCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUEsSUFDaEIsU0FBUyxnQkFDVCxXQUFXO0FBQUEsTUFDVCxVQUFVO0FBQUEsTUFDVixNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsTUFDVixZQUFZO0FBQUEsSUFDZCxDQUFDO0FBQUEsRUFDSCxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ3pELGFBQWEsQ0FBQyx3QkFBd0IsMEJBQTBCLCtCQUErQjtBQUFBLFVBQy9GLGdCQUFnQixDQUFDLFVBQVU7QUFBQSxVQUMzQixnQkFBZ0IsQ0FBQyx1QkFBdUI7QUFBQSxVQUN4QyxtQkFBbUIsQ0FBQyx1QkFBdUI7QUFBQTtBQUFBLFVBRTNDLGlCQUFpQixDQUFDLCtCQUErQjtBQUFBLFVBQ2pELGNBQWMsQ0FBQyxtQ0FBbUM7QUFBQSxVQUNsRCxpQkFBaUIsQ0FBQyxvQ0FBb0M7QUFBQSxVQUN0RCxpQkFBaUIsQ0FBQyxxQ0FBcUM7QUFBQSxVQUN2RCxhQUFhLENBQUMsaUNBQWlDO0FBQUEsUUFDakQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUEsSUFDdkIsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
