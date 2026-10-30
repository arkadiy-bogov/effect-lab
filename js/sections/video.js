import { registerSection } from "../core/registry.js";

registerSection({
  id: "video",
  order: 30,
  title: "Видео",
  navLabel: "Видео",
  description: "Раздел зарезервирован под видео-эффекты и таймлайн-инструменты.",
  status: "soon",
  statusLabel: "Скоро",
  soonText:
    "Сюда можно будет добавить trim, degrade, glitch и экспорт без переписывания ядра: достаточно нового файла секции и эффектов.",
  tools: [],
});
