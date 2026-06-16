/* Lingua — language learning PWA
   - Reads data.json (converted from DB.xlsx)
   - Base language: shown in UI and as the prompt side
   - Target language: what the user is learning
   - Persists progress in localStorage
*/

const LS_KEY = 'lingua.state.v1';
const LANG_CODES = ['es','en','fr','pt','de','it'];
const SESSION_LEN = 10; // items per practice session
const LEVEL_VALUE = {A1:1, A2:2, B1:3, B2:4, C1:5, C2:6};
const CEFR_LABELS = ['A1','A2','B1','B2','C1','C2'];
const INTERACTION_WINDOW = 500;
const WRONG_PENALTY = 3; // wrong = -3 * itemLevelValue
const HISTORY_DAYS = 100;

/* ---------------- i18n ---------------- */
const LANG_NAMES = {
  es: {es:'Español', en:'Inglés',    fr:'Francés',  pt:'Portugués', de:'Alemán',   it:'Italiano'},
  en: {es:'Spanish', en:'English',   fr:'French',   pt:'Portuguese',de:'German',   it:'Italian'},
  fr: {es:'Espagnol',en:'Anglais',   fr:'Français', pt:'Portugais', de:'Allemand', it:'Italien'},
  pt: {es:'Espanhol',en:'Inglês',    fr:'Francês',  pt:'Português', de:'Alemão',   it:'Italiano'},
  de: {es:'Spanisch',en:'Englisch',  fr:'Französisch',pt:'Portugiesisch',de:'Deutsch',it:'Italienisch'},
  it: {es:'Spagnolo',en:'Inglese',   fr:'Francese', pt:'Portoghese',de:'Tedesco',  it:'Italiano'},
};

