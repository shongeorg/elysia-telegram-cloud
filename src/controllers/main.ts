export const mainController = {
  home() {
    return new Response(
      `
   <!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Elysia Music Player</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎵</text></svg>" />
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  </head>
  <body class="bg-gray-900 text-gray-100 p-8">
    <div id="app" class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-6 text-blue-400">{{ message }}</h2>

      <div v-if="loading" class="text-gray-400">Завантаження...</div>

      <div v-else class="grid gap-4">
        <div
          v-for="file in musicFiles"
          :key="file.id"
          class="bg-gray-800 p-4 rounded-lg border border-gray-700"
        >
          <h3 class="font-medium text-white mb-3">{{ file.file_name }}</h3>
          <audio controls class="w-full" preload="none">
            <source :src="file.download_url" :type="file.mime_type" />
          </audio>
        </div>

        <div v-if="musicFiles.length === 0" class="text-gray-500 italic">
          Музики поки немає. Скинь аудіо у канал!
        </div>
      </div>
    </div>

    <script>
      const { createApp, ref, onMounted } = Vue;

      createApp({
        setup() {
          const message = ref("🎵 Music Player");
          const musicFiles = ref([]);
          const loading = ref(true);

          const fetchMusic = async () => {
            try {
              const res = await fetch("/api/music");
              musicFiles.value = await res.json();
            } catch (err) {
              console.error("Помилка завантаження:", err);
            } finally {
              loading.value = false;
            }
          };

          onMounted(fetchMusic);

          return {
            message,
            musicFiles,
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
