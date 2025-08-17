let aspectsData = {};
let aspectKeys = [];
let tasksData = {};
let lawsData = {};
let mindsetData = {};
let currentIndex = 0;
let currentStep = 0; // 0 importance, 1 level
let responses = JSON.parse(localStorage.getItem('responses') || '{}');
let previousLogin = 0;
let draggedIndex = null;
let editingTaskIndex = null;

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

const menuButton = document.getElementById('menu-button');
const menuDropdown = document.getElementById('menu-dropdown');
const themeToggle = document.getElementById('theme-toggle');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskDatetimeInput = document.getElementById('task-datetime');
const taskAspectInput = document.getElementById('task-aspect');
const saveTaskBtn = document.getElementById('save-task');
const cancelTaskBtn = document.getElementById('cancel-task');
const completeTaskBtn = document.getElementById('complete-task');
const addLawBtn = document.getElementById('add-law-btn');
const lawAspectInput = document.getElementById('law-aspect');
const headerLogo = document.getElementById('header-logo');
const dateDisplay = document.getElementById('date-display');

const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.classList.remove('light', 'dark');
document.body.classList.add(savedTheme);
themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';

themeToggle.addEventListener('click', () => {
  const newTheme = document.body.classList.contains('light') ? 'dark' : 'light';
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
});
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
  if (!localStorage.getItem('tasks')) {
    createInitialTasks(now);
  }
  buildConstitution();
  buildTasks(previousLogin);
  setInterval(() => buildTasks(previousLogin), 60000);
  buildLaws();
  buildStats();
  buildMindset();
  scheduleNotifications();
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  updateTime();
  setInterval(updateTime, 1000);
  setInterval(checkStatsPrompt, 60000);
  checkStatsPrompt();
}

function createInitialTasks(startTime) {
  const tasks = [];
  const selected = aspectKeys.filter(k => responses[k]?.importance >= 7);
  selected.forEach((k, i) => {
    const def = tasksData[k];
    if (!def) return;
    const t = {
      title: def.title.slice(0, 14),
      description: def.description.slice(0, 60),
      startTime: new Date(startTime + (i + 1) * 3600000).toISOString(),
      aspect: k,
      completed: false
    };
    tasks.push(t);
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function buildConstitution() {
  const container = document.getElementById('constitution-content');
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
    const h3 = document.createElement('h3');
    h3.textContent = t.title;
    const p = document.createElement('p');
    p.textContent = t.description;
    const span = document.createElement('span');
    span.textContent = `${new Date(t.startTime).toLocaleString()} | ${t.aspect}`;
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
  lawAspectInput.innerHTML = '';
  const custom = JSON.parse(localStorage.getItem('customLaws') || '{}');
  const keys = aspectKeys.filter(k => responses[k]?.importance >= 7);
  keys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    lawAspectInput.appendChild(opt);
    const h3 = document.createElement('h3');
    h3.textContent = k;
    container.appendChild(h3);
    const ul = document.createElement('ul');
    [...(lawsData[k] || []), ...(custom[k] || [])].forEach(l => {
      const li = document.createElement('li');
      li.textContent = l;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  });
}

function addLaw() {
  const aspect = lawAspectInput.value;
  const text = prompt('Digite a nova lei:');
  if (!text) return;
  const custom = JSON.parse(localStorage.getItem('customLaws') || '{}');
  if (!custom[aspect]) custom[aspect] = [];
  custom[aspect].push(text);
  localStorage.setItem('customLaws', JSON.stringify(custom));
  buildLaws();
}

addLawBtn.addEventListener('click', addLaw);

function buildStats() {
  const container = document.getElementById('stats-content');
  container.innerHTML = '';
  const ul = document.createElement('ul');
  aspectKeys.forEach(k => {
    if (!responses[k]) return;
    const li = document.createElement('li');
    li.textContent = `${k}: nível ${responses[k].level}`;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

function buildMindset() {
  const container = document.getElementById('mindset-content');
  container.innerHTML = '';
  const keys = aspectKeys.filter(k => responses[k]?.importance > 7);
  keys.forEach(k => {
    const h3 = document.createElement('h3');
    h3.textContent = k;
    container.appendChild(h3);
    const ul = document.createElement('ul');
    (mindsetData[k] || []).forEach(m => {
      const li = document.createElement('li');
      li.textContent = m;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  });
}

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

function updateTime() {
  const now = new Date();
  document.getElementById('time-display').textContent = now.toLocaleTimeString();
  dateDisplay.textContent = now.toLocaleDateString();
}

let hideMenuTimeout;
function showMenu() {
  clearTimeout(hideMenuTimeout);
  menuDropdown.classList.add('show');
}
function scheduleHideMenu() {
  clearTimeout(hideMenuTimeout);
  hideMenuTimeout = setTimeout(() => menuDropdown.classList.remove('show'), 2000);
}
menuButton.addEventListener('mouseenter', showMenu);
menuButton.addEventListener('mouseleave', scheduleHideMenu);
menuButton.addEventListener('click', () => {
  clearTimeout(hideMenuTimeout);
  menuDropdown.classList.toggle('show');
});
menuDropdown.addEventListener('mouseenter', showMenu);
menuDropdown.addEventListener('mouseleave', scheduleHideMenu);

document.querySelectorAll('#menu-dropdown a').forEach(a => {
  a.addEventListener('click', e => {
    showPage(e.target.getAttribute('data-page'));
    menuDropdown.classList.remove('show');
  });
});

document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', e => {
    const page = e.currentTarget.getAttribute('data-page');
    showPage(page);
  });
});

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
saveTaskBtn.addEventListener('click', saveTask);
cancelTaskBtn.addEventListener('click', closeTaskModal);
completeTaskBtn.addEventListener('click', completeTask);

function openTaskModal(index = null) {
  editingTaskIndex = index;
  taskAspectInput.innerHTML = '';
  aspectKeys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    taskAspectInput.appendChild(opt);
  });
  const now = new Date().toISOString().slice(0,16);
  taskDatetimeInput.min = now;
  if (index !== null) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const t = tasks[index];
    taskTitleInput.value = t.title;
    taskDescInput.value = t.description;
    taskDatetimeInput.value = t.startTime.slice(0,16);
    taskAspectInput.value = t.aspect;
    document.querySelector('#task-modal h2').textContent = 'Editar tarefa';
    if (!t.completed) {
      completeTaskBtn.classList.remove('hidden');
    } else {
      completeTaskBtn.classList.add('hidden');
    }
  } else {
    taskTitleInput.value = '';
    taskDescInput.value = '';
    taskDatetimeInput.value = now;
    taskAspectInput.value = aspectKeys[0] || '';
    document.querySelector('#task-modal h2').textContent = 'Nova tarefa';
    completeTaskBtn.classList.add('hidden');
  }
  taskModal.classList.add('show');
  taskModal.classList.remove('hidden');
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