const I18N = {
  es: {
    appName:'Lingua', navHome:'Inicio', navPractice:'Practicar', navProgress:'Progreso',
    settings:'Ajustes', baseLang:'Mi idioma', targetLang:'Idioma que aprendo',
    resetProgress:'Reiniciar progreso', resetConfirm:'¿Seguro? Se borrará todo tu progreso.',
    save:'Guardar', close:'Cerrar',
    learning:'Aprendiendo', from:'desde',
    welcomeHi:'¡Hola!', welcomeSub:'Sigamos con tu italiano.',
    levelLabel:'Tu nivel', todayPoints:'Hoy', streakDays:'Racha',
    practiceUpTo:'Practicas hasta {cefr}', avgLastN:'Promedio de las últimas {n} interacciones',
    evolutionLastDays:'Evolución del nivel · últimos {n} días',
    legendLevel:'Nivel', interactionsLabel:'Interacciones', accuracyLabel:'Aciertos',
    activitiesTitle:'¿Qué quieres practicar?',
    actFlashWords:'Flashcards de palabras', actFlashWordsD:'Da la vuelta y marca si acertaste',
    actFlashPhrases:'Flashcards de frases', actFlashPhrasesD:'Frases comunes en contexto',
    actQuizWords:'Quiz de palabras', actQuizWordsD:'4 opciones, traduce a {target}',
    actQuizPhrases:'Quiz de frases', actQuizPhrasesD:'4 opciones, traduce la frase',
    tapToFlip:'Toca la tarjeta para ver la traducción',
    iGotIt:'Acerté', iMissed:'Fallé',
    chooseTranslation:'Elige la traducción correcta',
    correct:'¡Correcto!', incorrect:'Incorrecto', nextItem:'Siguiente',
    sessionDone:'Sesión completa',
    pointsEarned:'puntos ganados',
    backHome:'Volver al inicio', playAgain:'Otra ronda',
    progressTitle:'Tu progreso', evolutionTitle:'Evolución diaria',
    masteredCount:'Dominadas', learnedCount:'Aprendidas', seenCount:'Vistas', totalItems:'Total',
    fluencyPct:'Dominio de A1', currentGroup:'Grupo actual',
    unlockedGroups:'Grupos desbloqueados', noHistoryYet:'Aún no hay historial — empieza a practicar',
    legendPoints:'Puntos', legendFluency:'Dominio %',
    notEnoughItems:'Necesitas más vocabulario para este modo. Practica antes con flashcards.',
    keepGoing:'¡Sigue así!', greatJob:'¡Excelente trabajo!',
    groups:{
      'Saludos y Cortesía':'Saludos y cortesía',
      'Números, Tiempo y Fechas':'Números, tiempo y fechas',
      'Familia y Personas':'Familia y personas',
      'Comida y Bebida (Básico)':'Comida y bebida',
      'Casa y Objetos cotidianos':'Casa y objetos cotidianos',
      'Ciudad y Transporte':'Ciudad y transporte',
      'Colores y Ropa básica':'Colores y ropa',
      'Verbos y Acciones Esenciales':'Verbos esenciales',
      'Naturaleza y Animales (Básico)':'Naturaleza y animales',
    },
  },
  en: {
    appName:'Lingua', navHome:'Home', navPractice:'Practice', navProgress:'Progress',
    settings:'Settings', baseLang:'My language', targetLang:'Language I learn',
    resetProgress:'Reset progress', resetConfirm:'Are you sure? All progress will be erased.',
    save:'Save', close:'Close',
    learning:'Learning', from:'from',
    welcomeHi:'Hi!', welcomeSub:"Let's keep learning.",
    levelLabel:'Your level', todayPoints:'Today', streakDays:'Streak',
    practiceUpTo:'Practicing up to {cefr}', avgLastN:'Average of the last {n} interactions',
    evolutionLastDays:'Level evolution · last {n} days',
    legendLevel:'Level', interactionsLabel:'Interactions', accuracyLabel:'Accuracy',
    activitiesTitle:'What do you want to practice?',
    actFlashWords:'Word flashcards', actFlashWordsD:'Flip and mark if you got it',
    actFlashPhrases:'Phrase flashcards', actFlashPhrasesD:'Common phrases in context',
    actQuizWords:'Word quiz', actQuizWordsD:'4 options, translate into {target}',
    actQuizPhrases:'Phrase quiz', actQuizPhrasesD:'4 options, translate the phrase',
    tapToFlip:'Tap the card to see the translation',
    iGotIt:'Got it', iMissed:'Missed',
    chooseTranslation:'Choose the right translation',
    correct:'Correct!', incorrect:'Wrong', nextItem:'Next',
    sessionDone:'Session complete',
    pointsEarned:'points earned',
    backHome:'Back to home', playAgain:'Play again',
    progressTitle:'Your progress', evolutionTitle:'Daily evolution',
    masteredCount:'Mastered', learnedCount:'Learned', seenCount:'Seen', totalItems:'Total',
    fluencyPct:'A1 mastery', currentGroup:'Current group',
    unlockedGroups:'Unlocked groups', noHistoryYet:'No history yet — start practicing',
    legendPoints:'Points', legendFluency:'Mastery %',
    notEnoughItems:'You need more vocabulary first. Practice flashcards.',
    keepGoing:'Keep it up!', greatJob:'Great job!',
    groups:{
      'Saludos y Cortesía':'Greetings & courtesy',
      'Números, Tiempo y Fechas':'Numbers, time & dates',
      'Familia y Personas':'Family & people',
      'Comida y Bebida (Básico)':'Food & drink',
      'Casa y Objetos cotidianos':'Home & everyday objects',
      'Ciudad y Transporte':'City & transport',
      'Colores y Ropa básica':'Colours & clothing',
      'Verbos y Acciones Esenciales':'Essential verbs',
      'Naturaleza y Animales (Básico)':'Nature & animals',
    },
  },
  fr: {
    appName:'Lingua', navHome:'Accueil', navPractice:'Pratiquer', navProgress:'Progrès',
    settings:'Réglages', baseLang:'Ma langue', targetLang:"Langue à apprendre",
    resetProgress:'Réinitialiser', resetConfirm:'Sûr ? Toute la progression sera effacée.',
    save:'Enregistrer', close:'Fermer',
    learning:'Apprentissage', from:'depuis',
    welcomeHi:'Salut !', welcomeSub:'Continuons à apprendre.',
    levelLabel:'Ton niveau', todayPoints:"Aujourd'hui", streakDays:'Série',
    practiceUpTo:"Tu pratiques jusqu'au {cefr}", avgLastN:'Moyenne des {n} dernières interactions',
    evolutionLastDays:'Évolution du niveau · {n} derniers jours',
    legendLevel:'Niveau', interactionsLabel:'Interactions', accuracyLabel:'Précision',
    activitiesTitle:'Que veux-tu pratiquer ?',
    actFlashWords:'Flashcards de mots', actFlashWordsD:"Retourne et marque si tu as réussi",
    actFlashPhrases:'Flashcards de phrases', actFlashPhrasesD:'Phrases courantes',
    actQuizWords:'Quiz de mots', actQuizWordsD:"4 choix, traduis en {target}",
    actQuizPhrases:'Quiz de phrases', actQuizPhrasesD:'4 choix, traduis la phrase',
    tapToFlip:'Touche la carte pour voir la traduction',
    iGotIt:'Réussi', iMissed:'Raté',
    chooseTranslation:'Choisis la bonne traduction',
    correct:'Correct !', incorrect:'Faux', nextItem:'Suivant',
    sessionDone:'Session terminée',
    pointsEarned:'points gagnés',
    backHome:"Retour à l'accueil", playAgain:'Rejouer',
    progressTitle:'Ton progrès', evolutionTitle:'Évolution quotidienne',
    masteredCount:'Maîtrisés', learnedCount:'Appris', seenCount:'Vus', totalItems:'Total',
    fluencyPct:'Maîtrise A1', currentGroup:'Groupe actuel',
    unlockedGroups:'Groupes débloqués', noHistoryYet:"Pas d'historique — commence à pratiquer",
    legendPoints:'Points', legendFluency:'Maîtrise %',
    notEnoughItems:'Tu as besoin de plus de vocabulaire. Pratique en flashcards.',
    keepGoing:'Continue !', greatJob:'Super boulot !',
    groups:{
      'Saludos y Cortesía':'Salutations & politesse',
      'Números, Tiempo y Fechas':'Nombres, temps & dates',
      'Familia y Personas':'Famille & personnes',
      'Comida y Bebida (Básico)':'Nourriture & boisson',
      'Casa y Objetos cotidianos':'Maison & objets',
      'Ciudad y Transporte':'Ville & transport',
      'Colores y Ropa básica':'Couleurs & vêtements',
      'Verbos y Acciones Esenciales':'Verbes essentiels',
      'Naturaleza y Animales (Básico)':'Nature & animaux',
    },
  },
  pt: {
    appName:'Lingua', navHome:'Início', navPractice:'Praticar', navProgress:'Progresso',
    settings:'Definições', baseLang:'Meu idioma', targetLang:'Idioma que aprendo',
    resetProgress:'Reiniciar progresso', resetConfirm:'Tem certeza? Todo o progresso será apagado.',
    save:'Guardar', close:'Fechar',
    learning:'Aprendendo', from:'desde',
    welcomeHi:'Olá!', welcomeSub:'Vamos continuar a aprender.',
    levelLabel:'Seu nível', todayPoints:'Hoje', streakDays:'Sequência',
    practiceUpTo:'Praticas até {cefr}', avgLastN:'Média das últimas {n} interações',
    evolutionLastDays:'Evolução do nível · últimos {n} dias',
    legendLevel:'Nível', interactionsLabel:'Interações', accuracyLabel:'Acertos',
    activitiesTitle:'O que queres praticar?',
    actFlashWords:'Flashcards de palavras', actFlashWordsD:'Vira e marca se acertaste',
    actFlashPhrases:'Flashcards de frases', actFlashPhrasesD:'Frases comuns em contexto',
    actQuizWords:'Quiz de palavras', actQuizWordsD:'4 opções, traduz para {target}',
    actQuizPhrases:'Quiz de frases', actQuizPhrasesD:'4 opções, traduz a frase',
    tapToFlip:'Toca o cartão para ver a tradução',
    iGotIt:'Acertei', iMissed:'Errei',
    chooseTranslation:'Escolhe a tradução correta',
    correct:'Correto!', incorrect:'Errado', nextItem:'Seguinte',
    sessionDone:'Sessão concluída',
    pointsEarned:'pontos ganhos',
    backHome:'Voltar ao início', playAgain:'Outra ronda',
    progressTitle:'O teu progresso', evolutionTitle:'Evolução diária',
    masteredCount:'Dominadas', learnedCount:'Aprendidas', seenCount:'Vistas', totalItems:'Total',
    fluencyPct:'Domínio A1', currentGroup:'Grupo atual',
    unlockedGroups:'Grupos desbloqueados', noHistoryYet:'Sem histórico — começa a praticar',
    legendPoints:'Pontos', legendFluency:'Domínio %',
    notEnoughItems:'Precisas de mais vocabulário. Pratica com flashcards.',
    keepGoing:'Continua!', greatJob:'Excelente!',
    groups:{
      'Saludos y Cortesía':'Saudações & cortesia',
      'Números, Tiempo y Fechas':'Números, tempo & datas',
      'Familia y Personas':'Família & pessoas',
      'Comida y Bebida (Básico)':'Comida & bebida',
      'Casa y Objetos cotidianos':'Casa & objetos',
      'Ciudad y Transporte':'Cidade & transporte',
      'Colores y Ropa básica':'Cores & roupa',
      'Verbos y Acciones Esenciales':'Verbos essenciais',
      'Naturaleza y Animales (Básico)':'Natureza & animais',
    },
  },
  de: {
    appName:'Lingua', navHome:'Start', navPractice:'Üben', navProgress:'Fortschritt',
    settings:'Einstellungen', baseLang:'Meine Sprache', targetLang:'Lernsprache',
    resetProgress:'Fortschritt zurücksetzen', resetConfirm:'Sicher? Alles wird gelöscht.',
    save:'Speichern', close:'Schließen',
    learning:'Lerne', from:'aus',
    welcomeHi:'Hallo!', welcomeSub:'Weiter lernen.',
    levelLabel:'Dein Niveau', todayPoints:'Heute', streakDays:'Serie',
    practiceUpTo:'Du übst bis {cefr}', avgLastN:'Durchschnitt der letzten {n} Interaktionen',
    evolutionLastDays:'Niveau-Verlauf · letzte {n} Tage',
    legendLevel:'Niveau', interactionsLabel:'Interaktionen', accuracyLabel:'Treffer',
    activitiesTitle:'Was möchtest du üben?',
    actFlashWords:'Wort-Karten', actFlashWordsD:'Umdrehen und bewerten',
    actFlashPhrases:'Satz-Karten', actFlashPhrasesD:'Häufige Sätze',
    actQuizWords:'Wort-Quiz', actQuizWordsD:'4 Optionen, ins {target} übersetzen',
    actQuizPhrases:'Satz-Quiz', actQuizPhrasesD:'4 Optionen, Satz übersetzen',
    tapToFlip:'Karte tippen für die Übersetzung',
    iGotIt:'Richtig', iMissed:'Falsch',
    chooseTranslation:'Wähle die richtige Übersetzung',
    correct:'Richtig!', incorrect:'Falsch', nextItem:'Weiter',
    sessionDone:'Sitzung beendet',
    pointsEarned:'Punkte erreicht',
    backHome:'Zur Startseite', playAgain:'Nochmal',
    progressTitle:'Dein Fortschritt', evolutionTitle:'Tägliche Entwicklung',
    masteredCount:'Beherrscht', learnedCount:'Gelernt', seenCount:'Gesehen', totalItems:'Gesamt',
    fluencyPct:'A1-Beherrschung', currentGroup:'Aktuelle Gruppe',
    unlockedGroups:'Freigeschaltete Gruppen', noHistoryYet:'Noch kein Verlauf — fang an',
    legendPoints:'Punkte', legendFluency:'Beherrschung %',
    notEnoughItems:'Du brauchst mehr Wortschatz. Übe mit Karten.',
    keepGoing:'Weiter so!', greatJob:'Toll gemacht!',
    groups:{
      'Saludos y Cortesía':'Begrüßung & Höflichkeit',
      'Números, Tiempo y Fechas':'Zahlen, Zeit & Datum',
      'Familia y Personas':'Familie & Personen',
      'Comida y Bebida (Básico)':'Essen & Trinken',
      'Casa y Objetos cotidianos':'Haus & Alltag',
      'Ciudad y Transporte':'Stadt & Verkehr',
      'Colores y Ropa básica':'Farben & Kleidung',
      'Verbos y Acciones Esenciales':'Wichtige Verben',
      'Naturaleza y Animales (Básico)':'Natur & Tiere',
    },
  },
  it: {
    appName:'Lingua', navHome:'Inizio', navPractice:'Pratica', navProgress:'Progresso',
    settings:'Impostazioni', baseLang:'La mia lingua', targetLang:'Lingua da imparare',
    resetProgress:'Azzera progresso', resetConfirm:'Sicuro? Tutto il progresso sarà cancellato.',
    save:'Salva', close:'Chiudi',
    learning:'Imparando', from:'da',
    welcomeHi:'Ciao!', welcomeSub:'Continuiamo a imparare.',
    levelLabel:'Il tuo livello', todayPoints:'Oggi', streakDays:'Serie',
    practiceUpTo:'Pratichi fino a {cefr}', avgLastN:'Media delle ultime {n} interazioni',
    evolutionLastDays:'Evoluzione del livello · ultimi {n} giorni',
    legendLevel:'Livello', interactionsLabel:'Interazioni', accuracyLabel:'Precisione',
    activitiesTitle:'Cosa vuoi praticare?',
    actFlashWords:'Flashcard di parole', actFlashWordsD:'Gira e segna se hai indovinato',
    actFlashPhrases:'Flashcard di frasi', actFlashPhrasesD:'Frasi comuni in contesto',
    actQuizWords:'Quiz di parole', actQuizWordsD:'4 opzioni, traduci in {target}',
    actQuizPhrases:'Quiz di frasi', actQuizPhrasesD:'4 opzioni, traduci la frase',
    tapToFlip:'Tocca la carta per vedere la traduzione',
    iGotIt:'Indovinato', iMissed:'Sbagliato',
    chooseTranslation:'Scegli la traduzione corretta',
    correct:'Corretto!', incorrect:'Sbagliato', nextItem:'Avanti',
    sessionDone:'Sessione completata',
    pointsEarned:'punti guadagnati',
    backHome:"Torna all'inizio", playAgain:'Ancora',
    progressTitle:'Il tuo progresso', evolutionTitle:'Evoluzione giornaliera',
    masteredCount:'Padroneggiate', learnedCount:'Apprese', seenCount:'Viste', totalItems:'Totale',
    fluencyPct:'Padronanza A1', currentGroup:'Gruppo attuale',
    unlockedGroups:'Gruppi sbloccati', noHistoryYet:'Nessuna cronologia — inizia a praticare',
    legendPoints:'Punti', legendFluency:'Padronanza %',
    notEnoughItems:'Servono più vocaboli. Pratica con flashcard.',
    keepGoing:'Continua!', greatJob:'Ottimo lavoro!',
    groups:{
      'Saludos y Cortesía':'Saluti & cortesia',
      'Números, Tiempo y Fechas':'Numeri, tempo & date',
      'Familia y Personas':'Famiglia & persone',
      'Comida y Bebida (Básico)':'Cibo & bevande',
      'Casa y Objetos cotidianos':'Casa & oggetti',
      'Ciudad y Transporte':'Città & trasporti',
      'Colores y Ropa básica':'Colori & vestiti',
      'Verbos y Acciones Esenciales':'Verbi essenziali',
      'Naturaleza y Animales (Básico)':'Natura & animali',
    },
  },
};

