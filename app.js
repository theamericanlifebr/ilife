let aspectsData = {};
let aspectKeys = [];
let tasksData = [];
let lawsData = [];
let mindsetData = [];
let currentIndex = 0;
let currentStep = 0; // 0 importance, 1 level
let responses = JSON.parse(localStorage.getItem('responses') || '{}');
let previousLogin = 0;
let draggedIndex = null;
let editingTaskIndex = null;
let editingMindsetIndex = null;

const statsColors = {
  Family: ['#ff4d4d', '#ff6666'],
  Relationships: ['#ffd700', '#ffea00'],
  Nutrition: ['#66bb6a', '#81c784'],
  Sleep: ['#003366', '#004080'],
  Water: ['#00bcd4', '#26c6da'],
  Emocional: ['#64b5f6', '#90caf9'],
  Hygiene: ['#b3e5fc', '#e1f5fe'],
  Mindfulness: ['#c0c0c0', '#d3d3d3'],
  Learning: ['#ffb300', '#ffca28'],
  Financial: ['#2e7d32', '#388e3c'],
  Purpose: ['#7e57c2', '#9575cd'],
  Contribution: ['#ffffff', '#f5f5f5']
};

// Prevent copying, context menu, and zoom interactions
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'a', '+', '-', '0'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

const slider = document.getElementById('slider');
const sliderFeedback = document.getElementById('slider-feedback');
const aspectImage = document.getElementById('aspect-image');
const statsSlider = document.getElementById('stats-slider');
const statsSliderValue = document.getElementById('stats-slider-value');

const addTaskBtn = document.getElementById('add-task-btn');
const suggestTaskBtn = document.getElementById('suggest-task-btn');
const taskModal = document.getElementById('task-modal');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskDatetimeInput = document.getElementById('task-datetime');
const taskAspectInput = document.getElementById('task-aspect');
const taskTypeInput = document.getElementById('task-type');
const saveTaskBtn = document.getElementById('save-task');
const cancelTaskBtn = document.getElementById('cancel-task');
const completeTaskBtn = document.getElementById('complete-task');
const addLawBtn = document.getElementById('add-law-btn');
const suggestLawBtn = document.getElementById('suggest-law-btn');
const lawModal = document.getElementById('law-modal');
const lawTitleInput = document.getElementById('law-title');
const lawDescInput = document.getElementById('law-desc');
const lawAspectSelect = document.getElementById('law-aspect-select');
const saveLawBtn = document.getElementById('save-law');
const acceptLawBtn = document.getElementById('accept-law');
const declineLawBtn = document.getElementById('decline-law');
const cancelLawBtn = document.getElementById('cancel-law');
const lawActionModal = document.getElementById('law-action-modal');
const revokeLawBtn = document.getElementById('revoke-law');
const cancelLawActionBtn = document.getElementById('cancel-law-action');
const addMindsetBtn = document.getElementById('add-mindset-btn');
const suggestMindsetBtn = document.getElementById('suggest-mindset-btn');
const mindsetModal = document.getElementById('mindset-modal');
const mindsetTitleInput = document.getElementById('mindset-title');
const mindsetDescInput = document.getElementById('mindset-desc');
const mindsetRateInput = document.getElementById('mindset-rate');
const mindsetRateValue = document.getElementById('mindset-rate-value');
const mindsetAspectSelect = document.getElementById('mindset-aspect-select');
const saveMindsetBtn = document.getElementById('save-mindset');
const acceptMindsetBtn = document.getElementById('accept-mindset');
const declineMindsetBtn = document.getElementById('decline-mindset');
const cancelMindsetBtn = document.getElementById('cancel-mindset');
const deleteMindsetBtn = document.getElementById('delete-mindset');
const headerLogo = document.getElementById('header-logo');
const menuCarousel = document.getElementById('menu-carousel');

document.body.classList.add('dark');
headerLogo.addEventListener('click', () => showPage('menu'));

