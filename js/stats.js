let aspectKeys = [];
let responses = {};
let statsColors = {};

const statsSlider = document.getElementById('stats-slider');
const statsSliderValue = document.getElementById('stats-slider-value');
let statsIndex = 0;
let statsResponses = {};

export function initStats(keys, res, colors) {
  aspectKeys = keys;
  responses = res;
  statsColors = colors;
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
  buildStats();
}

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

export function checkStatsPrompt() {
  const hour = Number(localStorage.getItem('statsHour'));
  if (isNaN(hour)) return;
  const lastDate = localStorage.getItem('statsDate');
  const now = new Date();
  if (now.getHours() === hour && (!lastDate || lastDate !== now.toDateString())) {
    openStatsModal();
    localStorage.setItem('statsDate', now.toDateString());
  }
}

