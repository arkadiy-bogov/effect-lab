import { registerSection } from "../core/registry.js";
import { controlRange, controlSelect, el } from "../core/ui.js";
import { estimateStrength, generatePassword } from "../tools/password.js";
import { TRANSLIT_PROFILES, transliterate } from "../tools/translit.js";
import { analyzeDateRange, shiftDate, todayInputValue } from "../tools/days.js";

function fieldLabel(text, forId) {
  return el("label", { className: "field-label", for: forId, text });
}

function copyButton(getText) {
  const btn = el("button", { className: "btn btn-ghost", type: "button", text: "Копировать" });
  btn.addEventListener("click", async () => {
    const value = getText();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      const prev = btn.textContent;
      btn.textContent = "Скопировано";
      setTimeout(() => {
        btn.textContent = prev;
      }, 1200);
    } catch (err) {
      console.error(err);
      btn.textContent = "Ошибка";
      setTimeout(() => {
        btn.textContent = "Копировать";
      }, 1200);
    }
  });
  return btn;
}

function checkbox({ id, label, checked, onChange }) {
  const input = el("input", {
    type: "checkbox",
    id,
    checked: checked ? true : undefined,
    onchange: (e) => onChange(e.target.checked),
  });
  return el("label", { className: "check-item", for: id }, [input, el("span", { text: label })]);
}

function mountPasswordTool(root) {
  const state = {
    length: 16,
    lower: true,
    upper: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: false,
    password: "",
  };

  const output = el("input", {
    className: "result-input",
    type: "text",
    readonly: true,
    value: "",
    "aria-label": "Сгенерированный пароль",
  });
  const strengthBar = el("div", { className: "strength-fill" });
  const strengthMeta = el("div", { className: "strength-meta", text: "" });
  const status = el("div", { className: "status", text: "Пароль создаётся локально в браузере." });

  function refresh() {
    try {
      state.password = generatePassword(state);
      output.value = state.password;
      const info = estimateStrength(state);
      strengthBar.style.width = `${(info.score / 4) * 100}%`;
      strengthBar.dataset.level = String(info.score);
      strengthMeta.textContent = `${info.label} · ~${Math.round(info.bits)} бит`;
      status.textContent = "Готово. Никуда не отправляется.";
    } catch (err) {
      console.error(err);
      output.value = "";
      strengthBar.style.width = "0%";
      strengthMeta.textContent = "Выберите хотя бы один набор символов";
      status.textContent = "Нечего генерировать";
    }
  }

  const controls = el("div", { className: "controls" }, [
    controlRange({
      id: "pw-len",
      label: "Длина",
      min: 8,
      max: 64,
      step: 1,
      value: state.length,
      onInput: (v) => {
        state.length = v;
        refresh();
      },
    }),
    el("div", { className: "check-grid" }, [
      checkbox({
        id: "pw-lower",
        label: "Строчные a-z",
        checked: state.lower,
        onChange: (v) => {
          state.lower = v;
          refresh();
        },
      }),
      checkbox({
        id: "pw-upper",
        label: "Заглавные A-Z",
        checked: state.upper,
        onChange: (v) => {
          state.upper = v;
          refresh();
        },
      }),
      checkbox({
        id: "pw-digits",
        label: "Цифры 0-9",
        checked: state.digits,
        onChange: (v) => {
          state.digits = v;
          refresh();
        },
      }),
      checkbox({
        id: "pw-symbols",
        label: "Символы !@#$...",
        checked: state.symbols,
        onChange: (v) => {
          state.symbols = v;
          refresh();
        },
      }),
      checkbox({
        id: "pw-amb",
        label: "Без похожих (0 O I l 1)",
        checked: state.excludeAmbiguous,
        onChange: (v) => {
          state.excludeAmbiguous = v;
          refresh();
        },
      }),
    ]),
  ]);

  const genBtn = el("button", { className: "btn", type: "button", text: "Сгенерировать" });
  genBtn.addEventListener("click", refresh);

  root.append(
    el("div", { className: "panel util-panel" }, [
      el("div", { className: "result-box" }, [
        output,
        el("div", { className: "strength-track" }, [strengthBar]),
        strengthMeta,
      ]),
      controls,
      el("div", { className: "toolbar" }, [genBtn, copyButton(() => state.password)]),
      status,
      el("p", {
        className: "hint",
        text: "Использует crypto.getRandomValues. Рекомендуется длина от 12 и уникальный пароль для каждого сервиса.",
      }),
    ])
  );

  refresh();
  return { dispose() {} };
}

