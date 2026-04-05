# План разработки Elysia Telegram Cloud Storage

## Этап 1: База данных (Drizzle ORM + Neon)
- [ ] Установить зависимости: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`
- [ ] Создать `src/schema.ts` — таблица `files` (id, tg_file_id, file_name, file_size, mime_type, created_at)
- [ ] Настроить `drizzle.config.ts`
- [ ] Создать миграцию и запушить в Neon
- [ ] Подключить БД в `src/index.ts`

## Этап 2: Webhook обработка
- [ ] Обновить `/api/webhook` — распознавать типы файлов (document, photo, video, audio)
- [ ] Записывать данные о файлах в БД (tg_file_id, file_name, file_size, mime_type)
- [ ] Обработать `onConflictDoNothing` для дубликатов

## Этап 3: API эндпоинты
- [ ] `GET /api/files` — список всех файлов
- [ ] `GET /api/files/:id` — получить конкретный файл
- [ ] Возможность скачивания файлов через Telegram Bot API

## Этап 4: Тестирование (локально)
- [ ] Отправить файл в канал
- [ ] Проверить `GET /api/files` — должен вернуть JSON с данными файла
