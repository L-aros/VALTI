const API_BASE = "/api";
const THEME_STORAGE_KEY = "valti-theme";
const SEEN_QUESTION_IDS_STORAGE_KEY = "valti-seen-question-ids";
const MAX_SEEN_QUESTION_IDS = 500;
const MD5_PATTERN = /^[a-f0-9]{32}$/;

let questions = [];
let quizAnswers = [];
let consentState = "pending";
let currentQ = 0;
let selectedOpt = null;
let lastQuizArtKey = null;

const dom = {
  themeToggle: document.getElementById("theme-toggle"),
  quizThemeToggle: document.getElementById("quiz-theme-toggle"),
  resultThemeToggle: document.getElementById("result-theme-toggle"),
  startBtn: document.getElementById("btn-start"),
  noticeEntry: document.getElementById("home-notice-entry"),
  noticeReopen: document.getElementById("btn-notice-reopen"),
  noticeOverlay: document.getElementById("notice-overlay"),
  noticeAgree: document.getElementById("btn-notice-agree"),
  noticeDecline: document.getElementById("btn-notice-decline"),
  backBtn: document.getElementById("btn-back"),
  nextBtn: document.getElementById("btn-next"),
  retryBtn: document.getElementById("btn-retry"),
  optionsWrap: document.getElementById("options-wrap"),
  quizCounter: document.getElementById("quiz-counter"),
  progressFill: document.getElementById("progress-fill"),
  quizMessage: document.getElementById("quiz-message"),
  quizQuestionId: document.getElementById("quiz-question-id"),
  questionText: document.getElementById("question-text"),
  termHelp: document.getElementById("term-help"),
  termHelpToggle: document.getElementById("term-help-toggle"),
  termHelpPanel: document.getElementById("term-help-panel"),
  quizAgentBubble: document.getElementById("quiz-agent-bubble"),
  quizAgentIcon: document.getElementById("quiz-agent-icon"),
  resultType: document.getElementById("result-type"),
  resultSubname: document.getElementById("result-subname"),
  resultQuote: document.getElementById("result-quote-text"),
  resultDesc: document.getElementById("result-desc"),
  resultAgentFrame: document.getElementById("result-agent-frame"),
  resultDate: document.getElementById("result-date"),
  traitList: document.getElementById("trait-list")
};

