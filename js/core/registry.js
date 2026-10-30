const sections = new Map();
const tools = new Map();

export function registerSection(section) {
  if (!section?.id) throw new Error("Section needs id");
  sections.set(section.id, section);
  if (Array.isArray(section.tools)) {
    for (const tool of section.tools) {
      registerTool({ ...tool, sectionId: section.id });
    }
  }
}

export function registerTool(tool) {
  if (!tool?.id || !tool?.sectionId) throw new Error("Tool needs id and sectionId");
  tools.set(`${tool.sectionId}/${tool.id}`, tool);
}

export function getSections() {
  return [...sections.values()].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function getSection(id) {
  return sections.get(id) || null;
}

export function getTools(sectionId) {
  return [...tools.values()]
    .filter((t) => t.sectionId === sectionId && !t.hidden)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function getTool(sectionId, toolId) {
  const tool = tools.get(`${sectionId}/${toolId}`) || null;
  if (!tool || tool.hidden) return null;
  return tool;
}