function t(key, params){
  const dict = I18N[state.base] || I18N.es;
  let s = dict[key] ?? I18N.es[key] ?? key;
  if (params){
    for (const k in params) s = s.replace(`{${k}}`, params[k]);
  }
  return s;
}
function tGroup(name){
  const dict = I18N[state.base]?.groups || I18N.es.groups;
  return dict[name] || name;
}
function langName(code, inBase){
  const base = inBase || state.base;
  return (LANG_NAMES[base] && LANG_NAMES[base][code]) || code;
}

/* ---------------- State ---------------- */
let data = null;        // {groupOrder, items}
let state = null;       // persisted

function defaultState(){
  return {
    base: 'es',
    target: 'it',
    mastery: {},        // id -> 0..5 (for SRS-style item selection)
    interactions: [],   // last INTERACTION_WINDOW entries: {id, lv, val, correct, score, ts}
    history: [],        // [{date, level, points, correct, wrong, interactions}]
    today: {date: today(), points: 0, correct: 0, wrong: 0},
    streak: {last: null, count: 0},
    createdAt: new Date().toISOString(),
  };
}
function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const obj = JSON.parse(raw);
    return Object.assign(defaultState(), obj);
  }catch(e){ return defaultState(); }
}
function saveState(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
}
function today(){
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function rollDayIfNeeded(){
  const td = today();
  if (state.today.date !== td){
    state.today = {date: td, points: 0, correct: 0, wrong: 0};
  }
}
function upsertTodayHistory(){
  const td = state.today.date;
  const entry = {
    date: td,
    level: userLevel(),
    points: state.today.points,
    correct: state.today.correct,
    wrong: state.today.wrong,
    interactions: state.interactions.length,
  };
  const idx = state.history.findIndex(h => h.date === td);
  if (idx >= 0) state.history[idx] = entry;
  else state.history.push(entry);
  if (state.history.length > 365) state.history = state.history.slice(-365);
}
function bumpStreak(){
  const td = today();
  if (state.streak.last === td) return;
  if (!state.streak.last){ state.streak.last = td; state.streak.count = 1; return; }
  const last = new Date(state.streak.last);
  const cur = new Date(td);
  const diff = Math.round((cur - last) / 86400000);
  if (diff === 1) state.streak.count += 1;
  else if (diff > 1) state.streak.count = 1;
  state.streak.last = td;
}

/* ---------------- Mastery (for item picking) ---------------- */
function getMastery(id){ return state.mastery[id] || 0; }
function setMastery(id, v){ state.mastery[id] = Math.max(0, Math.min(5, v)); }

/* ---------------- Level (CEFR) ---------------- */
function itemLevelValue(item){
  return LEVEL_VALUE[item.level] || 1;
}
function userLevel(){
  // Average of last INTERACTION_WINDOW interaction scores
  const xs = state.interactions;
  if (!xs.length) return 0;
  let sum = 0;
  for (const x of xs) sum += x.score;
  return sum / xs.length;
}
function cefrLabel(level){
  if (level < 1) return '—';
  const idx = Math.min(5, Math.floor(level) - 1);
  return CEFR_LABELS[idx];
}
function maxPracticeLevelValue(){
  // The user can practice up to: floor(level) + 2, clamped to [1, 6]
  const lv = userLevel();
  const base = Math.max(0, Math.floor(lv));
  return Math.max(1, Math.min(6, base + 2));
}
function maxPracticeCefr(){
  return CEFR_LABELS[maxPracticeLevelValue() - 1];
}

/* ---------------- Item eligibility / selection ---------------- */
function eligibleItems(type){
  const maxLv = maxPracticeLevelValue();
  return data.items.filter(it => it.type === type && itemLevelValue(it) <= maxLv);
}

function pickItemWeighted(pool, exclude){
  // Lower mastery → higher weight. Mastered (5) gets a small weight for retention.
  // Boost items at the user's frontier level so they progress upward.
  const frontier = maxPracticeLevelValue();
  const weighted = pool.filter(it => !exclude || !exclude.has(it.id)).map(it => {
    const m = getMastery(it.id);
    let w = m >= 5 ? 0.15 : (6 - m); // 6,5,4,3,2,1
    if (itemLevelValue(it) === frontier) w += 1.0;
    return {it, w};
  });
  const total = weighted.reduce((s,x)=>s+x.w, 0);
  let r = Math.random() * total;
  for (const x of weighted){
    r -= x.w;
    if (r <= 0) return x.it;
  }
  return weighted[weighted.length - 1]?.it;
}

function pickQuizDistractors(item, count){
  // Same group + same type ideally; fallback to same type
  const pool = data.items.filter(x => x.group === item.group && x.type === item.type && x.id !== item.id);
  if (pool.length < count){
    const more = data.items.filter(x => x.type === item.type && x.id !== item.id && !pool.find(p=>p.id===x.id));
    while (pool.length < count && more.length) pool.push(more.shift());
  }
  return pool.sort(()=>Math.random()-0.5).slice(0, count);
}

/* ---------------- Scoring ---------------- */
function recordAnswer(item, correct){
  rollDayIfNeeded();
  const val = itemLevelValue(item);
  const score = correct ? val : -WRONG_PENALTY * val;

  // SRS-style mastery (used for selection only)
  const m = getMastery(item.id);
  setMastery(item.id, correct ? m + 1 : m - 1);

  // Push interaction (capped at window size)
  state.interactions.push({
    id: item.id, lv: item.level, val, correct, score, ts: Date.now()
  });
  if (state.interactions.length > INTERACTION_WINDOW){
    state.interactions = state.interactions.slice(-INTERACTION_WINDOW);
  }

  if (correct){
    state.today.points += val;
    state.today.correct += 1;
    bumpStreak();
  } else {
    state.today.wrong += 1;
  }

  upsertTodayHistory();
  saveState();
}

function groupProgress(g){
  // Returns {count, learned, mastered, sumMastery, masteryPct (0..1), learnedPct (0..1)}
  const items = data.items.filter(it => it.group === g);
  let sumMastery = 0, learned = 0, mastered = 0;
  for (const it of items){
    const m = getMastery(it.id);
    sumMastery += m;
    if (m >= 3) learned += 1;
    if (m >= 5) mastered += 1;
  }
  const count = items.length;
  const masteryPct = count ? sumMastery / (count * 5) : 0;
  const learnedPct = count ? learned / count : 0;
  return {count, learned, mastered, sumMastery, masteryPct, learnedPct};
}

function computeStats(){
  const total = data.items.length;
  let mastered = 0, learned = 0, seen = 0, sum = 0;
  for (const it of data.items){
    const m = getMastery(it.id);
    sum += m;
    if (m >= 1) seen += 1;
    if (m >= 3) learned += 1;
    if (m >= 5) mastered += 1;
  }
  const max = total * 5;
  const fluencyPct = max ? Math.round((sum / max) * 100) : 0;
  return {total, mastered, learned, seen, fluencyPct};
}

function levelDisplay(){
  // Returns {numeric (e.g. 2.5), cefr (e.g. "A2"), progressInLevel (0..1), nextCefr}
  const lv = userLevel();
  const cefr = cefrLabel(lv);
  const progressInLevel = lv >= 1 ? (lv - Math.floor(lv)) : Math.max(0, lv);
  const nextCefr = lv >= 1
    ? CEFR_LABELS[Math.min(5, Math.floor(lv))]
    : 'A1';
  return {numeric: lv, cefr, progressInLevel, nextCefr};
}

/* ---------------- Rendering ---------------- */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function applyI18nStatic(){
  document.documentElement.lang = state.base;
  $$('#app [data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  $('#langPairLabel').textContent =
    `${t('learning')} ${langName(state.target)} ${t('from')} ${langName(state.base)}`;
}

function setActiveTab(name){
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
}

function renderHome(){
  setActiveTab('home');
  const root = $('#screen');
  root.innerHTML = `
    ${renderLevelCard()}

    <section class="kpis">
      <div class="kpi"><div class="v">${state.today.points}</div><div class="l">${t('todayPoints')}</div></div>
      <div class="kpi"><div class="v">${state.streak.count}</div><div class="l">${t('streakDays')}</div></div>
      <div class="kpi"><div class="v">${state.interactions.length}</div><div class="l">${t('interactionsLabel')}</div></div>
    </section>

    <section class="card">
      <div class="row between" style="margin-bottom:10px">
        <div class="h2">${t('activitiesTitle')}</div>
        <span class="group-chip">${t('practiceUpTo', {cefr: maxPracticeCefr()})}</span>
      </div>
      <div class="activities">
        <button class="activity" data-act="flash-word">
          <span class="ico"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M4 5h13a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H4z"/></svg></span>
          <div class="t">${t('actFlashWords')}</div>
          <div class="d">${t('actFlashWordsD')}</div>
        </button>
        <button class="activity alt" data-act="flash-phrase">
          <span class="ico"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M5 4h14v12H7l-4 4V4z"/></svg></span>
          <div class="t">${t('actFlashPhrases')}</div>
          <div class="d">${t('actFlashPhrasesD')}</div>
        </button>
        <button class="activity" data-act="quiz-word">
          <span class="ico"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zm-2 18h4v2h-4z"/></svg></span>
          <div class="t">${t('actQuizWords')}</div>
          <div class="d">${t('actQuizWordsD', {target:langName(state.target)})}</div>
        </button>
        <button class="activity alt" data-act="quiz-phrase">
          <span class="ico"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M3 5h18v3H3zm0 5h18v3H3zm0 5h12v3H3z"/></svg></span>
          <div class="t">${t('actQuizPhrases')}</div>
          <div class="d">${t('actQuizPhrasesD')}</div>
        </button>
      </div>
    </section>
  `;

  $$('.activity').forEach(b => b.addEventListener('click', () => {
    const map = {
      'flash-word': () => startFlashcards('Word'),
      'flash-phrase': () => startFlashcards('Phrase'),
      'quiz-word': () => startQuiz('Word'),
      'quiz-phrase': () => startQuiz('Phrase'),
    };
    map[b.dataset.act]?.();
  }));
}

function renderLevelCard(){
  const lv = levelDisplay();
  const numericStr = lv.numeric.toFixed(2);
  const pct = Math.round(lv.progressInLevel * 100);
  return `
    <section class="card level-card">
      <div class="row between">
        <div>
          <div class="l">${t('levelLabel')}</div>
          <div class="v">${lv.cefr} · ${numericStr}</div>
          <div class="muted" style="margin-top:4px">${t('avgLastN', {n: Math.min(INTERACTION_WINDOW, state.interactions.length)})}</div>
        </div>
        <div style="text-align:right">
          <div class="muted" style="font-size:11px">${t('practiceUpTo', {cefr: maxPracticeCefr()})}</div>
          <div style="font-size:26px;font-weight:800">${maxPracticeCefr()}</div>
        </div>
      </div>
      <div class="progressbar" style="margin-top:12px"><div class="fill" style="width:${pct}%"></div></div>
    </section>
  `;
}

/* ---------------- Practice screen (default = home with shortcuts) ---------------- */
function renderPractice(){
  setActiveTab('practice');
  const lv = levelDisplay();
  const root = $('#screen');
  root.innerHTML = `
    <section class="card">
      <div class="row between">
        <div class="h1">${t('activitiesTitle')}</div>
        <span class="pill">${lv.cefr} · ${lv.numeric.toFixed(2)}</span>
      </div>
      <div class="muted" style="margin-top:4px">${t('practiceUpTo', {cefr: maxPracticeCefr()})}</div>
    </section>
    <div class="activities">
      <button class="activity" data-act="flash-word">
        <span class="ico">📇</span>
        <div class="t">${t('actFlashWords')}</div>
        <div class="d">${t('actFlashWordsD')}</div>
      </button>
      <button class="activity alt" data-act="flash-phrase">
        <span class="ico">💬</span>
        <div class="t">${t('actFlashPhrases')}</div>
        <div class="d">${t('actFlashPhrasesD')}</div>
      </button>
      <button class="activity" data-act="quiz-word">
        <span class="ico">🎯</span>
        <div class="t">${t('actQuizWords')}</div>
        <div class="d">${t('actQuizWordsD', {target:langName(state.target)})}</div>
      </button>
      <button class="activity alt" data-act="quiz-phrase">
        <span class="ico">📝</span>
        <div class="t">${t('actQuizPhrases')}</div>
        <div class="d">${t('actQuizPhrasesD')}</div>
      </button>
    </div>
  `;
  $$('.activity').forEach(b => b.addEventListener('click', () => {
    const map = {
      'flash-word': () => startFlashcards('Word'),
      'flash-phrase': () => startFlashcards('Phrase'),
      'quiz-word': () => startQuiz('Word'),
      'quiz-phrase': () => startQuiz('Phrase'),
    };
    map[b.dataset.act]?.();
  }));
}

/* ---------------- Flashcards ---------------- */
function startFlashcards(type){
  const pool = eligibleItems(type);
  if (pool.length === 0){
    alert(t('notEnoughItems'));
    return;
  }
  const session = {type, idx:0, total: Math.min(SESSION_LEN, pool.length), correct:0, points:0, seen:new Set()};
  showFlashcard(session);
}

function showFlashcard(session){
  const pool = eligibleItems(session.type);
  const item = pickItemWeighted(pool, session.seen);
  if (!item){ return endSession(session); }
  session.seen.add(item.id);
  const root = $('#screen');
  setActiveTab('practice');
  root.innerHTML = `
    <div class="row between">
      <button class="pill" id="exitSess">✕</button>
      <span class="pill">${session.idx+1} / ${session.total}</span>
      <span class="pill">${cefrLabel(userLevel())} · ${userLevel().toFixed(2)}</span>
    </div>
    <div class="row between" style="margin-top:-6px">
      <span class="group-chip">${item.level} · ${tGroup(item.group)}</span>
    </div>
    <div class="flash-wrap">
      <div class="flash" id="flash">
        <div class="flash-inner">
          <div class="flash-face front">
            <div class="lang-tag">${langName(state.base)}</div>
            <div class="group-tag">${item.type === 'Word' ? '📇' : '💬'}</div>
            <div class="${item.type==='Word'?'word':'phrase'}">${item[state.base]}</div>
          </div>
          <div class="flash-face back">
            <div class="lang-tag">${langName(state.target)}</div>
            <div class="group-tag">${item.type === 'Word' ? '📇' : '💬'}</div>
            <div class="${item.type==='Word'?'word':'phrase'}">${item[state.target]}</div>
          </div>
        </div>
      </div>
      <div class="hint">${t('tapToFlip')}</div>
      <div class="btn-row" id="answerRow" style="display:none">
        <button class="btn bad" id="missBtn">${t('iMissed')}</button>
        <button class="btn good" id="hitBtn">${t('iGotIt')}</button>
      </div>
    </div>
  `;
  const flash = $('#flash');
  let flipped = false;
  flash.addEventListener('click', () => {
    flipped = !flipped;
    flash.classList.toggle('flipped', flipped);
    if (flipped) $('#answerRow').style.display = 'grid';
  });
  $('#exitSess').addEventListener('click', renderHome);
  const next = (ok) => {
    recordAnswer(item, ok);
    if (ok){ session.correct += 1; session.points += itemLevelValue(item); }
    session.idx += 1;
    if (session.idx >= session.total) endSession(session);
    else showFlashcard(session);
  };
  $('#missBtn').addEventListener('click', () => next(false));
  $('#hitBtn').addEventListener('click', () => next(true));
}

/* ---------------- Quiz ---------------- */
function startQuiz(type){
  const pool = eligibleItems(type);
  if (pool.length < 4){
    alert(t('notEnoughItems'));
    return;
  }
  const session = {type, idx:0, total: Math.min(SESSION_LEN, pool.length), correct:0, points:0, seen:new Set()};
  showQuiz(session);
}

function showQuiz(session){
  const pool = eligibleItems(session.type);
  const item = pickItemWeighted(pool, session.seen);
  if (!item){ return endSession(session); }
  session.seen.add(item.id);
  const distractors = pickQuizDistractors(item, 3);
  const options = [item, ...distractors].sort(()=>Math.random()-0.5);
  const root = $('#screen');
  setActiveTab('practice');
  root.innerHTML = `
    <div class="row between">
      <button class="pill" id="exitSess">✕</button>
      <span class="pill">${session.idx+1} / ${session.total}</span>
      <span class="pill">${cefrLabel(userLevel())} · ${userLevel().toFixed(2)}</span>
    </div>
    <div class="row between" style="margin-top:-6px">
      <span class="group-chip">${item.level} · ${tGroup(item.group)}</span>
    </div>
    <div class="quiz-prompt">
      <span class="lang-tag">${langName(state.base)} → ${langName(state.target)}</span>
      <div>${item[state.base]}</div>
    </div>
    <div class="muted" style="text-align:center">${t('chooseTranslation')}</div>
    <div class="options" id="options">
      ${options.map((o,i)=>`<button class="opt" data-id="${o.id}">${o[state.target]}</button>`).join('')}
    </div>
  `;
  $('#exitSess').addEventListener('click', renderHome);
  $$('#options .opt').forEach(btn => btn.addEventListener('click', () => {
    const chosenId = Number(btn.dataset.id);
    const correct = chosenId === item.id;
    $$('#options .opt').forEach(b => {
      b.disabled = true;
      const id = Number(b.dataset.id);
      if (id === item.id) b.classList.add('correct');
      else if (id === chosenId && !correct) b.classList.add('wrong');
    });
    recordAnswer(item, correct);
    if (correct){ session.correct += 1; session.points += itemLevelValue(item); }
    setTimeout(() => {
      session.idx += 1;
      if (session.idx >= session.total) endSession(session);
      else showQuiz(session);
    }, 850);
  }));
}

function endSession(session){
  const acc = session.idx ? Math.round((session.correct / session.idx) * 100) : 0;
  const root = $('#screen');
  root.innerHTML = `
    <div class="session-end">
      <div style="font-size:34px">${acc >= 80 ? '🎉' : acc >= 50 ? '💪' : '👍'}</div>
      <div class="big">${session.correct} / ${session.idx}</div>
      <div class="muted">${session.points} ${t('pointsEarned')}</div>
      <div class="muted" style="margin-top:6px">${acc >= 80 ? t('greatJob') : t('keepGoing')}</div>
    </div>
    <div class="btn-row">
      <button class="btn secondary" id="backHome">${t('backHome')}</button>
      <button class="btn" id="again">${t('playAgain')}</button>
    </div>
  `;
  $('#backHome').addEventListener('click', renderHome);
  $('#again').addEventListener('click', () => {
    const same = session.type;
    // Decide flash vs quiz by what session looked like? We tracked nothing — go to practice screen.
    renderPractice();
  });
}

/* ---------------- Progress ---------------- */
function renderProgress(){
  setActiveTab('progress');
  // Refresh today's snapshot live
  if (state.interactions.length > 0){
    upsertTodayHistory();
  }
  const chartSeries = state.history.slice(-HISTORY_DAYS);
  const lv = levelDisplay();
  const accuracy = state.interactions.length
    ? Math.round((state.interactions.filter(x => x.correct).length / state.interactions.length) * 100)
    : 0;

  const root = $('#screen');
  root.innerHTML = `
    ${renderLevelCard()}

    <section class="kpis">
      <div class="kpi"><div class="v">${state.interactions.length}</div><div class="l">${t('interactionsLabel')}</div></div>
      <div class="kpi"><div class="v">${accuracy}%</div><div class="l">${t('accuracyLabel')}</div></div>
      <div class="kpi"><div class="v">${state.today.points}</div><div class="l">${t('todayPoints')}</div></div>
    </section>

    <section class="card">
      <div class="row between" style="margin-bottom:6px"><div class="h2">${t('evolutionLastDays', {n: HISTORY_DAYS})}</div></div>
      <div class="legend"><span class="l1">${t('legendLevel')}</span></div>
      <div class="chart" id="chart">${chartSeries.length < 1 ? `<div class="muted" style="display:grid;place-items:center;height:100%">${t('noHistoryYet')}</div>` : renderLevelChartSVG(chartSeries)}</div>
    </section>
  `;
}

function renderLevelChartSVG(series){
  const W = 320, H = 184, P = 22;
  const n = series.length;
  const xs = (i) => n === 1 ? W/2 : P + i * (W - 2*P) / (n - 1);
  // Y axis: levels 0..6
  const ymax = 6, ymin = 0;
  const ysLv = (v) => H - P - ((Math.max(ymin, Math.min(ymax, v)) - ymin) / (ymax - ymin)) * (H - 2*P);
  const lvPath = series.map((s,i) => `${i===0?'M':'L'}${xs(i).toFixed(1)},${ysLv(s.level||0).toFixed(1)}`).join(' ');
  // CEFR gridlines at 1..6 with labels
  const gridY = [0,1,2,3,4,5,6].map(v => {
    const y = ysLv(v).toFixed(1);
    const label = v === 0 ? '' : CEFR_LABELS[v-1];
    return `<line x1="${P}" x2="${W-P}" y1="${y}" y2="${y}" stroke="#1f2a44" stroke-width="1"/>
            ${label ? `<text x="2" y="${(parseFloat(y)+3)}" fill="#94a3b8" font-size="9">${label}</text>` : ''}`;
  }).join('');
  const dots = series.map((s,i) => `<circle cx="${xs(i).toFixed(1)}" cy="${ysLv(s.level||0).toFixed(1)}" r="2.8" fill="#7be0c2"/>`).join('');
  // Area fill under curve
  const areaPath = series.length > 1
    ? lvPath + ` L${xs(n-1).toFixed(1)},${(H-P)} L${xs(0).toFixed(1)},${(H-P)} Z`
    : '';
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none">
    ${gridY}
    ${areaPath ? `<path d="${areaPath}" fill="rgba(123,224,194,0.12)"/>` : ''}
    <path d="${lvPath}" fill="none" stroke="#7be0c2" stroke-width="2"/>
    ${dots}
  </svg>`;
}

/* ---------------- Settings modal ---------------- */
function openSettings(){
  const m = document.createElement('div');
  m.className = 'modal open';
  m.innerHTML = `
    <div class="sheet">
      <div class="handle"></div>
      <div class="h1" style="margin-bottom:14px">${t('settings')}</div>
      <label>${t('baseLang')}</label>
      <select class="select" id="selBase">
        ${LANG_CODES.map(c => `<option value="${c}" ${c===state.base?'selected':''}>${langName(c)}</option>`).join('')}
      </select>
      <label>${t('targetLang')}</label>
      <select class="select" id="selTarget">
        ${LANG_CODES.map(c => `<option value="${c}" ${c===state.target?'selected':''}>${langName(c)}</option>`).join('')}
      </select>
      <div class="divider" style="margin:14px 0"></div>
      <button class="btn secondary" id="resetBtn">${t('resetProgress')}</button>
      <div style="height:10px"></div>
      <button class="btn" id="saveBtn">${t('save')}</button>
      <div style="height:8px"></div>
      <button class="btn ghost" id="closeBtn">${t('close')}</button>
    </div>
  `;
  document.body.appendChild(m);
  const close = () => m.remove();
  $('#closeBtn', m).addEventListener('click', close);
  $('#resetBtn', m).addEventListener('click', () => {
    if (confirm(t('resetConfirm'))){
      const base = state.base, target = state.target;
      state = defaultState();
      state.base = base; state.target = target;
      saveState();
      close();
      applyI18nStatic();
      renderHome();
    }
  });
  $('#saveBtn', m).addEventListener('click', () => {
    const b = $('#selBase', m).value;
    let tg = $('#selTarget', m).value;
    if (tg === b){
      // Pick a different default target
      tg = LANG_CODES.find(c => c !== b) || 'it';
    }
    state.base = b;
    state.target = tg;
    saveState();
    close();
    applyI18nStatic();
    renderHome();
  });
  m.addEventListener('click', (e) => { if (e.target === m) close(); });
}

/* ---------------- Boot ---------------- */
async function boot(){
  state = loadState();
  rollDayIfNeeded();
  saveState();
  try{
    const res = await fetch('data.json', {cache:'no-cache'});
    data = await res.json();
  }catch(e){
    alert('Error loading data.json');
    return;
  }
  applyI18nStatic();
  $('#settingsBtn').addEventListener('click', openSettings);
  $$('.tab').forEach(b => b.addEventListener('click', () => {
    const s = b.dataset.screen;
    if (s === 'home') renderHome();
    else if (s === 'practice') renderPractice();
    else if (s === 'progress') renderProgress();
  }));
  renderHome();
  setTimeout(() => $('#loading').classList.add('hidden'), 150);
}
boot();
