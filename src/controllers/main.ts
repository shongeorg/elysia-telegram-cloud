export const mainController = {
  home() {
    return new Response(
      `
   <!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Elysia Cloud Storage</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  </head>
  <body class="bg-gray-900 text-gray-100 p-8">
    <div id="app" class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-6 text-blue-400">{{ message }}</h2>

      <div v-if="loading" class="text-gray-400">Завантаження файлів...</div>

      <div v-else class="grid gap-4">
        <div
          v-for="file in files"
          :key="file.id"
          class="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center"
        >
          <div>
            <p class="font-medium text-white">{{ file.file_name }}</p>
            <p class="text-sm text-gray-400">
              Size: {{ (file.file_size / 1024 / 1024).toFixed(2) }} MB | Type:
              {{ file.mime_type }}
            </p>
          </div>
          <a
            :href="'/api/download/' + file.id"
            target="_blank"
            class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition"
          >
            Download
          </a>
        </div>

        <div v-if="files.length === 0" class="text-gray-500 italic">
          Файлів поки немає. Скинь щось у канал!
        </div>
      </div>
    </div>

    <script>
      const { createApp, ref, onMounted } = Vue;
      const apiUrl = "https://elysia-telegram-cloude-storage.vercel.app";

      createApp({
        setup() {
          const message = ref("My Telegram Cloud");
          const files = ref([]);
          const loading = ref(true);

          const fetchFiles = async () => {
            try {
              const res = await fetch(apiUrl +"/api/files");
              files.ref = await res.json();
            } catch (err) {
              console.error("Помилка завантаження:", err);
            } finally {
              loading.value = false;
            }
          };

          onMounted(fetchFiles);

          return {
            message,
            files,
            loading,
          };
        },
      }).mount("#app");
    </script>
  </body>
</html>

    `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      },
    );
  },
};
