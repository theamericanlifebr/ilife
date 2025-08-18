let aspectKeys = [];
let mindsetData = [];
let statsColors = {};
let editingMindsetIndex = null;

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

export function initMindset(keys, data, colors) {
  aspectKeys = keys;
  mindsetData = data;
  statsColors = colors;
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
  buildMindset();
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