Promise.all([
  fetch('data/aspects.json').then(r => r.json()),
  fetch('tarefas.json').then(r => r.json()),
  fetch('leis.json').then(r => r.json()),
  fetch('mindset.json').then(r => r.json())
]).then(([aspects, tarefas, leis, mindset]) => {
  aspectsData = aspects;
  tasksData = tarefas;
  lawsData = leis;
  mindsetData = mindset;
  aspectKeys = Object.keys(aspects);
  if (Object.keys(responses).length) {
    document.getElementById('logo-screen').style.display = 'none';
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    initApp(false);
  } else {
    setTimeout(() => {
      const text = document.getElementById('logo-text');
      text.classList.remove('hidden');
      requestAnimationFrame(() => text.classList.add('show'));
    }, 2500);
    setTimeout(() => {
      const logoScreen = document.getElementById('logo-screen');
      logoScreen.classList.add('fade-out');
      setTimeout(() => {
        logoScreen.style.display = 'none';
        document.getElementById('question-screen').classList.remove('hidden');
        showQuestion();
      }, 1000);
    }, 4000);
  }
});

function showQuestion() {
  const key = aspectKeys[currentIndex];
  document.getElementById('question-title').textContent = key;
  aspectImage.src = `aspect${currentIndex + 1}.png`;
  slider.value = currentStep === 0 ? (responses[key]?.importance || 50) : (responses[key]?.level || 50);
  updateFeedback();
  const progress = (currentIndex / aspectKeys.length) * 100;
  document.getElementById('progress-bar').style.width = progress + '%';
}

function getFeedback(val) {
  const v = Number(val);
  if (v <= 10) return 'Totalmente irrelevante';
  if (v <= 25) return 'Não é importante';
  if (v <= 50) return 'Sem prioridade';
  if (v <= 70) return 'Relevante';
  if (v <= 85) return 'Muito importante';
  if (v <= 92) return 'Pilar da vida';
  return 'Base da vida';
}

function updateFeedback() {
  sliderFeedback.textContent = getFeedback(slider.value);
}

slider.addEventListener('input', updateFeedback);

document.getElementById('next-btn').addEventListener('click', () => {
  const key = aspectKeys[currentIndex];
  if (!responses[key]) responses[key] = { importance: 0, level: 50 };
  if (currentStep === 0) {
    responses[key].importance = Number(slider.value);
    currentStep = 1;
    slider.value = responses[key].level || 50;
    updateFeedback();
    showQuestion();
  } else {
    responses[key].level = Number(slider.value);
    currentStep = 0;
    currentIndex++;
    if (currentIndex < aspectKeys.length) {
      showQuestion();
    } else {
      document.getElementById('question-screen').classList.add('hidden');
      document.getElementById('oath-text').textContent = buildOath();
      document.getElementById('name-screen').classList.remove('hidden');
    }
  }
});

document.getElementById('agree').addEventListener('change', checkStartReady);
document.getElementById('username').addEventListener('input', checkStartReady);

function checkStartReady() {
  const agree = document.getElementById('agree').checked;
  const name = document.getElementById('username').value.trim();
  document.getElementById('start-btn').disabled = !(agree && name);
}

document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('name-screen').classList.add('hidden');
  initApp(true);
});

function buildOath() {
  const parts = [];
  for (const key of aspectKeys) {
    const res = responses[key];
    if (res.importance >= 7) {
      parts.push(aspectsData[key].speech);
    }
  }
  return parts.length ? 'Eu prometo ' + parts.join(' ') : '';
}

function initApp(firstTime) {
  const now = Date.now();
  previousLogin = Number(localStorage.getItem('lastLogin')) || now;
  localStorage.setItem('lastLogin', now);
  if (firstTime) {
    const hour = prompt('Qual horário (0-23) é melhor para você atualizar suas estatísticas?');
    if (hour !== null) {
      localStorage.setItem('statsHour', hour);
    }
    localStorage.setItem('responses', JSON.stringify(responses));
    const name = document.getElementById('username').value.trim();
    localStorage.setItem('username', name);
  } else {
    responses = JSON.parse(localStorage.getItem('responses') || '{}');
  }
  buildOptions();
  buildTasks(previousLogin);
  setInterval(() => buildTasks(previousLogin), 60000);
  buildLaws();
  buildStats();
  buildMindset();
  buildOptions();
  scheduleNotifications();
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  setInterval(checkStatsPrompt, 60000);
  checkStatsPrompt();
  if (window.innerWidth <= 600) {
    initCarousel();
  }
}