const artPresets = {
  default: { label: "VLT", primary: "#111111", secondary: "#6b7280", mark: "diamond" },
  brimstone: { label: "BR", primary: "#8b5e34", secondary: "#f59e0b", mark: "crown" },
  yoru: { label: "YR", primary: "#1d4ed8", secondary: "#60a5fa", mark: "slash" },
  skye: { label: "SK", primary: "#166534", secondary: "#86efac", mark: "wing" },
  gekko: { label: "GK", primary: "#0f766e", secondary: "#5eead4", mark: "spark" },
  killjoy: { label: "KJ", primary: "#ca8a04", secondary: "#fde047", mark: "hex" },
  jett: { label: "JT", primary: "#0369a1", secondary: "#7dd3fc", mark: "dash" },
  sage: { label: "SG", primary: "#0f766e", secondary: "#99f6e4", mark: "cross" },
  raze: { label: "RZ", primary: "#c2410c", secondary: "#fb923c", mark: "burst" },
  viper: { label: "VP", primary: "#14532d", secondary: "#4ade80", mark: "fang" },
  cypher: { label: "CY", primary: "#334155", secondary: "#cbd5e1", mark: "eye" },
  omen: { label: "OM", primary: "#312e81", secondary: "#a5b4fc", mark: "smoke" },
  astra: { label: "AS", primary: "#6d28d9", secondary: "#c4b5fd", mark: "star" },
  sova: { label: "SV", primary: "#1e3a8a", secondary: "#93c5fd", mark: "arrow" },
  chamber: { label: "CH", primary: "#78350f", secondary: "#fcd34d", mark: "diamond" },
  harbor: { label: "HB", primary: "#0f766e", secondary: "#67e8f9", mark: "wave" },
  reyna: { label: "RY", primary: "#7e22ce", secondary: "#e879f9", mark: "orb" },
  breach: { label: "BRC", primary: "#7c2d12", secondary: "#fdba74", mark: "burst" },
  phoenix: { label: "PHX", primary: "#9a3412", secondary: "#fb923c", mark: "crown" },
  kayo: { label: "K/O", primary: "#1e3a8a", secondary: "#60a5fa", mark: "hex" },
  neon: { label: "NEO", primary: "#0f172a", secondary: "#22d3ee", mark: "dash" },
  fade: { label: "FAD", primary: "#111827", secondary: "#a78bfa", mark: "smoke" },
  deadlock: { label: "DLK", primary: "#334155", secondary: "#e2e8f0", mark: "shield" },
  iso: { label: "ISO", primary: "#1e1b4b", secondary: "#c4b5fd", mark: "target" },
  clove: { label: "CLV", primary: "#6d28d9", secondary: "#e9d5ff", mark: "orb" },
  vyse: { label: "VYS", primary: "#4c1d95", secondary: "#f5d0fe", mark: "diamond" },
  tejo: { label: "TJO", primary: "#365314", secondary: "#bef264", mark: "grid" },
  waylay: { label: "WYL", primary: "#164e63", secondary: "#67e8f9", mark: "star" },
  comms: { label: "COM", primary: "#111111", secondary: "#9ca3af", mark: "wave" },
  entry: { label: "IN", primary: "#991b1b", secondary: "#f87171", mark: "dash" },
  anchor: { label: "ANC", primary: "#1f2937", secondary: "#93c5fd", mark: "shield" },
  util: { label: "UTL", primary: "#365314", secondary: "#bef264", mark: "hex" },
  econ: { label: "ECO", primary: "#78350f", secondary: "#fbbf24", mark: "stack" },
  read: { label: "RD", primary: "#1e3a8a", secondary: "#a5b4fc", mark: "eye" },
  clutch: { label: "CLT", primary: "#7f1d1d", secondary: "#fca5a5", mark: "target" },
  reset: { label: "RST", primary: "#111827", secondary: "#d1d5db", mark: "ring" },
  support: { label: "SUP", primary: "#065f46", secondary: "#6ee7b7", mark: "cross" },
  lurk: { label: "LRK", primary: "#111827", secondary: "#818cf8", mark: "smoke" },
  defaulting: { label: "DFT", primary: "#374151", secondary: "#cbd5e1", mark: "grid" },
  mental: { label: "MNT", primary: "#7c2d12", secondary: "#fdba74", mark: "burst" }
};

const homeRows = {
  row1: ["brimstone", "phoenix", "yoru", "skye", "gekko", "killjoy", "jett", "sage", "raze", "breach"],
  row2: ["viper", "cypher", "omen", "astra", "sova", "chamber", "harbor", "reyna", "kayo", "neon"],
  row3: ["fade", "deadlock", "iso", "clove", "vyse", "tejo", "waylay", "jett", "omen", "killjoy"]
};

const quizArtPool = ["brimstone", "phoenix", "yoru", "skye", "gekko", "killjoy", "jett", "sage", "raze", "breach", "viper", "cypher", "omen", "astra", "sova", "chamber", "harbor", "reyna", "kayo", "neon", "fade", "deadlock", "iso", "clove", "vyse", "tejo", "waylay"];
const assetArtKeys = new Set(quizArtPool);

