import { id, dayKey, addDays } from "./domain.js";

export function seedData() {
  const today = dayKey();
  const students = [
    { id: "carolina", name: "Carolina Mendes", email: "carolina@vpstudio.com.br", gender: "Feminino", trackCycle: true, conditions: ["Hipertensão"], conditionNotes: "Condição informada na anamnese. Conferir orientações no perfil.", rankingOptIn: true },
    { id: "rafael", name: "Rafael Lima", email: "rafael@vpstudio.com.br", gender: "Masculino", trackCycle: false, conditions: [], rankingOptIn: true },
    { id: "ana", name: "Ana Souza", email: "ana@vpstudio.com.br", gender: "Feminino", trackCycle: false, conditions: ["Diabetes"], rankingOptIn: false },
  ];
  const catalog = [
    ["Agachamento no banco", "Quadríceps"], ["Leg press", "Quadríceps"], ["Desenvolvimento com halteres", "Ombro"], ["Elevação lateral", "Ombro"],
    ["Remada baixa", "Costas"], ["Supino com halteres", "Peito"], ["Mesa flexora", "Posterior de coxa"], ["Elevação pélvica", "Glúteo"],
    ["Panturrilha em pé", "Panturrilhas"], ["Rosca com halteres", "Bíceps"], ["Tríceps na polia", "Tríceps"], ["Prancha", "Abdômen"], ["Caminhada", "Cardio"],
  ].map(([name, emphasis], index) => ({ id: `exercise-${index}`, name, emphasis, category: emphasis === "Cardio" ? "cardio" : "strength", active: true }));
  return {
    schemaVersion: 1, students, catalog,
    slots: ["07:00", "08:00", "09:00", "11:00", "16:30", "17:30", "18:30", "19:40", "20:40"].map((time,index) => ({ id: `slot-${index}`, time, days: [1,3,5], capacity: 10, startsOn: addDays(today,-365) })),
    recurring: [{ id: id(), slotId: "slot-6", studentId: "carolina", from: today }, { id: id(), slotId: "slot-6", studentId: "rafael", from: today }],
    bookings: [], attendance: [], wellness: [], forms: [], assessments: [], sessions: [], notifications: [], documents: [], events: [],
    invoices: [{ id: id(), studentId: "carolina", label: "Mensalidade", amount: 280, dueDate: addDays(today,3), status: "pending" }],
    workouts: [{ id: id(), studentId: "carolina", letter: "A", version: 1, title: "Força geral", publishedAt: new Date().toISOString(), notes: "Comece com 5 minutos de caminhada confortável. Faça a mobilidade orientada pelo professor.", exercises: catalog.slice(0,4).map((e) => ({ ...e, sets: 3, reps: 12, rest: 60, weight: 0 })) }],
    posts: [{ id: id(), title: "Horários do Studio", text: "Nossas aulas acontecem às segundas, quartas e sextas. Consulte as vagas na agenda.", createdAt: new Date().toISOString() }],
    settings: { reminders: ["08:00", "17:00"], notifyPain: true, notifyCycle: true },
  };
}

export async function openDemoStore() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("vp-studio-meeting-v1", 1);
    request.onupgradeneeded = () => { request.result.createObjectStore("state"); request.result.createObjectStore("files"); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("vp-studio-demo-updates") : null;
  const subscribers = new Set();
  const read = () => new Promise((resolve,reject) => {
    const request = db.transaction("state").objectStore("state").get("studio");
    request.onsuccess = () => resolve(request.result || seedData()); request.onerror = () => reject(request.error);
  });
  const update = (action, actor, mutate) => new Promise((resolve,reject) => {
    // The read and write share one transaction, preventing lost updates across local tabs.
    const tx = db.transaction("state", "readwrite"), store = tx.objectStore("state");
    const request = store.get("studio"); let next, cause;
    request.onsuccess = () => {
      try {
        next = request.result || seedData();
        const before = structuredClone(next);
        mutate(next);
        const changes = Object.keys(next).filter(key => key !== 'events' && JSON.stringify(before[key]) !== JSON.stringify(next[key])).map(key => ({ collection:key, before:before[key], after:structuredClone(next[key]) }));
        next.events.push({ id: id(), action, actor, at: new Date().toISOString(), changes }); store.put(next,"studio");
      }
      catch(error) { cause = error; tx.abort(); }
    };
    tx.oncomplete = () => { channel?.postMessage("changed"); resolve(next); };
    tx.onabort = tx.onerror = () => reject(cause || tx.error || new Error("Não foi possível salvar. Tente novamente."));
  });
  channel && (channel.onmessage = () => subscribers.forEach((listener) => listener()));
  const initial = await read();
  if (!initial.events.length) await update("Ambiente de demonstração iniciado", "demo", () => {});
  return {
    read, update, subscribe: (listener) => subscribers.add(listener),
    async putFile(file, studentId, kind) {
      if (!['application/pdf','image/jpeg','image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Use PDF, JPG ou PNG de até 10 MB.");
      const document = { id:id(), studentId, kind, name:file.name, type:file.type, size:file.size, createdAt:new Date().toISOString() };
      await new Promise((resolve,reject) => {
        const tx=db.transaction(["state","files"],"readwrite"), request=tx.objectStore("state").get("studio");
        request.onsuccess=()=> { const data=request.result; data.documents.push(document); data.events.push({id:id(),action:"Documento anexado",actor:studentId,at:document.createdAt}); tx.objectStore("state").put(data,"studio"); tx.objectStore("files").put(file,document.id); };
        tx.oncomplete=resolve; tx.onabort=tx.onerror=()=>reject(tx.error);
      });
      channel?.postMessage("changed"); return document;
    },
    getFile(fileId) { return new Promise((resolve,reject) => { const request=db.transaction("files").objectStore("files").get(fileId); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); }); },
  };
}