function buildOptions() {
  const container = document.getElementById('options-content');
  container.innerHTML = '';
  const categories = [
    { title: 'Princípios fundamentais', filter: v => v === 10 },
    { title: 'Pilares de uma vida equilibrada', filter: v => v >= 8 && v <= 9 },
    { title: 'Pontos a trabalhar a longo prazo', filter: v => v >= 6 && v <= 7 }
  ];
  categories.forEach(cat => {
    const aspects = aspectKeys.filter(k => cat.filter(responses[k]?.importance));
    if (!aspects.length) return;
    const h = document.createElement('h2');
    h.textContent = cat.title;
    container.appendChild(h);
    aspects.sort((a, b) => responses[b].importance - responses[a].importance || a.localeCompare(b));
    aspects.forEach(k => {
      const p = document.createElement('p');
      p.textContent = `${aspectsData[k].speech} Importância: ${responses[k].importance}.`;
      container.appendChild(p);
    });
  });
}

function buildTasks(previousLogin) {
  const pending = document.getElementById('pending-list');
  const completed = document.getElementById('completed-list');
  const overdue = document.getElementById('overdue-list');
  pending.innerHTML = '';
  completed.innerHTML = '';
  overdue.innerHTML = '';
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const now = Date.now();
  tasks.forEach((t, index) => {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.dataset.index = index;
    div.draggable = true;
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    const h3 = document.createElement('h3');
    h3.textContent = t.title;
    const p = document.createElement('p');
    p.textContent = t.description;
    const span = document.createElement('span');
    span.textContent = `${new Date(t.startTime).toLocaleString()} | ${t.aspect} | ${t.type || 'Hábito'}`;
    div.appendChild(h3);
    div.appendChild(p);
    div.appendChild(span);
    div.addEventListener('dblclick', () => {
      tasks[index].completed = true;
      localStorage.setItem('tasks', JSON.stringify(tasks));
      buildTasks(previousLogin);
    });
    let pressTimer;
    const start = () => {
      pressTimer = setTimeout(() => openTaskModal(index), 500);
    };
    const cancel = () => clearTimeout(pressTimer);
    div.addEventListener('mousedown', start);
    div.addEventListener('touchstart', start);
    div.addEventListener('mouseup', cancel);
    div.addEventListener('mouseleave', cancel);
    div.addEventListener('touchend', cancel);
    const time = new Date(t.startTime).getTime();
    if (t.completed) {
      div.classList.add('completed');
      completed.appendChild(div);
    } else if (time < now) {
      div.classList.add('overdue');
      overdue.appendChild(div);
    } else {
      div.classList.add('pending');
      pending.appendChild(div);
    }
  });
  if (!tasks.length) {
    pending.textContent = 'Sem tarefas ainda';
  }
}

function handleDragStart(e) {
  draggedIndex = Number(e.currentTarget.dataset.index);
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  const targetIndex = Number(e.currentTarget.dataset.index);
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const [moved] = tasks.splice(draggedIndex, 1);
  tasks.splice(targetIndex, 0, moved);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  buildTasks(previousLogin);
}

function buildLaws() {
  const container = document.getElementById('laws-list');
  container.innerHTML = '';
  const laws = JSON.parse(localStorage.getItem('customLaws') || '[]');
  laws.forEach((l, index) => {
    const div = document.createElement('div');
    div.className = 'law-box';
    const colors = statsColors[l.aspect] || ['#555', '#777'];
    div.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
    const h3 = document.createElement('h3');
    h3.textContent = l.title;
    const p = document.createElement('p');
    p.textContent = l.description;
    div.appendChild(h3);
    div.appendChild(p);
    div.dataset.index = index;
    let pressTimer;
    const start = () => { pressTimer = setTimeout(() => openLawActionModal(index), 500); };
    const cancel = () => clearTimeout(pressTimer);
    div.addEventListener('mousedown', start);
    div.addEventListener('touchstart', start);
    div.addEventListener('mouseup', cancel);
    div.addEventListener('mouseleave', cancel);
    div.addEventListener('touchend', cancel);
    container.appendChild(div);
  });
  if (!laws.length) container.textContent = 'Sem leis ainda';
}