const termGlossary = [
  { terms: ["default", "默认"], label: "默认", desc: "开局先分散控图、试探信息，不急着直接进点。" },
  { terms: ["peek", "拉枪"], label: "peek / 拉枪", desc: "主动探出去看人或对枪。" },
  { terms: ["timing"], label: "timing", desc: "刚好遇到的时机差，早一秒晚一秒结果都可能不同。" },
  { terms: ["补防"], label: "补防", desc: "队友守的点有压力时，过去帮忙防守。" },
  { terms: ["转点"], label: "转点", desc: "放弃当前目标点，换到另一个点进攻或防守。" },
  { terms: ["反包"], label: "反包", desc: "进攻方下包后，防守方重新组织回点拆包。" },
  { terms: ["强起"], label: "强起", desc: "经济不好也硬买装备，赌这一回合能翻回来。" },
  { terms: ["eco"], label: "eco", desc: "少买或不买，攒钱给后面的关键回合。" },
  { terms: ["残局"], label: "残局", desc: "回合后半段人数变少，靠个人处理和选择收尾。" },
  { terms: ["架枪"], label: "架枪", desc: "提前瞄住敌人可能出现的位置，等对方出来。" },
  { terms: ["道具"], label: "道具", desc: "烟、闪、侦查、控制等技能或装备。" },
  { terms: ["预瞄"], label: "预瞄", desc: "提前把准星放在敌人可能出现的位置。" },
  { terms: ["控图", "地图控制"], label: "控图", desc: "通过站位和技能拿信息、压缩对手活动空间。" },
  { terms: ["补位"], label: "补位", desc: "阵容或位置缺什么，就主动去补上。" },
  { terms: ["起枪"], label: "起枪", desc: "这一回合买什么枪和护甲。" }
];

function updateThemeToggle(theme) {
  const nextLabel = theme === "dark" ? "浅色" : "深色";
  const ariaLabel = theme === "dark" ? "切换到浅色模式" : "切换到深色模式";
  [dom.themeToggle, dom.quizThemeToggle, dom.resultThemeToggle].filter(Boolean).forEach(button => {
    button.textContent = nextLabel;
    button.setAttribute("aria-label", ariaLabel);
  });
}

function setTheme(theme, persist = true) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  updateThemeToggle(nextTheme);

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {}
  }
}

function initTheme() {
  let storedTheme = "light";
  try {
    storedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
  } catch {}
  setTheme(storedTheme, false);
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme || "light";
  setTheme(currentTheme === "dark" ? "light" : "dark");
}

function normalizeSeenIds(ids) {
  return [...new Set(ids.filter(id => typeof id === "string" && MD5_PATTERN.test(id)))].slice(-MAX_SEEN_QUESTION_IDS);
}

