const STORAGE_KEY = "vp-studio-creative-v1";
const SCHEMA_VERSION = 4;
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
  return {
    id,
    sourceScreenId: options.sourceScreenId || id,
    name,
    navLabel: options.navLabel || name,
    role,
    showInNav: options.showInNav ?? true,
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
    fidelity: { edits: {}, additions: {}, orders: {} },
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

function loadProject() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(parsed.screens) || !parsed.screens.length) return createDefaultProject();
    return { ...createDefaultProject(), ...parsed };
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
    activeScreenId: state.activeScreenId,
    selectedBlockId: state.selectedBlockId,
  });
}

function applySnapshot(snapshot) {
  state.screens = clone(snapshot.screens);
  state.fidelity = clone(snapshot.fidelity || { edits: {}, additions: {}, orders: {} });
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
        return `
          <button class="screen-item ${screen.id === state.activeScreenId ? "is-active" : ""}" type="button" data-screen-id="${escapeHTML(screen.id)}">
            <span class="screen-item__index">${String(index).padStart(2, "0")}</span>
            <span class="screen-item__copy"><strong>${escapeHTML(screen.name)}</strong><small>${screen.showInNav ? "Na navegação" : "Fora da navegação"}</small></span>
            <span class="screen-item__count">${screen.blocks.length + Object.keys(state.fidelity?.additions?.[screen.id] || {}).length}</span>
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
  state.fidelity ||= { edits: {}, additions: {}, orders: {} };
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
    .filter((node) => !node.children.length && node.textContent.trim() && !node.closest("svg, style, script"));
}

function frameSections(surface) {
  const selector = [
    ":scope > .page-intro", ":scope > .wellness-hero", ":scope > .dashboard-grid",
    ":scope > .section-block", ":scope > .date-strip", ":scope > .schedule-list",
    ":scope > .workout-summary", ":scope > .exercise-list", ":scope > .chart-grid",
    ":scope > .profile-layout", ":scope > .coach-metrics", ":scope > .coach-dashboard-grid",
    ":scope > .search-field", ":scope > .student-table", ":scope > .coach-calendar",
    ":scope > .builder-layout", ":scope > .creative-added-section",
  ].join(",");
  return [...surface.querySelectorAll(selector)];
}

function persistFrameOrder(surface, screenId) {
  state.fidelity.orders[screenId] = frameSections(surface).map((section) => section.dataset.creativeSectionKey);
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
      [data-creative-section-key] { cursor: grab; }
      [data-creative-section-key].is-creative-dragging { opacity: .48; }
      [data-creative-section-key].is-creative-drop { outline: 2px dashed #a45f42; outline-offset: 5px; }
    `;
    doc.head.append(helperStyle);
  }

  const additions = fidelityBucket("additions", screen.id);
  surface.querySelectorAll("[data-creative-added-id]").forEach((node) => node.remove());
  Object.values(additions).forEach((addition) => {
    if (surface.querySelector(`[data-creative-added-id="${addition.id}"]`)) return;
    const template = doc.createElement("template");
    template.innerHTML = addition.html || originalBlockMarkup(addition.type, addition.id);
    surface.append(template.content.firstElementChild);
  });

  const sections = frameSections(surface);
  sections.forEach((section, index) => {
    section.dataset.creativeSectionKey ||= section.dataset.creativeAddedId ? `added-${section.dataset.creativeAddedId}` : `section-${index}`;
    section.draggable = true;
    section.ondragstart = () => {
      draggedFrameSection = section;
      frameEditSnapshot = historySnapshot();
      section.classList.add("is-creative-dragging");
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
      surface.insertBefore(draggedFrameSection, after ? section.nextSibling : section);
      section.classList.remove("is-creative-drop");
      persistFrameOrder(surface, screen.id);
    };
    section.ondragend = () => {
      section.classList.remove("is-creative-dragging");
      frameSections(surface).forEach((item) => item.classList.remove("is-creative-drop"));
      if (frameEditSnapshot) {
        undoStack.push(frameEditSnapshot);
        redoStack = [];
        scheduleSave();
        renderHistoryControls();
        showToast("Seção reorganizada");
      }
      frameEditSnapshot = null;
      draggedFrameSection = null;
    };
  });

  if (!surface.dataset.creativeOriginalOrder) {
    surface.dataset.creativeOriginalOrder = JSON.stringify(
      sections.filter((section) => !section.dataset.creativeAddedId).map((section) => section.dataset.creativeSectionKey),
    );
  }

  const requestedOrder = fidelityBucket("orders", screen.id);
  const originalOrder = JSON.parse(surface.dataset.creativeOriginalOrder || "[]");
  const effectiveOrder = requestedOrder.length ? requestedOrder : originalOrder;
  if (effectiveOrder.length) {
    const sectionMap = new Map(frameSections(surface).map((section) => [section.dataset.creativeSectionKey, section]));
    effectiveOrder.forEach((key) => {
      const section = sectionMap.get(key);
      if (section) surface.append(section);
    });
    frameSections(surface)
      .filter((section) => section.dataset.creativeAddedId && !effectiveOrder.includes(section.dataset.creativeSectionKey))
      .forEach((section) => surface.append(section));
  }

  const edits = fidelityBucket("edits", screen.id);
  editableFrameNodes(surface).forEach((node, index) => {
    const key = node.dataset.creativeTextKey || `text-${index}`;
    node.dataset.creativeTextKey = key;
    node.dataset.creativeOriginalText ||= node.textContent;
    node.dataset.creativeEditable = "true";
    node.contentEditable = "true";
    node.spellcheck = true;
    const requestedText = Object.hasOwn(edits, key) ? edits[key] : node.dataset.creativeOriginalText;
    if (node.textContent !== requestedText) node.textContent = requestedText;
    node.onfocus = () => {
      frameSelection?.element?.classList.remove("is-creative-selected");
      frameSelection = { element: node, key, screenId: screen.id, originalText: node.textContent };
      frameEditSnapshot = historySnapshot();
      node.classList.add("is-creative-selected");
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
      renderInspector();
    };
  });

  if (!surface.dataset.creativeSurfaceBound) {
    surface.dataset.creativeSurfaceBound = "true";
    surface.addEventListener("click", (event) => {
      if (event.target.closest("a, button") && !event.target.closest("[data-creative-editable]")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }
}

function syncOriginalPreview() {
  const screen = activeScreen();
  const bridge = elements.originalPreview.contentWindow?.vpCreativePreview;
  if (!screen || !frameReady || !bridge) return;
  frameSelection = null;
  bridge.showScreen({ screenId: screen.id, sourceScreenId: screen.sourceScreenId || screen.id });
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
      <div class="inspector-empty"><i>↖</i><strong>Edite o aplicativo real</strong><p>Clique em qualquer texto dentro da prévia. Arraste uma seção inteira para mudar sua posição.</p></div>`;
    return;
  }

  const section = frameSelection.element.closest("[data-creative-section-key]");
  if (state.inspectorTab === "style") {
    elements.inspectorBody.innerHTML = `
      <section class="inspector-section">
        <div class="inspector-section__heading"><h3>Elemento original</h3><span>${escapeHTML(frameSelection.element.tagName.toLowerCase())}</span></div>
        <p class="inspector-note">A identidade visual permanece vinculada ao aplicativo original. Nesta etapa, altere a hierarquia movendo a seção completa.</p>
      </section>
      ${section ? `<section class="inspector-section"><h3>Posição da seção</h3><div class="inspector-actions"><button type="button" data-fidelity-action="up">Mover acima</button><button type="button" data-fidelity-action="down">Mover abaixo</button></div></section>` : ""}`;
    return;
  }

  elements.inspectorBody.innerHTML = `
    <section class="inspector-section">
      <div class="inspector-section__heading"><h3>Texto selecionado</h3><span>Aplicativo original</span></div>
      <label class="editor-field"><span>Conteúdo</span><textarea data-fidelity-text>${escapeHTML(frameSelection.element.textContent.trim())}</textarea></label>
      <p class="inspector-note">Você também pode escrever diretamente dentro da prévia.</p>
      <button class="screen-action" type="button" data-fidelity-action="save-text">Aplicar texto</button>
    </section>
    ${section ? `<section class="inspector-section"><h3>Organização</h3><div class="inspector-actions"><button type="button" data-fidelity-action="up">Mover acima</button><button type="button" data-fidelity-action="down">Mover abaixo</button></div></section>` : ""}`;
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
  elements.inspectorBody.innerHTML = `
    <section class="inspector-section">
      <div class="inspector-section__heading"><h3>Identificação</h3><span>${screen.blocks.length} blocos</span></div>
      <label class="editor-field"><span>Nome da tela</span><input data-screen-field="name" value="${escapeHTML(screen.name)}" /></label>
      <label class="editor-field"><span>Nome curto na navegação</span><input data-screen-field="navLabel" value="${escapeHTML(screen.navLabel)}" /></label>
      <label class="editor-field"><span>Perfil</span><select data-screen-field="role"><option value="student" ${screen.role === "student" ? "selected" : ""}>Aluno</option><option value="coach" ${screen.role === "coach" ? "selected" : ""}>Professor</option><option value="shared" ${screen.role === "shared" ? "selected" : ""}>Compartilhada</option></select></label>
      <label class="editor-field"><span>Visibilidade na navegação</span><select data-screen-field="showInNav"><option value="true" ${screen.showInNav ? "selected" : ""}>Mostrar</option><option value="false" ${!screen.showInNav ? "selected" : ""}>Ocultar</option></select></label>
    </section>
    <section class="inspector-section">
      <h3>Organização da tela</h3>
      <div class="screen-settings-actions">
        <button class="screen-action" type="button" data-screen-action="duplicate">Duplicar esta tela</button>
        <button class="screen-action" type="button" data-screen-action="clear">Remover todos os blocos</button>
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

function addOriginalBlock(type) {
  if (!blockCatalog[type]) return;
  const screen = activeScreen();
  const addition = { id: uid("original"), type };
  const snapshot = historySnapshot();
  fidelityBucket("additions", screen.id)[addition.id] = addition;
  undoStack.push(snapshot);
  redoStack = [];
  scheduleSave();
  renderHistoryControls();
  refreshOriginalEditing();
  renderScreenList();
  elements.blockDialog.close();
  showToast(`${blockCatalog[type].name} adicionado com o visual original`);
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
    state.activeScreenId = state.screens[Math.max(0, index - 1)].id;
    state.selectedBlockId = null;
  }, "Tela excluída");
}

function createScreenFromForm(form) {
  const data = new FormData(form);
  const name = String(data.get("name") || "Nova tela").trim();
  const role = String(data.get("role") || "student");
  const template = String(data.get("template") || "blank");
  const templates = {
    blank: [],
    dashboard: [makeBlock("hero"), makeBlock("metrics"), makeBlock("chart")],
    list: [makeBlock("hero"), makeBlock("list")],
    form: [makeBlock("hero", { text: "Explique o objetivo do formulário." }), makeBlock("text", { title: "Campo ou pergunta", text: "Descreva o conteúdo que deverá ser preenchido." }), makeBlock("button", { action: "Salvar e continuar", tone: "copper" })],
  };
  commit(() => {
    const sourceScreenId = role === "coach" ? "coach-home" : role === "shared" ? "shared-login" : "student-home";
    const screen = makeScreen(uid("screen"), name, role, templates[template] || [], { sourceScreenId });
    state.screens.push(screen);
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

function moveSelectedOriginalSection(delta) {
  const section = frameSelection?.element?.closest("[data-creative-section-key]");
  const surface = elements.originalPreview.contentWindow?.vpCreativePreview?.getActiveSurface?.();
  if (!section || !surface) return;
  const sections = frameSections(surface);
  const index = sections.indexOf(section);
  const target = sections[index + delta];
  if (!target) return;
  const snapshot = historySnapshot();
  if (delta < 0) surface.insertBefore(section, target);
  else surface.insertBefore(section, target.nextSibling);
  persistFrameOrder(surface, activeScreen().id);
  undoStack.push(snapshot);
  redoStack = [];
  scheduleSave();
  renderHistoryControls();
  showToast(delta < 0 ? "Seção movida para cima" : "Seção movida para baixo");
}

function saveSelectedOriginalText() {
  const input = elements.inspectorBody.querySelector("[data-fidelity-text]");
  if (!input || !frameSelection?.element?.isConnected) return;
  const snapshot = frameEditSnapshot || historySnapshot();
  const previous = frameSelection.element.textContent;
  frameSelection.element.textContent = input.value;
  fidelityBucket("edits", frameSelection.screenId)[frameSelection.key] = input.value;
  if (previous !== input.value || frameEditSnapshot) {
    undoStack.push(snapshot);
    redoStack = [];
  }
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

async function importProject(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.screens) || !parsed.screens.length) throw new Error("Projeto inválido");
    undoStack.push(historySnapshot());
    state = { ...createDefaultProject(), ...parsed, schemaVersion: SCHEMA_VERSION };
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
    if (event.origin !== window.location.origin || event.data?.type !== "vp-creative-preview-ready") return;
    frameReady = true;
    syncOriginalPreview();
    renderInspector();
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
    const moveSelect = event.target.closest("[data-move-block]");

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
      commit(() => { activeScreen()[field] = value; }, "Configuração da tela atualizada");
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
      moveSelectedOriginalSection(fidelityAction.dataset.fidelityAction === "up" ? -1 : 1);
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
      if (screenAction.dataset.screenAction === "clear" && window.confirm("Remover todos os blocos desta tela?")) {
        commit(() => { activeScreen().blocks = []; state.selectedBlockId = null; }, "Tela esvaziada");
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
