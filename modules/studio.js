import { BRAND, FEATURES, EMPHASES, SYMPTOMS, CONDITIONS, anamneseFields, parqFields, dayKey, addDays, daysBetween, weekday, dueAlert, attendees, bookClass, classHasStarted, attendanceStreak, drawExercises, rankStudents, readiness, sessionLoad, engagementReasons, escapeHTML as esc, id } from "./domain.js";
import { openDemoStore } from "./store.js";
import { exportWorkbook } from "./tabular-export.js";

const money = (value) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);
const dateLabel = (date) => new Intl.DateTimeFormat("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).format(new Date(`${date}T12:00:00`));
const btn = (label,action,attrs="",secondary=false) => `<button type="button" class="button ${secondary ? 'button--secondary' : 'button--primary'}" data-studio="${action}" ${attrs}>${label}</button>`;
const intro = (title,copy="") => `<header class="page-intro page-intro--compact"><div><h2 tabindex="-1">${esc(title)}</h2>${copy ? `<p>${esc(copy)}</p>`:""}</div></header>`;
const empty = (copy) => `<p class="studio-empty">${esc(copy)}</p>`;
const input = (label,name,value="",type="text",extra="") => `<label class="field"><span>${esc(label)}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const select = (label,name,options,value="") => `<label class="field"><span>${esc(label)}</span><select name="${name}">${options.map(([key,text]) => `<option value="${esc(key)}" ${String(key)===String(value)?"selected":""}>${esc(text)}</option>`).join("")}</select></label>`;

export async function createStudio({ state, setRoute, showToast, enterWorkspace, setAccessRole }) {
  const store = await openDemoStore();
  let data = await store.read(), selectedStudent = localStorage.getItem("vp-demo-selected-student") || "carolina";
  let profileStudent = selectedStudent, agendaDate = dayKey(), sessionId = null, formPart = 0, formDraft = {}, timerEnd = Number(localStorage.getItem('vp-rest-end')) || 0, sound = null;
  let draftWorkout = { studentId:"carolina", letter:"A", title:"", notes:"", exercises:[] }, builderMode="manual", exerciseCategory="strength";
  const dismissedInvoices = new Set();
  const surface = (view) => document.querySelector(`[data-view="${view}"]`);
  const activeStudent = () => data.students.find((s) => s.id===selectedStudent) || data.students[0];
  const studentFor = (studentId) => data.students.find((s)=>s.id===studentId);
  const actor = () => state.role === "coach" ? "professor" : selectedStudent;
  const currentWorkouts = (studentId=selectedStudent) => {
    const result=new Map(); data.workouts.filter((w)=>w.studentId===studentId).forEach((w)=>result.set(w.letter,w)); return [...result.values()].sort((a,b)=>a.letter.localeCompare(b.letter));
  };
  const recentWellness = (studentId=selectedStudent) => data.wellness.filter((r)=>r.studentId===studentId).sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt));
  const latestPerDay = (studentId=selectedStudent) => [...new Map(recentWellness(studentId).map((r)=>[r.date,r])).values()];
  const conditions = (student) => student?.conditions?.length ? `<button class="condition-flag" type="button" data-studio="conditions" data-student="${student.id}" aria-label="Condições de saúde de ${esc(student.name)}">Atenção à saúde · ${student.conditions.length}</button>` : "";
  const nextClasses = (studentId=selectedStudent) => {
    const result=[];
    for(let n=0;n<30;n++){const date=addDays(dayKey(),n); data.slots.forEach((slot)=>{if(!classHasStarted(date,slot.time)&&attendees(data,slot,date).includes(studentId))result.push({slot,date});});}
    return result.sort((a,b)=>(a.date+a.slot.time).localeCompare(b.date+b.slot.time));
  };
  const latest = (list) => list.at(-1);
  const notify = (next,type,studentId,message) => next.notifications.push({id:id(),type,studentId,message,createdAt:new Date().toISOString(),read:false});
  async function change(action,mutate,{render=true}={}) {
    data=await store.update(action,actor(),mutate);
    if(render) draw(state.activeView);
  }
  function dialog(title,body) {
    const node=document.querySelector("#studio-dialog"); node.querySelector("h2").textContent=title; node.querySelector(".studio-dialog-body").innerHTML=body;
    if(!node.open)node.showModal(); return node;
  }
  function closeDialog(){document.querySelector("#studio-dialog").close();}
  function studentRow(student,tail="") {
    return `<article class="studio-person"><button type="button" class="studio-person-link" data-studio="student-profile" data-student="${student.id}"><span class="studio-avatar" aria-hidden="true">${esc(student.name.split(" ").map(s=>s[0]).slice(0,2).join(""))}</span><span><strong>${esc(student.name)}</strong><small>${esc(tail||"Ver perfil e acompanhamento")}</small></span><span aria-hidden="true">›</span></button>${conditions(student)}</article>`;
  }
  function compact(title,value,detail,action,attrs="",attention=false) {
    return `<article class="studio-compact ${attention?'studio-payment-due':''}"><div><span class="overline">${title}</span><h3>${esc(value)}</h3>${detail?`<p>${esc(detail)}</p>`:""}</div><button class="text-button" type="button" data-studio="${action}" ${attrs}>Ver detalhes <span aria-hidden="true">›</span></button></article>`;
  }
  function home() {
    const student=activeStudent(), next=nextClasses()[0], invoice=data.invoices.find(i=>i.studentId===student.id&&dueAlert(i));
    const check=latest(latestPerDay()), complete=check?.date===dayKey();
    const greetings=[`E aí, ${student.name.split(" ")[0]}.`,`Bom te ver, ${student.name.split(" ")[0]}.`,`Vamos nessa, ${student.name.split(" ")[0]}?`];
    return `${intro(greetings[new Date().getDate()%greetings.length])}
      <button class="wellness-hero studio-wellness" id="wellness-hero" type="button" data-studio="wellness"><span class="overline">Questionário de Bem-Estar</span><strong id="wellness-question-title">Como você está se sentindo hoje?</strong><span id="wellness-question-helper">${complete?'Respondido hoje. Você pode revisar suas respostas.':'Conte como foi seu sono, sua recuperação e sua disposição.'}</span><span class="studio-wellness-foot"><small id="wellness-status-title">${complete?'Concluído':'Pendente hoje'}</small><b id="wellness-action-label">${complete?'Revisar':'Responder'} →</b></span></button>
      <div class="studio-stack">${compact("PRÓXIMA AULA",next?`${dateLabel(next.date)} · ${next.slot.time}`:"Nenhuma aula agendada",next?"Presença confirmada":"Escolha um horário na agenda","agenda")}
      ${compact("TREINO ATUAL",currentWorkouts().map(w=>w.letter).join(" · ")||"Aguardando seu treino",currentWorkouts()[0]?.title||"Seu professor publicará seu programa.","workout")}
      ${invoice?compact("FINANCEIRO",money(invoice.amount),`${daysBetween(dayKey(),invoice.dueDate)<0?'Vencido em':'Vencimento em'} ${dateLabel(invoice.dueDate)}`,"finance","",true):""}</div>
      <section class="section-block"><header class="section-title"><h3>Mural do Studio</h3></header><div class="studio-stack">${data.posts.map(post=>`<article class="card"><h3>${esc(post.title)}</h3><p>${esc(post.text)}</p></article>`).join("")}</div></section>`;
  }
  function agenda(coach=false) {
    const slots=data.slots.filter(slot=>slot.days.includes(weekday(agendaDate))&&agendaDate>=slot.startsOn&&(!slot.endsOn||agendaDate<=slot.endsOn));
    const next=nextClasses()[0];
    if(!coach)return `${intro("Minhas aulas")}${next?compact("SUA PRÓXIMA AULA",`${dateLabel(next.date)} · ${next.slot.time}`,"Presença confirmada","class-details",`data-slot="${next.slot.id}" data-date="${next.date}"`):empty("Você ainda não tem uma aula confirmada.")}
      <details class="studio-details"><summary>Outras aulas confirmadas</summary>${nextClasses().slice(1,9).map(c=>`<p>${dateLabel(c.date)} · ${c.slot.time}</p>`).join("")||empty("Não há outras aulas no momento.")}</details>
      <div class="studio-agenda-bottom"><p class="studio-confirmation">${next?'Sua próxima aula está confirmada.':'Agende uma aula para confirmar sua presença.'}</p>${btn("Agendar aula","book-dialog")}</div>`;
    return `${intro("Agenda do Studio")}${input("Data das turmas","coachDate",agendaDate,"date")}
      <details class="studio-details"><summary>Horários com vagas <small>${slots.filter(s=>attendees(data,s,agendaDate).length<s.capacity).length} disponíveis</small></summary>${slots.filter(s=>attendees(data,s,agendaDate).length<s.capacity).map(s=>`<div class="vacancy-row"><strong>${s.time}</strong><meter min="0" max="${s.capacity}" value="${s.capacity-attendees(data,s,agendaDate).length}"></meter><span>${s.capacity-attendees(data,s,agendaDate).length} vagas</span></div>`).join("")||empty("Não há vagas nessa data.")}</details>
      <div class="studio-stack">${slots.map(slot=>classGroup(slot,agendaDate,true)).join("")||empty("Sem turmas nesta data. Os dias de funcionamento são configurados por turma.")}</div>
      ${btn("Criar turma / horário","slot-dialog")}`;
  }
  function classGroup(slot,date,expanded=false) {
    const members=attendees(data,slot,date);
    return `<details class="studio-details" ${expanded?'open':''}><summary><span>${slot.time} <small>${members.length}/${slot.capacity} alunos · ${slot.capacity-members.length} vagas</small></span></summary><div>${members.map(studentId=>{const s=studentFor(studentId);return s?studentRow(s):"";}).join("")||empty("Nenhum aluno confirmado.")}</div><div class="studio-actions">${btn("Ajustar turma","slot-dialog",`data-slot="${slot.id}"`,true)}${btn("Definir recorrência","recurring-dialog",`data-slot="${slot.id}"`,true)}${btn("Registrar presença","attendance-dialog",`data-slot="${slot.id}" data-date="${date}"`,true)}</div></details>`;
  }
  function bookingDialog() {
    const valid=data.slots.filter(s=>s.days.includes(weekday(agendaDate))&&agendaDate>=s.startsOn&&(!s.endsOn||agendaDate<=s.endsOn)&&!classHasStarted(agendaDate,s.time));
    dialog("Agendar aula",`${input("Escolha o dia","bookingDate",agendaDate,"date",`min="${dayKey()}"`)}<p>A reserva vale somente para a data escolhida.</p><div class="studio-stack">${valid.map(slot=>{const members=attendees(data,slot,agendaDate),booked=members.includes(selectedStudent),free=Math.max(0,slot.capacity-members.length);return `<article class="studio-compact"><div><h3>${slot.time}</h3><p>${booked?'Já confirmada':free?`${free} vagas disponíveis`:'Turma cheia'}</p></div>${btn(booked?'Confirmada':'Agendar','book',`data-slot="${slot.id}" ${booked||!free?'disabled':''}`)}</article>`;}).join("")||empty("Não há turmas neste dia. Tente segunda, quarta ou sexta.")}</div>`);
  }
  function finance() {
    return `${intro("Financeiro")}${data.invoices.filter(i=>i.studentId===selectedStudent).map(i=>`<article class="studio-compact ${dueAlert(i)?'studio-payment-due':''}"><div><span>${esc(i.label)}</span><h3>${money(i.amount)}</h3><p>${dateLabel(i.dueDate)} · ${i.status==='paid'?'Pago':'Pagamento pendente'}</p></div>${i.status==='pending'?btn("Como pagar","payment-info",`data-invoice="${i.id}"`,true):""}</article>`).join("")||empty("Não há cobranças registradas.")}`;
  }
  function workoutView() {
    const running=data.sessions.find(s=>s.id===sessionId)||data.sessions.find(s=>s.studentId===selectedStudent&&s.status!=="completed");
    if(running){sessionId=running.id;return sessionView(running);}
    return `${intro("Meu treino")}${currentWorkouts().map(w=>`<details class="studio-details" ${currentWorkouts().length===1?'open':''}><summary>Treino ${esc(w.letter)} <small>${esc(w.title)} · ${w.exercises.length} exercícios</small></summary>${w.notes?`<aside class="studio-attention"><strong>Antes de começar</strong><p>${esc(w.notes)}</p></aside>`:""}${w.exercises.map(e=>`<div class="studio-exercise-line"><strong>${esc(e.name)}</strong><span>${e.sets} séries · ${e.reps} ${e.category==='cardio'?'minutos':'repetições'}</span></div>`).join("")}${btn("Iniciar treino","start-session",`data-workout="${w.id}"`)}</details>`).join("")||empty("Seu professor ainda não publicou um treino.")}
      <details class="studio-details"><summary>Histórico dos treinos</summary>${data.sessions.filter(s=>s.studentId===selectedStudent&&s.status==='completed').slice().reverse().map(s=>`<p>${dateLabel(s.date)} · Treino ${esc(s.workout.letter)} · PSE ${s.pse} · ${s.minutes} min</p>`).join("")||empty("Seus treinos concluídos aparecerão aqui.")}</details>`;
  }
  function sessionView(session) {
    if(session.status==="awaiting-pse")return `${intro("Como foi o esforço de hoje?","A PSE registra o esforço percebido durante o treino.")}${input("Duração total do treino (minutos)","sessionMinutes",session.minutes,"number",'min="1" max="600" step="1"')}<div class="psr-grid studio-pse" role="group" aria-label="Percepção subjetiva de esforço">${Array.from({length:11},(_,n)=>`<button type="button" class="psr-option psr-option--${Math.max(1,10-n)} ${session.pse===n?'is-selected':''}" data-studio="pse" data-value="${n}" aria-pressed="${session.pse===n}"><strong>${n}</strong><span>${["Nenhum esforço","Muito leve","Leve","Moderado","Um pouco difícil","Difícil","Difícil","Muito difícil","Muito difícil","Quase máximo","Máximo"][n]}</span></button>`).join("")}</div>${btn("Salvar e concluir treino","finish-session",session.pse===null?'disabled':'')}`;
    return `${intro(`Treino ${session.workout.letter}`,session.workout.title)}${session.workout.notes?`<aside class="studio-attention"><strong>Antes do primeiro exercício</strong><p>${esc(session.workout.notes)}</p></aside>`:""}<div class="studio-timer" role="status" aria-live="polite"><strong id="rest-countdown">${timerEnd>Date.now()?`${Math.ceil((timerEnd-Date.now())/1000)} s de descanso`:"Escolha um exercício para começar"}</strong>${btn("Encerrar descanso","stop-rest","",true)}</div>
      ${session.exercises.map((e,index)=>`<details class="studio-details"><summary>${esc(e.name)} <small>${e.series.filter(s=>s.done).length}/${e.series.length} séries concluídas</small></summary>${e.series.map((s,n)=>`<div class="studio-set"><label><input type="checkbox" data-series-done data-exercise="${index}" data-series="${n}" ${s.done?'checked':''}> Série ${n+1} · ${e.reps} ${e.category==='cardio'?'min':'rep.'}</label><label>Peso (kg)<input type="number" min="0" max="1000" step="0.5" value="${s.weight}" data-series-weight data-exercise="${index}" data-series="${n}" aria-label="Peso da série ${n+1} de ${esc(e.name)}"></label></div>`).join("")}<div class="studio-actions">${btn("Aplicar primeiro peso a todas","all-weights",`data-exercise="${index}"`,true)}${btn("Concluir todas as séries","all-sets",`data-exercise="${index}"`,true)}${btn(`Descansar ${e.rest} s`,"rest",`data-seconds="${e.rest}"`,true)}</div></details>`).join("")}
      ${btn("Concluir treino e registrar PSE","complete-sets")}`;
  }
  function miniChart(title,records,label,unit="",note="") {
    const values=records.map(r=>r.value).filter(Number.isFinite),min=values.length?Math.min(...values):0,max=values.length?Math.max(...values):1;
    const points=records.map((r,n)=>`${5+n*110/Math.max(1,records.length-1)},${35-(r.value-min)*28/Math.max(1,max-min)}`).join(" ");
    return `<details class="studio-details studio-chart"><summary><span>${esc(title)}<small>${values.length?`${values.at(-1).toLocaleString('pt-BR')} ${esc(unit)}`:'Sem registros ainda'}</small></span><svg viewBox="0 0 120 44" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>${note?`<p>${esc(note)}</p>`:""}${records.length?`<table class="studio-table"><caption>${esc(label)}</caption><thead><tr><th scope="col">Data</th><th scope="col">Valor</th><th scope="col">Referência</th></tr></thead><tbody>${records.slice().reverse().map(r=>`<tr><td>${dateLabel(r.date)}</td><td>${Number(r.value).toLocaleString('pt-BR')} ${esc(unit)}</td><td>${esc(r.reference||"—")}</td></tr>`).join("")}</tbody></table>`:empty("O gráfico será preenchido conforme os registros forem salvos.")}</details>`;
  }
  function evolution(studentId=selectedStudent) {
    const checks=latestPerDay(studentId),assessments=data.assessments.filter(a=>a.studentId===studentId).sort((a,b)=>a.date.localeCompare(b.date));
    const attendance=data.attendance.filter(a=>a.studentId===studentId&&a.present).sort((a,b)=>a.date.localeCompare(b.date));
    return `${intro("Minha evolução")}${miniChart("Medidas",assessments.map(a=>({date:a.date,value:a.weight,reference:`${a.method} · ${a.waist??'—'} cm de cintura`})),"Avaliações registradas","kg","Peso corporal não equivale a massa muscular. Compare avaliações feitas pelo mesmo método.")}
      <details class="studio-details"><summary><span>Frequência <small>🔥 ${attendanceStreak(data.attendance,studentId)} dias de aula em sequência</small></span></summary><p>${attendance.length} presenças confirmadas. A sequência considera os dias conferidos pelo professor e termina na última falta registrada. Dias ainda não conferidos não entram no cálculo.</p>${attendance.map(a=>`<p>${dateLabel(a.date)} · Presente</p>`).join("")||empty("Nenhuma presença registrada.")}</details>
      ${miniChart("Qualidade do sono",checks.map(c=>({date:c.date,value:Number(c.answers.sleep),reference:"Questionário diário"})),"Qualidade do sono percebida","/ 5")}
      ${miniChart("Recuperação",checks.map(c=>({date:c.date,value:Number(c.answers.psr),reference:c.previousWorkout?`Após treino ${c.previousWorkout}`:"Sem treino anterior registrado"})),"Histórico de PSR","/ 10","A PSR registra como você se recuperou do último treino. Um valor baixo pede contexto; isoladamente não identifica qual treino causou cansaço.")}
      <details class="studio-details"><summary>Ganho de força</summary><p>Acompanhe o peso por exercício, comparando séries e repetições equivalentes. A carga total movimentada não mede sozinha o ganho de força.</p>${data.sessions.filter(s=>s.studentId===studentId&&s.status==='completed').map(s=>`<p>${dateLabel(s.date)} · Treino ${s.workout.letter}: ${s.exercises.map(e=>`${esc(e.name)} ${Math.max(...e.series.map(r=>r.weight))} kg`).join('; ')}</p>`).join("")||empty("Conclua treinos para começar seu histórico de cargas.")}</details>${btn("Ver ranking","ranking","",true)}`;
  }
  function profile(studentId=selectedStudent) {
    const student=studentFor(studentId)||activeStudent(), coach=state.role==='coach';
    const forms=data.forms.filter(f=>f.studentId===student.id),checks=latestPerDay(student.id);
    return `${intro(student.name)}${conditions(student)}<div class="studio-stack"><article class="card"><p>${esc(student.email)}</p><p>${esc(student.phone||'Contato ainda não informado')}</p><p>${esc(student.goals?.join(', ')||'Objetivos ainda não informados')}</p></article>
      <details class="studio-details"><summary>Anamnese e PAR-Q <small>${forms.length} versões</small></summary>${forms.slice().reverse().map(f=>`<details class="studio-details"><summary>${new Date(f.createdAt).toLocaleString('pt-BR')}</summary>${Object.entries(f.answers).map(([key,value])=>`<p><strong>${esc([...anamneseFields,...parqFields].find(q=>q[0]===key)?.[1]||key)}</strong><br>${esc(Array.isArray(value)?value.join(', '):value)}</p>`).join("")}</details>`).join("")||empty("Formulário ainda não preenchido.")}</details>
      <details class="studio-details"><summary>Documentos e fotos <small>${data.documents.filter(d=>d.studentId===student.id).length} arquivos</small></summary>${data.documents.filter(d=>d.studentId===student.id).map(d=>btn(esc(d.name),'open-file',`data-file="${d.id}"`,true)).join("")||empty("Nenhum anexo.")}<label class="field"><span>Anexar exame ou foto (PDF, JPG, PNG; até 10 MB)</span><input type="file" data-upload-student="${student.id}" accept="application/pdf,image/jpeg,image/png"></label></details>
      <details class="studio-details"><summary>Bem-estar e histórico <small>${checks.length} dias registrados</small></summary>${checks.slice().reverse().map(c=>`<p>${dateLabel(c.date)} · PSR ${esc(c.answers.psr)} · Sono ${esc(c.answers.sleep)}/5 · Prontidão ${readiness(c.answers)}%</p>`).join("")||empty("Sem questionários registrados.")}</details></div>
      ${coach?`<details class="studio-details"><summary>Mensalidades</summary>${data.invoices.filter(i=>i.studentId===student.id).map(i=>`<article class="studio-compact"><div><strong>${money(i.amount)}</strong><p>${dateLabel(i.dueDate)} · ${i.status==='paid'?'Pago':'Pendente'}</p></div>${i.status==='pending'?btn('Registrar pagamento','invoice-confirm',`data-invoice="${i.id}"`,true):''}</article>`).join('')||empty('Sem mensalidades registradas.')}</details>`:''}
      <div class="studio-actions">${!coach?btn("Atualizar meu formulário","intake"):btn("Registrar avaliação","assessment-dialog",`data-student="${student.id}"`)}${btn("Exportar ficha","export-profile",`data-student="${student.id}"`,true)}${!coach?btn("Financeiro","finance","",true)+btn("Configurações","settings","",true):""}</div>${!coach?'<button class="button button--secondary" type="button" data-logout>Sair da conta</button>':""}`;
  }
  function settings() {
    return `${intro("Configurações")}<form id="studio-settings" class="card studio-form">${select("Tamanho do texto","textSize",[["normal","Padrão"],["large","Ampliado"]],localStorage.getItem('vp-text-size')||'normal')}${select("Movimento na interface","motion",[["reduced","Reduzido"],["normal","Padrão"]],localStorage.getItem('vp-motion')||'reduced')}${select("Contraste","contrast",[["normal","Padrão"],["high","Alto contraste"]],localStorage.getItem('vp-contrast')||'normal')}<p>A navegação por leitor de tela e teclado está sempre disponível.</p><label><input name="ranking" type="checkbox" ${activeStudent().rankingOptIn?'checked':''}> Participar dos rankings com meu nome</label><button class="button button--primary" type="submit">Salvar preferências</button></form>
      <details class="studio-details"><summary>Lembretes e notificações</summary><p>Preferência: ${data.settings.reminders.join(' e ')}. As notificações no aparelho serão ativadas após conectar o serviço online.</p><p>Avisos de saúde ficam na área restrita do professor. A notificação externa não exibirá o diagnóstico.</p></details>
      <article class="card"><h3>Ambiente de testes</h3><p>Dados fictícios salvos neste navegador. Para trocar de aparelho, exporte os registros. A sincronização online aguarda a conexão com o Supabase.</p>${select("Aluno usado neste teste","demoStudent",data.students.map(s=>[s.id,s.name]),selectedStudent)}${btn("Exportar meus registros","export-profile",`data-student="${selectedStudent}"`,true)}</article>`;
  }
  function coachHome() {
    const today=dayKey(),slots=data.slots.filter(s=>s.days.includes(weekday(today)));
    return `${intro("Olá, Vinicius.")}<section class="section-block"><h3>Horários</h3>${slots.map(s=>classGroup(s,today)).join("")||empty("Não há turmas hoje.")}${btn("Ver agenda","coach-agenda","",true)}</section><section class="section-block"><h3>Atualizações dos Alunos</h3>${data.notifications.slice().reverse().map(n=>`<article class="card">${studentRow(studentFor(n.studentId),new Date(n.createdAt).toLocaleString('pt-BR'))}<p>${esc(n.message)}</p>${!n.read?btn("Marcar como lida","read-notification",`data-notification="${n.id}"`,true):'<small>Lida</small>'}</article>`).join("")||empty("As respostas e alterações dos alunos aparecerão aqui.")}</section>`;
  }
  function students() {return `${intro("Alunos")}${input("Buscar aluno","studentQuery","","search")}<div id="studio-student-list">${data.students.map(s=>studentRow(s)).join("")}</div>`;}
  function builder() {
    return `${intro("Montar treino")}<div class="studio-stack"><div class="studio-fields">${select("Aluno","builderStudent",data.students.map(s=>[s.id,s.name]),draftWorkout.studentId)}${select("Treino","builderLetter",["A","B","C","D"].map(s=>[s,s]),draftWorkout.letter)}${input("Nome do treino","builderTitle",draftWorkout.title)}</div>
      <div class="studio-tabs" role="group" aria-label="Forma de montagem">${['manual','draw'].map(mode=>btn(mode==='manual'?'Montagem manual':'Começar com sorteio','builder-mode',`data-mode="${mode}" aria-pressed="${builderMode===mode}"`,builderMode!==mode)).join("")}</div>
      ${builderMode==='draw'?`<details class="studio-details" open><summary>Quantidade por ênfase</summary><div class="studio-fields">${[...EMPHASES,'Cardio'].map((emphasis,n)=>input(emphasis,`criteria-${n}`,0,'number',`min="0" max="20" data-emphasis="${emphasis}"`)).join("")}</div>${btn("Sortear exercícios","draw")}</details>`:""}
      <div class="studio-tabs" role="group" aria-label="Tipo de exercício">${btn("Ênfases","catalog-category",'data-category="strength"',exerciseCategory!=='strength')}${btn("Cardio","catalog-category",'data-category="cardio"',exerciseCategory!=='cardio')}${btn("Gerenciar base","catalog","",true)}</div>
      <div class="studio-catalog">${data.catalog.filter(e=>e.active&&e.category===exerciseCategory).map(e=>`<button type="button" data-studio="add-exercise" data-exercise="${e.id}"><strong>${esc(e.name)}</strong><small>${esc(e.emphasis)} · Adicionar</small></button>`).join("")||empty("Cadastre exercícios para esta categoria.")}</div>
      <section><h3>Exercícios do treino</h3>${draftWorkout.exercises.map((e,index)=>`<details class="studio-details" open><summary>${index+1}. ${esc(e.name)}</summary><div class="studio-fields">${input('Séries',`sets-${index}`,e.sets,'number',`min="1" max="20" data-draft-field="sets" data-index="${index}"`)}${input(e.category==='cardio'?'Minutos':'Repetições',`reps-${index}`,e.reps,'number',`min="1" max="300" data-draft-field="reps" data-index="${index}"`)}${input('Descanso (segundos)',`rest-${index}`,e.rest,'number',`min="5" max="900" data-draft-field="rest" data-index="${index}"`)}</div>${btn("Remover exercício","remove-exercise",`data-index="${index}"`,true)}</details>`).join("")||empty("Adicione exercícios ou use o sorteio.")}</section>
      <label class="field"><span>Mobilidade, alongamento e aquecimento</span><textarea name="builderNotes" rows="4" placeholder="Orientações que aparecerão antes do primeiro exercício">${esc(draftWorkout.notes)}</textarea></label>
      <button type="button" class="button button--primary" data-studio="publish" ${!draftWorkout.exercises.length?'disabled':''}>Publicar treino</button>
      <details class="studio-details"><summary>Treinos publicados</summary>${currentWorkouts(draftWorkout.studentId).map(w=>`<div class="studio-compact"><div><h3>${w.letter} · ${esc(w.title)}</h3><p>Versão ${w.version}</p></div>${btn("Editar","edit-workout",`data-workout="${w.id}"`,true)}</div>`).join("")||empty("Nenhum treino publicado para este aluno.")}</details></div>`;
  }
  function catalogView() {
    return `${intro("Base de exercícios","Você pode cadastrar e desativar exercícios. Os treinos anteriores preservam sua versão.")}<form id="studio-exercise-form" class="card studio-form">${input("Nome do exercício","name","","text",'required maxlength="120"')}${select("Ênfase","emphasis",[...EMPHASES,'Cardio'].map(s=>[s,s]))}<button class="button button--primary" type="submit">Adicionar à base</button></form>${data.catalog.map(e=>`<article class="studio-compact"><div><h3>${esc(e.name)}</h3><p>${esc(e.emphasis)} · ${e.active?'Ativo':'Desativado'}</p></div>${btn(e.active?'Desativar':'Reativar','toggle-exercise',`data-exercise="${e.id}"`,true)}</article>`).join("")}`;
  }
  function ranking() {
    const from=dayKey().slice(0,8)+'01',until=dayKey();
    return `${intro("Ranking do Studio",`Resultados de ${dateLabel(from)} a ${dateLabel(until)}`)}${[['attendance','Frequência','presenças'],['muscle','Ganho de massa muscular','kg']].map(([metric,title,unit])=>`<details class="studio-details" open><summary>${title}</summary><ol class="studio-ranking">${rankStudents(data,metric,from,until).map(r=>`<li><span>${esc(r.name)}</span><strong>${Number(r.value).toLocaleString('pt-BR')} ${unit}</strong></li>`).join("")}</ol>${metric==='muscle'?'<p>Exige duas avaliações comparáveis pelo mesmo método. Questionários não medem massa muscular.</p>':''}</details>`).join("")}<p>Participação opcional nas configurações. A frequência considera presenças confirmadas, não respostas positivas no questionário.</p>`;
  }
  function reports() {
    const checks=data.students.flatMap(s=>latestPerDay(s.id)),sessions=data.sessions.filter(s=>s.status==='completed');
    return `${intro("Relatórios")}<div class="studio-actions">${btn("Exportar planilha","export-all","",true)}${btn("Preparar PDF","print-all","",true)}</div>
      ${miniChart("Média de PSE",averageByDay(sessions.map(s=>({date:s.date,value:s.pse}))),"Esforço após os treinos","/ 10")}
      ${miniChart("Média de PSR",averageByDay(checks.map(c=>({date:c.date,value:Number(c.answers.psr)}))),"Recuperação antes dos treinos","/ 10")}
      ${miniChart("Prontidão de bem-estar",averageByDay(checks.map(c=>({date:c.date,value:readiness(c.answers)})).filter(c=>c.value!==null)),"Índice descritivo de bem-estar","%","Média dos seis itens de 1 a 5, transformados para 0 a 100. Índice do Studio, sem validação clínica; PSR, ciclo e sintomas são analisados separadamente.")}
      <details class="studio-details"><summary>Carga aguda:crônica</summary><p>Referência: Gabbett (2016). A razão compara a carga de 7 dias com a média semanal de 28 dias. Exige registro completo dos dias de treino e descanso.</p>${empty("Aguardando 28 dias completos por aluno. Dias sem resposta não serão tratados como descanso.")}<p>Este indicador não prevê lesões individuais. Limites dependem da população e do método.</p></details>
      <details class="studio-details"><summary>Strain semanal</summary><p>Referência: Foster (1998). Carga semanal × monotonia. Carga da sessão = PSE × minutos; monotonia = média diária ÷ desvio-padrão dos sete dias.</p>${empty("Aguardando uma semana completa de carga e descanso.")}<p>6.000 é uma referência a validar com o professor, não um limite universal de segurança. Desvio-padrão zero deixa a monotonia indefinida.</p></details>
      <details class="studio-details"><summary>Acompanhamento de participação</summary>${data.students.map(s=>{const reasons=engagementReasons(data,s.id);return reasons.length?studentRow(s,reasons.join('; ')):"";}).join("")||empty("Sem sinais de afastamento pelos registros disponíveis.")}<p>Sinais descritivos: 14 dias sem presença ou 7 sem questionário. Não são previsão de desistência.</p></details>`;
  }
  function averageByDay(records) {const days=new Map();records.forEach(r=>days.set(r.date,[...(days.get(r.date)||[]),r.value]));return [...days].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,values])=>({date,value:Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10,reference:`${values.length} registros`}));}
  function fieldMarkup([key,label,type,required]) {
    const value=formDraft[key]??"",attr=required?'required':'';
    if(['conditions','symptoms','goals'].includes(type)) {
      const options=type==='conditions'?CONDITIONS:type==='symptoms'?SYMPTOMS:["Emagrecimento","Ganho de massa muscular","Definição muscular","Condicionamento físico","Saúde","Estética"];
      return `<fieldset class="studio-checkboxes"><legend>${esc(label)}${required?' *':''}</legend>${options.map(option=>`<label><input type="checkbox" name="${key}" value="${esc(option)}" ${Array.isArray(value)&&value.includes(option)?'checked':''}> ${esc(option)}</label>`).join("")}${!required?'<small>Deixe em branco se não se aplica.</small>':''}</fieldset>`;
    }
    if(type==='textarea')return `<label class="field"><span>${esc(label)}${required?' *':''}</span><textarea name="${key}" rows="3" ${attr}>${esc(value)}</textarea></label>`;
    if(type==='yesno'||type==='gender')return `<label class="field"><span>${esc(label)}${required?' *':''}</span><select name="${key}" ${attr}><option value="">Selecione</option>${(type==='yesno'?['Sim','Não']:['Feminino','Masculino','Outro','Prefiro não informar']).map(v=>`<option ${value===v?'selected':''}>${v}</option>`).join("")}</select></label>`;
    return input(label+(required?' *':''),key,value,type,attr+(type==='number'?' min="50" max="250" step="0.1"':'')+(type==='date'?` max="${dayKey()}"`:''));
  }
  function intake() {
    const fields=formPart===0?anamneseFields:parqFields;
    return `${intro(formPart===0?"Anamnese":"PAR-Q",formPart===0?"Parte 1 de 2. Conte sobre você e seu histórico.":"Parte 2 de 2. Responda cada pergunta de saúde.")}<form id="studio-intake" class="studio-form">${fields.map(fieldMarkup).join("")}${formPart===1?'<label class="studio-consent"><input type="checkbox" name="truth" required> Confirmo que as informações são verdadeiras e entendo que as respostas serão revisadas pelo professor. O envio não equivale a liberação médica.</label>':''}<div class="studio-actions">${formPart?btn("Voltar à anamnese","form-back","",true):""}<button class="button button--primary" type="submit">${formPart===0?'Continuar para PAR-Q':'Salvar formulário'}</button></div></form>`;
  }
  function draw(view) {
    const renderers={"student-home":home,"student-agenda":()=>agenda(),"student-workout":workoutView,"student-evolution":()=>evolution(),"student-profile":()=>profile(),"coach-home":coachHome,"coach-students":students,"coach-agenda":()=>agenda(true),"coach-training":builder,"coach-reports":reports,"student-finance":finance,"student-settings":settings,"student-ranking":ranking,"student-intake":intake,"coach-student-profile":()=>profile(profileStudent),"coach-catalog":catalogView};
    if(renderers[view]&&surface(view))surface(view).innerHTML=renderers[view]();
  }
  function beginRest(seconds) {
    timerEnd=Date.now()+seconds*1000;
    localStorage.setItem('vp-rest-end',String(timerEnd));
    try {sound ||= new (window.AudioContext||window.webkitAudioContext)();sound.resume();}catch{}
    showToast(`Descanso de ${seconds} segundos iniciado.`);
  }
  window.setInterval(()=>{
    if(!timerEnd)return; const seconds=Math.max(0,Math.ceil((timerEnd-Date.now())/1000)),output=document.querySelector('#rest-countdown');
    if(output)output.textContent=seconds?`${seconds} s de descanso`:"Descanso concluído. Próxima série.";
    if(seconds===0){timerEnd=0;localStorage.removeItem('vp-rest-end');try{const osc=sound.createOscillator(),gain=sound.createGain();osc.connect(gain);gain.connect(sound.destination);gain.gain.value=.12;osc.frequency.value=880;osc.start();osc.stop(sound.currentTime+.4);}catch{}navigator.vibrate?.([120,60,120]);showToast("Descanso concluído. Você pode iniciar a próxima série.");}
  },1000);
  const routeActions=new Set(['agenda','workout','finance','settings','intake','ranking','coach-agenda','catalog']);
  async function handleAction(button) {
    const action=button.dataset.studio;
    if(routeActions.has(action)){if(action==='intake'){formPart=0;formDraft={...activeStudent(),...latest(data.forms.filter(f=>f.studentId===selectedStudent))?.answers};}setRoute(action);return;}
    if(action==='wellness'){setRoute('wellness');return;}
    if(action==='conditions'){const student=studentFor(button.dataset.student);dialog(`Saúde de ${student.name}`,`<p>${esc(student.conditions.join(', '))}</p><p>${esc(student.conditionNotes||'Consulte a anamnese e as orientações registradas.')}</p>`);}
    if(action==='student-profile'){profileStudent=button.dataset.student;setRoute('student-profile');}
    if(action==='book-dialog'){agendaDate=dayKey();bookingDialog();}
    if(action==='book'){await change('Aula avulsa agendada',next=>bookClass(next,{studentId:selectedStudent,slotId:button.dataset.slot,date:agendaDate}));closeDialog();showToast('Aula confirmada para a data escolhida.');}
    if(action==='class-details'){dialog('Sua aula',`<p>${dateLabel(button.dataset.date)} · ${data.slots.find(s=>s.id===button.dataset.slot).time}</p><p>Presença confirmada.</p>${btn('Cancelar somente esta aula','cancel-class',`data-slot="${button.dataset.slot}" data-date="${button.dataset.date}"`,true)}`);}
    if(action==='cancel-class'){await change('Aula do dia cancelada',next=>{const existing=next.bookings.find(b=>b.studentId===selectedStudent&&b.slotId===button.dataset.slot&&b.date===button.dataset.date);if(existing)existing.status='cancelled';else next.bookings.push({id:id(),studentId:selectedStudent,slotId:button.dataset.slot,date:button.dataset.date,status:'cancelled'});});closeDialog();showToast('Aula cancelada. As outras datas foram mantidas.');}
    if(action==='slot-dialog'){const slot=data.slots.find(s=>s.id===button.dataset.slot);dialog(slot?'Editar turma':'Nova turma',`<form id="studio-slot-form" data-slot="${slot?.id||''}" class="studio-form">${input('Horário','time',slot?.time||'19:00','time','required')}${input('Vagas por turma','capacity',slot?.capacity||10,'number','min="1" max="200" required')}<fieldset><legend>Dias da semana</legend>${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d,n)=>`<label><input name="days" type="checkbox" value="${n}" ${(slot?.days||[1,3,5]).includes(n)?'checked':''}> ${d}</label>`).join('')}</fieldset><button class="button button--primary" type="submit">Salvar turma</button></form>`);}
    if(action==='recurring-dialog')dialog('Definir recorrência',`<form id="studio-recurring-form" data-slot="${button.dataset.slot}" class="studio-form">${select('Aluno','studentId',data.students.map(s=>[s.id,s.name]))}${input('A partir de','from',dayKey(),'date','required')}${input('Até (opcional)','until','','date')}<p>A recorrência reserva os dias de funcionamento desta turma. Somente o professor pode defini-la.</p><button class="button button--primary" type="submit">Salvar recorrência</button></form>`);
    if(action==='attendance-dialog'){const slot=data.slots.find(s=>s.id===button.dataset.slot),date=button.dataset.date;dialog(`Presenças · ${slot.time}`,`<form id="studio-attendance-form" data-slot="${slot.id}" data-date="${date}" class="studio-form">${attendees(data,slot,date).map(s=>`<label><input type="checkbox" name="present" value="${s}" ${data.attendance.some(a=>a.studentId===s&&a.date===date&&a.slotId===slot.id&&a.present)?'checked':''}> ${esc(studentFor(s)?.name)}</label>`).join('')}<button class="button button--primary" type="submit">Salvar presenças</button></form>`);}
    if(action==='payment-info')dialog('Pagamento da mensalidade','<p>O pagamento integrado será disponibilizado após a configuração do meio de cobrança do Studio. Entre em contato com o professor para confirmar o pagamento.</p>');
    if(action==='invoice-confirm'&&state.role==='coach')dialog('Confirmar pagamento',`<p>Registre somente um pagamento que você já conferiu. Esta ação não movimenta dinheiro.</p>${btn('Pagamento conferido','invoice-paid',`data-invoice="${button.dataset.invoice}"`)}`);
    if(action==='invoice-paid'&&state.role==='coach'){await change('Pagamento conferido pelo professor',next=>{const invoice=next.invoices.find(i=>i.id===button.dataset.invoice);invoice.status='paid';invoice.paidAt=new Date().toISOString();});closeDialog();showToast('Pagamento registrado.');}
    if(action==='notifications'){if(state.role==='coach')setRoute('home');else dialog('Atualizações',data.notifications.filter(n=>n.studentId===selectedStudent&&n.type==='workout').map(n=>`<p>${esc(n.message)}</p>`).join('')||'<p>Sem novas atualizações de treino.</p>');}
    if(action==='read-notification'){await change('Notificação lida',next=>{next.notifications.find(n=>n.id===button.dataset.notification).read=true;});}
    if(action==='builder-mode'){builderMode=button.dataset.mode;draw(state.activeView);}
    if(action==='catalog-category'){exerciseCategory=button.dataset.category;draw(state.activeView);}
    if(action==='add-exercise'){const exercise=data.catalog.find(e=>e.id===button.dataset.exercise);draftWorkout.exercises.push({...exercise,sets:3,reps:exercise.category==='cardio'?10:12,rest:60,weight:0});draw(state.activeView);}
    if(action==='remove-exercise'){draftWorkout.exercises.splice(Number(button.dataset.index),1);draw(state.activeView);}
    if(action==='draw'){const criteria={};document.querySelectorAll('[data-emphasis]').forEach(e=>{criteria[e.dataset.emphasis]=Number(e.value);});const result=drawExercises(data.catalog,criteria);if(!result.length)throw new Error('Informe pelo menos uma quantidade para sortear.');draftWorkout.exercises=result.map(e=>({...e,sets:3,reps:e.category==='cardio'?10:12,rest:60,weight:0}));draw(state.activeView);showToast('Exercícios sorteados. Você pode editar cada um.');}
    if(action==='edit-workout'){const workout=data.workouts.find(w=>w.id===button.dataset.workout);draftWorkout=structuredClone(workout);draw(state.activeView);}
    if(action==='toggle-exercise'){await change('Catálogo atualizado',next=>{const e=next.catalog.find(e=>e.id===button.dataset.exercise);e.active=!e.active;});}
    if(action==='publish'){if(!draftWorkout.title.trim())throw new Error('Dê um nome ao treino.');if(!draftWorkout.exercises.length)throw new Error('Inclua pelo menos um exercício.');await change('Treino publicado',next=>{const version=next.workouts.filter(w=>w.studentId===draftWorkout.studentId&&w.letter===draftWorkout.letter).length+1;next.workouts.push({...structuredClone(draftWorkout),id:id(),version,publishedAt:new Date().toISOString()});notify(next,'workout',draftWorkout.studentId,`Treino ${draftWorkout.letter} atualizado.`);});showToast('Treino publicado. A versão anterior foi preservada.');}
    if(action==='start-session') {
      const workout=data.workouts.find(w=>w.id===button.dataset.workout);sessionId=id();
      await change('Treino iniciado',next=>next.sessions.push({
        id:sessionId,studentId:selectedStudent,workout:structuredClone(workout),date:dayKey(),startedAt:new Date().toISOString(),status:'running',pse:null,
        exercises:workout.exercises.map(e=>({...e,series:Array.from({length:e.sets},()=>({weight:e.weight||0,done:false}))})),
      }));
    }
    if(['all-sets','all-weights'].includes(action)){await change('Séries atualizadas',next=>{const exercise=next.sessions.find(s=>s.id===sessionId).exercises[Number(button.dataset.exercise)];exercise.series.forEach(s=>{if(action==='all-sets')s.done=true;else s.weight=exercise.series[0].weight;});});}
    if(action==='rest')beginRest(Number(button.dataset.seconds));
    if(action==='stop-rest'){timerEnd=0;localStorage.removeItem('vp-rest-end');draw(state.activeView);}
    if(action==='complete-sets'){timerEnd=0;localStorage.removeItem('vp-rest-end');await change('Treino aguardando PSE',next=>{const session=next.sessions.find(s=>s.id===sessionId);session.exercises.forEach(e=>e.series.forEach(s=>s.done=true));session.status='awaiting-pse';session.minutes=Math.max(1,Math.round((Date.now()-Date.parse(session.startedAt))/60000));});}
    if(action==='pse'){await change('PSE selecionada',next=>{next.sessions.find(s=>s.id===sessionId).pse=Number(button.dataset.value);});}
    if(action==='finish-session'){await change('Treino concluído com PSE',next=>{const session=next.sessions.find(s=>s.id===sessionId);if(session.pse===null)throw new Error('Registre a PSE antes de concluir.');session.status='completed';session.endedAt=new Date().toISOString();notify(next,'session',selectedStudent,`Treino ${session.workout.letter} concluído. PSE ${session.pse}.`);});sessionId=null;draw(state.activeView);showToast('Treino e PSE salvos no histórico.');}
    if(action==='form-back'){captureForm();formPart=0;draw(state.activeView);}
    if(action==='assessment-dialog')dialog('Registrar avaliação',`<form id="studio-assessment-form" data-student="${button.dataset.student}" class="studio-form">${input('Data','date',dayKey(),'date','required')}${input('Peso corporal (kg)','weight','','number','min="1" max="500" step="0.1" required')}${input('Cintura (cm)','waist','','number','min="1" max="300" step="0.1"')}${input('Massa muscular (kg, se medida)','muscleMass','','number','min="1" max="200" step="0.1"')}${input('Método / equipamento','method','','text','required')}<button class="button button--primary" type="submit">Salvar avaliação</button></form>`);
    if(action==='open-file'){const file=await store.getFile(button.dataset.file);if(!file)throw new Error('Arquivo não encontrado neste aparelho.');const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
    if(action==='export-profile')showExport(button.dataset.student);
    if(action==='export-all')downloadData();
    if(action==='print-all')printData();
    if(action==='export-xlsx')downloadData(button.dataset.student);
    if(action==='print-profile')printData(button.dataset.student);
  }
  function captureForm() {
    const form=document.querySelector('#studio-intake');if(!form)return;
    const values=new FormData(form),fields=formPart===0?anamneseFields:parqFields;
    fields.forEach(([key,,type])=>{formDraft[key]=['goals','conditions','symptoms'].includes(type)?values.getAll(key):String(values.get(key)||'').trim();});
  }
  async function submit(form) {
    const values=new FormData(form);
    if(form.id==='studio-intake') {
      captureForm();
      if(formPart===0){if(!formDraft.goals.length)throw new Error('Escolha pelo menos um objetivo.');formPart=1;draw(state.activeView);surface(state.activeView).querySelector('h2').focus();return;}
      const createdAt=new Date().toISOString();
      await change('Anamnese e PAR-Q registrados',next=>{
        next.forms.push({id:id(),studentId:selectedStudent,version:1,createdAt,answers:structuredClone(formDraft)});
        const student=next.students.find(s=>s.id===selectedStudent);
        ['name','gender','birthDate','profession','height','phone','emergencyContact','conditions','conditionNotes','goals'].forEach(k=>student[k]=structuredClone(formDraft[k]??''));
        student.trackCycle=formDraft.trackCycle==='Sim';
        const positive=parqFields.filter(([key,,type])=>type==='yesno'&&formDraft[key]==='Sim');
        student.needsReview=positive.length>0;notify(next,'form',selectedStudent,positive.length?'Novo formulário com respostas que precisam de revisão.':'Anamnese e PAR-Q atualizados.');
      });
      formPart=0;setRoute('profile');showToast('Formulário salvo. Você pode anexar documentos no perfil.');
    }
    if(form.id==='studio-slot-form') {
      const capacity=Number(values.get('capacity')),days=values.getAll('days').map(Number),slotId=form.dataset.slot||id();
      if(!days.length)throw new Error('Escolha ao menos um dia da semana.');
      await change('Turma configurada',next=>{
        const old=next.slots.find(s=>s.id===slotId);const slot={id:slotId,time:String(values.get('time')),capacity,days,startsOn:old?.startsOn||dayKey()};
        if(!Number.isInteger(capacity)||capacity<1||capacity>200)throw new Error('Informe de 1 a 200 vagas.');
        for(let n=0;n<366;n++){const date=addDays(dayKey(),n);if(old&&attendees(next,old,date).length>capacity)throw new Error('A capacidade não pode ficar abaixo dos alunos já confirmados.');}
        if(old&&next.recurring.some(r=>r.slotId===old.id)&&JSON.stringify(old.days)!==JSON.stringify(days))throw new Error('Esta turma tem recorrências. Crie outra turma para mudar os dias sem alterar reservas existentes.');
        if(old)Object.assign(old,slot);else next.slots.push(slot);
      });closeDialog();showToast('Turma salva.');
    }
    if(form.id==='studio-recurring-form') {
      await change('Recorrência definida pelo professor',next=>{
        const slot=next.slots.find(s=>s.id===form.dataset.slot),studentId=String(values.get('studentId')),from=String(values.get('from')),until=String(values.get('until'))||null;
        if(until&&until<from)throw new Error('A data final deve ser posterior à inicial.');
        if(next.recurring.some(r=>r.slotId===slot.id&&r.studentId===studentId&&(!r.until||r.until>=from)&&(!until||r.from<=until)))throw new Error('O aluno já tem recorrência neste período.');
        // Reserve recurring seats conservatively for open-ended series.
        if(next.recurring.filter(r=>r.slotId===slot.id&&(!r.until||r.until>=from)&&(!until||r.from<=until)).length>=slot.capacity)throw new Error('Não há vaga recorrente nesta turma.');
        const futureDates=[...new Set(next.bookings.filter(b=>b.slotId===slot.id&&b.date>=from&&(!until||b.date<=until)).map(b=>b.date))];
        if(futureDates.some(date=>attendees(next,slot,date).length>=slot.capacity&&!attendees(next,slot,date).includes(studentId)))throw new Error('Há uma data com turma cheia por encaixes já confirmados. Ajuste o período ou a capacidade.');
        next.recurring.push({id:id(),slotId:slot.id,studentId,from,until});
      });closeDialog();showToast('Recorrência salva.');
    }
    if(form.id==='studio-attendance-form') {
      const present=new Set(values.getAll('present')),slot=data.slots.find(s=>s.id===form.dataset.slot),date=form.dataset.date;
      if(date>dayKey())throw new Error('Presenças só podem ser confirmadas no dia da aula ou depois.');
      await change('Presenças conferidas pelo professor',next=>attendees(next,slot,date).forEach(studentId=>{const old=next.attendance.find(a=>a.studentId===studentId&&a.date===date&&a.slotId===slot.id);const record={id:old?.id||id(),studentId,date,slotId:slot.id,present:present.has(studentId)};if(old)Object.assign(old,record);else next.attendance.push(record);}));closeDialog();showToast('Presenças salvas.');
    }
    if(form.id==='studio-exercise-form') {
      await change('Exercício cadastrado',next=>{const emphasis=String(values.get('emphasis'));next.catalog.push({id:id(),name:String(values.get('name')).trim(),emphasis,category:emphasis==='Cardio'?'cardio':'strength',active:true});});showToast('Exercício adicionado.');
    }
    if(form.id==='studio-assessment-form') {
      await change('Avaliação física registrada',next=>next.assessments.push({id:id(),studentId:form.dataset.student,date:String(values.get('date')),weight:Number(values.get('weight')),waist:values.get('waist')?Number(values.get('waist')):null,muscleMass:values.get('muscleMass')?Number(values.get('muscleMass')):null,method:String(values.get('method')).trim(),createdAt:new Date().toISOString()}));closeDialog();showToast('Avaliação salva no histórico.');
    }
    if(form.id==='studio-settings') {
      ['textSize','motion','contrast'].forEach((key)=>{const storage={textSize:'vp-text-size',motion:'vp-motion',contrast:'vp-contrast'};localStorage.setItem(storage[key],String(values.get(key)));});
      applyPreferences();await change('Preferências atualizadas',next=>{next.students.find(s=>s.id===selectedStudent).rankingOptIn=values.has('ranking');});showToast('Preferências salvas.');
    }
  }
  function exportTables(studentId) {
    const keys=['students','forms','wellness','workouts','sessions','bookings','recurring','attendance','invoices','assessments','documents','notifications'];
    const tables=keys.map(key=>({name:key,rows:data[key].filter(row=>!studentId||(key==='students'?row.id===studentId:row.studentId===studentId)).map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v!==null&&typeof v==='object'?JSON.stringify(v):v??''])))}));
    if(!studentId)tables.push(...['slots','catalog','posts','events'].map(key=>({name:key,rows:data[key].map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='object'?JSON.stringify(v):v])))})));
    return tables;
  }
  function showExport(studentId) {dialog('Exportar ficha',`<p>Exportação dos registros e do histórico de ${esc(studentFor(studentId).name)}. Os arquivos anexados são baixados separadamente no perfil.</p><div class="studio-actions">${btn('Planilha Excel','export-xlsx',`data-student="${studentId}"`)}${btn('Preparar PDF','print-profile',`data-student="${studentId}"`,true)}</div>`);}
  function downloadData(studentId) {exportWorkbook(exportTables(studentId),`studio-${studentId||'geral'}-${dayKey()}.xlsx`);showToast('Planilha exportada com os registros e históricos.');}
  function printData(studentId) {
    const printRoot=document.querySelector('#studio-print');
    printRoot.innerHTML=`<header><img src="${BRAND.logo}" alt="${esc(BRAND.name)}"><h1>${esc(BRAND.name)} · ${studentId?esc(studentFor(studentId).name):'Relatório geral'}</h1><p>Emitido em ${new Date().toLocaleString('pt-BR')}</p></header>${exportTables(studentId).filter(t=>t.rows.length).map(table=>`<section><h2>${esc(table.name)}</h2>${table.rows.map(row=>`<article>${Object.entries(row).filter(([key])=>key!=='id'&&key!=='studentId').map(([key,value])=>`<p><strong>${esc(key)}:</strong> ${esc(value)}</p>`).join('')}</article>`).join('')}</section>`).join('')}`;
    closeDialog();window.print();
  }
  function applyPreferences() {document.documentElement.dataset.textSize=localStorage.getItem('vp-text-size')||'normal';document.documentElement.dataset.motion=localStorage.getItem('vp-motion')||'reduced';document.documentElement.dataset.contrast=localStorage.getItem('vp-contrast')||'normal';}
  function restoreWellness() {
    const today=latest(latestPerDay());const existing=today?.date===dayKey()?today:null;
    state.wellnessAnswers=structuredClone(existing?.answers||{});state.bodyPoints=structuredClone(existing?.answers.bodyMap||[]);
    state.profileSex=activeStudent().gender==='Masculino'?'male':'female';state.trackCycle=activeStudent().trackCycle;
    state.checkinCompleted=Boolean(existing);state.checkinCompletedAt=existing?.createdAt||null;
  }
  async function saveWellness(answers) {
    const previous=data.sessions.filter(s=>s.studentId===selectedStudent&&s.status==='completed').at(-1);
    await change('Questionário de bem-estar registrado',next=>{
      const record={id:id(),studentId:selectedStudent,date:dayKey(),createdAt:new Date().toISOString(),answers:structuredClone(answers),previousWorkout:previous?.workout.letter||null,previousSessionId:previous?.id||null};
      next.wellness.push(record);
      notify(next,'wellness',selectedStudent,`Questionário de Bem-Estar atualizado. PSR ${answers.psr}.`);
      if(answers.bodyMap?.length||Number(answers.musclePain)<5)notify(next,'pain',selectedStudent,'Dor registrada no questionário. Consulte as regiões e intensidades.');
      if(answers.cycle?.enabled)notify(next,'cycle',selectedStudent,'Registro de ciclo atualizado. Consulte os detalhes autorizados.');
      if(answers.symptoms48h?.length)notify(next,'symptoms',selectedStudent,`Sintomas nas últimas 48 horas: ${answers.symptoms48h.join(', ')}.`);
    },{render:false});restoreWellness();setRoute('home');showToast('Questionário salvo no histórico deste ambiente.');
  }
  function onEnter() {
    restoreWellness();
    const student=activeStudent();if(state.role==='student'){
      for(const selector of ['#header-name','#account-name'])document.querySelector(selector).textContent=student.name;
      const invoice=data.invoices.find(i=>i.studentId===selectedStudent&&dueAlert(i));
      if(invoice&&!dismissedInvoices.has(invoice.id)){dismissedInvoices.add(invoice.id);dialog('Mensalidade pendente',`<p>${esc(invoice.label)} · <strong>${money(invoice.amount)}</strong></p><p>${daysBetween(dayKey(),invoice.dueDate)<0?'Venceu':'Vence'} em ${dateLabel(invoice.dueDate)}.</p><p>Se você já pagou, peça ao professor para conferir o registro.</p>`);}
    }
  }
  for(const view of ['student-finance','student-settings','student-intake','student-ranking','coach-student-profile','coach-catalog']) {
    const section=document.createElement('section');section.className='app-view';section.dataset.view=view;section.setAttribute('aria-hidden','true');document.querySelector('[data-view="student-home"]').parentElement.append(section);
  }
  document.body.insertAdjacentHTML('beforeend','<dialog id="studio-dialog" class="studio-dialog" aria-labelledby="studio-dialog-title"><header><h2 id="studio-dialog-title"></h2><button type="button" aria-label="Fechar" data-close-studio>×</button></header><div class="studio-dialog-body"></div></dialog><div id="studio-print"></div>');
  document.querySelector('[data-close-studio]').addEventListener('click',closeDialog);
  document.querySelector('#studio-dialog').addEventListener('click',event=>{if(event.target===event.currentTarget)closeDialog();});
  document.addEventListener('click',event=>{const button=event.target.closest('[data-studio]');if(!button)return;event.preventDefault();handleAction(button).catch(error=>showToast(error.message));});
  document.addEventListener('submit',event=>{if(!event.target.id.startsWith('studio-'))return;event.preventDefault();submit(event.target).catch(error=>showToast(error.message));});
  document.addEventListener('change',async event=>{
    const target=event.target;
    try {
      if(target.name==='coachDate'){agendaDate=target.value;draw(state.activeView);}
      if(target.name==='bookingDate'){agendaDate=target.value;bookingDialog();}
      if(target.name==='builderStudent')draftWorkout.studentId=target.value;
      if(target.name==='builderLetter')draftWorkout.letter=target.value;
      if(target.name==='builderTitle')draftWorkout.title=target.value;
      if(target.name==='builderNotes')draftWorkout.notes=target.value;
      if(target.dataset.draftField){const value=Number(target.value);if(!target.validity.valid||!Number.isFinite(value))throw new Error('Confira o valor do exercício.');draftWorkout.exercises[Number(target.dataset.index)][target.dataset.draftField]=value;}
      if(target.matches('[data-series-done],[data-series-weight]')) {
        if(target.matches('[data-series-weight]')&&!target.validity.valid)throw new Error('Informe um peso válido entre 0 e 1.000 kg.');
        await change('Série registrada',next=>{const row=next.sessions.find(s=>s.id===sessionId).exercises[Number(target.dataset.exercise)].series[Number(target.dataset.series)];if(target.matches('[data-series-done]'))row.done=target.checked;else row.weight=Number(target.value);},{render:false});
        if(target.matches('[data-series-done]')&&target.checked)beginRest(data.sessions.find(s=>s.id===sessionId).exercises[Number(target.dataset.exercise)].rest);
      }
      if(target.name==='sessionMinutes'){if(!target.validity.valid)throw new Error('Informe de 1 a 600 minutos.');await change('Duração ajustada',next=>{next.sessions.find(s=>s.id===sessionId).minutes=Number(target.value);},{render:false});}
      if(target.dataset.uploadStudent&&target.files[0]){await store.putFile(target.files[0],target.dataset.uploadStudent,'exame-ou-foto');data=await store.read();draw(state.activeView);showToast('Anexo salvo neste ambiente de teste.');}
      if(target.name==='demoStudent'){selectedStudent=target.value;sessionId=null;localStorage.setItem('vp-demo-selected-student',selectedStudent);restoreWellness();draw(state.activeView);showToast('Aluno de teste alterado.');}
    }catch(error){showToast(error.message);}
  });
  document.addEventListener('input',event=>{if(event.target.name==='studentQuery'){const query=event.target.value.toLocaleLowerCase('pt-BR');document.querySelector('#studio-student-list').innerHTML=data.students.filter(s=>s.name.toLocaleLowerCase('pt-BR').includes(query)).map(s=>studentRow(s)).join('');}});
  store.subscribe(async()=>{data=await store.read();if(document.activeElement?.matches('input,textarea,select'))return;draw(state.activeView);});
  applyPreferences();restoreWellness();
  document.documentElement.dataset.studioRuntime='true';
  const bell=document.querySelector('[aria-label="Notificações"]');if(bell){bell.removeAttribute('data-toast');bell.dataset.studio='notifications';}
  const banner=document.createElement('p');banner.className='studio-demo-label';banner.textContent='Ambiente de testes · use dados fictícios';document.querySelector('.workspace-header').after(banner);
  async function createDemoStudent(values) {
    const email=String(values.get('email')||'').trim().toLowerCase();
    if(data.students.some(s=>s.email.toLowerCase()===email))throw new Error('Já existe um aluno de teste com este e-mail.');
    const student={id:id(),name:String(values.get('fullName')||'').trim(),email,gender:values.get('profileSex')==='male'?'Masculino':'Feminino',trackCycle:false,conditions:[],rankingOptIn:false};
    if(!student.name)throw new Error('Informe um nome de teste.');
    await change('Aluno de teste criado',next=>next.students.push(student),{render:false});
    selectedStudent=student.id;localStorage.setItem('vp-demo-selected-student',selectedStudent);localStorage.setItem('vp-demo-session-role','student');
    setAccessRole('student');formPart=0;formDraft={name:student.name,gender:student.gender,trackCycle:'Não'};restoreWellness();enterWorkspace('intake');
    showToast('Perfil de teste criado. A senha não foi armazenada; autenticação real aguarda o serviço online.');
  }
  return {render:draw,saveWellness,onEnter,student:activeStudent,createDemoStudent,async reload(){data=await store.read();restoreWellness();draw(state.activeView);}};
}
