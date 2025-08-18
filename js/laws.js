let aspectKeys = [];
let lawsData = [];
let statsColors = {};

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

export function initLaws(keys, data, colors) {
  aspectKeys = keys;
  lawsData = data;
  statsColors = colors;
  addLawBtn.addEventListener('click', () => openLawModal());
  suggestLawBtn.addEventListener('click', suggestLaw);
  saveLawBtn.addEventListener('click', saveLaw);
  cancelLawBtn.addEventListener('click', closeLawModal);
  acceptLawBtn.addEventListener('click', saveLaw);
  declineLawBtn.addEventListener('click', closeLawModal);
  revokeLawBtn.addEventListener('click', () => {
    const index = Number(lawActionModal.dataset.index);
    const laws = JSON.parse(localStorage.getItem('customLaws') || '[]');
    laws.splice(index, 1);
    localStorage.setItem('customLaws', JSON.stringify(laws));
    closeLawActionModal();
    buildLaws();
  });
  cancelLawActionBtn.addEventListener('click', closeLawActionModal);
  buildLaws();
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

