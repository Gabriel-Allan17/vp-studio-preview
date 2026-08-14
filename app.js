import { mountBodyMap, validateBodyMapCatalog } from "./body-map.js?v=21";

const icon = (name) => `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;

const navigation = {
  student: [
    { route: "home", label: "Início", icon: "home" },
    { route: "agenda", label: "Agenda", icon: "calendar" },
    { route: "workout", label: "Treino", icon: "workout" },
    { route: "evolution", label: "Evolução", icon: "chart" },
    { route: "profile", label: "Perfil", icon: "user" },
  ],
  coach: [
    { route: "home", label: "Início", icon: "home" },
    { route: "students", label: "Alunos", icon: "users" },
    { route: "coach-agenda", label: "Agenda", icon: "calendar" },
    { route: "training", label: "Treinos", icon: "workout" },
    { route: "reports", label: "Relatórios", icon: "chart" },
  ],
};

const pageMeta = {
  "student-home": ["VISÃO GERAL", "Início"],
  "student-agenda": ["AGENDA", "Minhas aulas"],
  "student-workout": ["TREINO ATUAL", "Meu treino"],
  "student-evolution": ["HISTÓRICO", "Evolução"],
  "student-profile": ["CONTA", "Meu perfil"],
  wellness: ["CHECK-IN DIÁRIO", "Bem-estar"],
  "coach-home": ["GESTÃO DO STUDIO", "Início"],
  "coach-students": ["ACOMPANHAMENTO", "Alunos"],
  "coach-agenda": ["GESTÃO DE HORÁRIOS", "Agenda"],
  "coach-training": ["PRESCRIÇÃO", "Treinos"],
  "coach-reports": ["INDICADORES", "Relatórios"],
  account: ["PRIMEIRO ACESSO", "Criar conta"],
};

const scaleOptions = [
  { value: "1", emoji: "😣", label: "Péssimo", tone: "rose" },
  { value: "2", emoji: "😕", label: "Ruim", tone: "amber" },
  { value: "3", emoji: "😐", label: "Normal", tone: "slate" },
  { value: "4", emoji: "🙂", label: "Bom", tone: "blue" },
  { value: "5", emoji: "😄", label: "Ótimo", tone: "green" },
];

function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readWellnessHistory() {
  try {
    const history = JSON.parse(localStorage.getItem("vp-demo-wellness-history") || "[]");
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

function todayCheckin() {
  const today = localDayKey();
  return [...readWellnessHistory()]
    .reverse()
    .find((entry) => localDayKey(entry.updatedAt || entry.createdAt) === today) || null;
}

function copyAnswers(answers = {}) {
  return JSON.parse(JSON.stringify(answers));
}

const wellnessDefinition = [
  {
    id: "sleep",
    kind: "scale",
    overline: "SONO",
    title: "Como foi a qualidade da sua noite de sono?",
    helper: "Considere a noite como um todo, não apenas o tempo que ficou na cama.",
  },
  {
    id: "energy",
    kind: "scale",
    overline: "ENERGIA",
    title: "Como está sua disposição hoje?",
    helper: "Pense na energia disponível para sua rotina e para o treino.",
  },
  {
    id: "stress",
    kind: "scale-reverse",
    overline: "ESTRESSE",
    title: "Como está seu nível de estresse?",
    helper: "Escolha a resposta que melhor descreve este momento.",
  },
  {
    id: "mood",
    kind: "scale",
    overline: "HUMOR",
    title: "Como está seu humor hoje?",
    helper: "Marque como você está se sentindo agora.",
  },
  {
    id: "musclePain",
    kind: "pain-scale",
    overline: "DOR MUSCULAR",
    title: "Como está sua dor muscular?",
    helper: "Se houver desconforto, você poderá indicar a região na etapa corporal.",
  },
  {
    id: "hydration",
    kind: "hydration",
    overline: "HIDRATAÇÃO",
    title: "Como ficou sua hidratação desde que acordou?",
    helper: "Use sua percepção geral até este momento.",
  },
  {
    id: "psr",
    kind: "psr",
    overline: "PSR",
    title: "Como você avalia sua recuperação?",
    helper: "A Percepção Subjetiva de Recuperação deve ser respondida antes do treino.",
  },
  {
    id: "bodyMap",
    kind: "body",
    overline: "LOCALIZAÇÃO DE DOR",
    title: "Onde está o desconforto?",
    helper: "Marque um ou mais pontos e informe a intensidade do último ponto.",
    conditional: (answers) => answers.musclePain && answers.musclePain !== "5",
  },
  {
    id: "cycle",
    kind: "cycle",
    overline: "CICLO MENSTRUAL",
    title: "Deseja registrar informações do seu ciclo?",
    helper: "Opcional. Registre apenas se quiser acompanhar seu ciclo.",
    conditional: () => state.profileSex === "female",
  },
];

const persistedTodayCheckin = todayCheckin();
const persistedAnswers = copyAnswers(persistedTodayCheckin?.answers);

const state = {
  experience: "editorial",
  experienceReturn: "login",
  role: "student",
  activeRoute: "home",
  activeView: "student-home",
  wellnessIndex: 0,
  wellnessAnswers: persistedAnswers,
  bodyPoints: Array.isArray(persistedAnswers.bodyMap) ? [...persistedAnswers.bodyMap] : [],
  profileSex: localStorage.getItem("vp-demo-profile-sex") || "female",
  checkinCompleted: Boolean(persistedTodayCheckin),
  checkinCompletedAt: persistedTodayCheckin?.updatedAt || persistedTodayCheckin?.createdAt || null,
  deferredInstallPrompt: null,
  toastTimer: null,
};

const experienceScreen = document.querySelector("#experience-screen");
const loginScreen = document.querySelector("#login-screen");
const workspaceShell = document.querySelector("#workspace-shell");
const railNav = document.querySelector("#rail-nav");
const mobileTabbar = document.querySelector("#mobile-tabbar");
const toast = document.querySelector("#toast");
const toastCopy = toast.querySelector("span");
const loginIdentity = document.querySelector("#login-identity");
const loginPassword = document.querySelector("#login-password");
const loginPanel = document.querySelector(".login-panel");
const loginTitle = document.querySelector("#login-title");
const passwordToggle = document.querySelector("#password-toggle");
const rememberProfile = document.querySelector("#remember-profile");
const accountDialog = document.querySelector("#account-dialog");
const experienceStylesheet = document.querySelector("#experience-picker-styles");
const selectedRoleLabel = document.querySelector("#selected-role-label");

const experienceNames = {
  mineral: "Mineral",
  terracota: "Cobre Urbano",
  editorial: "Atlântico",
};

const experienceLoginCopy = {
  mineral: {
    eyebrow: "SEU ACOMPANHAMENTO",
    title: "Bom ter você por aqui.",
    instruction: "Entre para acompanhar seu treino e sua evolução.",
  },
  terracota: {
    eyebrow: "",
    title: "Acesso do aluno",
    instruction: "",
  },
  editorial: {
    eyebrow: "VP STUDIO · ACESSO",
    title: "Seu treino. Seu ritmo.",
    instruction: "Entre como aluno ou professor.",
  },
};

const accessRoles = {
  student: {
    label: "Aluno",
    identity: "carolina@vpstudio.com.br",
  },
  coach: {
    label: "Professor",
    identity: "vinicius@vpstudio.com.br",
  },
};

function showToast(message) {
  toastCopy.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3800);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("vp-studio-theme", theme);
  const dark = theme === "dark";
  updateThemeColor();
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
    button.setAttribute("aria-pressed", String(dark));
  });
}

function initialiseTheme() {
  const stored = localStorage.getItem("vp-studio-theme");
  setTheme(stored || "dark");
}

function updateThemeColor() {
  const dark = document.documentElement.dataset.theme === "dark";
  const colors = {
    mineral: dark ? "#1d2529" : "#edf0f1",
    terracota: dark ? "#181d1b" : "#ebe8e2",
    editorial: dark ? "#14232c" : "#edf1f3",
  };
  document.querySelector('meta[name="theme-color"]').content = colors[state.experience] || colors.editorial;
}

function setExperience(experience, options = {}) {
  if (!experienceNames[experience]) return;
  state.experience = experience;
  document.documentElement.dataset.experience = experience;
  loginScreen.dataset.concept = experience;
  const loginCopy = experienceLoginCopy[experience];
  document.querySelector(".login-heading .overline").textContent = loginCopy.eyebrow;
  document.querySelector("#login-title").textContent = loginCopy.title;
  document.querySelector(".login-instruction").textContent = loginCopy.instruction;
  document.querySelectorAll("[data-experience-choice]").forEach((button) => {
    const active = button.dataset.experienceChoice === experience;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("#account-experience").textContent = `${experienceNames[experience]} selecionado`;
  if (options.persist !== false) localStorage.setItem("vp-experience-v13", experience);
  updateThemeColor();
}

function setExperiencePickerActive(active) {
  experienceStylesheet.disabled = !active;
  document.body.classList.toggle("is-choosing-experience", active);
}

function showLoginScreen() {
  setExperiencePickerActive(false);
  experienceScreen.hidden = true;
  experienceScreen.classList.remove("is-active");
  workspaceShell.hidden = true;
  workspaceShell.classList.remove("is-active", "is-wellness");
  loginScreen.hidden = false;
  loginScreen.classList.add("is-active");
  setAccessRole(state.role, { syncQuery: false });
  loginPanel.scrollTo({ top: 0, behavior: "auto" });
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showExperiencePicker(returnTo = workspaceShell.hidden ? "login" : "workspace") {
  state.experienceReturn = returnTo;
  setExperiencePickerActive(true);
  if (accountDialog.open) accountDialog.close();
  loginScreen.hidden = true;
  loginScreen.classList.remove("is-active");
  workspaceShell.hidden = true;
  experienceScreen.hidden = false;
  experienceScreen.classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "auto" });
}

function chooseExperience(experience) {
  setExperience(experience);
  setAccessRole(state.role);
  syncExperienceQuery(experience);
  setExperiencePickerActive(false);
  experienceScreen.hidden = true;
  experienceScreen.classList.remove("is-active");
  if (state.experienceReturn === "workspace") {
    enterWorkspace("home");
    return;
  }
  showLoginScreen();
}

function syncExperienceQuery(experience) {
  const url = new URL(window.location.href);
  const hasExplicitExperience = url.searchParams.has("experience") || url.searchParams.has("login");
  if (!hasExplicitExperience) return;
  url.searchParams.delete("login");
  url.searchParams.set("experience", experience);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function syncAccessRoleQuery(role) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("role")) return;
  url.searchParams.set("role", role);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function initialiseExperience() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("experience") || params.get("login");
  const initial = experienceNames[requested] ? requested : "terracota";
  setExperience(initial, { persist: true });
  showLoginScreen();
}

function setAccessRole(role, options = {}) {
  if (!accessRoles[role]) return false;
  state.role = role;
  document.querySelectorAll("[data-access-role]").forEach((button) => {
    const active = button.dataset.accessRole === role;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-preview-role]").forEach((button) => {
    const active = button.dataset.previewRole === role;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  loginScreen.dataset.selectedRole = role;
  selectedRoleLabel.textContent = accessRoles[role].label;
  if (state.experience === "terracota") {
    loginTitle.textContent = role === "coach" ? "Acesso do professor" : "Acesso do aluno";
  }
  loginIdentity.value = accessRoles[role].identity;
  loginPassword.value = "homologacao";
  if (options.syncQuery !== false) syncAccessRoleQuery(role);
  return true;
}

function renderNavigation() {
  const items = navigation[state.role];
  const markup = items
    .map((item) => `
      <button type="button" data-nav-route="${item.route}" aria-label="${item.label}">
        ${icon(item.icon)}
        <span>${item.label}</span>
      </button>`)
    .join("");
  railNav.innerHTML = markup;
  mobileTabbar.innerHTML = markup;
  updateNavigationState();
}

function updateNavigationState() {
  document.querySelectorAll("[data-nav-route]").forEach((button) => {
    const active = button.dataset.navRoute === state.activeRoute && state.activeView !== "wellness";
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function targetViewForRoute(route) {
  if (route === "wellness" || route === "account") return route;
  if (state.role === "student") return `student-${route}`;
  if (route === "coach-agenda") return "coach-agenda";
  return `coach-${route}`;
}

function updatePageHeader(view) {
  const [overline, title] = pageMeta[view] || ["VP STUDIO", "Aplicativo"];
  document.querySelector("#page-overline").textContent = overline;
  document.querySelector("#page-title").textContent = title;
}

function setRoute(route, options = {}) {
  const view = targetViewForRoute(route);
  const target = document.querySelector(`[data-view="${view}"]`);
  if (!target) return;

  state.activeRoute = route;
  state.activeView = view;
  document.querySelectorAll(".app-view").forEach((section) => {
    const active = section === target;
    section.classList.toggle("is-active", active);
    section.setAttribute("aria-hidden", String(!active));
  });

  workspaceShell.classList.toggle("is-onboarding", view === "account");
  workspaceShell.classList.toggle("is-wellness", view === "wellness");
  updatePageHeader(view);
  updateNavigationState();

  if (view === "wellness" && options.resetWellness !== false) {
    state.wellnessIndex = 0;
    renderWellness();
  }

  if (view === "coach-agenda" && window.matchMedia("(max-width: 900px)").matches) {
    const calendar = document.querySelector("#coach-calendar");
    const today = calendar?.querySelector(".is-today");
    if (calendar && today) calendar.scrollTo({ left: Math.max(0, today.offsetLeft - 54), behavior: "auto" });
  }

  document.querySelector(".workspace-content").scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
  window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
}

function enterWorkspace(initialRoute = "home") {
  experienceScreen.classList.remove("is-active");
  experienceScreen.hidden = true;
  loginScreen.classList.remove("is-active");
  loginScreen.hidden = true;
  workspaceShell.hidden = false;
  workspaceShell.classList.add("is-active");

  const coach = state.role === "coach";
  document.querySelector("#rail-role").textContent = coach ? "Área do professor" : "Área do aluno";
  document.querySelector("#mobile-context").textContent = coach ? "PROFESSOR" : "STUDIO";
  document.querySelector("#header-avatar").textContent = coach ? "VP" : "CM";
  document.querySelector("#header-name").textContent = coach ? "Vinicius Pontes" : "Carolina Mendes";
  document.querySelector("#header-role").textContent = coach ? "Professor" : "Aluno";
  document.querySelector("#account-avatar").textContent = coach ? "VP" : "CM";
  document.querySelector("#account-name").textContent = coach ? "Vinicius Pontes" : "Carolina Mendes";
  document.querySelector("#account-role").textContent = coach ? "Professor" : "Aluno";
  document.querySelector("[data-account-profile]").hidden = coach;

  renderNavigation();
  updateCheckinCard();
  setRoute(initialRoute, { instant: true });
  window.scrollTo({ top: 0, behavior: "auto" });
}

function logout() {
  if (accountDialog.open) accountDialog.close();
  loginPassword.type = "password";
  passwordToggle.textContent = "Mostrar";
  passwordToggle.setAttribute("aria-label", "Mostrar senha");
  state.activeRoute = "home";
  state.activeView = "student-home";
  showLoginScreen();
  loginTitle.focus({ preventScroll: true });
}

function activeWellnessSteps() {
  return wellnessDefinition.filter((step) => !step.conditional || step.conditional(state.wellnessAnswers));
}

function wellnessScaleMarkup(step) {
  let options = [...scaleOptions];
  if (step.kind === "scale-reverse") {
    options = options.map((option, index) => ({
      ...option,
      value: String(index + 1),
      label: ["Muito alto", "Alto", "Moderado", "Baixo", "Muito baixo"][index],
    }));
  }
  if (step.kind === "pain-scale") {
    options = options.map((option, index) => ({
      ...option,
      value: String(index + 1),
      label: ["Muito forte", "Forte", "Moderada", "Leve", "Sem dor"][index],
    }));
  }
  if (step.kind === "hydration") {
    options = options.map((option, index) => ({
      ...option,
      value: String(index + 1),
      emoji: "💧",
      label: ["Muito baixa", "Baixa", "Regular", "Boa", "Muito boa"][index],
    }));
  }

  return `
    <div class="wellness-question">
      <span class="overline">${step.overline}</span>
      <h3>${step.title}</h3>
      <p>${step.helper}</p>
      <div class="response-scale" role="group" aria-label="${step.title}">
        ${options.map((option) => `
          <button class="response-scale__option response-scale__option--${option.tone}${state.wellnessAnswers[step.id] === option.value ? " is-selected" : ""}" type="button" data-scale-value="${option.value}" aria-pressed="${state.wellnessAnswers[step.id] === option.value}">
            <span class="response-scale__emoji" aria-hidden="true">${option.emoji}</span>
            <strong>${option.label}</strong>
            <small>${option.value}</small>
          </button>`).join("")}
      </div>
    </div>`;
}

function wellnessPsrMarkup(step) {
  const levels = [
    ["10", "Recuperação total"],
    ["9", "Recuperação muito boa"],
    ["8", "Recuperação boa"],
    ["7", "Sinto-me bem recuperado"],
    ["6", "Recuperação moderada"],
    ["5", "Recuperação parcial"],
    ["4", "Recuperação baixa"],
    ["3", "Pouca recuperação"],
    ["2", "Recuperação muito baixa"],
    ["1", "Sem recuperação"],
  ];
  return `
    <div class="wellness-question wellness-question--psr">
      <span class="overline">${step.overline}</span>
      <h3>${step.title}</h3>
      <p>${step.helper}</p>
      <div class="psr-grid" role="group" aria-label="Escala de percepção subjetiva de recuperação">
        ${levels.map(([value, label]) => `
          <button type="button" class="psr-option psr-option--${value}${state.wellnessAnswers.psr === value ? " is-selected" : ""}" data-psr-value="${value}" aria-pressed="${state.wellnessAnswers.psr === value}">
            <strong>${value}</strong>
            <span>${label}</span>
          </button>`).join("")}
      </div>
      <details class="scale-explanation">
        <summary>O que é PSR?</summary>
        <p>A PSR registra como você percebe sua recuperação antes do treino. Ela não substitui avaliação de saúde ou diagnóstico.</p>
      </details>
    </div>`;
}

function wellnessCycleMarkup(step) {
  const cycle = state.wellnessAnswers.cycle || { enabled: null, flow: null, pain: null, symptoms: [] };
  return `
    <div class="wellness-question wellness-question--cycle">
      <span class="overline">${step.overline}</span>
      <h3>${step.title}</h3>
      <p>${step.helper}</p>
      <div class="binary-choice" role="group" aria-label="Registrar ciclo">
        <button type="button" data-cycle-enabled="true" class="${cycle.enabled === true ? "is-selected" : ""}">Sim, registrar hoje</button>
        <button type="button" data-cycle-enabled="false" class="${cycle.enabled === false ? "is-selected" : ""}">Não hoje</button>
      </div>
      ${cycle.enabled === true ? `
        <section class="cycle-details">
          <label>
            <span>Fluxo menstrual</span>
            <div class="cycle-levels" role="group">
              ${["Ausente", "Leve", "Moderado", "Intenso"].map((label, index) => `<button type="button" data-cycle-flow="${index}" class="${cycle.flow === index ? "is-selected" : ""}">${label}</button>`).join("")}
            </div>
          </label>
          <label>
            <span>Dor menstrual</span>
            <div class="cycle-levels cycle-levels--pain" role="group">
              ${["Nenhuma", "Leve", "Moderada", "Forte"].map((label, index) => `<button type="button" data-cycle-pain="${index}" class="${cycle.pain === index ? "is-selected" : ""}">${label}</button>`).join("")}
            </div>
          </label>
          <fieldset>
            <legend>Sintomas percebidos</legend>
            ${["Cólica", "Dor lombar", "Inchaço", "Dor de cabeça", "Sensibilidade nas mamas"].map((label) => `<label><input type="checkbox" value="${label}" data-cycle-symptom ${cycle.symptoms.includes(label) ? "checked" : ""} /><span>${label}</span></label>`).join("")}
          </fieldset>
          <label class="field"><span>Observação opcional</span><textarea rows="3" data-cycle-note placeholder="Algo que o professor deva considerar?">${cycle.note || ""}</textarea></label>
        </section>` : ""}
    </div>`;
}

function stepIsAnswered(step) {
  if (["scale", "scale-reverse", "pain-scale", "hydration"].includes(step.kind)) {
    return Boolean(state.wellnessAnswers[step.id]);
  }
  if (step.kind === "psr") return Boolean(state.wellnessAnswers.psr);
  if (step.kind === "body") return state.bodyPoints.length > 0;
  if (step.kind === "cycle") {
    const cycle = state.wellnessAnswers.cycle;
    if (!cycle || cycle.enabled === null) return false;
    if (cycle.enabled === false) return true;
    return cycle.flow !== null && cycle.pain !== null;
  }
  return true;
}

function wireScaleStep(step, stage) {
  stage.querySelectorAll("[data-scale-value]").forEach((button) => {
    button.addEventListener("click", () => {
      state.wellnessAnswers[step.id] = button.dataset.scaleValue;
      if (step.id === "musclePain" && button.dataset.scaleValue === "5") {
        state.bodyPoints = [];
        delete state.wellnessAnswers.bodyMap;
      }
      renderWellness();
    });
  });
}

function wireCycleStep(stage) {
  const ensureCycle = () => {
    if (!state.wellnessAnswers.cycle) {
      state.wellnessAnswers.cycle = { enabled: null, flow: null, pain: null, symptoms: [], note: "" };
    }
    return state.wellnessAnswers.cycle;
  };

  stage.querySelectorAll("[data-cycle-enabled]").forEach((button) => {
    button.addEventListener("click", () => {
      const cycle = ensureCycle();
      cycle.enabled = button.dataset.cycleEnabled === "true";
      if (!cycle.enabled) {
        cycle.flow = null;
        cycle.pain = null;
        cycle.symptoms = [];
        cycle.note = "";
      }
      renderWellness();
    });
  });
  stage.querySelectorAll("[data-cycle-flow]").forEach((button) => {
    button.addEventListener("click", () => {
      ensureCycle().flow = Number(button.dataset.cycleFlow);
      renderWellness();
    });
  });
  stage.querySelectorAll("[data-cycle-pain]").forEach((button) => {
    button.addEventListener("click", () => {
      ensureCycle().pain = Number(button.dataset.cyclePain);
      renderWellness();
    });
  });
  stage.querySelectorAll("[data-cycle-symptom]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const cycle = ensureCycle();
      cycle.symptoms = [...stage.querySelectorAll("[data-cycle-symptom]:checked")].map((input) => input.value);
    });
  });
  stage.querySelector("[data-cycle-note]")?.addEventListener("input", (event) => {
    ensureCycle().note = event.currentTarget.value;
  });
}

function renderWellness() {
  const steps = activeWellnessSteps();
  state.wellnessIndex = Math.min(state.wellnessIndex, steps.length - 1);
  const step = steps[state.wellnessIndex];
  const stage = document.querySelector("#wellness-stage");
  const next = document.querySelector("#wellness-next");
  const back = document.querySelector("#wellness-back");
  const progress = ((state.wellnessIndex + 1) / steps.length) * 100;

  document.querySelector("#wellness-step-label").textContent = `${state.wellnessIndex + 1} de ${steps.length}`;
  document.querySelector("#wellness-progress").style.width = `${progress}%`;
  back.disabled = state.wellnessIndex === 0;

  if (["scale", "scale-reverse", "pain-scale", "hydration"].includes(step.kind)) {
    stage.innerHTML = wellnessScaleMarkup(step);
    wireScaleStep(step, stage);
  } else if (step.kind === "psr") {
    stage.innerHTML = wellnessPsrMarkup(step);
    stage.querySelectorAll("[data-psr-value]").forEach((button) => {
      button.addEventListener("click", () => {
        state.wellnessAnswers.psr = button.dataset.psrValue;
        renderWellness();
      });
    });
  } else if (step.kind === "body") {
    stage.innerHTML = `
      <div class="wellness-question wellness-question--body">
        <span class="overline">${step.overline}</span>
        <h3>${step.title}</h3>
        <p>${step.helper}</p>
        <div id="body-map-root"></div>
      </div>`;
    mountBodyMap(stage.querySelector("#body-map-root"), {
      profileSex: state.profileSex,
      initialPoints: state.bodyPoints,
      onChange(points) {
        state.bodyPoints = points;
        state.wellnessAnswers.bodyMap = points;
        next.disabled = points.length === 0;
      },
    });
  } else if (step.kind === "cycle") {
    stage.innerHTML = wellnessCycleMarkup(step);
    wireCycleStep(stage);
  }

  const lastStep = state.wellnessIndex === steps.length - 1;
  next.disabled = !stepIsAnswered(step);
  next.innerHTML = lastStep
    ? `Salvar check-in ${icon("check")}`
    : `Continuar ${icon("arrow")}`;
}

function saveWellnessCheckin() {
  const history = readWellnessHistory();
  const updatedAt = new Date().toISOString();
  const today = localDayKey(updatedAt);
  const existingIndex = history.findIndex((entry) => localDayKey(entry.updatedAt || entry.createdAt) === today);
  const existing = existingIndex >= 0 ? history[existingIndex] : null;
  const record = {
    id: existing?.id || crypto.randomUUID?.() || `checkin-${Date.now()}`,
    createdAt: existing?.createdAt || updatedAt,
    updatedAt,
    answers: copyAnswers(state.wellnessAnswers),
  };
  if (existingIndex >= 0) history[existingIndex] = record;
  else history.push(record);
  localStorage.setItem("vp-demo-wellness-history", JSON.stringify(history.slice(-30)));
  localStorage.setItem("vp-demo-checkin-completed", "true");
  localStorage.setItem("vp-demo-checkin-completed-at", updatedAt);
  state.checkinCompleted = true;
  state.checkinCompletedAt = updatedAt;
  updateCheckinCard();
  showToast("Check-in salvo neste aparelho.");
  setRoute("home");
}

function updateCheckinCard() {
  const card = document.querySelector("#wellness-hero");
  if (!card) return;
  const completedDate = state.checkinCompletedAt ? new Date(state.checkinCompletedAt) : null;
  const completedTime = completedDate && !Number.isNaN(completedDate.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(completedDate)
    : null;
  card.classList.toggle("is-complete", state.checkinCompleted);
  document.querySelector("#wellness-status-title").textContent = state.checkinCompleted ? "Concluído" : "Pendente";
  document.querySelector("#wellness-question-title").textContent = state.checkinCompleted
    ? (completedTime ? `Check-in registrado às ${completedTime}` : "Check-in de hoje registrado")
    : "Como seu corpo está hoje?";
  document.querySelector("#wellness-question-helper").textContent = state.checkinCompleted
    ? "As respostas de hoje estão salvas neste aparelho."
    : "Sono, energia, recuperação e desconfortos.";
  document.querySelector("#wellness-action-label").textContent = state.checkinCompleted ? "Revisar respostas" : "Responder agora";
}

function setupInstallPrompt() {
  const installButtons = [
    document.querySelector("#install-app-button"),
    document.querySelector("#mobile-install-row"),
  ].filter(Boolean);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    installButtons.forEach((button) => { button.hidden = false; });
  });

  installButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.deferredInstallPrompt) {
        showToast("No iPhone, use Compartilhar e depois “Adicionar à Tela de Início”.");
        return;
      }
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice;
      state.deferredInstallPrompt = null;
      installButtons.forEach((item) => { item.hidden = true; });
    });
  });
}

function setupPwa() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app remains usable online if cache registration is unavailable.
    });
  }
  setupInstallPrompt();
}

function wireStaticControls() {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
  });

  document.querySelectorAll("[data-access-role]").forEach((button) => {
    button.addEventListener("click", () => setAccessRole(button.dataset.accessRole));
  });

  document.querySelectorAll("[data-preview-role]").forEach((button) => {
    button.addEventListener("click", () => {
      setAccessRole(button.dataset.previewRole);
      chooseExperience(button.dataset.previewExperience);
    });
  });

  document.querySelectorAll("[data-experience-choice]").forEach((button) => {
    button.addEventListener("click", () => chooseExperience(button.dataset.experienceChoice));
  });

  document.querySelectorAll("[data-open-experience]").forEach((button) => {
    button.addEventListener("click", () => {
      showExperiencePicker(workspaceShell.hidden ? "login" : "workspace");
    });
  });

  document.querySelectorAll("[data-account-menu]").forEach((button) => {
    button.addEventListener("click", () => accountDialog.showModal());
  });
  document.querySelector("[data-account-close]").addEventListener("click", () => accountDialog.close());
  document.querySelector("[data-account-profile]").addEventListener("click", () => {
    accountDialog.close();
    setRoute("profile");
  });
  accountDialog.addEventListener("click", (event) => {
    if (event.target === accountDialog) accountDialog.close();
  });

  document.querySelector("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (rememberProfile.checked) localStorage.setItem("vp-remembered-role", state.role);
    else localStorage.removeItem("vp-remembered-role");
    enterWorkspace("home");
  });

  passwordToggle.addEventListener("click", (event) => {
    const reveal = loginPassword.type === "password";
    loginPassword.type = reveal ? "text" : "password";
    event.currentTarget.textContent = reveal ? "Ocultar" : "Mostrar";
    event.currentTarget.setAttribute("aria-label", reveal ? "Ocultar senha" : "Mostrar senha");
  });

  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav-route]");
    if (nav) setRoute(nav.dataset.navRoute);

    const route = event.target.closest("[data-route]");
    if (route) {
      if (workspaceShell.hidden && route.dataset.route === "account") {
        setAccessRole("student");
        enterWorkspace("account");
      } else {
        setRoute(route.dataset.route);
      }
    }

    const toastTrigger = event.target.closest("[data-toast]");
    if (toastTrigger) showToast(toastTrigger.dataset.toast);

    if (event.target.closest("[data-logout]")) logout();
  });

  toast.querySelector("button").addEventListener("click", () => toast.classList.remove("is-visible"));

  document.querySelector("#wellness-back").addEventListener("click", () => {
    if (state.wellnessIndex === 0) {
      setRoute("home");
      return;
    }
    state.wellnessIndex -= 1;
    renderWellness();
  });

  document.querySelector("#wellness-next").addEventListener("click", () => {
    const steps = activeWellnessSteps();
    const step = steps[state.wellnessIndex];
    if (!stepIsAnswered(step)) return;
    if (state.wellnessIndex === steps.length - 1) {
      saveWellnessCheckin();
      return;
    }
    state.wellnessIndex += 1;
    renderWellness();
  });

  document.querySelector("#account-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedProfileSex = formData.get("profileSex");
    state.profileSex = selectedProfileSex === "male" ? "male" : "female";
    localStorage.setItem("vp-demo-profile-sex", state.profileSex);
    setAccessRole("student");
    loginIdentity.value = String(formData.get("email") || "");
    loginPassword.value = String(formData.get("password") || "");
    workspaceShell.classList.remove("is-active", "is-onboarding");
    showLoginScreen();
    showToast("Conta de demonstração criada. Entre para continuar.");
  });

  document.querySelectorAll(".date-strip button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".date-strip button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      showToast(`Agenda de ${button.querySelector("span").textContent.toLowerCase()} selecionada.`);
    });
  });

  document.querySelectorAll(".coach-calendar__day button").forEach((button) => {
    button.addEventListener("click", () => showToast(`Aula “${button.childNodes[0].textContent.trim()}” aberta para edição.`));
  });

  document.querySelectorAll(".calendar-toolbar button").forEach((button) => {
    button.addEventListener("click", () => showToast("Período da agenda atualizado."));
  });

  document.querySelectorAll(".builder-list .icon-control").forEach((button) => {
    button.addEventListener("click", () => showToast("Opções do exercício abertas."));
  });

  document.querySelector("#suggest-exercises").addEventListener("click", () => {
    showToast("Exercícios sorteados pelos critérios. Revise antes de publicar.");
    document.querySelector("#builder-list").classList.add("is-refreshed");
    window.setTimeout(() => document.querySelector("#builder-list").classList.remove("is-refreshed"), 700);
  });

  document.querySelector("#publish-workout").addEventListener("click", () => {
    showToast("Treino publicado para Carolina com histórico da versão preservado.");
  });

  const studentSearch = document.querySelector("#student-search");
  studentSearch.addEventListener("input", () => {
    const query = studentSearch.value.trim().toLocaleLowerCase("pt-BR");
    document.querySelectorAll("#student-table [data-student-name]").forEach((row) => {
      row.hidden = !row.dataset.studentName.toLocaleLowerCase("pt-BR").includes(query);
    });
  });

  const workoutDialog = document.querySelector("#workout-dialog");
  document.querySelector("#start-workout").addEventListener("click", () => workoutDialog.showModal());
  workoutDialog.querySelector(".dialog-close").addEventListener("click", () => workoutDialog.close());
  workoutDialog.querySelectorAll("[data-pse]").forEach((button) => {
    button.addEventListener("click", () => {
      workoutDialog.querySelectorAll("[data-pse]").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      document.querySelector("#save-pse").disabled = false;
    });
  });
  document.querySelector("#save-pse").addEventListener("click", () => {
    const value = workoutDialog.querySelector("[data-pse].is-selected")?.dataset.pse;
    workoutDialog.close();
    showToast(`PSE ${value} registrada no histórico deste treino.`);
  });
}

function runDiagnostics() {
  const bodyMapValidation = validateBodyMapCatalog();
  if (!bodyMapValidation.valid) {
    console.error("Falha no catálogo do mapa corporal:", bodyMapValidation.errors);
  }
}

initialiseTheme();
initialiseExperience();
setAccessRole(
  new URLSearchParams(window.location.search).get("role")
    || localStorage.getItem("vp-remembered-role")
    || "student",
  { syncQuery: false },
);
wireStaticControls();
setupPwa();
runDiagnostics();
