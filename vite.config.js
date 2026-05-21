import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        books: "books.html",
        comingSoon: "coming-soon.html",
        physicalBusinesses: "physical-businesses.html",
      },
    },
  },
});