function openLawModal(prefill = null, suggestion = false) {
  lawAspectSelect.innerHTML = '';
  aspectKeys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    lawAspectSelect.appendChild(opt);
  });
  if (prefill) {
    lawTitleInput.value = prefill.title;
    lawDescInput.value = prefill.description;
    lawAspectSelect.value = prefill.aspect;
  } else {
    lawTitleInput.value = '';
    lawDescInput.value = '';
    lawAspectSelect.value = aspectKeys[0] || '';
  }
  lawTitleInput.readOnly = suggestion;
  lawDescInput.readOnly = suggestion;
  lawAspectSelect.disabled = suggestion;
  if (suggestion) {
    saveLawBtn.classList.add('hidden');
    acceptLawBtn.classList.remove('hidden');
    declineLawBtn.classList.remove('hidden');
  } else {
    saveLawBtn.classList.remove('hidden');
    acceptLawBtn.classList.add('hidden');
    declineLawBtn.classList.add('hidden');
  }
  lawModal.classList.add('show');
  lawModal.classList.remove('hidden');
}

function closeLawModal() {
  lawModal.classList.remove('show');
  lawModal.classList.add('hidden');
}

function saveLaw() {
  const title = lawTitleInput.value.trim().slice(0,24);
  const description = lawDescInput.value.trim().slice(0,60);
  if (!title || !description) return;
  const aspect = lawAspectSelect.value;
  const laws = JSON.parse(localStorage.getItem('customLaws') || '[]');
  laws.push({ title, description, aspect });
  localStorage.setItem('customLaws', JSON.stringify(laws));
  closeLawModal();
  buildLaws();
}

function suggestLaw() {
  if (!Array.isArray(lawsData) || !lawsData.length) return;
  const idea = lawsData[Math.floor(Math.random() * lawsData.length)];
  const laws = JSON.parse(localStorage.getItem('customLaws') || '[]');
  laws.push(idea);
  localStorage.setItem('customLaws', JSON.stringify(laws));
  buildLaws();
}

function openLawActionModal(index) {
  lawActionModal.dataset.index = index;
  lawActionModal.classList.add('show');
  lawActionModal.classList.remove('hidden');
}

function closeLawActionModal() {
  lawActionModal.classList.remove('show');
  lawActionModal.classList.add('hidden');
  delete lawActionModal.dataset.index;
}

revokeLawBtn.addEventListener('click', () => {
  const index = Number(lawActionModal.dataset.index);
  const laws = JSON.parse(localStorage.getItem('customLaws') || '[]');
  laws.splice(index, 1);
  localStorage.setItem('customLaws', JSON.stringify(laws));
  closeLawActionModal();
  buildLaws();
});

cancelLawActionBtn.addEventListener('click', closeLawActionModal);
addLawBtn.addEventListener('click', () => openLawModal());
suggestLawBtn.addEventListener('click', suggestLaw);
saveLawBtn.addEventListener('click', saveLaw);
cancelLawBtn.addEventListener('click', closeLawModal);
acceptLawBtn.addEventListener('click', saveLaw);
declineLawBtn.addEventListener('click', closeLawModal);

function buildStats() {
  const container = document.getElementById('stats-content');
  container.innerHTML = '';
  aspectKeys.forEach(k => {
    const box = document.createElement('div');
    box.className = 'stats-box';

    const title = document.createElement('span');
    title.className = 'stats-title';
    title.textContent = k;
    box.appendChild(title);

    const progress = document.createElement('div');
    progress.className = 'stats-progress';

    const bar = document.createElement('div');
    bar.className = 'stats-bar';
    const level = responses[k]?.level || 0;
    bar.style.width = level + '%';
    const colors = statsColors[k];
    if (colors) {
      bar.style.background = `linear-gradient(to right, ${colors[0]}, ${colors[1]})`;
    }
    progress.appendChild(bar);
    box.appendChild(progress);

    container.appendChild(box);
  });
}

