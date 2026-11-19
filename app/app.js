// Leonida Trophy Guide — offline checklist + tracker for the 55 GTA VI trophies.
// Loads app/data/trophies.json (the official list plus our own cited guides),
// keeps earned ticks, the spoiler setting and the filter in localStorage,
// and exports / imports progress as a JSON file. No network request at run time
// beyond the one local data file.
const DATA_URL = 'data/trophies.json';
const STORAGE_KEY = 'gta6-trophy-guide-v1';

const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABELS = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };

// The three stages of the platinum run, from PowerPyx's roadmap:
// 1 = play the story, 2 = the 100% checklist grind, 3 = stranger strands and odd ones left.
const STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Play the story',
    time: 'Chapters 1–5 · about 60–80 hours',
    points: [
      'Finish the five chapters; every chapter and mission trophy pops on its own.',
      'Start the character questlines as they appear (Andy, Kenton, Billy, Randy, Tyrone) — all finishable after the story.',
      'Scan vehicles and study animals as you go: 200 of 277 vehicles and 100 of 255 animals feed the 100% checklist.',
      'Do the Chapter 1 balcony meditation with Lucia (see Positive Mental Attitude) — the only thing that might be missable.',
    ],
  },
  {
    stage: 2,
    title: 'Stage 2 — 100% completion',
    time: 'The checklist · about 100 hours',
    points: [
      'After the credits, open Progress > Stats > 100% Completion and work the list: 70 of 80 challenges, 300 stunts, 15 of 18 card sets and meditations.',
      'Clear the lines that demand everything: all 8 bank vaults, all 39 gang operations, all 15 Target Decks, all shooting ranges and drone races.',
      'Money trophies land here: $250,000 laundered, $100,000 spent, all 8 garages bought.',
      'Robberies, races and collectibles all count toward the checklist — most trophies pop along the way.',
    ],
  },
  {
    stage: 3,
    title: 'Stage 3 — Cleanup',
    time: 'Strangers & odd ones · about 10 hours',
    points: [
      'Finish 8 Strangers & Freaks strands with the confirmed strangers (Kirk, Kyle, Yago, Pilot Pete).',
      'Mop up the odd one-offs and the trophies whose method is still unconfirmed.',
      'The platinum pops the moment the last of the other 54 is earned.',
    ],
  },
];

const SOURCES = [
  { name: 'PowerPyx — GTA 6 Trophy Guide & Roadmap', url: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/', note: 'The main source for methods, counts and the roadmap: difficulty 4/10, about 200 hours, the possibly-missable meditation, per-trophy steps.' },
  { name: 'Push Square — GTA 6 Trophy Guide & Roadmap', url: 'https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap', note: 'Where the 100% checklist lives in-game, the 18 card sets (15 needed), the 42 shooting-range challenges.' },
  { name: 'PlanetGTA6 — GTA 6 Trophies', url: 'https://www.planetgta6.com/en/gta-6-trophies/', note: 'The official names, descriptions and grades as shown on PlayStation Network, cross-checked with Exophase, PSNProfiles and TrueAchievements; the 27 visible / 28 hidden split.' },
  { name: 'Output Lag — GTA 6 Trophy List', url: 'https://outputlag.com/guides/gta-6-trophy-list/', note: 'No mission replay and no New Game+, the Chapter 1 meditation warning, and the five trophies with no confirmed method yet.' },
  { name: 'GTA Zone — GTA 6 Trophy List', url: 'https://gta-zone.com/news/gta-6-trophies-achievements/', note: 'Positive Mental Attitude: 18 spots in 10 locations, last one needs both characters together.' },
  { name: 'KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap', url: 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/', note: 'Actions Speak Louder: 500 actions affecting the Criminal Profile.' },
  { name: 'Leonida Intel — GTA 6 Platinum Guide', url: 'https://leonida-intel.com/guides/gta-6-trophies-achievements/', note: 'Corroboration: 55 trophies, no online trophies, one possibly missable, about 200 hours.' },
  { name: 'EGamers — GTA 6 Trophy List', url: 'https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/', note: 'Corroboration that the same totals and names appear across Beebom, CULTR, TechWiser, GTABase and PowerPyx.' },
];

let trophies = [];
const state = {
  earned: new Set(),
  revealed: new Set(),
  spoilers: true,
  kind: 'all',
  grade: 'all',
  query: '',
  selectedId: null,
  view: 'checklist',
};

const $ = (id) => document.getElementById(id);

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned.filter((n) => typeof n === 'string'));
    if (Array.isArray(saved.revealed)) state.revealed = new Set(saved.revealed.filter((n) => typeof n === 'string'));
    if (typeof saved.spoilers === 'boolean') state.spoilers = saved.spoilers;
    if (typeof saved.kind === 'string') state.kind = saved.kind;
    if (typeof saved.grade === 'string') state.grade = saved.grade;
    if (typeof saved.selectedId === 'number') state.selectedId = saved.selectedId;
  } catch {
    // A corrupt saved state starts fresh rather than breaking the guide.
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: [...state.earned],
    revealed: [...state.revealed],
    spoilers: state.spoilers,
    kind: state.kind,
    grade: state.grade,
    selectedId: state.selectedId,
  }));
}