function getSeenQuestionIds() {
  try {
    const raw = localStorage.getItem(SEEN_QUESTION_IDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return normalizeSeenIds(parsed);
  } catch {
    return [];
  }
}

function setSeenQuestionIds(ids) {
  try {
    localStorage.setItem(SEEN_QUESTION_IDS_STORAGE_KEY, JSON.stringify(normalizeSeenIds(ids)));
  } catch {}
}

function rememberSeenQuestions(items) {
  const currentIds = getSeenQuestionIds();
  const nextIds = [...currentIds, ...items.map(item => item?.id).filter(id => typeof id === "string")];
  setSeenQuestionIds(nextIds);
}

function makeAgentSVG({ size = 84, label = "VLT", primary = "#111111", secondary = "#6b7280", mark = "diamond" } = {}) {
  const marks = {
    diamond: `<path d="M64 24 L88 48 L64 72 L40 48 Z" fill="${secondary}"></path>`,
    crown: `<path d="M34 56 L44 34 L58 52 L64 28 L70 52 L84 34 L94 56 Z" fill="${secondary}"></path>`,
    slash: `<path d="M44 78 L78 30" stroke="${secondary}" stroke-width="10" stroke-linecap="round"></path><path d="M56 90 L90 42" stroke="${secondary}" stroke-width="6" stroke-linecap="round"></path>`,
    wing: `<path d="M38 64 C46 42 72 34 92 46 C78 50 66 60 58 74 C52 84 44 86 38 64 Z" fill="${secondary}"></path>`,
    spark: `<path d="M64 24 L72 46 L96 48 L76 62 L82 86 L64 72 L46 86 L52 62 L32 48 L56 46 Z" fill="${secondary}"></path>`,
    hex: `<path d="M46 32 H82 L100 64 L82 96 H46 L28 64 Z" fill="${secondary}"></path>`,
    dash: `<path d="M34 70 L98 42" stroke="${secondary}" stroke-width="12" stroke-linecap="round"></path>`,
    cross: `<rect x="58" y="34" width="12" height="56" rx="4" fill="${secondary}"></rect><rect x="36" y="56" width="56" height="12" rx="4" fill="${secondary}"></rect>`,
    burst: `<circle cx="64" cy="64" r="20" fill="${secondary}"></circle><path d="M64 24 V40 M64 88 V104 M24 64 H40 M88 64 H104 M36 36 L46 46 M82 82 L92 92 M92 36 L82 46 M36 92 L46 82" stroke="${secondary}" stroke-width="6" stroke-linecap="round"></path>`,
    fang: `<path d="M48 32 C40 48 42 70 56 86 L64 70 L72 86 C86 70 88 48 80 32 C70 40 58 40 48 32 Z" fill="${secondary}"></path>`,
    eye: `<path d="M28 64 C38 48 50 40 64 40 C78 40 90 48 100 64 C90 80 78 88 64 88 C50 88 38 80 28 64 Z" fill="${secondary}"></path><circle cx="64" cy="64" r="12" fill="${primary}"></circle>`,
    smoke: `<path d="M38 80 C26 70 28 52 42 48 C42 34 54 26 66 30 C74 20 90 24 94 40 C104 42 108 56 100 64 C104 78 94 90 80 88 H48 C42 88 38 84 38 80 Z" fill="${secondary}"></path>`,
    star: `<path d="M64 24 L72 48 L98 48 L76 62 L84 88 L64 72 L44 88 L52 62 L30 48 L56 48 Z" fill="${secondary}"></path>`,
    arrow: `<path d="M34 82 L70 46" stroke="${secondary}" stroke-width="10" stroke-linecap="round"></path><path d="M64 46 H92 V74" stroke="${secondary}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>`,
    wave: `<path d="M26 70 C38 52 48 52 58 70 C68 88 78 88 90 70 C94 64 98 60 102 58" stroke="${secondary}" stroke-width="10" stroke-linecap="round" fill="none"></path>`,
    orb: `<circle cx="64" cy="64" r="26" fill="${secondary}"></circle><circle cx="64" cy="64" r="10" fill="${primary}"></circle>`,
    shield: `<path d="M64 26 L92 38 V62 C92 78 82 92 64 102 C46 92 36 78 36 62 V38 Z" fill="${secondary}"></path>`,
    stack: `<rect x="38" y="36" width="52" height="14" rx="4" fill="${secondary}"></rect><rect x="32" y="57" width="64" height="14" rx="4" fill="${secondary}"></rect><rect x="42" y="78" width="44" height="14" rx="4" fill="${secondary}"></rect>`,
    target: `<circle cx="64" cy="64" r="26" fill="none" stroke="${secondary}" stroke-width="8"></circle><circle cx="64" cy="64" r="10" fill="${secondary}"></circle>`,
    ring: `<circle cx="64" cy="64" r="26" fill="none" stroke="${secondary}" stroke-width="10"></circle>`,
    grid: `<path d="M40 40 H88 M40 64 H88 M40 88 H88 M40 40 V88 M64 40 V88 M88 40 V88" stroke="${secondary}" stroke-width="6" stroke-linecap="round"></path>`
  };

  return `<svg viewBox="0 0 128 128" width="${size}" height="${size}" aria-hidden="true">
    <rect x="12" y="12" width="104" height="104" rx="28" fill="${primary}"></rect>
    <path d="M24 96 C48 78 84 78 104 42" stroke="rgba(255,255,255,0.12)" stroke-width="10" stroke-linecap="round"></path>
    <circle cx="64" cy="56" r="30" fill="rgba(255,255,255,0.08)"></circle>
    ${marks[mark] || marks.diamond}
    <rect x="24" y="88" width="80" height="18" rx="9" fill="rgba(255,255,255,0.16)"></rect>
    <text x="64" y="101" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" font-weight="700" letter-spacing="1" fill="#ffffff">${label}</text>
  </svg>`;
}

function resolveArtKey(key) {
  if (key && artPresets[key]) return key;
  return "default";
}

function getArtAssetUrl(key) {
  const artKey = resolveArtKey(key);
  return `assets/agents/${artKey}.png`;
}

function renderAgentArt(key, size, options = {}) {
  const artKey = resolveArtKey(key);
  const preset = artPresets[artKey] || artPresets.default;
  const inlineSvg = makeAgentSVG({ ...preset, size }).replace("<svg ", '<svg class="cat-art-fallback" ');

  if (!assetArtKeys.has(artKey)) {
    return inlineSvg;
  }

  const fallback = encodeURIComponent(inlineSvg);
  const imageClass = options.cropTopSquare ? "cat-art cat-art--crop-top" : "cat-art";
  return `<img class="${imageClass}" src="${getArtAssetUrl(artKey)}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='data:image/svg+xml;charset=UTF-8,${fallback}'">`;
}

function fillRow(id, keys) {
  const row = document.getElementById(id);
  const doubled = [...keys, ...keys];
  row.innerHTML = doubled.map(key => `<div class="animal-cell">${renderAgentArt(key, 74)}</div>`).join("");
}

function renderHomeRows() {
  fillRow("home-row-1", homeRows.row1);
  fillRow("home-row-2", homeRows.row2);
  fillRow("home-row-3", homeRows.row3);
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.body.dataset.activePage = id;
  window.scrollTo(0, 0);
}

function applyConsentState(state) {
  consentState = state;
  const allowStart = state === "agreed";
  dom.startBtn.classList.toggle("is-hidden", !allowStart);
  dom.noticeEntry.classList.toggle("is-visible", state === "declined");
}

function openNoticeDialog() {
  dom.noticeOverlay.classList.add("is-open");
}

function closeNoticeDialog() {
  dom.noticeOverlay.classList.remove("is-open");
}

function agreeNotice() {
  applyConsentState("agreed");
  closeNoticeDialog();
}

function declineNotice() {
  applyConsentState("declined");
  closeNoticeDialog();
}

function cleanQuoteText(text) {
  return typeof text === "string" ? text.replace(/[。．.]+$/u, "") : "";
}

function showQuizMessage(message) {
  if (!dom.quizMessage) return;
  dom.quizMessage.textContent = message;
  dom.quizMessage.hidden = false;
  window.clearTimeout(showQuizMessage.timer);
  showQuizMessage.timer = window.setTimeout(() => {
    dom.quizMessage.hidden = true;
  }, 3200);
}

function hideQuizMessage() {
  if (!dom.quizMessage) return;
  window.clearTimeout(showQuizMessage.timer);
  dom.quizMessage.hidden = true;
}

function getQuestionTextForTerms(question) {
  return [
    question?.text,
    question?.hint,
    ...(Array.isArray(question?.options) ? question.options.map(option => option.text) : [])
  ].filter(Boolean).join(" ").toLowerCase();
}

function getMatchedTerms(question) {
  const text = getQuestionTextForTerms(question);
  return termGlossary.filter(item => item.terms.some(term => text.includes(term.toLowerCase())));
}

function renderTermHelp(question) {
  if (!dom.termHelp || !dom.termHelpToggle || !dom.termHelpPanel) return;

  const matches = getMatchedTerms(question);
  if (!matches.length) {
    dom.termHelp.hidden = true;
    dom.termHelp.classList.remove("is-open");
    dom.termHelpToggle.setAttribute("aria-expanded", "false");
    dom.termHelpPanel.innerHTML = "";
    return;
  }

  dom.termHelp.hidden = false;
  dom.termHelp.classList.remove("is-open");
  dom.termHelpToggle.setAttribute("aria-expanded", "false");
  dom.termHelpPanel.innerHTML = matches.map(item => `
    <p><strong>${item.label}</strong>：${item.desc}</p>
  `).join("");
}

function toggleTermHelp() {
  if (!dom.termHelp || dom.termHelp.hidden) return;
  const isOpen = dom.termHelp.classList.toggle("is-open");
  dom.termHelpToggle.setAttribute("aria-expanded", String(isOpen));
}

function initHomeNotice() {
  applyConsentState("pending");
  openNoticeDialog();
}

function isRateLimited(response, data) {
  return response?.status === 429 || data?.error === "Too Many Requests";
}

function buildHistoryIndex(seenIds) {
  const historyIndex = new Map();
  seenIds.forEach((id, index) => {
    historyIndex.set(id, index);
  });
  return historyIndex;
}

function pickLocalQuestion(slotQuestions, historyIndex) {
  const unseenQuestions = slotQuestions.filter(question => !historyIndex.has(question.id));
  if (unseenQuestions.length) {
    return unseenQuestions[Math.floor(Math.random() * unseenQuestions.length)];
  }

  const rankedQuestions = [...slotQuestions].sort((left, right) => {
    return (historyIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (historyIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER);
  });

  return rankedQuestions[0] || null;
}

function buildLocalQuiz(slotOrder, slotPools, seenIds) {
  if (!Array.isArray(slotOrder) || !slotOrder.length || !slotPools || typeof slotPools !== "object") {
    return [];
  }

  const historyIndex = buildHistoryIndex(seenIds);

  return slotOrder.map(slot => {
    const slotQuestions = Array.isArray(slotPools[slot]) ? slotPools[slot].filter(question => question && typeof question.id === "string" && Array.isArray(question.options)) : [];
    return pickLocalQuestion(slotQuestions, historyIndex);
  }).filter(Boolean);
}

async function startQuiz() {
  if (consentState !== "agreed") {
    openNoticeDialog();
    return;
  }

  hideQuizMessage();
  const originalText = dom.startBtn.innerHTML;
  dom.startBtn.disabled = true;
  dom.startBtn.innerHTML = '<span class="btn-start-icon"></span>加载中';

  try {
    const response = await fetch(`${API_BASE}/start`, {
      method: "GET",
      headers: { accept: "application/json" }
    });

    const data = await response.json();
    if (!response.ok) {
      if (isRateLimited(response, data)) {
        showQuizMessage("点太快啦，稍等一会儿再开始。");
        return;
      }
      throw new Error("题目加载失败");
    }
    const seenIds = getSeenQuestionIds();
    const nextQuestions = buildLocalQuiz(data.slotOrder, data.slotPools, seenIds);
    questions = nextQuestions.length ? nextQuestions : (Array.isArray(data.questions) ? data.questions : []);

    if (questions.length !== 15) {
      throw new Error("没有可用题目");
    }

    rememberSeenQuestions(questions);
    currentQ = 0;
    quizAnswers = [];
    selectedOpt = null;
    renderQuestion();
    showPage("page-quiz");
  } catch {
    showQuizMessage("题目加载失败，等一下再试试。");
  } finally {
    dom.startBtn.disabled = false;
    dom.startBtn.innerHTML = originalText;
  }
}

function pickQuizArt(key) {
  if (key && artPresets[key]) {
    lastQuizArtKey = key;
    return key;
  }

  let picked = quizArtPool[Math.floor(Math.random() * quizArtPool.length)];
  if (picked === lastQuizArtKey && quizArtPool.length > 1) {
    const nextIndex = (quizArtPool.indexOf(picked) + 1) % quizArtPool.length;
    picked = quizArtPool[nextIndex];
  }
  lastQuizArtKey = picked;
  return picked;
}

function renderQuestion() {
  const q = questions[currentQ];
  if (!q) return;

  const savedAnswer = quizAnswers[currentQ];
  selectedOpt = savedAnswer ? q.options.findIndex(option => option.key === savedAnswer.optionKey) : null;
  dom.quizCounter.textContent = `${currentQ + 1} / ${questions.length}`;
  dom.progressFill.style.width = `${((currentQ + 1) / questions.length) * 100}%`;
  dom.quizQuestionId.textContent = q.id || "";
  dom.questionText.textContent = q.text;
  dom.quizAgentBubble.textContent = q.hint;
  dom.quizAgentIcon.innerHTML = renderAgentArt(pickQuizArt(q.art), 40, { cropTopSquare: true });
  renderTermHelp(q);
  dom.optionsWrap.innerHTML = q.options.map((opt, index) => `
    <button type="button" class="opt${index === selectedOpt ? " selected" : ""}" data-option-index="${index}">
      <span class="opt-key">${opt.key}</span>
      <span class="opt-text">${opt.text}</span>
    </button>
  `).join("");
  dom.nextBtn.classList.toggle("enabled", selectedOpt !== null);
  dom.nextBtn.textContent = currentQ === questions.length - 1 ? "查看结果 →" : "继续 →";
}

function selectOption(index) {
  const target = dom.optionsWrap.querySelector(`[data-option-index="${index}"]`);
  if (!target) return;

  dom.optionsWrap.querySelectorAll(".opt").forEach(button => button.classList.remove("selected"));
  target.classList.add("selected");
  selectedOpt = index;
  dom.nextBtn.classList.add("enabled");
}

function handleOptionClick(event) {
  const button = event.target.closest(".opt");
  if (!button || !dom.optionsWrap.contains(button)) return;
  selectOption(Number(button.dataset.optionIndex));
}

async function nextQuestion() {
  if (selectedOpt === null) return;

  const picked = questions[currentQ].options[selectedOpt];
  quizAnswers[currentQ] = {
    questionId: questions[currentQ].id,
    optionKey: picked.key
  };

  if (currentQ < questions.length - 1) {
    currentQ += 1;
    renderQuestion();
    return;
  }

  const originalText = dom.nextBtn.textContent;
  dom.nextBtn.classList.remove("enabled");
  dom.nextBtn.textContent = "生成结果中...";

  try {
    const response = await fetch(`${API_BASE}/finish`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({ answers: quizAnswers })
    });

    const data = await response.json();
    if (!response.ok) {
      if (isRateLimited(response, data)) {
        showQuizMessage("请求太频繁了，稍后再看结果。");
        dom.nextBtn.textContent = originalText;
        if (selectedOpt !== null) {
          dom.nextBtn.classList.add("enabled");
        }
        return;
      }
      throw new Error(data.error || "结果生成失败");
    }

    if (!data.result) {
      throw new Error(data.error || "结果生成失败");
    }

    showResult(data.result);
  } catch {
    showQuizMessage("结果生成失败，可以重新测一次。");
    dom.nextBtn.textContent = originalText;
    if (selectedOpt !== null) {
      dom.nextBtn.classList.add("enabled");
    }
  }
}

function goBack() {
  if (currentQ === 0) {
    showPage("page-home");
    return;
  }

  quizAnswers[currentQ] = null;
  currentQ -= 1;
  renderQuestion();
}

function showResult(data) {
  dom.resultType.textContent = data.name;
  dom.resultSubname.textContent = data.subname;
  dom.resultQuote.textContent = cleanQuoteText(data.quote);
  dom.resultDesc.textContent = data.desc;
  dom.resultAgentFrame.innerHTML = renderAgentArt(data.art || "default", 112);

  const now = new Date();
  dom.resultDate.textContent = `${now.getMonth() + 1}月${now.getDate()}日`;
  dom.traitList.innerHTML = "";
  data.traits.forEach(trait => {
    const item = document.createElement("span");
    item.className = "trait";
    item.textContent = trait;
    dom.traitList.appendChild(item);
  });

  showPage("page-result");
}

function retryQuiz() {
  startQuiz();
}

function bindEvents() {
  dom.themeToggle.addEventListener("click", toggleTheme);
  dom.quizThemeToggle?.addEventListener("click", toggleTheme);
  dom.resultThemeToggle?.addEventListener("click", toggleTheme);
  dom.startBtn.addEventListener("click", startQuiz);
  dom.noticeReopen.addEventListener("click", openNoticeDialog);
  dom.noticeAgree.addEventListener("click", agreeNotice);
  dom.noticeDecline.addEventListener("click", declineNotice);
  dom.termHelpToggle?.addEventListener("click", toggleTermHelp);
  dom.backBtn.addEventListener("click", goBack);
  dom.nextBtn.addEventListener("click", nextQuestion);
  dom.retryBtn.addEventListener("click", retryQuiz);
  dom.optionsWrap.addEventListener("click", handleOptionClick);
}

function initApp() {
  initTheme();
  bindEvents();
  renderHomeRows();
  initHomeNotice();
}

initApp();