function buildMindset() {
  const container = document.getElementById('mindset-content');
  container.innerHTML = '';
  const mindsets = JSON.parse(localStorage.getItem('customMindsets') || '[]');
  mindsets.forEach((m, idx) => {
    const div = document.createElement('div');
    div.className = 'mindset-box';
    const colors = statsColors[m.aspect] || ['#555', '#777'];
    div.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
    const h3 = document.createElement('h3');
    h3.textContent = m.title;
    const p = document.createElement('p');
    p.textContent = m.description;
    div.appendChild(h3);
    div.appendChild(p);
    let pressTimer;
    div.addEventListener('dblclick', () => openMindsetModal(idx, m));
    div.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => openMindsetModal(idx, m), 500);
    });
    ['touchend', 'touchmove', 'touchcancel'].forEach(ev => {
      div.addEventListener(ev, () => clearTimeout(pressTimer));
    });
    container.appendChild(div);
  });
  if (!mindsets.length) container.textContent = 'Sem mindsets ainda';
}

function openMindsetModal(index = null, prefill = null, suggestion = false) {
  mindsetAspectSelect.innerHTML = '';
  aspectKeys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    mindsetAspectSelect.appendChild(opt);
  });
  editingMindsetIndex = index;
  if (prefill) {
    mindsetTitleInput.value = prefill.title;
    mindsetDescInput.value = prefill.description;
    mindsetAspectSelect.value = prefill.aspect;
    mindsetRateInput.value = prefill.conviction || 50;
  } else {
    mindsetTitleInput.value = '';
    mindsetDescInput.value = '';
    mindsetRateInput.value = 50;
    mindsetAspectSelect.value = aspectKeys[0] || '';
  }
  mindsetRateValue.textContent = mindsetRateInput.value;
  mindsetTitleInput.readOnly = suggestion;
  mindsetDescInput.readOnly = suggestion;
  mindsetAspectSelect.disabled = suggestion;
  mindsetRateInput.disabled = suggestion;
  if (suggestion) {
    saveMindsetBtn.classList.add('hidden');
    acceptMindsetBtn.classList.remove('hidden');
    declineMindsetBtn.classList.remove('hidden');
    deleteMindsetBtn.classList.add('hidden');
  } else {
    saveMindsetBtn.classList.remove('hidden');
    acceptMindsetBtn.classList.add('hidden');
    declineMindsetBtn.classList.add('hidden');
    if (index !== null) {
      deleteMindsetBtn.classList.remove('hidden');
      document.querySelector('#mindset-modal h2').textContent = 'Editar mindset';
    } else {
      deleteMindsetBtn.classList.add('hidden');
      document.querySelector('#mindset-modal h2').textContent = 'Novo mindset';
    }
  }
  mindsetModal.classList.add('show');
  mindsetModal.classList.remove('hidden');
}

function closeMindsetModal() {
  mindsetModal.classList.remove('show');
  mindsetModal.classList.add('hidden');
  editingMindsetIndex = null;
}

function saveMindset() {
  const title = mindsetTitleInput.value.trim().slice(0,24);
  const description = mindsetDescInput.value.trim().slice(0,60);
  const rate = Number(mindsetRateInput.value);
  if (!title || !description) return;
  if (rate < 40) {
    alert('Importância mínima é 40');
    return;
  }
  const aspect = mindsetAspectSelect.value;
  const mindsets = JSON.parse(localStorage.getItem('customMindsets') || '[]');
  const item = { title, description, aspect, rate };
  if (editingMindsetIndex !== null) {
    mindsets[editingMindsetIndex] = item;
  } else {
    mindsets.push(item);
  }
  localStorage.setItem('customMindsets', JSON.stringify(mindsets));
  closeMindsetModal();
  buildMindset();
}