function isSpoilerHidden(trophy) {
  return state.spoilers
    && trophy.kinds.includes('story')
    && !state.earned.has(trophy.name)
    && !state.revealed.has(trophy.name);
}

function displayName(trophy) {
  return isSpoilerHidden(trophy) ? 'Hidden story trophy' : trophy.name;
}

function displayDescription(trophy) {
  return isSpoilerHidden(trophy)
    ? 'Finish the story to reveal this trophy — it stays hidden on PlayStation until earned.'
    : trophy.description;
}

function gradeTag(trophy) {
  return `<span class="tag grade-${trophy.grade}">${GRADE_LABELS[trophy.grade]}</span>`;
}

function trophyTags(trophy) {
  const tags = [gradeTag(trophy)];
  if (trophy.hidden) tags.push('<span class="tag hidden-tag">Hidden</span>');
  if (trophy.missable) tags.push('<span class="tag missable">Missable</span>');
  if (trophy.chapter) tags.push(`<span class="tag">${escapeHtml(trophy.chapter)}</span>`);
  if (state.earned.has(trophy.name)) tags.push('<span class="tag earned-tag">Earned</span>');
  return tags.join('');
}

function visibleTrophies() {
  const query = state.query.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (state.kind === 'online') return false;
    if (state.kind !== 'all' && !trophy.kinds.includes(state.kind)) return false;
    if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.chapter ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderProgress() {
  const total = trophies.length;
  const earnedCount = state.earned.size;
  $('progressCount').textContent = `${earnedCount} / ${total}`;
  $('progressFill').style.width = total ? `${(earnedCount / total) * 100}%` : '0%';
  $('progressBar').setAttribute('aria-valuenow', String(earnedCount));
  const perGrade = Object.keys(GRADE_LABELS).map((grade) => {
    const have = trophies.filter((t) => t.grade === grade && state.earned.has(t.name)).length;
    const of = trophies.filter((t) => t.grade === grade).length;
    return `${GRADE_LABELS[grade]} ${have}/${of}`;
  });
  $('gradeCounts').textContent = perGrade.join(' · ');
  $('progressNote').textContent = earnedCount === total && total > 0
    ? 'All 55 earned — Vice Got a Price! is yours.'
    : 'Tick a trophy when you earn it — it stays ticked in this browser.';
}

function renderCounts() {
  for (const kind of ['all', 'story', 'missable', 'collectibles', 'activities']) {
    const count = kind === 'all' ? trophies.length : trophies.filter((t) => t.kinds.includes(kind)).length;
    const el = $(`count-${kind}`);
    if (el) el.textContent = String(count);
  }
  const online = $('count-online');
  if (online) online.textContent = '0';
}

function renderList() {
  const list = $('trophyList');
  const shown = visibleTrophies();
  const note = $('filterNote');
  if (state.kind === 'online') {
    note.textContent = 'No online trophies — all 55 are single-player and offline (PowerPyx).';
  } else if (shown.length === 0) {
    note.textContent = 'Nothing matches — clear the search or pick another filter.';
  } else if (state.query.trim() || state.kind !== 'all' || state.grade !== 'all') {
    note.textContent = `Showing ${shown.length} of ${trophies.length} trophies.`;
  } else {
    note.textContent = '';
  }
  list.replaceChildren();
  for (const trophy of shown) {
    const hidden = isSpoilerHidden(trophy);
    const li = document.createElement('li');
    li.className = 'trophy-row'
      + (state.selectedId === trophy.id ? ' is-selected' : '')
      + (state.earned.has(trophy.name) ? ' is-earned' : '');
    li.dataset.id = String(trophy.id);
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'trophy-check';
    box.checked = state.earned.has(trophy.name);
    box.setAttribute('aria-label', `Earned: ${displayName(trophy)}`);
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      toggleEarned(trophy);
    });
    const main = document.createElement('div');
    main.className = 'trophy-main';
    main.innerHTML = `<div class="trophy-top"><span class="trophy-name${hidden ? ' spoiler-hidden' : ''}">${escapeHtml(displayName(trophy))}</span></div>`
      + `<p class="trophy-desc${hidden ? ' spoiler-hidden' : ''}">${escapeHtml(displayDescription(trophy))}</p>`
      + `<div class="trophy-tags">${trophyTags(trophy)}</div>`;
    li.append(box, main);
    li.addEventListener('click', (event) => {
      if (event.target === box) return;
      selectTrophy(trophy.id);
    });
    list.append(li);
  }
}

