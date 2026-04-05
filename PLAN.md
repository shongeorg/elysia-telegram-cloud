# План разработки Elysia Telegram Cloud Storage

## Что сейчас есть
### Этап 1: База данных (Drizzle ORM + Neon) ✅ Готово
- [x] Установить зависимости: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`
- [x] Создать `src/schema.ts` — таблица `files` (id, tg_file_id, file_name, file_size, mime_type, created_at)
- [x] Настроить `drizzle.config.ts`
- [x] Создать миграцию и запушить в Neon
- [x] Подключить БД в `src/index.ts`

### Этап 2: Webhook обработка ✅ Готово
- [x] Обновить `/api/webhook` — распознавать типы файлов (document, photo, video, audio)
- [x] Записывать данные о файлах в БД (tg_file_id, file_name, file_size, mime_type)
- [x] Обработать `onConflictDoNothing` для дубликатов

### Этап 3: API эндпоинты (частично)
- [x] `GET /api/files` — список всех файлов
- [ ] `GET /api/files/:id` — получить конкретный файл
- [ ] Возможность скачивания файлов через Telegram Bot API

### CORS и Error Handling ✅ Готово
- [x] CORS настроен для dev и prod URL
- [x] Глобальная обработка ошибок (VALIDATION → 400, NOT_FOUND → 404, остальные → 500)

### Фронтенд ✅ Готово
- [x] Vue 3 + Tailwind CSS на главной странице
- [x] Отображение списка файлов из БД
- [x] Кнопка Download (пока не работает — нет эндпоинта)

## Что осталось сделать

### Этап 4: Скачивание файлов
- [ ] `GET /api/download/:id` — получить file_id из БД
- [ ] Скачать файл через Telegram Bot API (`getFile` + `https://api.telegram.org/file/bot<token>/<file_path>`)
- [ ] Отправить файл пользователю как stream

### Этап 5: Тестирование (локально)
- [ ] Отправить файл в канал
- [ ] Проверить `GET /api/files` — должен вернуть JSON с данными файла
- [ ] Проверить скачивание файла через фронтенд