function mountTranslitTool(root) {
  const state = {
    profile: "url",
    codeStyle: "snake",
    source: "Привет, мир! Новый раздел сайта",
  };

  const source = el("textarea", {
    className: "util-textarea",
    id: "tr-src",
    rows: 5,
  });
  source.value = state.source;
  const result = el("textarea", {
    className: "util-textarea",
    id: "tr-out",
    rows: 5,
    readonly: true,
  });
  const hint = el("p", { className: "hint", text: "" });
  const codeWrap = el("div", { className: "control-slot" });

  function renderResult() {
    result.value = transliterate(state.source, state.profile, { codeStyle: state.codeStyle });
  }

  function renderProfileUi() {
    const profile = TRANSLIT_PROFILES.find((p) => p.id === state.profile);
    hint.textContent = profile?.hint || "";
    codeWrap.replaceChildren();
    if (state.profile === "code") {
      codeWrap.append(
        controlSelect({
          id: "tr-style",
          label: "Стиль кода",
          value: state.codeStyle,
          options: [
            { value: "snake", label: "snake_case" },
            { value: "camel", label: "camelCase" },
            { value: "pascal", label: "PascalCase" },
          ],
          onChange: (v) => {
            state.codeStyle = v;
            renderResult();
          },
        })
      );
    }
    renderResult();
  }

  source.addEventListener("input", () => {
    state.source = source.value;
    renderResult();
  });

  root.append(
    el("div", { className: "panel util-panel" }, [
      el("div", { className: "controls" }, [
        controlSelect({
          id: "tr-profile",
          label: "Назначение",
          value: state.profile,
          options: TRANSLIT_PROFILES.map((p) => ({ value: p.id, label: p.label })),
          onChange: (v) => {
            state.profile = v;
            renderProfileUi();
          },
        }),
        codeWrap,
      ]),
      hint,
      el("div", { className: "field-grid" }, [
        el("div", { className: "field" }, [fieldLabel("Исходный текст", "tr-src"), source]),
        el("div", { className: "field" }, [fieldLabel("Результат", "tr-out"), result]),
      ]),
      el("div", { className: "toolbar" }, [copyButton(() => result.value)]),
    ])
  );

  renderProfileUi();
  return { dispose() {} };
}

