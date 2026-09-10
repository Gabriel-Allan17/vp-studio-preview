export const BRAND = { name: "Vinicius Pontes", label: "Studio", logo: "assets/brand/vp-logo-gradient.png" };
export const FEATURES = { strengthRanking: false, physicalAssessmentBooking: false };
export const EMPHASES = ["Ombro", "Costas", "Peito", "Quadríceps", "Posterior de coxa", "Glúteo", "Panturrilhas", "Bíceps", "Tríceps", "Antebraço", "Abdômen", "Lombar", "Adutores", "Abdutores", "Inferiores"];
export const SYMPTOMS = ["Dor de cabeça", "Oscilação de pressão", "Diarreia", "Vômito ou náuseas", "Tontura", "Visão turva"];
export const CONDITIONS = ["Hipertensão", "Diabetes", "Condição cardíaca", "Asma", "Condição da tireoide", "Condição osteoarticular", "Outra"];
export const id = () => crypto.randomUUID();
export const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
export function dayKey(value = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
export function addDays(day, amount) { const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0, 10); }
export const weekday = (day) => new Date(`${day}T12:00:00Z`).getUTCDay();
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
export const classHasStarted = (date, time, now = new Date()) => Date.parse(`${date}T${time}:00-03:00`) <= new Date(now).getTime();
export function attendanceStreak(records, studentId) {
  const days = new Map();
  records.filter(r => r.studentId === studentId).sort((a,b)=>a.date.localeCompare(b.date)).forEach(r => days.set(r.date, (days.get(r.date) || false) || r.present));
  let streak = 0;
  for (const present of [...days.values()].reverse()) { if (!present) break; streak += 1; }
  return streak;
}
export function dueAlert(invoice, today = dayKey()) {
  return invoice && invoice.status === "pending" && daysBetween(today, invoice.dueDate) <= 3;
}
export function attendees(data, slot, date) {
  if (!slot.days.includes(weekday(date)) || date < slot.startsOn || (slot.endsOn && date > slot.endsOn)) return [];
  const recurring = data.recurring.filter((r) => r.slotId === slot.id && r.from <= date && (!r.until || r.until >= date));
  const cancelled = new Set(data.bookings.filter((r) => r.slotId === slot.id && r.date === date && r.status === "cancelled").map((r) => r.studentId));
  const variable = data.bookings.filter((r) => r.slotId === slot.id && r.date === date && r.status === "confirmed");
  return [...new Set([...recurring, ...variable].map((r) => r.studentId))].filter((student) => !cancelled.has(student));
}
export function bookClass(data, { studentId, slotId, date }, today = dayKey(), now = new Date()) {
  const slot = data.slots.find((item) => item.id === slotId);
  if (!slot || !slot.days.includes(weekday(date)) || date < today || date < slot.startsOn || (slot.endsOn && date > slot.endsOn)) throw new Error("Este horário não está disponível nesta data.");
  if (date === dayKey(now) && classHasStarted(date, slot.time, now)) throw new Error("Esta aula já começou. Escolha um horário futuro.");
  const members = attendees(data, slot, date);
  if (members.includes(studentId)) throw new Error("Sua presença já está confirmada neste horário.");
  if (members.length >= slot.capacity) throw new Error("Esta turma está cheia. Escolha outro horário.");
  const otherSlot = data.slots.find((item) => item.time === slot.time && item.id !== slotId && attendees(data, item, date).includes(studentId));
  if (otherSlot) throw new Error("Você já tem uma aula neste mesmo horário.");
  const cancelled = data.bookings.find((r) => r.slotId === slotId && r.date === date && r.studentId === studentId);
  if (cancelled) cancelled.status = "confirmed";
  else data.bookings.push({ id: id(), studentId, slotId, date, status: "confirmed" });
}
export function readiness(answers) {
  const keys = ["sleep", "energy", "stress", "mood", "musclePain", "hydration"];
  if (keys.some((key) => !Number.isFinite(Number(answers[key])) || Number(answers[key]) < 1 || Number(answers[key]) > 5)) return null;
  return Math.round(keys.reduce((sum, key) => sum + (Number(answers[key]) - 1) * 25, 0) / keys.length);
}
export function sessionLoad(session) {
  if (session.status !== "completed" || !Number.isFinite(session.pse) || session.pse < 0 || session.pse > 10 || !(session.minutes > 0)) return null;
  return session.minutes * session.pse;
}
export function loadMetrics(daily) {
  // Missing days are unknown, never silently converted to rest days.
  if (daily.length !== 28 || daily.some((value) => !Number.isFinite(value) || value < 0)) return { acute: null, chronic: null, ratio: null, strain: null };
  const week = daily.slice(-7);
  const acute = week.reduce((a, b) => a + b, 0);
  const chronic = daily.reduce((a, b) => a + b, 0) / 4;
  const mean = acute / 7;
  const sd = Math.sqrt(week.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 7);
  return { acute, chronic, ratio: chronic > 0 ? acute / chronic : null, strain: sd > 0 ? acute * mean / sd : null };
}
export function drawExercises(catalog, criteria, random = Math.random) {
  const chosen = [];
  for (const [emphasis, count] of Object.entries(criteria)) {
    if (!Number.isInteger(count) || count < 0 || count > 20) throw new Error("Informe de 0 a 20 exercícios por ênfase.");
    const pool = catalog.filter((exercise) => exercise.active && exercise.emphasis === emphasis && !chosen.some((item) => item.id === exercise.id));
    if (pool.length < count) throw new Error(`A base tem apenas ${pool.length} exercício(s) de ${emphasis}. Ajuste a quantidade ou cadastre mais exercícios.`);
    for (let n = 0; n < count; n += 1) chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return chosen;
}
export function rankStudents(data, metric, from, until) {
  const eligible = data.students.filter((student) => student.rankingOptIn);
  if (metric === "strength" && !FEATURES.strengthRanking) return [];
  return eligible.map((student) => {
    if (metric === "attendance") return { id: student.id, name: student.name, value: data.attendance.filter((r) => r.studentId === student.id && r.present && r.date >= from && r.date <= until).length };
    const measures = data.assessments.filter((r) => r.studentId === student.id && r.date >= from && r.date <= until && Number.isFinite(r.muscleMass)).sort((a,b) => a.date.localeCompare(b.date));
    const first = measures[0], last = measures.at(-1);
    const value = measures.length >= 2 && first.method === last.method ? last.muscleMass - first.muscleMass : null;
    return { id: student.id, name: student.name, value };
  }).filter((r) => r.value !== null).sort((a,b) => b.value - a.value || a.name.localeCompare(b.name));
}
export function engagementReasons(data, studentId, today = dayKey()) {
  const present = data.attendance.filter((r) => r.studentId === studentId && r.present).sort((a,b) => b.date.localeCompare(a.date));
  const checks = data.wellness.filter((r) => r.studentId === studentId).sort((a,b) => b.date.localeCompare(a.date));
  const reasons = [];
  if (present.length && daysBetween(present[0].date, today) >= 14) reasons.push("Sem presença registrada há pelo menos 14 dias");
  if (checks.length && daysBetween(checks[0].date, today) >= 7) reasons.push("Sem questionário há pelo menos 7 dias");
  return reasons;
}
export const anamneseFields = [
  ["name", "Nome completo", "text", true], ["gender", "Gênero", "gender", true], ["birthDate", "Data de nascimento", "date", true],
  ["profession", "Profissão (se aposentado, atividade exercida por mais tempo)", "text", true], ["height", "Altura em centímetros", "number", true],
  ["medicalRecommendation", "Teve recomendação médica para praticar musculação?", "yesno", true], ["medicalCertificate", "Possui atestado médico para musculação?", "yesno", true],
  ["jointPain", "Sente dor em alguma articulação? Qual?", "textarea", true], ["surgery", "Já fez alguma cirurgia? Qual?", "textarea", true],
  ["fractures", "Já sofreu alguma fratura? Qual?", "textarea", false], ["medications", "Faz uso de alguma medicação? Qual e para quê?", "textarea", true],
  ["activities", "Pratica outra atividade física?", "textarea", true], ["limitations", "Tem dificuldade em algum movimento no dia a dia?", "textarea", true],
  ["trainingHistory", "Já fez musculação? Por quanto tempo? Há quanto tempo parou?", "textarea", true],
  ["familyHistory", "Histórico familiar de doença coronariana, morte súbita, problema cardíaco, hipertensão ou tireoide", "textarea", false],
  ["goals", "Objetivos com o treinamento", "goals", true], ["expectations", "O que você espera dos treinos?", "textarea", false],
  ["preferredTimes", "Horários de preferência", "text", false], ["phone", "Celular com DDD", "tel", true],
  ["emergencyContact", "Contato de emergência (nome e telefone)", "text", true], ["conditions", "Condições de saúde diagnosticadas em você", "conditions", false],
  ["conditionNotes", "Orientações, restrições e outras condições", "textarea", false], ["symptoms48h", "Teve algum destes sintomas nas últimas 48 horas?", "symptoms", false],
  ["trackCycle", "Deseja acompanhar o ciclo menstrual?", "yesno", true],
];
export const parqFields = [
  ["heartCondition", "Alguma vez seu médico disse que você possui um problema cardíaco e recomendou atividade física somente sob prescrição médica?", "yesno", true],
  ["exerciseChestPain", "Você sente dor no tórax quando pratica atividade física?", "yesno", true],
  ["restChestPain", "No último mês, sentiu dor no tórax quando não estava praticando atividade física?", "yesno", true],
  ["dizziness", "Perdeu o equilíbrio por tontura ou perdeu a consciência durante atividade física?", "yesno", true],
  ["boneJoint", "Tem algum problema ósseo ou articular que poderia ser agravado pela atividade física?", "yesno", true],
  ["boneJointDetails", "Se sim, qual problema ósseo ou articular?", "textarea", false],
  ["heartMedication", "Seu médico recomendou medicamentos para pressão arterial ou condição cardiovascular?", "yesno", true],
  ["otherReason", "Conhece outra razão pela qual não deveria praticar atividade física?", "yesno", true],
  ["additional", "Há alguma informação de saúde que deseja acrescentar?", "textarea", false],
];