function deleteMindset() {
  if (editingMindsetIndex === null) return;
  const mindsets = JSON.parse(localStorage.getItem('customMindsets') || '[]');
  mindsets.splice(editingMindsetIndex, 1);
  localStorage.setItem('customMindsets', JSON.stringify(mindsets));
  closeMindsetModal();
  buildMindset();
}

function suggestMindset() {
  if (!Array.isArray(mindsetData) || !mindsetData.length) return;
  const idea = mindsetData[Math.floor(Math.random() * mindsetData.length)];
  const mindsets = JSON.parse(localStorage.getItem('customMindsets') || '[]');
  mindsets.push(idea);
  localStorage.setItem('customMindsets', JSON.stringify(mindsets));
  buildMindset();
}

mindsetRateInput.addEventListener('input', () => {
  mindsetRateValue.textContent = mindsetRateInput.value;
});

addMindsetBtn.addEventListener('click', () => openMindsetModal());
suggestMindsetBtn.addEventListener('click', suggestMindset);
saveMindsetBtn.addEventListener('click', saveMindset);
cancelMindsetBtn.addEventListener('click', closeMindsetModal);
acceptMindsetBtn.addEventListener('click', saveMindset);
declineMindsetBtn.addEventListener('click', closeMindsetModal);
deleteMindsetBtn.addEventListener('click', deleteMindset);

function scheduleNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const now = Date.now();
  tasks.forEach(t => {
    const time = new Date(t.startTime).getTime();
    if (time > now) {
      setTimeout(() => {
        new Notification('Mr.President | New Task |', { body: t.title });
      }, time - now);
    }
  });
}

document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', e => {
    const page = e.currentTarget.getAttribute('data-page');
    showPage(page);
  });
});

function initCarousel() {
  const items = [
    { page: 'tasks', img: 'acoes.png', label: 'Tarefas' },
    { page: 'laws', img: 'leis.png', label: 'Leis' },
    { page: 'stats', img: 'estatisticas.png', label: 'Estatísticas' },
    { page: 'mindset', img: 'mindset.png', label: 'Mindset' },
    { page: 'options', img: 'constituicao.png', label: 'Opções' },
    { page: 'history', img: 'historico.png', label: 'Histórico' }
  ];
  let idx = 0;
  const img = document.createElement('img');
  const span = document.createElement('span');
  menuCarousel.appendChild(img);
  menuCarousel.appendChild(span);

  function render() {
    const item = items[idx];
    img.src = item.img;
    img.alt = item.label;
    span.textContent = item.label;
    showPage(item.page);
  }

  render();

  let startX = 0;
  menuCarousel.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });
  menuCarousel.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 50) {
      idx = (idx - 1 + items.length) % items.length;
      render();
    } else if (dx < -50) {
      idx = (idx + 1) % items.length;
      render();
    }
  });
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(sec => sec.classList.remove('active'));
  const section = document.getElementById(pageId);
  if (section) section.classList.add('active');
}

let statsIndex = 0;
let statsResponses = {};

statsSlider.addEventListener('input', () => {
  statsSliderValue.textContent = statsSlider.value;
});

document.getElementById('stats-next').addEventListener('click', () => {
  const key = aspectKeys[statsIndex];
  statsResponses[key] = Number(statsSlider.value);
  statsIndex++;
  if (statsIndex < aspectKeys.length) {
    showStatsQuestion();
  } else {
    const date = new Date().toISOString().split('T')[0];
    const allStats = JSON.parse(localStorage.getItem('dailyStats') || '{}');
    allStats[date] = statsResponses;
    localStorage.setItem('dailyStats', JSON.stringify(allStats));
    document.getElementById('stats-modal').classList.remove('show');
  }
});

function showStatsQuestion() {
  const key = aspectKeys[statsIndex];
  document.getElementById('stats-question').textContent = `Qual seu nível hoje para ${key}?`;
  statsSlider.value = 5;
  statsSliderValue.textContent = 5;
}

function openStatsModal() {
  statsIndex = 0;
  statsResponses = {};
  showStatsQuestion();
  document.getElementById('stats-modal').classList.add('show');
}

