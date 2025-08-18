let aspectKeys = [];
let tasksData = [];
let editingTaskIndex = null;
let aspectsMap = {};
let touchStartX = 0;

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
const scheduleTitle = document.getElementById('schedule-title');
const scheduleList = document.getElementById('schedule-list');
const tasksSection = document.getElementById('tasks');

export function initTasks(keys, data, aspects) {
  aspectKeys = keys;
  tasksData = data;
  aspectsMap = aspects;
  addTaskBtn.addEventListener('click', () => openTaskModal());
  suggestTaskBtn.addEventListener('click', suggestTask);
  saveTaskBtn.addEventListener('click', saveTask);
  cancelTaskBtn.addEventListener('click', closeTaskModal);
  completeTaskBtn.addEventListener('click', completeTask);
  tasksSection.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  });
  tasksSection.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (!tasksSection.classList.contains('show-schedule') && dx < -50) {
      tasksSection.classList.add('show-schedule');
    } else if (tasksSection.classList.contains('show-schedule') && dx > 50) {
      tasksSection.classList.remove('show-schedule');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') {
      tasksSection.classList.add('show-schedule');
    } else if (e.key === 'ArrowDown') {
      tasksSection.classList.remove('show-schedule');
    }
  });
  const centralIcon = tasksSection.querySelector('.icone-central');
  if (centralIcon) {
    let pressTimer;
    const startPress = () => {
      pressTimer = setTimeout(() => {
        tasksSection.classList.toggle('show-schedule');
      }, 1000);
    };
    const cancelPress = () => clearTimeout(pressTimer);
    centralIcon.addEventListener('mousedown', startPress);
    centralIcon.addEventListener('touchstart', startPress);
    centralIcon.addEventListener('mouseup', cancelPress);
    centralIcon.addEventListener('mouseleave', cancelPress);
    centralIcon.addEventListener('touchend', cancelPress);
  }
  buildTasks();
  buildSchedule();
  setInterval(() => {
    buildTasks();
    buildSchedule();
  }, 60000);
}

function buildTasks() {
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
    span.textContent = `${new Date(t.startTime).toLocaleString()} | ${t.aspect} | ${t.type || 'Hábito'}`;
    div.appendChild(h3);
    div.appendChild(p);
    div.appendChild(span);
    div.addEventListener('dblclick', () => {
      tasks[index].completed = true;
      localStorage.setItem('tasks', JSON.stringify(tasks));
      buildTasks();
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

function buildSchedule() {
  if (!scheduleList || !scheduleTitle) return;
  const now = new Date();
  scheduleTitle.textContent = now.toLocaleString('pt-BR');
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const todayTasks = tasks.filter(t => {
    const d = new Date(t.startTime);
    return d.toDateString() === now.toDateString();
  });
  scheduleList.innerHTML = '';
  for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const block = document.createElement('div');
    block.className = `time-block ${getPeriodClass(h)}`;
    const title = document.createElement('div');
    title.className = 'time-title';
    title.textContent = label;
    block.appendChild(title);
    const icons = document.createElement('div');
    icons.className = 'task-icons';
    const matching = todayTasks.filter(t => {
      const d = new Date(t.startTime);
      return d.getHours() === h && d.getMinutes() === m;
    });
    const count = document.createElement('span');
    count.className = 'task-count';
    count.textContent = matching.length;
    block.appendChild(count);
    matching.slice(0, 5).forEach(t => {
      const img = document.createElement('img');
      img.src = aspectsMap[t.aspect]?.image || '';
      img.alt = t.aspect;
      img.width = 30;
      img.height = 30;
      const idx = tasks.indexOf(t);
      img.addEventListener('click', () => openTaskModal(idx));
      icons.appendChild(img);
    });
    block.appendChild(icons);
    scheduleList.appendChild(block);
  }
}

function getPeriodClass(hour) {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'night';
  return 'dawn';
}

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
  const now = new Date().toISOString().slice(0, 16);
  taskDatetimeInput.min = now;
  if (index !== null) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const t = tasks[index];
    taskTitleInput.value = t.title;
    taskDescInput.value = t.description;
    taskDatetimeInput.value = t.startTime.slice(0, 16);
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
    title: idea.title.slice(0, 14),
    description: (idea.description || '').slice(0, 60),
    startTime: now,
    aspect: idea.aspect,
    type: idea.type || 'Hábito',
    completed: false
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
  buildTasks();
  buildSchedule();
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
  buildTasks();
  buildSchedule();
}

function completeTask() {
  if (editingTaskIndex === null) return;
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  tasks[editingTaskIndex].completed = true;
  localStorage.setItem('tasks', JSON.stringify(tasks));
  closeTaskModal();
  buildTasks();
  buildSchedule();
}

