# FX Lab

Браузерная лаборатория эффектов и онлайн-инструментов. Без серверной обработки файлов.

## Быстрый старт

```bash
cd D:\effect-lab
copy .env.example .env
npm run build
npm run serve
```

Открыть http://localhost:8080

## Сценарии

| Команда | Что делает |
|---|---|
| `npm run config` | Читает `.env`, пишет `js/core/site-config.js` |
| `npm run seo` | Пересобирает `sitemap.xml`, `robots.txt` и SEO-блок в `index.html` |
| `npm run check` | Проверяет, что конфиг/SEO согласованы с `.env` |
| `npm run build` | `config` + `seo` + `check` |
| `npm run serve` | Локальный static-server на порту 8080 |

Домен и тексты задаются в `.env` (см. `.env.example`). Скрытые маршруты для sitemap - в `scripts/seo-routes.mjs` (`hidden: true`).

## Хостинг

Перед выкладкой задайте боевой `SITE_ORIGIN` в `.env` и выполните `npm run build`.

## Архитектура

- `js/core/registry.js` - регистрация разделов и инструментов
- `js/core/site-config.js` - сгенерированный runtime-конфиг
- `js/sections/*` - разделы
- `js/effects/*` - эффекты
- `js/tools/*` - утилиты (пароль, транслит, дни)
- `scripts/*` - сборка конфига и SEO