function toggleEarned(trophy) {
  if (state.earned.has(trophy.name)) state.earned.delete(trophy.name);
  else state.earned.add(trophy.name);
  saveState();
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
}

function selectTrophy(id) {
  state.selectedId = id;
  saveState();
  renderList();
  renderDetail();
  history.replaceState(null, '', `#/trophy/${id}`);
}

function renderDetail() {
  const panel = $('detailPanel');
  const trophy = trophies.find((t) => t.id === state.selectedId) ?? null;
  if (!trophy) {
    panel.innerHTML = '<p class="detail-empty">Pick a trophy from the list to see its guide and sources. '
      + 'Every guide is written in our own words and names where its facts come from — '
      + 'a guide that only repeats the official description scores nothing, so each one '
      + 'says what to do, where and how, and when it can be missed.</p>';
    return;
  }
  const earned = state.earned.has(trophy.name);
  const hidden = isSpoilerHidden(trophy);
  if (hidden) {
    panel.innerHTML = `<h2>Hidden story trophy</h2>`
      + `<p class="official">This story trophy stays hidden until you earn it.</p>`
      + `<div class="detail-meta">${gradeTag(trophy)}<span class="tag hidden-tag">Hidden</span><span class="tag">${escapeHtml(trophy.chapter ?? 'Story')}</span></div>`
      + `<div class="spoiler-box">Spoilers are hidden. Tick it as earned, turn the spoiler setting off, `
      + `or reveal this one trophy to read its official description and guide.</div>`
      + `<div class="detail-actions"><button type="button" class="primary" id="revealBtn">Reveal this trophy</button></div>`;
    $('revealBtn').addEventListener('click', () => {
      state.revealed.add(trophy.name);
      saveState();
      renderList();
      renderDetail();
    });
    return;
  }
  const goal = trophy.target !== null
    ? `<p><strong>Target:</strong> ${trophy.target.toLocaleString('en-US')}</p>` : '';
  const unknown = /No confirmed method yet/.test(trophy.guide)
    ? '<p class="unknown-note">Unconfirmed as of 19 November 2026 — the guides we cite have not pinned this one down yet. This entry says so rather than inventing a method.</p>' : '';
  const sources = trophy.sources.map((s) => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a></li>`).join('');
  panel.innerHTML = `<h2>${escapeHtml(trophy.name)}</h2>`
    + `<p class="official"><strong>Official description:</strong> ${escapeHtml(trophy.description)}</p>`
    + `<div class="detail-meta">${trophyTags(trophy)}</div>`
    + goal
    + `<h3>Guide</h3><p class="guide-text">${escapeHtml(trophy.guide)}</p>`
    + unknown
    + `<h3>Sources</h3><ul class="source-list-detail">${sources}</ul>`
    + `<div class="detail-actions"><button type="button" class="${earned ? '' : 'primary'}" id="earnBtn">${earned ? 'Mark as not earned' : 'Mark as earned'}</button></div>`;
  $('earnBtn').addEventListener('click', () => toggleEarned(trophy));
}

function renderRoadmap() {
  const holder = $('roadmapStages');
  holder.replaceChildren();
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.roadmap_stage === stage.stage);
    const done = members.filter((t) => state.earned.has(t.name)).length;
    const card = document.createElement('article');
    card.className = 'stage';
    const names = members.map((t) => {
      const tick = state.earned.has(t.name) ? '✓ ' : '';
      const label = isSpoilerHidden(t) ? 'Hidden story trophy' : t.name;
      return `<li>${tick}${escapeHtml(label)} <span class="tag grade-${t.grade}">${GRADE_LABELS[t.grade]}</span>${t.missable ? ' <span class="tag missable">Missable</span>' : ''}</li>`;
    }).join('');
    card.innerHTML = `<h3>${escapeHtml(stage.title)}</h3>`
      + `<p class="stage-time">${escapeHtml(stage.time)}</p>`
      + stage.points.map((p) => `<p>${escapeHtml(p)}</p>`).join('')
      + `<h3>Trophies in this stage</h3><ul class="stage-list">${names}</ul>`
      + `<p class="stage-progress">${done} / ${members.length} earned in this stage</p>`;
    card.querySelectorAll('.stage-list li').forEach((li, index) => {
      li.addEventListener('click', () => selectTrophy(members[index].id));
      li.style.cursor = 'pointer';
    });
    holder.append(card);
  }
}

function renderSources() {
  const list = $('sourcesList');
  list.replaceChildren();
  for (const source of SOURCES) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.name)}</a> <span>— ${escapeHtml(source.note)}</span>`;
    list.append(li);
  }
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    guide: 'Leonida Trophy Guide',
    exported: new Date().toISOString(),
    earned: [...state.earned].sort(),
    total: trophies.length,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(trophies.map((t) => t.name));
    state.earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
    saveState();
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
    $('filterNote').textContent = `Imported ${state.earned.size} earned trophies.`;
  } catch {
    $('filterNote').textContent = 'That file is not a trophy-progress export — nothing was imported.';
  }
}