function checkStatsPrompt() {
  const hour = Number(localStorage.getItem('statsHour'));
  if (isNaN(hour)) return;
  const lastDate = localStorage.getItem('statsDate');
  const now = new Date();
  if (now.getHours() === hour && (!lastDate || lastDate !== now.toDateString())) {
    openStatsModal();
    localStorage.setItem('statsDate', now.toDateString());
  }
}

addTaskBtn.addEventListener('click', () => openTaskModal());
suggestTaskBtn.addEventListener('click', suggestTask);
saveTaskBtn.addEventListener('click', saveTask);
cancelTaskBtn.addEventListener('click', closeTaskModal);
completeTaskBtn.addEventListener('click', completeTask);

function openTaskModal(index = null, prefill = null) {
  editingTaskIndex = index;
  taskAspectInput.innerHTML = '';
  aspectKeys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    taskAspectInput.appendChild(opt);
  });
  taskTypeInput.value = 'Hábito';
  const now = new Date().toISOString().slice(0,16);
  taskDatetimeInput.min = now;
  if (index !== null) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const t = tasks[index];
    taskTitleInput.value = t.title;
    taskDescInput.value = t.description;
    taskDatetimeInput.value = t.startTime.slice(0,16);
    taskAspectInput.value = t.aspect;
    taskTypeInput.value = t.type || 'Hábito';
    document.querySelector('#task-modal h2').textContent = 'Editar tarefa';
    if (!t.completed) {
      completeTaskBtn.classList.remove('hidden');
    } else {
      completeTaskBtn.classList.add('hidden');
    }
  } else {
    document.querySelector('#task-modal h2').textContent = 'Nova tarefa';
    completeTaskBtn.classList.add('hidden');
    if (prefill) {
      taskTitleInput.value = prefill.title;
      taskDescInput.value = prefill.description;
      taskDatetimeInput.value = now;
      taskAspectInput.value = prefill.aspect;
      taskTypeInput.value = prefill.type || 'Hábito';
    } else {
      taskTitleInput.value = '';
      taskDescInput.value = '';
      taskDatetimeInput.value = now;
      taskAspectInput.value = aspectKeys[0] || '';
    }
  }
  taskModal.classList.add('show');
  taskModal.classList.remove('hidden');
}

function suggestTask() {
  if (!Array.isArray(tasksData) || !tasksData.length) return;
  const idea = tasksData[Math.floor(Math.random() * tasksData.length)];
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const now = new Date(Date.now() + 3600000).toISOString();
  tasks.push({
    title: idea.title.slice(0,14),
    description: (idea.description || '').slice(0,60),
    startTime: now,
    aspect: idea.aspect,
    type: idea.type || 'Hábito',
    completed: false
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
  buildTasks(previousLogin);
}

function closeTaskModal() {
  taskModal.classList.remove('show');
  taskModal.classList.add('hidden');
  editingTaskIndex = null;
}

function saveTask() {
  const title = taskTitleInput.value.trim();
  if (!title) return;
  const description = taskDescInput.value.trim();
  const datetime = taskDatetimeInput.value;
  if (!datetime) return;
  const aspect = taskAspectInput.value;
  const type = taskTypeInput.value;
  if (new Date(datetime) <= new Date()) {
    alert('Selecione um horário futuro');
    return;
  }
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const taskObj = {
    title: title.slice(0, 14),
    description: (description || '').slice(0, 60),
    startTime: new Date(datetime).toISOString(),
    aspect,
    type,
    completed: false
  };
  if (editingTaskIndex !== null) {
    tasks[editingTaskIndex] = taskObj;
  } else {
    tasks.push(taskObj);
  }
  localStorage.setItem('tasks', JSON.stringify(tasks));
  closeTaskModal();
  buildTasks(previousLogin);
}

function completeTask() {
  if (editingTaskIndex === null) return;
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  tasks[editingTaskIndex].completed = true;
  localStorage.setItem('tasks', JSON.stringify(tasks));
  closeTaskModal();
  buildTasks(previousLogin);
}