function mountDaysTool(root) {
  const today = todayInputValue();
  const state = {
    from: today,
    to: today,
    includeEnd: true,
    base: today,
    years: 0,
    months: 0,
    weeks: 0,
    days: 30,
    direction: 1,
  };

  const summary = el("div", { className: "stat-grid" });
  const shiftSummary = el("div", { className: "stat-grid" });

  function dateField(id, label, value, onChange) {
    const input = el("input", {
      className: "date-input",
      type: "date",
      id,
      value,
      onchange: (e) => onChange(e.target.value),
      oninput: (e) => onChange(e.target.value),
    });
    return el("div", { className: "field" }, [fieldLabel(label, id), input]);
  }

  function numberField(id, label, value, onChange) {
    const input = el("input", {
      className: "number-input",
      type: "number",
      id,
      value,
      step: 1,
      oninput: (e) => onChange(Number(e.target.value) || 0),
    });
    return el("div", { className: "field" }, [fieldLabel(label, id), input]);
  }

  function renderStats(host, items) {
    host.replaceChildren(
      ...items.map((item) =>
        el("div", { className: "stat-card" }, [
          el("div", { className: "stat-label", text: item.label }),
          el("div", { className: "stat-value", text: item.value }),
        ])
      )
    );
  }

  function refreshRange() {
    const data = analyzeDateRange({
      from: state.from,
      to: state.to,
      includeEnd: state.includeEnd,
    });
    if (!data) {
      renderStats(summary, [{ label: "Статус", value: "Укажите обе даты" }]);
      return;
    }
    renderStats(summary, [
      { label: "Дней", value: String(data.totalDays) },
      { label: "Рабочих дней", value: String(data.businessDays) },
      { label: "Недель", value: data.weeks.toFixed(2) },
      { label: "~Месяцев", value: data.monthsApprox.toFixed(2) },
      { label: "~Лет", value: data.yearsApprox.toFixed(2) },
      { label: "День года (начало)", value: String(data.fromDayOfYear) },
      { label: "День года (конец)", value: String(data.toDayOfYear) },
      { label: "Неделя ISO", value: `${data.fromWeek} -> ${data.toWeek}` },
    ]);
  }

  function refreshShift() {
    const data = shiftDate({
      date: state.base,
      years: state.years,
      months: state.months,
      weeks: state.weeks,
      days: state.days,
      direction: state.direction,
    });
    if (!data) {
      renderStats(shiftSummary, [{ label: "Статус", value: "Укажите дату" }]);
      return;
    }
    renderStats(shiftSummary, [
      { label: "Результат", value: data.result },
      { label: "День года", value: String(data.dayOfYear) },
      { label: "Неделя ISO", value: String(data.week) },
    ]);
  }

  root.append(
    el("div", { className: "panel util-panel" }, [
      el("h3", { className: "util-subtitle", text: "Разница между датами" }),
      el("div", { className: "field-grid field-grid--2" }, [
        dateField("day-from", "Дата от", state.from, (v) => {
          state.from = v;
          refreshRange();
        }),
        dateField("day-to", "Дата до", state.to, (v) => {
          state.to = v;
          refreshRange();
        }),
      ]),
      el("div", { className: "check-grid" }, [
        checkbox({
          id: "day-include",
          label: "Включая конечную дату",
          checked: state.includeEnd,
          onChange: (v) => {
            state.includeEnd = v;
            refreshRange();
          },
        }),
      ]),
      summary,
      el("h3", { className: "util-subtitle", text: "Дата через промежуток" }),
      el("div", { className: "field-grid field-grid--2" }, [
        dateField("day-base", "Базовая дата", state.base, (v) => {
          state.base = v;
          refreshShift();
        }),
        controlSelect({
          id: "day-dir",
          label: "Направление",
          value: "1",
          options: [
            { value: "1", label: "Вперёд" },
            { value: "-1", label: "Назад" },
          ],
          onChange: (v) => {
            state.direction = Number(v);
            refreshShift();
          },
        }),
      ]),
      el("div", { className: "field-grid field-grid--4" }, [
        numberField("day-y", "Лет", state.years, (v) => {
          state.years = v;
          refreshShift();
        }),
        numberField("day-m", "Месяцев", state.months, (v) => {
          state.months = v;
          refreshShift();
        }),
        numberField("day-w", "Недель", state.weeks, (v) => {
          state.weeks = v;
          refreshShift();
        }),
        numberField("day-d", "Дней", state.days, (v) => {
          state.days = v;
          refreshShift();
        }),
      ]),
      shiftSummary,
      el("p", {
        className: "hint",
        text: "Рабочие дни считаются без суббот и воскресений, без учёта праздников.",
      }),
    ])
  );

  refreshRange();
  refreshShift();
  return { dispose() {} };
}

registerSection({
  id: "utils",
  order: 15,
  title: "Инструменты",
  navLabel: "Инструменты",
  description: "Генератор паролей, транслит по назначению и калькулятор дней - всё локально в браузере.",
  tools: [
    {
      id: "password",
      order: 10,
      title: "Генератор паролей",
      description: "Случайные пароли нужной длины с наборами символов и оценкой стойкости.",
      mount: mountPasswordTool,
    },
    {
      id: "translit",
      order: 20,
      title: "Транслит",
      description: "Кириллица в латиницу с выбором назначения: URL, код, ISO 9, загранпаспорт.",
      mount: mountTranslitTool,
    },
    {
      id: "days",
      order: 30,
      title: "Калькулятор дней",
      description: "Разница между датами, рабочие дни, неделя ISO и дата через заданный срок.",
      mount: mountDaysTool,
    },
  ],
});