function setView(view) {
  state.view = view;
  document.querySelectorAll('.view-tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('is-active', section.id === `view-${view}`);
  });
}

function readHash() {
  const hash = location.hash || '#/checklist';
  const trophyMatch = hash.match(/^#\/trophy\/(\d+)$/);
  if (trophyMatch) {
    const id = Number(trophyMatch[1]);
    if (trophies.some((t) => t.id === id)) state.selectedId = id;
    setView('checklist');
    return;
  }
  if (hash === '#/roadmap') setView('roadmap');
  else if (hash === '#/sources') setView('sources');
  else setView('checklist');
}

async function loadTrophies() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`could not load ${DATA_URL}: ${response.status}`);
  const doc = await response.json();
  trophies = doc.trophies;
}

function bindControls() {
  $('search').addEventListener('input', (event) => {
    state.query = event.target.value;
    renderList();
  });
  $('kindFilters').addEventListener('click', (event) => {
    const button = event.target.closest('.kind-btn');
    if (!button) return;
    state.kind = button.dataset.kind;
    document.querySelectorAll('.kind-btn').forEach((b) => b.classList.toggle('is-active', b === button));
    saveState();
    renderList();
  });
  $('gradeFilter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    saveState();
    renderList();
  });
  $('spoilerToggle').addEventListener('change', (event) => {
    state.spoilers = event.target.checked;
    saveState();
    renderList();
    renderDetail();
    renderRoadmap();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importInput').addEventListener('change', (event) => {
    importProgress(event.target.files[0]);
    event.target.value = '';
  });
  $('clearBtn').addEventListener('click', () => {
    if (!state.earned.size) return;
    if (!window.confirm('Clear all earned ticks?')) return;
    state.earned.clear();
    saveState();
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
  });
  document.querySelectorAll('.view-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      setView(tab.dataset.view);
      history.replaceState(null, '', `#/${tab.dataset.view}`);
    });
  });
  window.addEventListener('hashchange', readHash);
}

async function initGuide() {
  loadState();
  await loadTrophies();
  if (state.selectedId === null) {
    // Open on the missable trophy's neighbour: the first guide a new reader needs is
    // the one trophy that can be missed, so select it once, spoilers permitting.
    state.selectedId = 28;
  }
  $('spoilerToggle').checked = state.spoilers;
  $('gradeFilter').value = state.grade;
  document.querySelectorAll('.kind-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.kind === state.kind));
  bindControls();
  renderCounts();
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderSources();
  readHash();
  renderList();
  renderDetail();
}

initGuide().catch((error) => {
  $('trophyList').innerHTML = `<li class="trophy-row"><div class="trophy-main"><p class="trophy-desc">The trophy data could not be loaded: ${escapeHtml(error.message)}</p></div></li>`;
});
