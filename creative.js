const STORAGE_KEY = "vp-studio-creative-v1";
const SCHEMA_VERSION = 6;
const MAX_HISTORY = 80;

let sequence = 0;
const uid = (prefix = "item") => `${prefix}-${Date.now().toString(36)}-${(sequence += 1).toString(36)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));
const escapeHTML = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const roleNames = {
  student: "Aluno",
  coach: "Professor",
  shared: "Compartilhada",
};

const roleHeadings = {
  student: "ÁREA DO ALUNO",
  coach: "ÁREA DO PROFESSOR",
  shared: "VP STUDIO",
};

const navigationPlacementNames = {
  existing: "Ícone existente",
  new: "Novo ícone",
  hidden: "Sem atalho",
};

const screenDefaultIcons = {
  "student-home": "home", "student-agenda": "calendar", "student-workout": "workout", "student-evolution": "chart", "student-profile": "user",
  "coach-home": "home", "coach-students": "users", "coach-agenda": "calendar", "coach-training": "workout", "coach-reports": "chart",
};

const blockCatalog = {
  hero: {
    name: "Abertura",
    description: "Saudação, título e texto de apoio.",
    marker: "Aa",
    create: () => ({ kicker: "BOAS-VINDAS", title: "Sua nova seção", text: "Use este espaço para orientar o aluno.", tone: "plain", width: "full", density: "normal", align: "left" }),
  },
  wellness: {
    name: "Bem-estar",
    description: "Destaque para o check-in diário.",
    marker: "05",
    create: () => ({ kicker: "CHECK-IN DIÁRIO", title: "Como você está hoje?", text: "Sono, energia, dor, estresse e recuperação.", action: "Responder agora", tone: "copper", width: "full", density: "normal", align: "left" }),
  },
  metrics: {
    name: "Indicadores",
    description: "Resumo com até três números.",
    marker: "123",
    create: () => ({ kicker: "RESUMO", title: "Seus indicadores", text: "", items: ["12|Treinos", "86%|Frequência", "7,8|PSR média"], tone: "plain", width: "full", density: "normal", align: "left" }),
  },
  chart: {
    name: "Gráfico",
    description: "Visualização de evolução ou carga.",
    marker: "▥",
    create: () => ({ kicker: "EVOLUÇÃO", title: "Últimas semanas", text: "Acompanhe a tendência dos registros.", values: [42, 58, 48, 70, 62, 82, 76], tone: "plain", width: "full", density: "normal", align: "left" }),
  },
  workout: {
    name: "Treino atual",
    description: "Resumo do treino e chamada principal.",
    marker: "T",
    create: () => ({ kicker: "TREINO 12", title: "Força geral", text: "7 exercícios · aproximadamente 52 minutos", action: "Abrir treino", tone: "graphite", width: "full", density: "normal", align: "left" }),
  },
  schedule: {
    name: "Agenda",
    description: "Aulas, avaliações ou compromissos.",
    marker: "31",
    create: () => ({ kicker: "AGENDA", title: "Próximos horários", text: "", items: ["Hoje, 18:30|Treino individual|Confirmada", "Qui, 17:00|Avaliação física|Agendada"], tone: "plain", width: "full", density: "normal", align: "left" }),
  },
  list: {
    name: "Lista",
    description: "Histórico, alunos ou registros livres.",
    marker: "≡",
    create: () => ({ kicker: "REGISTROS", title: "Itens recentes", text: "", items: ["Registro principal|Descrição curta|Ativo", "Segundo registro|Informação complementar|Revisar"], tone: "plain", width: "full", density: "normal", align: "left" }),
  },
  notice: {
    name: "Aviso",
    description: "Mensagem importante ou pendência.",
    marker: "!",
    create: () => ({ kicker: "ATENÇÃO", title: "Há uma atualização", text: "Descreva aqui o que precisa ser visto.", tone: "soft", width: "full", density: "compact", align: "left" }),
  },
  text: {
    name: "Texto livre",
    description: "Título e parágrafo sem ação.",
    marker: "¶",
    create: () => ({ kicker: "", title: "Título do conteúdo", text: "Escreva uma explicação, orientação ou observação.", tone: "plain", width: "full", density: "normal", align: "left" }),
  },
  button: {
    name: "Ação",
    description: "Botão para outra tela ou função.",
    marker: "→",
    create: () => ({ kicker: "", title: "Ação principal", text: "", action: "Continuar", target: "", tone: "plain", width: "full", density: "compact", align: "left" }),
  },
  image: {
    name: "Imagem",
    description: "Foto, ilustração, logo ou referência visual.",
    marker: "▧",
    create: () => ({ kicker: "IMAGEM", title: "Legenda da imagem", text: "", imageUrl: "assets/brand/vp-logo-gradient.png", tone: "plain", width: "full", density: "normal", align: "center" }),
  },
  form: {
    name: "Formulário",
    description: "Perguntas e campos para preenchimento.",
    marker: "□",
    create: () => ({ kicker: "FORMULÁRIO", title: "Informações importantes", text: "Preencha os campos abaixo.", items: ["Objetivo principal", "Observações", "Data desejada"], action: "Salvar respostas", tone: "plain", width: "full", density: "normal", align: "left" }),
  },
  shortcuts: {
    name: "Atalhos",
    description: "Acesso rápido a outras áreas do app.",
    marker: "#",
    create: () => ({ kicker: "ACESSO RÁPIDO", title: "O que você procura?", text: "", items: ["Meu treino", "Agendar aula", "Ver evolução", "Financeiro"], tone: "soft", width: "full", density: "normal", align: "left" }),
  },
  divider: {
    name: "Divisor",
    description: "Separação visual entre conteúdos.",
    marker: "—",
    create: () => ({ kicker: "", title: "", text: "", tone: "plain", width: "full", density: "compact", align: "left" }),
  },
  spacer: {
    name: "Espaço",
    description: "Respiro ajustável entre blocos.",
    marker: "↕",
    create: () => ({ kicker: "", title: "", text: "", spacer: 40, tone: "plain", width: "full", density: "normal", align: "left" }),
  },
};

const originalComponentSelectors = {
  hero: ".app-view .page-intro",
  wellness: "#wellness-hero",
  metrics: ".metric-strip",
  chart: ".chart-card",
  workout: ".current-workout-card",
  schedule: ".schedule-item",
  list: ".student-table",
  notice: ".notice-card",
  text: ".account-intro",
  button: ".app-view .button--primary",
  image: ".cobre-login-logo",
  form: ".account-form",
  shortcuts: ".notice-grid",
};

function makeBlock(type, overrides = {}) {
  const definition = blockCatalog[type] || blockCatalog.text;
  return {
    id: uid("block"),
    type,
    visible: true,
    ...definition.create(),
    ...overrides,
  };
}

function makeScreen(id, name, role, blocks, options = {}) {
  const navLabel = options.navLabel || name;
  const showInNav = options.showInNav ?? true;
  return {
    id,
    sourceScreenId: options.sourceScreenId || id,
    startBlank: options.startBlank || false,
    navigationPlacement: options.navigationPlacement || (options.sourceScreenId && options.sourceScreenId !== id ? "new" : "existing"),
    navIcon: options.navIcon || "more",
    name,
    navLabel,
    role,
    showInNav,
    baseline: options.baseline || { name, navLabel, role, showInNav },
    blocks,
  };
}

function createDefaultProject() {
  return {
    schemaVersion: SCHEMA_VERSION,
    projectName: "VP Studio · Reunião",
    activeScreenId: "student-home",
    selectedBlockId: null,
    viewport: "mobile",
    zoom: 65,
    zoomManual: false,
    roleFilter: "all",
    inspectorTab: "content",
    navigationModes: { student: "responsive", coach: "responsive", shared: "responsive" },
    fidelity: { edits: {}, originals: {}, additions: {}, orders: {}, hidden: {} },
    screens: [
      makeScreen("shared-login", "Entrada", "shared", [
        makeBlock("hero", { kicker: "VINICIUS PONTES STUDIO", title: "Acesso ao Studio", text: "Entre com seu e-mail ou celular.", align: "center", density: "spacious" }),
        makeBlock("button", { title: "", action: "Entrar", target: "student-home", tone: "copper" }),
        makeBlock("button", { title: "", action: "Área do professor", target: "coach-home", tone: "soft" }),
      ], { showInNav: false }),
      makeScreen("student-home", "Início", "student", [
        makeBlock("hero", { kicker: "OLÁ, CAROLINA", title: "Bom ter você por aqui.", text: "Disciplina supera motivação.", density: "compact" }),
        makeBlock("wellness", { title: "Seu bem-estar", text: "Leva menos de dois minutos e orienta seu treino de hoje." }),
        makeBlock("notice", { kicker: "NOVIDADE", title: "Avaliações físicas de agosto", text: "Os horários da próxima semana já estão disponíveis." }),
        makeBlock("metrics", { title: "Resumo do mês", items: ["12|Treinos", "86%|Frequência", "+8%|Evolução"] }),
        makeBlock("workout", { kicker: "TREINO 12", title: "Força geral", text: "7 exercícios · aproximadamente 52 minutos" }),
      ], { navLabel: "Início" }),
      makeScreen("student-agenda", "Agenda", "student", [
        makeBlock("hero", { kicker: "MINHAS AULAS", title: "Organize sua semana", text: "Agende, remarque e acompanhe seus horários." }),
        makeBlock("schedule", { title: "Próximas aulas", items: ["Hoje, 18:30|Treino individual|Confirmada", "Qui, 17:00|Treino individual|Agendada", "Sáb, 09:00|Avaliação física|Pendente"] }),
        makeBlock("button", { title: "", action: "Agendar nova aula", tone: "copper" }),
      ]),
      makeScreen("student-workout", "Meu treino", "student", [
        makeBlock("workout", { kicker: "TREINO ATUAL · 12", title: "Força geral", text: "Quadríceps, ombros e estabilidade", action: "Iniciar treino" }),
        makeBlock("list", { kicker: "EXERCÍCIOS", title: "Sessão de hoje", items: ["Agachamento livre|4 × 8|60 kg", "Desenvolvimento|3 × 10|18 kg", "Afundo alternado|3 × 12|24 kg", "Prancha|3 × 45s|Corporal"] }),
        makeBlock("chart", { kicker: "CARGA", title: "Volume das últimas sessões", values: [48, 56, 61, 59, 72, 78, 82] }),
      ], { navLabel: "Treino" }),
      makeScreen("student-evolution", "Evolução", "student", [
        makeBlock("hero", { kicker: "HISTÓRICO", title: "Sua evolução", text: "Veja o que mudou e celebre cada etapa." }),
        makeBlock("metrics", { title: "Últimos 90 dias", items: ["34|Treinos", "91%|Presença", "+12%|Carga"] }),
        makeBlock("chart", { kicker: "FREQUÊNCIA", title: "Treinos por semana", values: [44, 62, 55, 74, 68, 86, 80] }),
        makeBlock("chart", { kicker: "MEDIDAS", title: "Composição corporal", values: [82, 78, 74, 68, 64, 61, 57], tone: "soft" }),
      ]),
      makeScreen("student-profile", "Perfil", "student", [
        makeBlock("hero", { kicker: "CONTA", title: "Carolina Mendes", text: "Força e condicionamento · aluna desde 2025", align: "center" }),
        makeBlock("list", { kicker: "DADOS", title: "Informações e preferências", items: ["Dados pessoais|Contato e informações básicas|Editar", "Saúde e objetivos|Questionário inicial|Revisar", "Notificações|Lembretes e avisos|Ativas"] }),
        makeBlock("notice", { kicker: "PRIVACIDADE", title: "Seus dados, suas escolhas", text: "Controle permissões e histórico compartilhado com o Studio." }),
      ]),
      makeScreen("coach-home", "Painel do professor", "coach", [
        makeBlock("hero", { kicker: "BOM DIA, VINICIUS", title: "Visão do Studio", text: "Acompanhe prioridades, agenda e alunos em um só lugar." }),
        makeBlock("metrics", { title: "Hoje", items: ["8|Aulas", "3|Check-ins", "2|Alertas"] }),
        makeBlock("notice", { kicker: "ATENÇÃO", title: "Dois alunos precisam de revisão", text: "Dor informada e queda de frequência nos últimos registros.", tone: "copper" }),
        makeBlock("schedule", { title: "Agenda de hoje", items: ["07:00|Rafael Brito|Concluída", "16:00|Mariana Costa|Confirmada", "18:30|Carolina Mendes|Confirmada"] }),
        makeBlock("chart", { kicker: "PRONTIDÃO", title: "Resumo coletivo", values: [72, 66, 81, 77, 70, 84, 79] }),
      ], { navLabel: "Início" }),
      makeScreen("coach-students", "Alunos", "coach", [
        makeBlock("hero", { kicker: "ACOMPANHAMENTO", title: "Seus alunos", text: "Busque, filtre e abra o histórico individual." }),
        makeBlock("metrics", { title: "Base ativa", items: ["28|Alunos", "86%|Frequência", "4|Atenção"] }),
        makeBlock("list", { kicker: "ALUNOS", title: "Registros recentes", items: ["Larissa Martins|Dor informada hoje|Revisar", "Carolina Mendes|PSR 8 · 06:55|Ativa", "Rafael Brito|3 faltas recentes|Atenção", "Mariana Costa|Frequência 92%|Ativa"] }),
      ]),
      makeScreen("coach-agenda", "Agenda do Studio", "coach", [
        makeBlock("hero", { kicker: "HORÁRIOS", title: "Agenda semanal", text: "Visualize a ocupação e organize recorrências." }),
        makeBlock("schedule", { title: "Terça-feira", items: ["07:00|Rafael Brito|Treino", "16:00|Mariana Costa|Avaliação", "18:30|Carolina Mendes|Treino", "20:00|Henrique Souza|Treino"] }),
        makeBlock("button", { title: "", action: "Criar horário recorrente", tone: "copper" }),
      ], { navLabel: "Agenda" }),
      makeScreen("coach-training", "Montagem de treinos", "coach", [
        makeBlock("hero", { kicker: "PRESCRIÇÃO", title: "Montar treino", text: "Combine exercícios, critérios e progressões." }),
        makeBlock("list", { kicker: "TREINO EM EDIÇÃO", title: "Carolina · Treino 13", items: ["Quadríceps|1 exercício obrigatório|Definido", "Ombros|2 exercícios obrigatórios|Definido", "Posterior|1 exercício obrigatório|Pendente"] }),
        makeBlock("notice", { kicker: "HISTÓRICO", title: "Versão anterior preservada", text: "A publicação de um novo treino não apaga os registros anteriores." }),
        makeBlock("button", { title: "", action: "Revisar e publicar", tone: "copper" }),
      ], { navLabel: "Treinos" }),
      makeScreen("coach-reports", "Relatórios", "coach", [
        makeBlock("hero", { kicker: "INDICADORES", title: "Relatórios do Studio", text: "Cruze frequência, prontidão, carga e evolução." }),
        makeBlock("metrics", { title: "Visão geral", items: ["86%|Frequência", "7,6|PSR média", "4|Atenção"] }),
        makeBlock("chart", { kicker: "ADESÃO", title: "Frequência coletiva", values: [62, 68, 74, 70, 82, 86, 84] }),
        makeBlock("chart", { kicker: "CARGA", title: "Carga aguda e crônica", values: [52, 60, 58, 71, 75, 79, 76], tone: "graphite" }),
      ]),
    ],
    versions: [],
  };
}

function migrateProject(parsed) {
  const defaults = createDefaultProject();
  const project = {
    ...defaults,
    ...parsed,
    schemaVersion: SCHEMA_VERSION,
    navigationModes: { ...defaults.navigationModes, ...(parsed.navigationModes || {}) },
    fidelity: { ...defaults.fidelity, ...(parsed.fidelity || {}) },
  };
  project.screens = parsed.screens.map((screen) => ({
    startBlank: false,
    navigationPlacement: screen.id === screen.sourceScreenId || !screen.sourceScreenId ? "existing" : "new",
    navIcon: screenDefaultIcons[screen.sourceScreenId || screen.id] || "more",
    baseline: screen.baseline || { name: screen.name, navLabel: screen.navLabel, role: screen.role, showInNav: screen.showInNav },
    ...screen,
  }));
  return project;
}

function loadProject() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(parsed?.screens) || !parsed.screens.length) return createDefaultProject();
    return migrateProject(parsed);
  } catch {
    return createDefaultProject();
  }
}

let state = loadProject();
let undoStack = [];
let redoStack = [];
let draggedBlockId = null;
let saveTimer = null;
let toastTimer = null;
let frameReady = false;
let frameSelection = null;
let frameEditSnapshot = null;
let draggedFrameSection = null;
let frameDragSnapshot = null;
let frameDragStartOrder = null;
let placementFrameSection = null;
let placementFrameSnapshot = null;

const elements = {
  projectTitle: document.querySelector("#project-title"),
  saveState: document.querySelector("#save-state"),
  undo: document.querySelector("#undo-button"),
  redo: document.querySelector("#redo-button"),
  screenList: document.querySelector("#screen-list"),
  screenSearch: document.querySelector("#screen-search"),
  currentRole: document.querySelector("#current-screen-role"),
  currentName: document.querySelector("#current-screen-name"),
  previewProfile: document.querySelector("#preview-profile"),
  previewTitle: document.querySelector("#preview-screen-title"),
  previewContent: document.querySelector("#preview-content"),
  previewNavigation: document.querySelector("#preview-navigation"),
  originalPreview: document.querySelector("#original-app-preview"),
  canvasStage: document.querySelector("#canvas-stage"),
  deviceShell: document.querySelector("#device-shell"),
  inspectorBody: document.querySelector("#inspector-body"),
  zoom: document.querySelector("#zoom-control"),
  zoomOutput: document.querySelector("#zoom-output"),
  blockDialog: document.querySelector("#block-dialog"),
  screenDialog: document.querySelector("#screen-dialog"),
  projectDialog: document.querySelector("#project-dialog"),
  blockLibrary: document.querySelector("#block-library"),
  versionList: document.querySelector("#version-list"),
  versionCount: document.querySelector("#version-count"),
  importFile: document.querySelector("#import-file"),
  presentation: document.querySelector("#presentation-mode"),
  presentationMount: document.querySelector("#presentation-mount"),
  toast: document.querySelector("#creative-toast"),
};

function activeScreen() {
  return state.screens.find((screen) => screen.id === state.activeScreenId) || state.screens[0];
}

function selectedBlock() {
  return activeScreen()?.blocks.find((block) => block.id === state.selectedBlockId) || null;
}

function historySnapshot() {
  return clone({
    screens: state.screens,
    fidelity: state.fidelity,
    navigationModes: state.navigationModes,
    activeScreenId: state.activeScreenId,
    selectedBlockId: state.selectedBlockId,
  });
}

function applySnapshot(snapshot) {
  state.screens = clone(snapshot.screens);
  state.fidelity = clone(snapshot.fidelity || { edits: {}, originals: {}, additions: {}, orders: {}, hidden: {} });
  state.navigationModes = clone(snapshot.navigationModes || { student: "responsive", coach: "responsive", shared: "responsive" });
  state.activeScreenId = snapshot.activeScreenId;
  state.selectedBlockId = snapshot.selectedBlockId;
  ensureValidSelection();
}

function ensureValidSelection() {
  if (!state.screens.some((screen) => screen.id === state.activeScreenId)) state.activeScreenId = state.screens[0]?.id;
  const screen = activeScreen();
  if (!screen?.blocks.some((block) => block.id === state.selectedBlockId)) state.selectedBlockId = null;
}

function commit(change, message = "Alteração aplicada") {
  undoStack.push(historySnapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  change();
  ensureValidSelection();
  scheduleSave();
  renderAll();
  if (message) showToast(message);
}

function scheduleSave() {
  window.clearTimeout(saveTimer);
  elements.saveState.classList.add("is-saving");
  elements.saveState.querySelector("span").textContent = "Salvando alterações";
  saveTimer = window.setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    elements.saveState.classList.remove("is-saving");
    elements.saveState.querySelector("span").textContent = "Alterações salvas";
  }, 240);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2500);
}

function renderAll() {
  renderScreenList();
  renderCanvas();
  renderInspector();
  renderHistoryControls();
  renderVersions();
  elements.projectTitle.textContent = state.projectName;
}

function renderHistoryControls() {
  elements.undo.disabled = undoStack.length === 0;
  elements.redo.disabled = redoStack.length === 0;
}

function screenGroupLabel(role) {
  if (role === "student") return "ALUNO";
  if (role === "coach") return "PROFESSOR";
  return "COMPARTILHADAS";
}

function renderScreenList() {
  const query = elements.screenSearch.value.trim().toLocaleLowerCase("pt-BR");
  const order = ["shared", "student", "coach"];
  const filtered = state.screens.filter((screen) => {
    const roleMatches = state.roleFilter === "all" || screen.role === state.roleFilter;
    return roleMatches && screen.name.toLocaleLowerCase("pt-BR").includes(query);
  });

  elements.screenList.innerHTML = order.map((role) => {
    const screens = filtered.filter((screen) => screen.role === role);
    if (!screens.length) return "";
    return `
      <div class="screen-list__group">${screenGroupLabel(role)}</div>
      ${screens.map((screen) => {
        const index = state.screens.filter((item) => item.role === role).indexOf(screen) + 1;
        const additions = Object.keys(state.fidelity?.additions?.[screen.id] || {}).length;
        const removed = Object.keys(state.fidelity?.hidden?.[screen.id] || {}).length;
        const count = Math.max(0, (screen.startBlank ? 0 : screen.blocks.length) + additions - removed);
        return `
          <button class="screen-item ${screen.id === state.activeScreenId ? "is-active" : ""}" type="button" data-screen-id="${escapeHTML(screen.id)}">
            <span class="screen-item__index">${String(index).padStart(2, "0")}</span>
            <span class="screen-item__copy"><strong>${escapeHTML(screen.name)}</strong><small>${escapeHTML(navigationPlacementNames[screen.navigationPlacement] || (screen.showInNav ? "Na navegação" : "Sem atalho"))}</small></span>
            <span class="screen-item__count">${count}</span>
          </button>`;
      }).join("")}
    `;
  }).join("") || '<div class="inspector-empty"><strong>Nenhuma tela encontrada</strong><p>Altere o filtro ou crie uma nova tela.</p></div>';
}

function editableText(tag, className, field, value) {
  if (!value && field !== "title") return "";
  return `<${tag} class="${className}" contenteditable="true" spellcheck="true" data-inline-field="${field}">${escapeHTML(value)}</${tag}>`;
}

function renderBlockCore(block) {
  const kicker = editableText("span", "block-kicker", "kicker", block.kicker || "");
  const title = editableText("h3", "block-title", "title", block.title || "");
  const copy = editableText("p", "block-copy", "text", block.text || "");
  const action = block.action ? `<button class="block-action" type="button" data-preview-target="${escapeHTML(block.target || "")}"><span>${escapeHTML(block.action)}</span><b aria-hidden="true">→</b></button>` : "";

  if (block.type === "divider") return '<div class="divider-block" aria-label="Divisor"></div>';
  if (block.type === "spacer") return `<div class="spacer-block" style="--spacer-height:${Number(block.spacer) || 40}px">Espaço · ${Number(block.spacer) || 40}px</div>`;

  if (block.type === "metrics") {
    const metrics = (block.items || []).slice(0, 3).map((item) => {
      const [value, label] = String(item).split("|");
      return `<article><strong>${escapeHTML(value || "—")}</strong><small>${escapeHTML(label || "Indicador")}</small></article>`;
    }).join("");
    return `<div class="block-content">${kicker}${title}${copy}<div class="metric-grid">${metrics}</div>${action}</div>`;
  }

  if (block.type === "chart") {
    const values = Array.isArray(block.values) && block.values.length ? block.values : [35, 52, 46, 68, 62, 78, 73];
    const bars = values.map((value) => `<i style="height:${Math.max(8, Math.min(100, Number(value) || 10))}%"></i>`).join("");
    return `<div class="block-content">${kicker}${title}${copy}<div class="chart-bars" aria-label="Gráfico demonstrativo">${bars}</div>${action}</div>`;
  }

  if (block.type === "schedule" || block.type === "list") {
    const listClass = block.type === "schedule" ? "schedule-list" : "record-list";
    const items = (block.items || []).map((item) => {
      const [primary, secondary, status] = String(item).split("|");
      return `<article><b>${escapeHTML(primary || "Item")}</b><span>${escapeHTML(secondary || "")}</span><small>${escapeHTML(status || "")}</small></article>`;
    }).join("");
    return `<div class="block-content">${kicker}${title}${copy}<div class="${listClass}">${items}</div>${action}</div>`;
  }

  if (block.type === "image") {
    const source = /^(https?:\/\/|data:image\/|assets\/)/i.test(block.imageUrl || "") ? block.imageUrl : "assets/brand/vp-logo-gradient.png";
    return `<div class="block-content">${kicker}<img class="creative-image" src="${escapeHTML(source)}" alt="${escapeHTML(block.title || "Imagem do aplicativo")}" />${title}${copy}${action}</div>`;
  }

  if (block.type === "form") {
    const fields = (block.items || []).map((item) => `<label class="creative-form-field"><span>${escapeHTML(item)}</span><i></i></label>`).join("");
    return `<div class="block-content">${kicker}${title}${copy}<div class="creative-form-preview">${fields}</div>${action}</div>`;
  }

  if (block.type === "shortcuts") {
    const shortcuts = (block.items || []).map((item) => `<button type="button"><span>${escapeHTML(item)}</span><b aria-hidden="true">→</b></button>`).join("");
    return `<div class="block-content">${kicker}${title}${copy}<div class="creative-shortcuts">${shortcuts}</div>${action}</div>`;
  }

  if (block.type === "wellness") {
    return `<div class="block-content">${kicker}${title}${copy}<div class="wellness-scale" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>${action}</div>`;
  }

  return `<div class="block-content">${kicker}${title}${copy}${action}</div>`;
}

function renderBlock(block) {
  return `
    <section class="preview-block ${block.id === state.selectedBlockId ? "is-selected" : ""} ${block.visible ? "" : "is-hidden"}"
      draggable="true"
      data-block-id="${escapeHTML(block.id)}"
      data-type="${escapeHTML(block.type)}"
      data-tone="${escapeHTML(block.tone || "plain")}"
      data-width="${escapeHTML(block.width || "full")}"
      data-density="${escapeHTML(block.density || "normal")}"
      style="--block-align:${escapeHTML(block.align || "left")}">
      <div class="block-tools" aria-label="Ações do bloco">
        <button type="button" data-block-action="up" title="Mover para cima">↑</button>
        <button type="button" data-block-action="down" title="Mover para baixo">↓</button>
        <button type="button" data-block-action="duplicate" title="Duplicar">＋</button>
        <button type="button" data-block-action="visibility" title="${block.visible ? "Ocultar" : "Mostrar"}">${block.visible ? "○" : "●"}</button>
        <button type="button" data-block-action="delete" title="Excluir">×</button>
      </div>
      ${renderBlockCore(block)}
    </section>`;
}

function fidelityBucket(name, screenId = activeScreen()?.id) {
  state.fidelity ||= { edits: {}, originals: {}, additions: {}, orders: {}, hidden: {} };
  state.fidelity[name] ||= {};
  if (screenId) state.fidelity[name][screenId] ||= name === "orders" ? [] : {};
  return screenId ? state.fidelity[name][screenId] : state.fidelity[name];
}

function originalBlockMarkup(type, id) {
  const commonStart = `<section class="section-block creative-added-section" data-creative-added-id="${escapeHTML(id)}">`;
  const heading = (kicker, title) => `<header class="section-title"><div><span class="overline">${kicker}</span><h3>${title}</h3></div></header>`;
  const blocks = {
    hero: `<header class="page-intro creative-added-section" data-creative-added-id="${escapeHTML(id)}"><div><span class="overline">NOVA SEÇÃO</span><h2>Título da seção</h2><p>Edite este texto diretamente na prévia.</p></div></header>`,
    wellness: `<button class="wellness-hero creative-added-section" data-creative-added-id="${escapeHTML(id)}" type="button"><span class="wellness-hero__status"><i></i><small>CHECK-IN</small><strong>Pendente</strong></span><span class="wellness-hero__copy"><strong>Como você está hoje?</strong><span>Sono, energia, recuperação e desconfortos.</span></span><span class="wellness-hero__action"><b>Responder</b></span></button>`,
    metrics: `${commonStart}${heading("RESUMO", "Indicadores")}<div class="metric-strip"><article><span>Frequência</span><strong>86%</strong><small>12 de 14 aulas</small></article><article><span>Carga total</span><strong>+8,2%</strong><small>no período</small></article><article><span>PSR média</span><strong>7,6</strong><small>últimos 14 dias</small></article></div></section>`,
    chart: `${commonStart}${heading("EVOLUÇÃO", "Histórico")}<article class="card chart-card chart-card--wide"><div class="bar-chart"><i style="--bar:48%"></i><i style="--bar:62%"></i><i style="--bar:56%"></i><i style="--bar:76%"></i><i style="--bar:68%"></i><i style="--bar:84%"></i><i style="--bar:79%"></i></div></article></section>`,
    schedule: `${commonStart}${heading("AGENDA", "Próximos horários")}<div class="schedule-list"><article class="schedule-item"><time>18:30</time><span class="schedule-item__line"></span><div><span class="status-pill status-pill--confirmed">Confirmada</span><h3>Treino individual</h3><p>Vinicius Pontes · 50 min</p></div></article></div></section>`,
    image: `${commonStart}${heading("IMAGEM", "Referência visual")}<article class="card"><img src="assets/brand/vp-logo-gradient.png" alt="VP Studio" style="display:block;max-width:180px;margin:auto" /></article></section>`,
    form: `${commonStart}${heading("FORMULÁRIO", "Informações importantes")}<div class="settings-list"><button type="button"><span><strong>Campo ou pergunta</strong><small>Descrição para preenchimento</small></span></button><button type="button"><span><strong>Outro campo</strong><small>Informação complementar</small></span></button></div></section>`,
    shortcuts: `${commonStart}${heading("ACESSO RÁPIDO", "Atalhos")}<div class="notice-grid"><button class="notice-card" type="button"><strong>Meu treino</strong><p>Abrir treino atual</p></button><button class="notice-card notice-card--quiet" type="button"><strong>Agenda</strong><p>Consultar horários</p></button></div></section>`,
  };
  return blocks[type] || `${commonStart}${heading("CONTEÚDO", blockCatalog[type]?.name || "Nova seção")}<article class="card"><h3>Título do conteúdo</h3><p>Edite este texto diretamente na prévia.</p></article></section>`;
}

function editableFrameNodes(surface) {
  return [...surface.querySelectorAll("h1,h2,h3,p,strong,small,time,.overline,.card-kicker,.daily-line")]
    .filter((node) => !node.children.length && node.textContent.trim() && !node.closest("[hidden], svg, style, script"));
}

function allFrameSections(surface) {
  const units = [];
  const add = (node) => { if (node && !units.includes(node)) units.push(node); };
  [...surface.children].forEach((child) => {
    if (child.matches(".dashboard-grid,.chart-grid,.coach-metrics,.coach-dashboard-grid,.schedule-list,.exercise-list,.profile-layout,.builder-layout")) {
      child.dataset.creativeSourceGroup = "true";
      [...child.children].filter((node) => node.matches("article,section,aside,.card,.schedule-item,.builder-workout")).forEach(add);
      return;
    }
    if (child.matches(".section-block") && child.querySelector(":scope > .metric-strip, :scope > .notice-grid")) {
      child.dataset.creativeSourceGroup = "true";
      add(child.querySelector(":scope > .section-title"));
      child.querySelectorAll(":scope > .metric-strip > article, :scope > .notice-grid > .notice-card").forEach(add);
      return;
    }
    if (child.matches(".student-table,.coach-calendar")) {
      child.dataset.creativeSourceGroup = "true";
      [...child.children].filter((node) => !node.matches(".student-table__head")).forEach(add);
      return;
    }
    if (child.matches(".page-intro,.wellness-hero,.section-block,.date-strip,.workout-summary,.search-field,.creative-added-section,.cobre-login-logo,.login-heading,.role-selector,.role-selection-summary,.cobre-access-status,.login-form,.login-separator,.button,.cobre-role-access,.card,article,.section-title,[data-creative-section-key]")) add(child);
  });
  units.forEach((unit) => {
    if (unit.parentElement === surface || unit.dataset.creativeAddedId) return;
    const parent = unit.parentElement;
    parent.dataset.creativeGroupKey ||= uid("group");
    unit.dataset.creativeOriginalParentKey ||= parent.dataset.creativeGroupKey;
    unit.dataset.creativeOriginalIndex ||= String([...parent.children].indexOf(unit));
  });
  return units;
}

function frameSections(surface) {
  return allFrameSections(surface).filter((section) => !section.hidden);
}

function persistFrameOrder(surface, screenId) {
  state.fidelity.orders[screenId] = frameSections(surface).map((section) => section.dataset.creativeSectionKey);
}

function flattenFrameSections(surface, sections) {
  sections.forEach((section) => {
    section.dataset.creativeDetached = "true";
    surface.append(section);
  });
  surface.querySelectorAll("[data-creative-source-group]").forEach((group) => {
    group.hidden = true;
    group.dataset.creativeEmptied = "true";
  });
}

function restoreOriginalFrameStructure(surface) {
  const units = [...surface.querySelectorAll("[data-creative-original-parent-key]")]
    .sort((a, b) => Number(a.dataset.creativeOriginalIndex) - Number(b.dataset.creativeOriginalIndex));
  units.forEach((unit) => {
    const parent = surface.querySelector(`[data-creative-group-key="${unit.dataset.creativeOriginalParentKey}"]`);
    if (parent) parent.append(unit);
    delete unit.dataset.creativeDetached;
  });
  surface.querySelectorAll("[data-creative-source-group]").forEach((group) => {
    group.hidden = false;
    delete group.dataset.creativeEmptied;
  });
}

function reorderFrameSections(surface, source, target, after = false) {
  const sections = frameSections(surface);
  const from = sections.indexOf(source);
  const targetIndex = sections.indexOf(target);
  if (from < 0 || targetIndex < 0 || source === target) return false;
  const reordered = sections.filter((section) => section !== source);
  let destination = reordered.indexOf(target) + (after ? 1 : 0);
  reordered.splice(destination, 0, source);
  const before = sections.map((section) => section.dataset.creativeSectionKey).join("|");
  const next = reordered.map((section) => section.dataset.creativeSectionKey).join("|");
  if (before === next) return false;
  flattenFrameSections(surface, reordered);
  return true;
}

function selectOriginalSection(section, textNode = null) {
  frameSelection?.element?.classList.remove("is-creative-selected");
  selectedFrameSection()?.classList.remove("is-creative-section-selected");
  frameSelection = {
    element: textNode || section,
    section,
    key: textNode?.dataset.creativeTextKey || null,
    screenId: activeScreen().id,
    originalText: textNode?.textContent || "",
    kind: textNode ? "text" : "section",
  };
  section.classList.add("is-creative-section-selected");
  if (textNode) textNode.classList.add("is-creative-selected");
  state.selectedBlockId = null;
  renderInspector();
}

function reselectOriginalSection(surface, sectionKey) {
  const refreshed = allFrameSections(surface).find((section) => section.dataset.creativeSectionKey === sectionKey);
  if (refreshed) selectOriginalSection(refreshed);
  else renderInspector();
}

function finishFramePlacement(surface, target) {
  if (!placementFrameSection) return false;
  if (placementFrameSection === target) {
    showToast("Esta seção já está nessa posição. Escolha outra seção como destino.");
    return false;
  }
  const moved = reorderFrameSections(surface, placementFrameSection, target, false);
  if (!moved) {
    showToast("A posição escolhida é igual à atual.");
    return false;
  }
  const movedKey = placementFrameSection.dataset.creativeSectionKey;
  persistFrameOrder(surface, activeScreen().id);
  if (placementFrameSnapshot) undoStack.push(placementFrameSnapshot);
  redoStack = [];
  placementFrameSection.classList.remove("is-creative-moving");
  placementFrameSection = null;
  placementFrameSnapshot = null;
  scheduleSave();
  renderHistoryControls();
  refreshOriginalEditing();
  reselectOriginalSection(surface, movedKey);
  showToast("Seção posicionada antes do destino escolhido.");
  return true;
}

function refreshOriginalEditing() {
  const screen = activeScreen();
  const frameWindow = elements.originalPreview.contentWindow;
  const bridge = frameWindow?.vpCreativePreview;
  const doc = elements.originalPreview.contentDocument;
  const surface = bridge?.getActiveSurface?.();
  if (!screen || !doc || !surface) return;

  let helperStyle = doc.querySelector("#vp-creative-helper-style");
  if (!helperStyle) {
    helperStyle = doc.createElement("style");
    helperStyle.id = "vp-creative-helper-style";
    helperStyle.textContent = `
      [data-creative-editable] { cursor: text; border-radius: 3px; }
      [data-creative-editable]:hover { outline: 1px dashed #a45f42; outline-offset: 3px; }
      [data-creative-editable]:focus, [data-creative-editable].is-creative-selected { outline: 2px solid #a45f42; outline-offset: 3px; }
      [data-creative-section-key] { position: relative; cursor: pointer; transition: outline-color 160ms ease, opacity 160ms ease; }
      [data-creative-section-key]:hover, [data-creative-section-key].is-creative-section-selected { outline: 2px solid #a45f42; outline-offset: 5px; }
      [data-creative-section-key].is-creative-dragging { opacity: .48; }
      [data-creative-section-key].is-creative-drop { outline: 2px dashed #a45f42; outline-offset: 5px; }
      [data-creative-section-key].is-creative-moving { outline: 3px solid #a45f42; outline-offset: 6px; }
      [data-creative-detached] { width: 100% !important; max-width: none !important; margin: 0 0 18px !important; }
      [data-creative-emptied] { display: none !important; }
      .creative-move-handle { position: absolute; z-index: 30; top: 8px; right: 8px; min-height: 32px; display: inline-flex; align-items: center; gap: 6px; padding: 0 10px; border: 1px solid rgb(255 255 255 / 45%); border-radius: 999px; color: #fff; background: #703d2b; box-shadow: 0 5px 16px rgb(0 0 0 / 24%); font: 700 11px/1 sans-serif; letter-spacing: .04em; cursor: grab; user-select: none; }
      .creative-move-handle:active { cursor: grabbing; }
    `;
    doc.head.append(helperStyle);
  }

  const additions = fidelityBucket("additions", screen.id);
  const hiddenSections = fidelityBucket("hidden", screen.id);
  surface.querySelectorAll("[data-creative-added-id]").forEach((node) => node.remove());
  restoreOriginalFrameStructure(surface);
  surface.querySelectorAll("[data-creative-source-group]").forEach((group) => {
    group.hidden = false;
    delete group.dataset.creativeEmptied;
  });
  allFrameSections(surface).forEach((section) => { section.hidden = false; });
  Object.values(additions).forEach((addition) => {
    if (surface.querySelector(`[data-creative-added-id="${addition.id}"]`)) return;
    const template = doc.createElement("template");
    template.innerHTML = addition.html || originalBlockMarkup(addition.type, addition.id);
    surface.append(template.content.firstElementChild);
  });

  const sections = allFrameSections(surface);
  sections.forEach((section, index) => {
    section.dataset.creativeSectionKey ||= section.dataset.creativeAddedId ? `added-${section.dataset.creativeAddedId}` : `section-${index}`;
    const isBaseSection = !section.dataset.creativeAddedId;
    section.hidden = isBaseSection && (screen.startBlank || Boolean(hiddenSections[section.dataset.creativeSectionKey]));
    section.draggable = false;
    let moveHandle = [...section.children].find((child) => child.classList?.contains("creative-move-handle"));
    if (!moveHandle) {
      moveHandle = doc.createElement("span");
      moveHandle.className = "creative-move-handle";
      moveHandle.textContent = "↕ Mover";
      moveHandle.title = "Arraste ou toque e escolha o destino";
      moveHandle.contentEditable = "false";
      section.append(moveHandle);
    }
    moveHandle.draggable = true;
    moveHandle.ondragstart = (event) => {
      event.stopPropagation();
      moveHandle.dataset.creativeDragging = "true";
      draggedFrameSection = section;
      frameDragSnapshot = historySnapshot();
      frameDragStartOrder = frameSections(surface).map((item) => item.dataset.creativeSectionKey);
      section.classList.add("is-creative-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", section.dataset.creativeSectionKey);
    };
    section.ondragover = (event) => {
      if (!draggedFrameSection || draggedFrameSection === section) return;
      event.preventDefault();
      section.classList.add("is-creative-drop");
    };
    section.ondragleave = () => section.classList.remove("is-creative-drop");
    section.ondrop = (event) => {
      if (!draggedFrameSection || draggedFrameSection === section) return;
      event.preventDefault();
      const after = event.clientY > section.getBoundingClientRect().top + section.getBoundingClientRect().height / 2;
      reorderFrameSections(surface, draggedFrameSection, section, after);
      section.classList.remove("is-creative-drop");
    };
    moveHandle.ondragend = () => {
      section.classList.remove("is-creative-dragging");
      frameSections(surface).forEach((item) => item.classList.remove("is-creative-drop"));
      const finalOrder = frameSections(surface).map((item) => item.dataset.creativeSectionKey);
      const changed = frameDragStartOrder && (finalOrder.length !== frameDragStartOrder.length || finalOrder.some((key, index) => key !== frameDragStartOrder[index]));
      if (changed && frameDragSnapshot) {
        state.fidelity.orders[screen.id] = finalOrder;
        undoStack.push(frameDragSnapshot);
        redoStack = [];
        scheduleSave();
        renderHistoryControls();
        showToast("Seção reorganizada");
      } else {
        showToast("Nenhuma mudança: solte a seção sobre outro bloco destacado.");
      }
      frameDragSnapshot = null;
      frameDragStartOrder = null;
      draggedFrameSection = null;
      moveHandle.dataset.creativeLastDrag = String(Date.now());
      delete moveHandle.dataset.creativeDragging;
    };
    moveHandle.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (moveHandle.dataset.creativeDragging || Date.now() - Number(moveHandle.dataset.creativeLastDrag || 0) < 350) return;
      if (placementFrameSection === section) {
        section.classList.remove("is-creative-moving");
        placementFrameSection = null;
        placementFrameSnapshot = null;
        showToast("Movimentação cancelada.");
        return;
      }
      placementFrameSection?.classList.remove("is-creative-moving");
      placementFrameSection = section;
      placementFrameSnapshot = historySnapshot();
      section.classList.add("is-creative-moving");
      selectOriginalSection(section);
      showToast("Agora toque na seção que deve ficar logo depois desta.");
    };
    section.onclick = (event) => {
      if (event.target.closest(".creative-move-handle,[data-creative-editable]")) return;
      event.preventDefault();
      event.stopPropagation();
      if (placementFrameSection) {
        finishFramePlacement(surface, section);
        return;
      }
      selectOriginalSection(section);
    };
  });

  if (!surface.dataset.creativeOriginalOrder) {
    surface.dataset.creativeOriginalOrder = JSON.stringify(
      sections.filter((section) => !section.dataset.creativeAddedId).map((section) => section.dataset.creativeSectionKey),
    );
  }

  const requestedOrder = fidelityBucket("orders", screen.id);
  if (requestedOrder.length) {
    const sectionMap = new Map(frameSections(surface).map((section) => [section.dataset.creativeSectionKey, section]));
    const orderedSections = [];
    requestedOrder.forEach((key) => {
      const section = sectionMap.get(key);
      if (section) orderedSections.push(section);
    });
    frameSections(surface)
      .filter((section) => !requestedOrder.includes(section.dataset.creativeSectionKey))
      .forEach((section) => orderedSections.push(section));
    flattenFrameSections(surface, orderedSections);
  }
  if (screen.startBlank) {
    surface.querySelectorAll("[data-creative-source-group]").forEach((group) => { group.hidden = true; });
  }

  const edits = fidelityBucket("edits", screen.id);
  editableFrameNodes(surface).forEach((node, index) => {
    const section = node.closest("[data-creative-section-key]");
    const sectionNodes = section ? editableFrameNodes(section) : [];
    const localIndex = section ? sectionNodes.indexOf(node) : index;
    const key = node.dataset.creativeTextKey || `${section?.dataset.creativeSectionKey || "surface"}-text-${localIndex}`;
    node.dataset.creativeTextKey = key;
    node.dataset.creativeOriginalText ||= node.textContent;
    const originals = fidelityBucket("originals", screen.id);
    if (!Object.hasOwn(originals, key)) originals[key] = node.dataset.creativeOriginalText;
    node.dataset.creativeEditable = "true";
    node.contentEditable = "true";
    node.spellcheck = true;
    const requestedText = Object.hasOwn(edits, key) ? edits[key] : node.dataset.creativeOriginalText;
    if (node.textContent !== requestedText) node.textContent = requestedText;
    node.onfocus = () => {
      frameSelection?.element?.classList.remove("is-creative-selected");
      frameSelection = { element: node, section: node.closest("[data-creative-section-key]"), key, screenId: screen.id, originalText: node.textContent, kind: "text" };
      frameEditSnapshot = historySnapshot();
      node.classList.add("is-creative-selected");
      frameSelection.section?.classList.add("is-creative-section-selected");
      state.selectedBlockId = null;
      renderInspector();
    };
    node.oninput = () => {
      edits[key] = node.textContent.trim();
      const inspectorText = elements.inspectorBody.querySelector("[data-fidelity-text]");
      if (inspectorText) inspectorText.value = node.textContent.trim();
      scheduleSave();
    };
    node.onblur = () => {
      const value = node.textContent.trim();
      edits[key] = value;
      if (frameEditSnapshot && value !== frameSelection?.originalText) {
        undoStack.push(frameEditSnapshot);
        redoStack = [];
        renderHistoryControls();
        showToast("Texto atualizado");
      }
      frameEditSnapshot = null;
      scheduleSave();
    };
  });

  if (!surface.dataset.creativeSurfaceBound) {
    surface.dataset.creativeSurfaceBound = "true";
    surface.addEventListener("click", (event) => {
      if (event.target.closest("a, button") && !event.target.closest("[data-creative-editable]")) {
        event.preventDefault();
        if (!event.target.closest("[data-creative-section-key]")) event.stopPropagation();
      }
    }, true);
  }
}

function syncOriginalPreview() {
  const screen = activeScreen();
  const bridge = elements.originalPreview.contentWindow?.vpCreativePreview;
  if (!screen || !frameReady || !bridge) return;
  frameSelection = null;
  const roleScreens = state.screens.filter((item) => item.role === screen.role && item.showInNav && item.navigationPlacement !== "hidden");
  const baseScreens = roleScreens.filter((item) => item.id === item.sourceScreenId);
  const navigationItems = baseScreens.map((base) => {
    const replacements = roleScreens.filter((item) => item.id !== item.sourceScreenId && item.navigationPlacement === "existing" && item.sourceScreenId === base.id);
    const target = replacements.find((item) => item.id === screen.id) || (screen.id === base.id ? base : replacements[0]) || base;
    return {
      id: target.id,
      label: target.navLabel,
      icon: screenDefaultIcons[base.id] || "more",
    };
  });
  roleScreens.filter((item) => item.navigationPlacement === "new").forEach((item) => {
    navigationItems.push({ id: item.id, label: item.navLabel, icon: item.navIcon || "more" });
  });
  bridge.showScreen({
    screenId: screen.id,
    sourceScreenId: screen.sourceScreenId || screen.id,
    screenName: screen.name,
    navigation: {
      items: navigationItems,
      activeScreenId: screen.id,
      mode: state.navigationModes?.[screen.role] || "responsive",
    },
  });
  refreshOriginalEditing();
  window.requestAnimationFrame(refreshOriginalEditing);
}

function fittedZoom(device) {
  const sizes = {
    mobile: [390, 844],
    tablet: [768, 1024],
    desktop: [1366, 820],
  };
  const [width, height] = sizes[device] || sizes.mobile;
  const availableWidth = Math.max(240, elements.canvasStage.clientWidth - 80);
  const availableHeight = Math.max(320, elements.canvasStage.clientHeight - 72);
  const scale = Math.min(.9, availableWidth / width, availableHeight / height);
  return Math.max(40, Math.min(90, Math.floor((scale * 100) / 5) * 5));
}

function renderCanvas() {
  const screen = activeScreen();
  if (!screen) return;
  elements.currentRole.textContent = roleNames[screen.role].toUpperCase();
  elements.currentName.textContent = screen.name;
  elements.previewProfile.textContent = roleHeadings[screen.role];
  elements.previewTitle.textContent = screen.name;
  elements.previewContent.innerHTML = screen.blocks.map(renderBlock).join("") || `
    <button class="inspector-empty" type="button" data-empty-add>
      <i>+</i><strong>Tela vazia</strong><p>Adicione o primeiro conteúdo para começar a composição.</p>
    </button>`;

  elements.canvasStage.dataset.device = state.viewport;
  if (!state.zoomManual) state.zoom = fittedZoom(state.viewport);
  elements.zoom.value = state.zoom;
  elements.zoomOutput.value = `${state.zoom}%`;
  elements.deviceShell.style.setProperty("--preview-scale", String(state.zoom / 100));
  document.querySelectorAll("[data-device]").forEach((button) => {
    const active = button.dataset.device === state.viewport;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  syncOriginalPreview();

  if (screen.role === "shared") {
    elements.previewNavigation.hidden = true;
    elements.previewNavigation.innerHTML = "";
    return;
  }

  const navigation = state.screens.filter((item) => item.role === screen.role && item.showInNav).slice(0, 5);
  elements.previewNavigation.hidden = false;
  elements.previewNavigation.innerHTML = navigation.map((item) => `
    <button class="${item.id === screen.id ? "is-active" : ""}" type="button" data-screen-nav="${escapeHTML(item.id)}">${escapeHTML(item.navLabel)}</button>
  `).join("");
}

function blockField(label, field, value, type = "input") {
  if (type === "textarea") return `<label class="editor-field"><span>${label}</span><textarea data-block-field="${field}">${escapeHTML(value || "")}</textarea></label>`;
  return `<label class="editor-field"><span>${label}</span><input data-block-field="${field}" value="${escapeHTML(value || "")}" /></label>`;
}

function renderFidelityInspector() {
  if (!frameSelection || frameSelection.screenId !== activeScreen().id) {
    elements.inspectorBody.innerHTML = `
      <div class="inspector-empty"><i>↖</i><strong>Selecione uma seção</strong><p>Toque em qualquer área de um bloco. Para editar apenas o texto, toque diretamente sobre ele.</p></div>`;
    return;
  }

  const section = selectedFrameSection();
  const surface = elements.originalPreview.contentWindow?.vpCreativePreview?.getActiveSurface?.();
  const sections = surface ? frameSections(surface) : [];
  const sectionIndex = sections.indexOf(section);
  const sectionName = section ? originalSectionLabel(section) : "Seção";
  const sectionActions = section ? `
    <section class="inspector-section">
      <div class="inspector-section__heading"><h3>Organização da seção</h3><span>${sectionIndex + 1} de ${sections.length}</span></div>
      <p class="inspector-note"><strong>${escapeHTML(sectionName)}</strong><br />Use uma posição exata ou as setas. Os comandos funcionam no primeiro toque.</p>
      <div class="inspector-actions">
        <button type="button" data-fidelity-action="first" ${sectionIndex <= 0 ? "disabled" : ""}>Ir para o início</button>
        <button type="button" data-fidelity-action="up" ${sectionIndex <= 0 ? "disabled" : ""}>↑ Uma posição</button>
        <button type="button" data-fidelity-action="down" ${sectionIndex < 0 || sectionIndex >= sections.length - 1 ? "disabled" : ""}>↓ Uma posição</button>
        <button type="button" data-fidelity-action="last" ${sectionIndex < 0 || sectionIndex >= sections.length - 1 ? "disabled" : ""}>Ir para o final</button>
        <button type="button" data-fidelity-action="duplicate">Duplicar seção</button>
        <button class="danger-action" type="button" data-fidelity-action="remove">Remover seção</button>
      </div>
      <label class="editor-field"><span>Posicionar antes de</span><select data-fidelity-position><option value="">Escolha uma seção</option>${sections.filter((item) => item !== section).map((item) => `<option value="${escapeHTML(item.dataset.creativeSectionKey)}">${escapeHTML(originalSectionLabel(item))}</option>`).join("")}</select></label>
      <label class="editor-field"><span>Mover esta seção para outra tela</span><select data-fidelity-move-screen><option value="">Escolha a tela</option>${state.screens.filter((screen) => screen.id !== activeScreen().id).map((screen) => `<option value="${escapeHTML(screen.id)}">${escapeHTML(screen.name)} · ${escapeHTML(roleNames[screen.role])}</option>`).join("")}</select></label>
    </section>` : "";
  if (state.inspectorTab === "style") {
    elements.inspectorBody.innerHTML = `
      <section class="inspector-section">
        <div class="inspector-section__heading"><h3>Seção selecionada</h3><span>${escapeHTML(frameSelection.element.tagName.toLowerCase())}</span></div>
        <p class="inspector-note">A identidade visual permanece vinculada ao aplicativo original. Nesta etapa, altere a hierarquia movendo a seção completa.</p>
      </section>
      ${sectionActions}`;
    return;
  }

  const textEditor = frameSelection.kind === "text" ? `
    <section class="inspector-section">
      <div class="inspector-section__heading"><h3>Texto selecionado</h3><span>Aplicativo original</span></div>
      <label class="editor-field"><span>Conteúdo</span><textarea data-fidelity-text>${escapeHTML(frameSelection.element.textContent.trim())}</textarea></label>
      <p class="inspector-note">Você também pode escrever diretamente dentro da prévia.</p>
      <button class="screen-action" type="button" data-fidelity-action="save-text">Aplicar texto</button>
    </section>` : `<section class="inspector-section"><div class="inspector-section__heading"><h3>Seção selecionada</h3><span>Aplicativo original</span></div><p class="inspector-note">A seção inteira está selecionada. Toque em uma frase dentro dela quando quiser alterar somente o texto.</p></section>`;
  elements.inspectorBody.innerHTML = `${textEditor}${sectionActions}`;
}

function renderInspector() {
  document.querySelectorAll("[data-inspector-tab]").forEach((button) => {
    const active = button.dataset.inspectorTab === state.inspectorTab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  if (state.inspectorTab === "screen") {
    renderScreenInspector();
    return;
  }

  if (elements.originalPreview && frameReady) {
    renderFidelityInspector();
    return;
  }

  const block = selectedBlock();
  if (!block) {
    elements.inspectorBody.innerHTML = `
      <div class="inspector-empty"><i>↖</i><strong>Selecione um conteúdo</strong><p>Toque em qualquer bloco da prévia para editar seus textos e aparência.</p></div>`;
    return;
  }

  if (state.inspectorTab === "style") {
    elements.inspectorBody.innerHTML = `
      <section class="inspector-section">
        <div class="inspector-section__heading"><h3>Largura</h3><span>${blockCatalog[block.type]?.name || "Bloco"}</span></div>
        <div class="segmented-options">
          <button class="${block.width === "full" ? "is-active" : ""}" type="button" data-set-option="width" data-value="full">Inteira</button>
          <button class="${block.width === "half" ? "is-active" : ""}" type="button" data-set-option="width" data-value="half">Metade</button>
        </div>
      </section>
      <section class="inspector-section">
        <h3>Superfície</h3>
        <div class="segmented-options">
          <button class="${block.tone === "plain" ? "is-active" : ""}" type="button" data-set-option="tone" data-value="plain">Clara</button>
          <button class="${block.tone === "soft" ? "is-active" : ""}" type="button" data-set-option="tone" data-value="soft">Suave</button>
          <button class="${block.tone === "copper" ? "is-active" : ""}" type="button" data-set-option="tone" data-value="copper">Cobre</button>
          <button class="${block.tone === "graphite" ? "is-active" : ""}" type="button" data-set-option="tone" data-value="graphite">Grafite</button>
        </div>
      </section>
      <section class="inspector-section">
        <h3>Espaçamento</h3>
        <div class="segmented-options">
          <button class="${block.density === "compact" ? "is-active" : ""}" type="button" data-set-option="density" data-value="compact">Compacto</button>
          <button class="${block.density === "normal" ? "is-active" : ""}" type="button" data-set-option="density" data-value="normal">Normal</button>
          <button class="${block.density === "spacious" ? "is-active" : ""}" type="button" data-set-option="density" data-value="spacious">Amplo</button>
        </div>
      </section>
      <section class="inspector-section">
        <h3>Alinhamento</h3>
        <div class="segmented-options">
          <button class="${block.align === "left" ? "is-active" : ""}" type="button" data-set-option="align" data-value="left">Esquerda</button>
          <button class="${block.align === "center" ? "is-active" : ""}" type="button" data-set-option="align" data-value="center">Centro</button>
          <button class="${block.align === "right" ? "is-active" : ""}" type="button" data-set-option="align" data-value="right">Direita</button>
        </div>
      </section>
      ${block.type === "spacer" ? `<section class="inspector-section">${blockField("Altura em pixels", "spacer", block.spacer)}</section>` : ""}
      <section class="inspector-section">
        <div class="inspector-actions">
          <button type="button" data-inspector-action="duplicate">Duplicar</button>
          <button class="danger-action" type="button" data-inspector-action="delete">Excluir</button>
        </div>
      </section>`;
    return;
  }

  const supportsItems = ["metrics", "schedule", "list", "form", "shortcuts"].includes(block.type);
  const supportsValues = block.type === "chart";
  elements.inspectorBody.innerHTML = `
    <section class="inspector-section">
      <div class="inspector-section__heading"><h3>${blockCatalog[block.type]?.name || "Conteúdo"}</h3><span>Edição livre</span></div>
      ${!["divider", "spacer"].includes(block.type) ? blockField("Identificador", "kicker", block.kicker) : ""}
      ${!["divider", "spacer", "button"].includes(block.type) ? blockField("Título", "title", block.title) : ""}
      ${!["divider", "spacer", "button"].includes(block.type) ? blockField("Texto de apoio", "text", block.text, "textarea") : ""}
      ${block.action !== undefined ? blockField("Texto do botão", "action", block.action) : ""}
      ${block.type === "image" ? blockField("Endereço da imagem", "imageUrl", block.imageUrl) : ""}
    </section>
    ${supportsItems ? `
      <section class="inspector-section">
        <h3>Itens</h3>
        <label class="editor-field"><span>Um item por linha, separando colunas com |</span><textarea data-complex-field="items">${escapeHTML((block.items || []).join("\n"))}</textarea></label>
      </section>` : ""}
    ${supportsValues ? `
      <section class="inspector-section">
        <h3>Valores do gráfico</h3>
        <label class="editor-field"><span>Números de 0 a 100 separados por vírgula</span><input data-complex-field="values" value="${escapeHTML((block.values || []).join(", "))}" /></label>
      </section>` : ""}
    ${block.action !== undefined ? `
      <section class="inspector-section">
        <label class="editor-field"><span>Destino do botão</span><select data-block-field="target"><option value="">Sem destino</option>${state.screens.map((screen) => `<option value="${escapeHTML(screen.id)}" ${block.target === screen.id ? "selected" : ""}>${escapeHTML(screen.name)}</option>`).join("")}</select></label>
      </section>` : ""}
    <section class="inspector-section">
      <label class="editor-field"><span>Mover este bloco para outra tela</span><select data-move-block><option value="">Escolha a tela</option>${state.screens.filter((screen) => screen.id !== activeScreen().id).map((screen) => `<option value="${escapeHTML(screen.id)}">${escapeHTML(screen.name)} · ${escapeHTML(roleNames[screen.role])}</option>`).join("")}</select></label>
      <div class="inspector-actions">
        <button type="button" data-inspector-action="duplicate">Duplicar</button>
        <button class="danger-action" type="button" data-inspector-action="delete">Excluir</button>
      </div>
    </section>`;
}

function renderScreenInspector() {
  const screen = activeScreen();
  const additions = Object.keys(state.fidelity?.additions?.[screen.id] || {}).length;
  const removed = Object.keys(state.fidelity?.hidden?.[screen.id] || {}).length;
  const activeSurface = elements.originalPreview.contentWindow?.vpCreativePreview?.getActiveSurface?.();
  const sectionCount = activeSurface && frameReady
    ? frameSections(activeSurface).length
    : Math.max(0, (screen.startBlank ? 0 : screen.blocks.length) + additions - removed);
  const sourceOptions = state.screens.filter((item) => item.role === screen.role && item.id === item.sourceScreenId);
  const navigationMode = state.navigationModes?.[screen.role] || "responsive";
  elements.inspectorBody.innerHTML = `
    <section class="inspector-section">
      <div class="inspector-section__heading"><h3>Identificação</h3><span>${sectionCount} seções editáveis</span></div>
      <label class="editor-field"><span>Nome da tela</span><input data-screen-field="name" value="${escapeHTML(screen.name)}" /></label>
      <label class="editor-field"><span>Nome curto na navegação</span><input data-screen-field="navLabel" value="${escapeHTML(screen.navLabel)}" /></label>
      <label class="editor-field"><span>Perfil</span><select data-screen-field="role"><option value="student" ${screen.role === "student" ? "selected" : ""}>Aluno</option><option value="coach" ${screen.role === "coach" ? "selected" : ""}>Professor</option><option value="shared" ${screen.role === "shared" ? "selected" : ""}>Compartilhada</option></select></label>
    </section>
    <section class="inspector-section">
      <div class="inspector-section__heading"><h3>Navegação</h3><span>${escapeHTML(roleNames[screen.role])}</span></div>
      <p class="inspector-note">Defina se esta tela abre por um ícone que já existe, recebe um novo ícone ou funciona como etapa interna.</p>
      <label class="editor-field"><span>Como acessar esta tela</span><select data-screen-field="navigationPlacement"><option value="existing" ${screen.navigationPlacement === "existing" ? "selected" : ""}>Usar ícone existente</option><option value="new" ${screen.navigationPlacement === "new" ? "selected" : ""}>Criar novo ícone</option><option value="hidden" ${screen.navigationPlacement === "hidden" ? "selected" : ""}>Sem ícone, acesso interno</option></select></label>
      <label class="editor-field"><span>Tela e ícone usados como referência</span><select data-screen-field="sourceScreenId">${sourceOptions.map((item) => `<option value="${escapeHTML(item.id)}" ${screen.sourceScreenId === item.id ? "selected" : ""}>${escapeHTML(item.name)}</option>`).join("")}</select></label>
      <label class="editor-field"><span>Ícone quando for um item novo</span><select data-screen-field="navIcon"><option value="more" ${screen.navIcon === "more" ? "selected" : ""}>Mais opções</option><option value="home" ${screen.navIcon === "home" ? "selected" : ""}>Início</option><option value="calendar" ${screen.navIcon === "calendar" ? "selected" : ""}>Agenda</option><option value="workout" ${screen.navIcon === "workout" ? "selected" : ""}>Treino</option><option value="chart" ${screen.navIcon === "chart" ? "selected" : ""}>Evolução</option><option value="user" ${screen.navIcon === "user" ? "selected" : ""}>Perfil</option><option value="users" ${screen.navIcon === "users" ? "selected" : ""}>Alunos</option></select></label>
      <label class="editor-field"><span>Formato da navegação deste perfil</span><select data-role-navigation-mode><option value="responsive" ${navigationMode === "responsive" ? "selected" : ""}>Inferior no celular e lateral no desktop</option><option value="bottom" ${navigationMode === "bottom" ? "selected" : ""}>Sempre inferior</option><option value="sidebar" ${navigationMode === "sidebar" ? "selected" : ""}>Sempre lateral</option></select></label>
    </section>
    <section class="inspector-section">
      <h3>Organização da tela</h3>
      <div class="screen-settings-actions">
        <button class="screen-action" type="button" data-screen-action="duplicate">Duplicar esta tela</button>
        <button class="screen-action" type="button" data-screen-action="clear">Começar com tela vazia</button>
        <button class="screen-action" type="button" data-screen-action="restore">Restaurar conteúdo original</button>
        <button class="screen-action danger-action" type="button" data-screen-action="delete">Excluir esta tela</button>
      </div>
    </section>`;
}

function renderBlockLibrary() {
  elements.blockLibrary.innerHTML = Object.entries(blockCatalog).map(([type, definition]) => `
    <button type="button" data-add-block="${type}">
      <i>${escapeHTML(definition.marker)}</i>
      <strong>${escapeHTML(definition.name)}</strong>
      <small>${escapeHTML(definition.description)}</small>
      <span class="block-library__origin">${originalComponentSelectors[type] ? "COMPONENTE DO APP" : "RECURSO DE EDIÇÃO"}</span>
    </button>`).join("");
}

function renderVersions() {
  elements.versionCount.textContent = state.versions.length;
  elements.versionList.innerHTML = state.versions.length ? state.versions.map((version) => `
    <article class="version-item">
      <div><strong>${escapeHTML(version.label)}</strong><small>${escapeHTML(version.createdAt)}</small></div>
      <button type="button" data-version-action="restore" data-version-id="${escapeHTML(version.id)}">Restaurar</button>
      <button type="button" data-version-action="delete" data-version-id="${escapeHTML(version.id)}">Excluir</button>
    </article>`).join("") : '<div class="version-empty">Nenhuma versão registrada ainda.</div>';
}

function selectScreen(screenId) {
  if (!state.screens.some((screen) => screen.id === screenId)) return;
  state.activeScreenId = screenId;
  state.selectedBlockId = null;
  scheduleSave();
  renderAll();
}

function selectBlock(blockId) {
  if (!activeScreen().blocks.some((block) => block.id === blockId)) return;
  state.selectedBlockId = blockId;
  if (window.matchMedia("(max-width: 900px)").matches) activateMobilePanel("inspector-panel");
  scheduleSave();
  renderAll();
}

function moveBlock(blockId, delta) {
  const screen = activeScreen();
  const index = screen.blocks.findIndex((block) => block.id === blockId);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= screen.blocks.length) return;
  commit(() => {
    const [block] = screen.blocks.splice(index, 1);
    screen.blocks.splice(target, 0, block);
  }, delta < 0 ? "Conteúdo movido para cima" : "Conteúdo movido para baixo");
}

function duplicateBlock(blockId) {
  const screen = activeScreen();
  const index = screen.blocks.findIndex((block) => block.id === blockId);
  if (index < 0) return;
  commit(() => {
    const copy = clone(screen.blocks[index]);
    copy.id = uid("block");
    screen.blocks.splice(index + 1, 0, copy);
    state.selectedBlockId = copy.id;
  }, "Conteúdo duplicado");
}

function deleteBlock(blockId) {
  const screen = activeScreen();
  const index = screen.blocks.findIndex((block) => block.id === blockId);
  if (index < 0) return;
  commit(() => {
    screen.blocks.splice(index, 1);
    state.selectedBlockId = screen.blocks[Math.min(index, screen.blocks.length - 1)]?.id || null;
  }, "Conteúdo removido");
}

function makeOriginalAddition(type) {
  const id = uid("original");
  const sourceSelector = originalComponentSelectors[type];
  const source = sourceSelector ? elements.originalPreview.contentDocument?.querySelector(sourceSelector) : null;
  return {
    id,
    type,
    exactSource: Boolean(source),
    html: source ? serialiseOriginalSection(source, id) : originalBlockMarkup(type, id),
  };
}

function addOriginalBlock(type) {
  if (!blockCatalog[type]) return;
  const screen = activeScreen();
  const addition = makeOriginalAddition(type);
  const snapshot = historySnapshot();
  fidelityBucket("additions", screen.id)[addition.id] = addition;
  undoStack.push(snapshot);
  redoStack = [];
  scheduleSave();
  renderHistoryControls();
  refreshOriginalEditing();
  renderScreenList();
  elements.blockDialog.close();
  showToast(addition.exactSource ? `${blockCatalog[type].name} copiado do aplicativo real` : `${blockCatalog[type].name} adicionado como recurso de organização`);
}

function addBlock(type) {
  if (!blockCatalog[type]) return;
  if (elements.originalPreview && frameReady) {
    addOriginalBlock(type);
    return;
  }
  commit(() => {
    const block = makeBlock(type);
    activeScreen().blocks.push(block);
    state.selectedBlockId = block.id;
  }, `${blockCatalog[type].name} adicionado`);
  elements.blockDialog.close();
}

function duplicateScreen() {
  const screen = activeScreen();
  commit(() => {
    const copy = clone(screen);
    copy.id = uid("screen");
    copy.sourceScreenId = screen.sourceScreenId || screen.id;
    copy.name = `${screen.name} · cópia`;
    copy.navLabel = screen.navLabel;
    copy.blocks.forEach((block) => { block.id = uid("block"); });
    ["edits", "originals", "additions", "orders", "hidden"].forEach((bucket) => {
      state.fidelity[bucket][copy.id] = clone(state.fidelity?.[bucket]?.[screen.id] || (bucket === "orders" ? [] : {}));
    });
    const index = state.screens.indexOf(screen);
    state.screens.splice(index + 1, 0, copy);
    state.activeScreenId = copy.id;
    state.selectedBlockId = null;
  }, "Tela duplicada");
}

function deleteScreen() {
  if (state.screens.length <= 1) {
    showToast("O projeto precisa manter pelo menos uma tela.");
    return;
  }
  const screen = activeScreen();
  if (!window.confirm(`Excluir a tela “${screen.name}”?`)) return;
  commit(() => {
    const index = state.screens.indexOf(screen);
    state.screens.splice(index, 1);
    ["edits", "originals", "additions", "orders", "hidden"].forEach((bucket) => {
      delete state.fidelity?.[bucket]?.[screen.id];
    });
    state.activeScreenId = state.screens[Math.max(0, index - 1)].id;
    state.selectedBlockId = null;
  }, "Tela excluída");
}

function createScreenFromForm(form) {
  const data = new FormData(form);
  const name = String(data.get("name") || "Nova tela").trim();
  const role = String(data.get("role") || "student");
  const template = String(data.get("template") || "blank");
  const navigationPlacement = String(data.get("navigationPlacement") || "new");
  const navIcon = String(data.get("navIcon") || "more");
  commit(() => {
    const sourceScreenId = role === "coach" ? "coach-home" : role === "shared" ? "shared-login" : "student-home";
    const screen = makeScreen(uid("screen"), name, role, [], {
      sourceScreenId,
      startBlank: true,
      navigationPlacement,
      navIcon,
      showInNav: navigationPlacement !== "hidden" && role !== "shared",
    });
    state.screens.push(screen);
    const templateTypes = {
      blank: [],
      dashboard: ["hero", "metrics", "chart"],
      list: ["hero", "list"],
      form: ["hero", "form", "button"],
    };
    const additions = fidelityBucket("additions", screen.id);
    (templateTypes[template] || []).forEach((type) => {
      const addition = makeOriginalAddition(type);
      additions[addition.id] = addition;
    });
    state.activeScreenId = screen.id;
    state.selectedBlockId = null;
  }, "Nova tela criada");
  form.reset();
  elements.screenDialog.close();
}

function activateMobilePanel(panelId) {
  document.querySelectorAll(".creative-workspace > *").forEach((panel) => panel.classList.toggle("is-mobile-active", panel.id === panelId));
  document.querySelectorAll("[data-mobile-panel]").forEach((button) => button.classList.toggle("is-active", button.dataset.mobilePanel === panelId));
  if (panelId === "canvas-panel" && !state.zoomManual) {
    window.requestAnimationFrame(() => {
      state.zoom = fittedZoom(state.viewport);
      elements.zoom.value = state.zoom;
      elements.zoomOutput.value = `${state.zoom}%`;
      elements.deviceShell.style.setProperty("--preview-scale", String(state.zoom / 100));
    });
  }
}

function openPresentation() {
  elements.presentationMount.innerHTML = elements.deviceShell.outerHTML;
  elements.presentationMount.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
  elements.presentation.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePresentation() {
  elements.presentation.hidden = true;
  elements.presentationMount.innerHTML = "";
  document.body.style.overflow = "";
}

function selectedFrameSection() {
  return frameSelection?.section || frameSelection?.element?.closest?.("[data-creative-section-key]") || null;
}

function originalSectionLabel(section) {
  const preferred = section.querySelector("h1,h2,h3,.overline,.card-kicker,strong");
  return (preferred?.textContent || section.textContent || "Seção sem título").trim().replace(/\s+/g, " ").slice(0, 80);
}

function serialiseOriginalSection(section, id) {
  const copy = section.cloneNode(true);
  copy.hidden = false;
  const editorAttributes = ["id", "contenteditable", "spellcheck", "draggable", "hidden", "data-creative-section-key", "data-creative-text-key", "data-creative-original-text", "data-creative-editable", "data-creative-original-parent-key", "data-creative-original-index", "data-creative-detached", "data-creative-source-group", "data-creative-group-key", "data-creative-emptied"];
  editorAttributes.forEach((attribute) => copy.removeAttribute(attribute));
  copy.setAttribute("data-creative-added-id", id);
  copy.classList.add("creative-added-section");
  copy.classList.remove("is-creative-selected", "is-creative-dragging", "is-creative-drop");
  copy.querySelectorAll(".creative-move-handle").forEach((node) => node.remove());
  copy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  copy.querySelectorAll(editorAttributes.map((attribute) => `[${attribute}]`).join(",")).forEach((node) => {
    editorAttributes.forEach((attribute) => node.removeAttribute(attribute));
    node.classList.remove("is-creative-selected", "is-creative-dragging", "is-creative-drop");
  });
  return copy.outerHTML;
}

function removeOriginalSectionFromScreen(section, screen) {
  const additionId = section.dataset.creativeAddedId;
  const key = section.dataset.creativeSectionKey;
  if (additionId) delete fidelityBucket("additions", screen.id)[additionId];
  else fidelityBucket("hidden", screen.id)[key] = originalSectionLabel(section);
  state.fidelity.orders[screen.id] = fidelityBucket("orders", screen.id).filter((item) => item !== key);
}

function duplicateSelectedOriginalSection() {
  const section = selectedFrameSection();
  const screen = activeScreen();
  if (!section || !screen) return;
  const snapshot = historySnapshot();
  const id = uid("original");
  fidelityBucket("additions", screen.id)[id] = { id, type: "custom", html: serialiseOriginalSection(section, id), label: originalSectionLabel(section), duplicatedFrom: screen.id };
  undoStack.push(snapshot);
  redoStack = [];
  frameSelection = null;
  scheduleSave();
  renderAll();
  showToast("Seção duplicada");
}

function removeSelectedOriginalSection() {
  const section = selectedFrameSection();
  const screen = activeScreen();
  if (!section || !screen) return;
  const snapshot = historySnapshot();
  removeOriginalSectionFromScreen(section, screen);
  undoStack.push(snapshot);
  redoStack = [];
  frameSelection = null;
  scheduleSave();
  renderAll();
  showToast("Seção removida");
}

function moveSelectedOriginalSectionTo(destinationId) {
  const section = selectedFrameSection();
  const origin = activeScreen();
  const destination = state.screens.find((screen) => screen.id === destinationId);
  if (!section || !origin || !destination || destination.id === origin.id) return;
  const snapshot = historySnapshot();
  const id = uid("original");
  fidelityBucket("additions", destination.id)[id] = {
    id,
    type: "custom",
    html: serialiseOriginalSection(section, id),
    label: originalSectionLabel(section),
    movedFrom: { screenId: origin.id, screenName: origin.name },
  };
  removeOriginalSectionFromScreen(section, origin);
  state.activeScreenId = destination.id;
  state.selectedBlockId = null;
  frameSelection = null;
  undoStack.push(snapshot);
  redoStack = [];
  scheduleSave();
  renderAll();
  showToast(`Seção movida para ${destination.name}`);
}

function moveSelectedOriginalSection(delta) {
  const section = selectedFrameSection();
  const surface = elements.originalPreview.contentWindow?.vpCreativePreview?.getActiveSurface?.();
  if (!section || !surface) return;
  const sections = frameSections(surface);
  const index = sections.indexOf(section);
  const target = sections[index + delta];
  if (!target) {
    showToast(delta < 0 ? "Esta seção já está no início." : "Esta seção já está no final.");
    return;
  }
  const snapshot = historySnapshot();
  const sectionKey = section.dataset.creativeSectionKey;
  const moved = reorderFrameSections(surface, section, target, delta > 0);
  if (!moved) {
    showToast("A seção permaneceu na posição atual.");
    return;
  }
  persistFrameOrder(surface, activeScreen().id);
  undoStack.push(snapshot);
  redoStack = [];
  scheduleSave();
  renderHistoryControls();
  refreshOriginalEditing();
  reselectOriginalSection(surface, sectionKey);
  showToast(delta < 0 ? "Seção movida para cima" : "Seção movida para baixo");
}

function moveSelectedOriginalSectionToPosition(position) {
  const section = selectedFrameSection();
  const surface = elements.originalPreview.contentWindow?.vpCreativePreview?.getActiveSurface?.();
  if (!section || !surface) return;
  const sections = frameSections(surface);
  const currentIndex = sections.indexOf(section);
  let reordered = sections.filter((item) => item !== section);
  if (position === "first") reordered.unshift(section);
  else if (position === "last") reordered.push(section);
  else {
    const targetIndex = reordered.findIndex((item) => item.dataset.creativeSectionKey === position);
    if (targetIndex < 0) {
      showToast("Não foi possível localizar a posição escolhida.");
      return;
    }
    reordered.splice(targetIndex, 0, section);
  }
  const nextIndex = reordered.indexOf(section);
  if (currentIndex === nextIndex) {
    showToast("Esta seção já está na posição escolhida.");
    return;
  }
  const snapshot = historySnapshot();
  const sectionKey = section.dataset.creativeSectionKey;
  flattenFrameSections(surface, reordered);
  persistFrameOrder(surface, activeScreen().id);
  undoStack.push(snapshot);
  redoStack = [];
  scheduleSave();
  renderHistoryControls();
  refreshOriginalEditing();
  reselectOriginalSection(surface, sectionKey);
  showToast(position === "first" ? "Seção movida para o início" : position === "last" ? "Seção movida para o final" : "Seção posicionada no local escolhido");
}

function saveSelectedOriginalText() {
  const input = elements.inspectorBody.querySelector("[data-fidelity-text]");
  if (!input || !frameSelection?.element?.isConnected) return;
  const changed = input.value !== frameSelection.originalText;
  if (!changed) return;
  const snapshot = frameEditSnapshot || historySnapshot();
  frameSelection.element.textContent = input.value;
  fidelityBucket("edits", frameSelection.screenId)[frameSelection.key] = input.value;
  undoStack.push(snapshot);
  redoStack = [];
  frameSelection.originalText = input.value;
  frameEditSnapshot = null;
  scheduleSave();
  renderHistoryControls();
  showToast("Texto aplicado");
}

function saveVersion(label) {
  state.versions.unshift({
    id: uid("version"),
    label,
    createdAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    snapshot: historySnapshot(),
  });
  scheduleSave();
  renderVersions();
  showToast("Versão registrada para a reunião");
}

function exportProject() {
  const payload = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vp-studio-criativo-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Projeto exportado");
}

function downloadText(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function generateChangeReport() {
  const lines = [
    `# ${state.projectName} - resumo das mudanças`,
    "",
    `Gerado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}.`,
    "",
    "Este documento registra o que foi decidido no espelho criativo para orientar a implementação posterior no aplicativo original.",
    "",
  ];
  state.screens.forEach((screen) => {
    const edits = state.fidelity?.edits?.[screen.id] || {};
    const originals = state.fidelity?.originals?.[screen.id] || {};
    const additions = Object.values(state.fidelity?.additions?.[screen.id] || {});
    const hidden = Object.entries(state.fidelity?.hidden?.[screen.id] || {});
    const order = state.fidelity?.orders?.[screen.id] || [];
    const changedEdits = Object.entries(edits).filter(([key, value]) => originals[key] !== undefined && originals[key] !== value);
    const created = screen.id !== screen.sourceScreenId;
    const configChanged = !created && screen.baseline && (
      screen.name !== screen.baseline.name
      || screen.navLabel !== screen.baseline.navLabel
      || screen.role !== screen.baseline.role
      || screen.showInNav !== screen.baseline.showInNav
    );
    lines.push(`## ${screen.name}`, "");
    lines.push(`- Tipo: ${created ? "tela criada no modo criativo" : "tela existente"}`);
    lines.push(`- Perfil: ${roleNames[screen.role]}`);
    lines.push(`- Navegação: ${screen.showInNav ? `visível como "${screen.navLabel}"` : "oculta"}`);
    lines.push(`- Tipo de acesso: ${navigationPlacementNames[screen.navigationPlacement] || "Sem atalho"}`);
    lines.push(`- Formato da navegação: ${state.navigationModes?.[screen.role] === "bottom" ? "sempre inferior" : state.navigationModes?.[screen.role] === "sidebar" ? "sempre lateral" : "inferior no celular e lateral no desktop"}`);
    if (screen.navigationPlacement === "new") lines.push(`- Ícone escolhido: ${screen.navIcon}`);
    if (!created && screen.baseline) {
      if (screen.name !== screen.baseline.name) lines.push(`- Nome da tela alterado: "${screen.baseline.name}" -> "${screen.name}"`);
      if (screen.navLabel !== screen.baseline.navLabel) lines.push(`- Rótulo da navegação alterado: "${screen.baseline.navLabel}" -> "${screen.navLabel}"`);
      if (screen.role !== screen.baseline.role) lines.push(`- Perfil alterado: ${roleNames[screen.baseline.role]} -> ${roleNames[screen.role]}`);
      if (screen.showInNav !== screen.baseline.showInNav) lines.push(`- Visibilidade na navegação alterada: ${screen.showInNav ? "mostrar" : "ocultar"}`);
    }
    if (created) lines.push(`- Estrutura de referência: ${screen.sourceScreenId}`);
    if (screen.startBlank) lines.push("- Base original removida para começar em branco");
    if (order.length) lines.push("- Ordem das seções foi personalizada");
    hidden.forEach(([, label]) => lines.push(`- Seção original removida: ${typeof label === "string" ? label : "seção sem título"}`));
    additions.forEach((addition) => {
      const name = addition.label || blockCatalog[addition.type]?.name || "Seção personalizada";
      const origin = addition.movedFrom ? `, movida de ${addition.movedFrom.screenName}` : "";
      lines.push(`- Seção adicionada: ${name}${origin}`);
    });
    changedEdits.forEach(([key, value]) => {
      const original = originals[key];
      lines.push(`- Texto alterado: "${original}" -> "${value}"`);
    });
    if (!created && !configChanged && !screen.startBlank && !order.length && !hidden.length && !additions.length && !changedEdits.length) lines.push("- Sem alterações registradas");
    lines.push("");
  });
  lines.push(
    "## Aplicação futura na versão original",
    "",
    "1. Aplicar primeiro os textos, nomes de telas e rótulos de navegação aprovados.",
    "2. Reproduzir a ordem, remoção, duplicação e transferência das seções na estrutura real de cada tela.",
    "3. Criar as novas rotas, ícones e telas registradas, preservando os componentes e padrões do aplicativo.",
    "4. Revisar responsividade, acessibilidade, navegação e regras funcionais depois da migração.",
    "",
    "O relatório é uma especificação das decisões. A lógica, o banco de dados e as integrações continuam sendo implementados e testados na versão original.",
  );
  return lines.join("\n");
}

function exportChangeReport() {
  downloadText(`vp-studio-mudancas-${new Date().toISOString().slice(0, 10)}.md`, generateChangeReport(), "text/markdown");
  showToast("Resumo das mudanças exportado");
}

async function importProject(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.screens) || !parsed.screens.length) throw new Error("Projeto inválido");
    undoStack.push(historySnapshot());
    state = migrateProject(parsed);
    ensureValidSelection();
    redoStack = [];
    scheduleSave();
    renderAll();
    elements.projectDialog.close();
    showToast("Projeto importado com sucesso");
  } catch {
    showToast("Não foi possível importar este arquivo.");
  } finally {
    elements.importFile.value = "";
  }
}

function undo() {
  const snapshot = undoStack.pop();
  if (!snapshot) return;
  redoStack.push(historySnapshot());
  applySnapshot(snapshot);
  scheduleSave();
  renderAll();
  showToast("Alteração desfeita");
}

function redo() {
  const snapshot = redoStack.pop();
  if (!snapshot) return;
  undoStack.push(historySnapshot());
  applySnapshot(snapshot);
  scheduleSave();
  renderAll();
  showToast("Alteração refeita");
}

function wireEvents() {
  elements.originalPreview.addEventListener("load", () => {
    frameReady = Boolean(elements.originalPreview.contentWindow?.vpCreativePreview);
    syncOriginalPreview();
    renderInspector();
  });
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "vp-creative-navigate" && event.data.screenId) {
      selectScreen(event.data.screenId);
      return;
    }
    if (event.data?.type === "vp-creative-preview-ready") {
      frameReady = true;
      syncOriginalPreview();
      renderInspector();
    }
  });
  document.querySelector("#new-screen-button").addEventListener("click", () => elements.screenDialog.showModal());
  document.querySelector("#add-block-button").addEventListener("click", () => elements.blockDialog.showModal());
  document.querySelector("#duplicate-screen-button").addEventListener("click", duplicateScreen);
  document.querySelector("#manage-versions-button").addEventListener("click", () => elements.projectDialog.showModal());
  document.querySelector("#project-button").addEventListener("click", () => elements.projectDialog.showModal());
  document.querySelector("#preview-button").addEventListener("click", openPresentation);
  document.querySelector("#close-preview-button").addEventListener("click", closePresentation);
  elements.undo.addEventListener("click", undo);
  elements.redo.addEventListener("click", redo);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`).close());
  });

  document.querySelectorAll(".creative-dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  elements.screenSearch.addEventListener("input", renderScreenList);
  elements.screenList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-screen-id]");
    if (button) selectScreen(button.dataset.screenId);
  });

  document.querySelectorAll("[data-role-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.roleFilter = button.dataset.roleFilter;
      document.querySelectorAll("[data-role-filter]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      scheduleSave();
      renderScreenList();
    });
  });

  document.querySelectorAll("[data-device]").forEach((button) => {
    button.addEventListener("click", () => {
      state.viewport = button.dataset.device;
      state.zoomManual = false;
      scheduleSave();
      renderCanvas();
    });
  });

  elements.zoom.addEventListener("input", () => {
    state.zoom = Number(elements.zoom.value);
    state.zoomManual = true;
    elements.zoomOutput.value = `${state.zoom}%`;
    elements.deviceShell.style.setProperty("--preview-scale", String(state.zoom / 100));
  });
  elements.zoom.addEventListener("change", scheduleSave);

  elements.previewContent.addEventListener("click", (event) => {
    const action = event.target.closest("[data-block-action]");
    const blockElement = event.target.closest("[data-block-id]");
    if (event.target.closest("[data-empty-add]")) {
      elements.blockDialog.showModal();
      return;
    }
    if (action && blockElement) {
      const id = blockElement.dataset.blockId;
      const type = action.dataset.blockAction;
      if (type === "up") moveBlock(id, -1);
      if (type === "down") moveBlock(id, 1);
      if (type === "duplicate") duplicateBlock(id);
      if (type === "visibility") commit(() => { activeScreen().blocks.find((block) => block.id === id).visible = !activeScreen().blocks.find((block) => block.id === id).visible; }, "Visibilidade atualizada");
      if (type === "delete") deleteBlock(id);
      return;
    }
    const targetButton = event.target.closest("[data-preview-target]");
    if (targetButton?.dataset.previewTarget) {
      selectScreen(targetButton.dataset.previewTarget);
      return;
    }
    if (blockElement && !event.target.closest("[contenteditable]")) selectBlock(blockElement.dataset.blockId);
  });

  elements.previewContent.addEventListener("focusin", (event) => {
    const blockElement = event.target.closest("[data-block-id]");
    if (blockElement) {
      state.selectedBlockId = blockElement.dataset.blockId;
      renderInspector();
    }
  });

  elements.previewContent.addEventListener("blur", (event) => {
    const editable = event.target.closest("[data-inline-field]");
    const blockElement = event.target.closest("[data-block-id]");
    if (!editable || !blockElement) return;
    const block = activeScreen().blocks.find((item) => item.id === blockElement.dataset.blockId);
    const field = editable.dataset.inlineField;
    const value = editable.textContent.trim();
    if (!block || block[field] === value) return;
    commit(() => { block[field] = value; }, "Texto atualizado");
  }, true);

  elements.previewContent.addEventListener("dragstart", (event) => {
    const block = event.target.closest("[data-block-id]");
    if (!block) return;
    draggedBlockId = block.dataset.blockId;
    block.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
  });

  elements.previewContent.addEventListener("dragend", () => {
    draggedBlockId = null;
    document.querySelectorAll(".preview-block").forEach((block) => block.classList.remove("is-dragging", "is-drop-target"));
  });

  elements.previewContent.addEventListener("dragover", (event) => {
    const target = event.target.closest("[data-block-id]");
    if (!target || target.dataset.blockId === draggedBlockId) return;
    event.preventDefault();
    document.querySelectorAll(".preview-block").forEach((block) => block.classList.toggle("is-drop-target", block === target));
  });

  elements.previewContent.addEventListener("drop", (event) => {
    const target = event.target.closest("[data-block-id]");
    if (!target || !draggedBlockId || target.dataset.blockId === draggedBlockId) return;
    event.preventDefault();
    const screen = activeScreen();
    const from = screen.blocks.findIndex((block) => block.id === draggedBlockId);
    const to = screen.blocks.findIndex((block) => block.id === target.dataset.blockId);
    commit(() => {
      const [block] = screen.blocks.splice(from, 1);
      screen.blocks.splice(to, 0, block);
    }, "Conteúdo reorganizado");
  });

  elements.previewNavigation.addEventListener("click", (event) => {
    const button = event.target.closest("[data-screen-nav]");
    if (button) selectScreen(button.dataset.screenNav);
  });

  elements.blockLibrary.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-block]");
    if (button) addBlock(button.dataset.addBlock);
  });

  document.querySelector("#screen-form").addEventListener("submit", (event) => {
    event.preventDefault();
    createScreenFromForm(event.currentTarget);
  });

  document.querySelectorAll("[data-inspector-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.inspectorTab = button.dataset.inspectorTab;
      scheduleSave();
      renderInspector();
    });
  });

  elements.inspectorBody.addEventListener("change", (event) => {
    if (event.target.closest("[data-fidelity-text]")) return;
    const block = selectedBlock();
    const blockFieldInput = event.target.closest("[data-block-field]");
    const complexField = event.target.closest("[data-complex-field]");
    const screenFieldInput = event.target.closest("[data-screen-field]");
    const navigationModeInput = event.target.closest("[data-role-navigation-mode]");
    const moveSelect = event.target.closest("[data-move-block]");
    const fidelityMoveSelect = event.target.closest("[data-fidelity-move-screen]");
    const fidelityPosition = event.target.closest("[data-fidelity-position]");

    if (fidelityMoveSelect?.value) {
      moveSelectedOriginalSectionTo(fidelityMoveSelect.value);
      return;
    }
    if (fidelityPosition?.value) {
      moveSelectedOriginalSectionToPosition(fidelityPosition.value);
      return;
    }

    if (block && blockFieldInput) {
      const field = blockFieldInput.dataset.blockField;
      const raw = blockFieldInput.value;
      commit(() => { block[field] = field === "spacer" ? Math.max(10, Math.min(240, Number(raw) || 40)) : raw; }, "Conteúdo atualizado");
    }
    if (block && complexField) {
      const field = complexField.dataset.complexField;
      commit(() => {
        block[field] = field === "values"
          ? complexField.value.split(",").map((value) => Math.max(0, Math.min(100, Number(value.trim()) || 0))).filter((value, index, list) => list.length === 1 || value > 0)
          : complexField.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
      }, "Dados do bloco atualizados");
    }
    if (screenFieldInput) {
      const field = screenFieldInput.dataset.screenField;
      const value = field === "showInNav" ? screenFieldInput.value === "true" : screenFieldInput.value;
      commit(() => {
        const screen = activeScreen();
        screen[field] = value;
        if (field === "navigationPlacement") screen.showInNav = value !== "hidden" && screen.role !== "shared";
        if (field === "role") {
          screen.showInNav = value !== "shared" && screen.navigationPlacement !== "hidden";
          const matchingSource = state.screens.find((item) => item.role === value && item.id === item.sourceScreenId);
          if (matchingSource) screen.sourceScreenId = matchingSource.id;
        }
      }, "Configuração da tela atualizada");
      return;
    }
    if (navigationModeInput?.value) {
      commit(() => {
        state.navigationModes ||= { student: "responsive", coach: "responsive", shared: "responsive" };
        state.navigationModes[activeScreen().role] = navigationModeInput.value;
      }, "Formato da navegação atualizado");
      return;
    }
    if (block && moveSelect?.value) {
      const origin = activeScreen();
      const destination = state.screens.find((screen) => screen.id === moveSelect.value);
      if (!destination) return;
      commit(() => {
        origin.blocks = origin.blocks.filter((item) => item.id !== block.id);
        destination.blocks.push(block);
        state.activeScreenId = destination.id;
        state.selectedBlockId = block.id;
      }, `Conteúdo movido para ${destination.name}`);
    }
  });

  elements.inspectorBody.addEventListener("focusin", (event) => {
    if (!event.target.closest("[data-fidelity-text]") || !frameSelection) return;
    frameEditSnapshot = historySnapshot();
    frameSelection.originalText = frameSelection.element.textContent;
  });

  elements.inspectorBody.addEventListener("input", (event) => {
    const input = event.target.closest("[data-fidelity-text]");
    if (!input || !frameSelection?.element?.isConnected) return;
    frameSelection.element.textContent = input.value;
    fidelityBucket("edits", frameSelection.screenId)[frameSelection.key] = input.value;
    scheduleSave();
  });

  elements.inspectorBody.addEventListener("focusout", (event) => {
    const input = event.target.closest("[data-fidelity-text]");
    if (!input || !frameSelection || !frameEditSnapshot) return;
    if (input.value !== frameSelection.originalText) {
      undoStack.push(frameEditSnapshot);
      redoStack = [];
      renderHistoryControls();
      showToast("Texto atualizado");
      frameSelection.originalText = input.value;
    }
    frameEditSnapshot = null;
  });

  elements.inspectorBody.addEventListener("click", (event) => {
    const fidelityAction = event.target.closest("[data-fidelity-action]");
    if (fidelityAction) {
      if (fidelityAction.dataset.fidelityAction === "save-text") {
        saveSelectedOriginalText();
        return;
      }
      if (fidelityAction.dataset.fidelityAction === "duplicate") duplicateSelectedOriginalSection();
      if (fidelityAction.dataset.fidelityAction === "remove") removeSelectedOriginalSection();
      if (fidelityAction.dataset.fidelityAction === "first") moveSelectedOriginalSectionToPosition("first");
      if (fidelityAction.dataset.fidelityAction === "up") moveSelectedOriginalSection(-1);
      if (fidelityAction.dataset.fidelityAction === "down") moveSelectedOriginalSection(1);
      if (fidelityAction.dataset.fidelityAction === "last") moveSelectedOriginalSectionToPosition("last");
      return;
    }
    const option = event.target.closest("[data-set-option]");
    const inspectorAction = event.target.closest("[data-inspector-action]");
    const screenAction = event.target.closest("[data-screen-action]");
    const block = selectedBlock();
    if (option && block) {
      commit(() => { block[option.dataset.setOption] = option.dataset.value; }, "Visual atualizado");
    }
    if (inspectorAction && block) {
      if (inspectorAction.dataset.inspectorAction === "duplicate") duplicateBlock(block.id);
      if (inspectorAction.dataset.inspectorAction === "delete") deleteBlock(block.id);
    }
    if (screenAction) {
      if (screenAction.dataset.screenAction === "duplicate") duplicateScreen();
      if (screenAction.dataset.screenAction === "delete") deleteScreen();
      if (screenAction.dataset.screenAction === "clear" && window.confirm("Remover todo o conteúdo desta tela e começar em branco?")) {
        commit(() => {
          const screen = activeScreen();
          screen.blocks = [];
          screen.startBlank = true;
          ["edits", "originals", "additions", "orders", "hidden"].forEach((bucket) => {
            state.fidelity[bucket][screen.id] = bucket === "orders" ? [] : {};
          });
          state.selectedBlockId = null;
          frameSelection = null;
        }, "Tela esvaziada");
      }
      if (screenAction.dataset.screenAction === "restore" && window.confirm("Restaurar o conteúdo original desta tela?")) {
        commit(() => {
          const screen = activeScreen();
          screen.startBlank = false;
          ["edits", "originals", "additions", "orders", "hidden"].forEach((bucket) => {
            state.fidelity[bucket][screen.id] = bucket === "orders" ? [] : {};
          });
          frameSelection = null;
        }, "Conteúdo original restaurado");
      }
    }
  });

  document.querySelectorAll("[data-mobile-panel]").forEach((button) => {
    button.addEventListener("click", () => activateMobilePanel(button.dataset.mobilePanel));
  });

  document.querySelector("#version-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.label;
    saveVersion(input.value.trim());
    event.currentTarget.reset();
  });

  elements.versionList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-version-action]");
    if (!button) return;
    const version = state.versions.find((item) => item.id === button.dataset.versionId);
    if (!version) return;
    if (button.dataset.versionAction === "restore") {
      commit(() => applySnapshot(version.snapshot), `Versão “${version.label}” restaurada`);
      elements.projectDialog.close();
    }
    if (button.dataset.versionAction === "delete") {
      state.versions = state.versions.filter((item) => item.id !== version.id);
      scheduleSave();
      renderVersions();
      showToast("Versão removida");
    }
  });

  document.querySelector("#export-button").addEventListener("click", exportProject);
  document.querySelector("#report-button").addEventListener("click", exportChangeReport);
  document.querySelector("#import-button").addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", () => {
    const [file] = elements.importFile.files;
    if (file) importProject(file);
  });
  document.querySelector("#reset-button").addEventListener("click", () => {
    if (!window.confirm("Restaurar o modelo inicial? As versões não exportadas serão perdidas.")) return;
    undoStack.push(historySnapshot());
    state = createDefaultProject();
    redoStack = [];
    scheduleSave();
    renderAll();
    elements.projectDialog.close();
    showToast("Modelo inicial restaurado");
  });

  document.addEventListener("keydown", (event) => {
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
    }
    if (modifier && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
    if (event.key === "Escape" && !elements.presentation.hidden) closePresentation();
  });
}

renderBlockLibrary();
wireEvents();
renderAll();
