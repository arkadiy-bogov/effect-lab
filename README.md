# FX Lab

Браузерная лаборатория эффектов для фото и звука. Без WordPress.

## Локально

```bash
cd D:\effect-lab
python -m http.server 8080
```

Открыть http://localhost:8080

## Хостинг

Корень сайта: https://eba.pluton-host.ru/
Pretty Cure: https://eba.pluton-host.ru/pretty-cure/

## Архитектура

- `js/core/registry.js` - регистрация разделов и инструментов
- `js/sections/*` - разделы
- `js/effects/*` - эффекты
