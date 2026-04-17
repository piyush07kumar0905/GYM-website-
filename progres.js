
const STORAGE_KEY = 'fitdash_v1.3'

const defaultData = {
  meta: { version: '1.4', created: new Date().toISOString() },
  overview: {
    currentWeight: 82,
    targetWeight: 78,
    bodyFat: 18,
    muscleGain: '2.0 kg',
    bmi: 25.3,
    lastUpdated: new Date().toISOString().slice(0, 10)
  },
  weekly: (() => {
    const arr = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      arr.push({ date: d.toISOString().slice(0, 10), weight: 82 - (i * 0.1) + (Math.random() * 0.4 - 0.2), calories: 420 + Math.round(Math.random() * 180), minutes: 30 + Math.round(Math.random() * 40) })
    }
    return arr
  })(),
  prs: [
    { id: id(), label: 'Deadlift', value: '180 kg' },
    { id: id(), label: 'Squat', value: '140 kg' },
    { id: id(), label: 'Bench', value: '110 kg' }
  ],
  schedule: {
    week: [true, false, true, true, false, false, true],
    nextPlanned: new Date().toISOString().slice(0, 10)
  },
  hydration: { amount: 0, goal: 2000 },
  plans: [
    { id: id(), date: new Date().toISOString().slice(0, 10), title: 'Legs + Core', notes: 'Squats, Lunges, Planks' }
  ],
  achievements: [
    { id: 'a1', icon: '', title: '7 Day Streak', earned: true },
    { id: 'a2', icon: '', title: '100kg Club', earned: true },
    { id: 'a3', icon: '', title: 'Stay Hydrated', earned: true },
    { id: 'a4', icon: '', title: 'Marathoner', earned: false },
    { id: 'a5', icon: '', title: 'Clean Eater', earned: false }
  ]
}

let data = loadData()
let chart = null

function id() { return 'id_' + Math.random().toString(36).slice(2, 9) }

function qs(sel) { return document.querySelector(sel) }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)) }

function daysFromToday(offset) {
  const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10)
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { console.warn('local load failed', e) }
  return JSON.parse(JSON.stringify(defaultData))
}

function saveData() {
  try {
    data.overview.lastUpdated = new Date().toISOString().slice(0, 10)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) { console.error('save failed', e) }
}

function renderOverview() {
  qs('#currentWeight').textContent = `${Number(data.overview.currentWeight).toFixed(1)} kg`
  qs('#targetWeight').textContent = `${Number(data.overview.targetWeight).toFixed(1)} kg`
  qs('#bodyFat').textContent = `${data.overview.bodyFat} %`
  qs('#muscleGain').textContent = data.overview.muscleGain
  qs('#bmiScore').textContent = Number(data.overview.bmi).toFixed(1)
  qs('#lastUpdated').textContent = `Last: ${data.overview.lastUpdated}`
  const start = Number(data.weekly[0].weight)
  const current = Number(data.overview.currentWeight)
  const target = Number(data.overview.targetWeight)
  const progressPct = Math.max(0, Math.min(100, ((start - current) / (start - target || 1)) * 100))
  // small delay for smooth animation purely on load
  setTimeout(() => qs('#weightProgress').style.width = progressPct.toFixed(0) + '%', 100)
  qs('#progressMeta').textContent = `${(start - current).toFixed(1)} kg from baseline • ${progressPct.toFixed(0)}% toward target`
  const arr = data.schedule.week.slice().reverse()
  let streak = 0
  for (let v of arr) { if (v) streak++; else break }
  qs('#streak').textContent = streak
  qs('#version').textContent = data.meta.version || 'v1.4'
}

function renderAchievements() {
  const grid = qs('#achievementsGrid'); grid.innerHTML = ''
  let earnedCount = 0
  data.achievements.forEach(a => {
    if (a.earned) earnedCount++
    const div = document.createElement('div')
    div.className = 'achievement-badge ' + (a.earned ? '' : 'locked')
    div.innerHTML = `
      ${a.earned ? '<div class="badge-shine"></div>' : ''}
      <div class="badge-icon">${a.icon}</div>
      <div class="badge-title">${escapeHtml(a.title)}</div>
    `
    grid.appendChild(div)
  })
  qs('#earnedCount').textContent = `${earnedCount} / ${data.achievements.length} Earned`
}

function renderPRs() {
  const ul = qs('#prsList'); ul.innerHTML = ''
  data.prs.forEach(pr => {
    const li = document.createElement('li'); li.className = 'prs-item'
    li.innerHTML = `
      <div>
        <div style="font-weight:700">${escapeHtml(pr.label)}</div>
        <div class="muted small">${escapeHtml(pr.value)}</div>
      </div>
      <div class="prs-meta">
        <button class="btn small ghost edit-pr" data-id="${pr.id}">Edit</button>
        <button class="btn small ghost del-pr" data-id="${pr.id}">Delete</button>
      </div>
    `
    ul.appendChild(li)
  })
}

function renderSchedule() {
  const grid = qs('#weekGrid'); grid.innerHTML = ''
  const weekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(today.getDate() + i)
    const dayIdx = d.getDay()
    const div = document.createElement('div')
    const attended = !!data.schedule.week[i]
    div.className = 'week-day ' + (attended ? 'attended' : 'missed')
    div.setAttribute('data-i', i)
    div.innerHTML = `<span class="label">${weekNames[dayIdx]}</span><span class="day">${d.toISOString().slice(0, 10)}</span>`
    div.addEventListener('click', () => {
      data.schedule.week[i] = !data.schedule.week[i]
      saveData(); renderSchedule(); renderOverview()
    })
    grid.appendChild(div)
  }
  qs('#nextWorkout').value = data.schedule.nextPlanned || ''
}

function renderHydration() {
  qs('#waterAmount').textContent = data.hydration.amount
  qs('#waterGoal').textContent = data.hydration.goal
}

function renderPlans() {
  const ul = qs('#plansList'); ul.innerHTML = ''
  if (!data.plans.length) ul.innerHTML = '<div class="muted small">No plans yet</div>'
  data.plans.forEach(p => {
    const li = document.createElement('li'); li.className = 'plan-item'
    li.innerHTML = `
      <div>
        <div style="font-weight:700">${escapeHtml(p.title)} <span class="muted small">• ${p.date}</span></div>
        <div class="muted small">${escapeHtml(p.notes)}</div>
      </div>
      <div>
        <button class="btn small ghost edit-plan" data-id="${p.id}">Edit</button>
        <button class="btn small ghost del-plan" data-id="${p.id}">Delete</button>
      </div>
    `
    ul.appendChild(li)
  })
}

function initChart() {
  const ctx = qs('#weeklyChart').getContext('2d')
  const labels = data.weekly.map(w => w.date)
  const weightData = data.weekly.map(w => Number(w.weight.toFixed(2)))
  const caloriesData = data.weekly.map(w => w.calories)
  const minutesData = data.weekly.map(w => w.minutes)

  Chart.defaults.color = qs('#darkModeToggle').checked ? '#e2e8f0' : '#475569';
  Chart.defaults.font.family = '"Inter", sans-serif';

  chart = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        { type: 'line', label: 'Weight (kg)', data: weightData, yAxisID: 'y1', borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 3, fill: true, tension: 0.4 },
        { type: 'bar', label: 'Calories', data: caloriesData, yAxisID: 'y2', backgroundColor: 'rgba(139, 92, 246, 0.8)', borderRadius: 6 },
        { type: 'line', label: 'Minutes', data: minutesData, yAxisID: 'y2', borderColor: '#ec4899', borderWidth: 3, fill: false, tension: 0.4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true } },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { size: 14, family: 'Outfit' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: { grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        y1: { type: 'linear', position: 'left', title: { display: true, text: 'Weight (kg)' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        y2: { type: 'linear', position: 'right', title: { display: true, text: 'Cals / Mins' }, grid: { drawOnChartArea: false } }
      }
    }
  })
}

function updateChart(metric = 'all') {
  if (!chart) return
  chart.data.labels = data.weekly.map(w => w.date)
  if (metric === 'weight' || metric === 'all') chart.data.datasets[0].data = data.weekly.map(w => Number(w.weight.toFixed(2)))
  else chart.data.datasets[0].data = []
  if (metric === 'calories' || metric === 'all') chart.data.datasets[1].data = data.weekly.map(w => w.calories)
  else chart.data.datasets[1].data = []
  if (metric === 'minutes' || metric === 'all') chart.data.datasets[2].data = data.weekly.map(w => w.minutes)
  else chart.data.datasets[2].data = []
  chart.data.datasets.forEach(ds => ds.hidden = (ds.data.length === 0))
  chart.update()
}

function wire() {
  qs('#editOverview').addEventListener('click', () => {
    showModal(buildOverviewForm())
  })

  qs('#openStats').addEventListener('click', () => {
    showModal(`<h3>Detailed Stats</h3><p class="muted small">Coming soon — analytics and trend insights.</p>`)
  })

  qs('#addPR').addEventListener('click', () => {
    showModal(buildPRForm())
  })
  qs('#prsList').addEventListener('click', (e) => {
    const idAttr = e.target.dataset.id
    if (!idAttr) return
    if (e.target.classList.contains('del-pr')) {
      if (confirm('Delete this record?')) {
        data.prs = data.prs.filter(p => p.id !== idAttr)
        saveData(); renderPRs()
      }
    } else if (e.target.classList.contains('edit-pr')) {
      const pr = data.prs.find(p => p.id === idAttr)
      showModal(buildPRForm(pr))
    }
  })

  qs('#clearSchedule').addEventListener('click', () => {
    if (confirm('Clear attendance for the current week?')) {
      data.schedule.week = [false, false, false, false, false, false, false]
      saveData(); renderSchedule(); renderOverview()
    }
  })
  qs('#planWorkout').addEventListener('click', () => {
    showModal(buildPlanForm())
  })
  qs('#nextWorkout').addEventListener('change', (e) => {
    data.schedule.nextPlanned = e.target.value; saveData()
  })

  qs('#add250').addEventListener('click', () => { data.hydration.amount += 250; saveData(); renderHydration() })
  qs('#add500').addEventListener('click', () => { data.hydration.amount += 500; saveData(); renderHydration() })
  qs('#resetWater').addEventListener('click', () => { data.hydration.amount = 0; saveData(); renderHydration() })

  qs('#addPlan').addEventListener('click', () => showModal(buildPlanForm()))
  qs('#plansList').addEventListener('click', (e) => {
    const idAttr = e.target.dataset.id
    if (!idAttr) return
    if (e.target.classList.contains('del-plan')) {
      if (confirm('Delete plan?')) { data.plans = data.plans.filter(p => p.id !== idAttr); saveData(); renderPlans() }
    } else if (e.target.classList.contains('edit-plan')) {
      const p = data.plans.find(x => x.id === idAttr)
      showModal(buildPlanForm(p))
    }
  })

  qs('#exportCsv').addEventListener('click', () => {
    const csv = buildCSV()
    downloadFile(csv, 'fitdash_data.csv', 'text/csv')
  })

  qs('#resetData').addEventListener('click', () => {
    if (confirm('Reset to sample data? This will overwrite local changes.')) {
      localStorage.removeItem(STORAGE_KEY)
      data = loadData()
      reRenderAll()
    }
  })

  qs('#modalClose').addEventListener('click', hideModal)
  qs('#modal').addEventListener('click', (e) => { if (e.target === qs('#modal')) hideModal() })

  const tm = qs('#darkModeToggle')
  tm.checked = localStorage.getItem(STORAGE_KEY + '_dark') === '1'
  if (localStorage.getItem(STORAGE_KEY + '_dark') === null) { tm.checked = true; } // default to dark mode for premium look
  applyDarkMode(tm.checked)
  tm.addEventListener('change', (e) => {
    applyDarkMode(e.target.checked)
    localStorage.setItem(STORAGE_KEY + '_dark', e.target.checked ? '1' : '0')
    if (chart) {
      Chart.defaults.color = e.target.checked ? '#e2e8f0' : '#475569';
      chart.update();
    }
  })

  qs('#chartMetric').addEventListener('change', (e) => updateChart(e.target.value))

}

function showModal(content) {
  const modal = qs('#modal'), panel = qs('#modalContent')
  panel.innerHTML = '' // replace
  if (typeof content === 'string') panel.innerHTML = content
  else if (content instanceof Node) panel.appendChild(content)
  modal.setAttribute('aria-hidden', 'false')
  document.body.style.overflow = 'hidden'
}
function hideModal() {
  const modal = qs('#modal')
  modal.setAttribute('aria-hidden', 'true')
  document.body.style.overflow = ''
}

function buildOverviewForm() {
  const form = document.createElement('form')
  form.innerHTML = `
    <h3>Edit Overview</h3>
    <label class="input-row">Current Weight (kg)<input name="currentWeight" type="number" step="0.1" required /></label>
    <label class="input-row">Target Weight (kg)<input name="targetWeight" type="number" step="0.1" required /></label>
    <label class="input-row">BMI<input name="bmi" type="number" step="0.1" required /></label>
    <label class="input-row">Body Fat %<input name="bodyFat" type="number" step="0.1" required /></label>
    <label class="input-row">Muscle Gain (text)<input name="muscleGain" type="text" /></label>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
      <button type="submit" class="btn">Save</button>
      <button type="button" id="cancelOverview" class="btn ghost">Cancel</button>
    </div>
  `
  form.currentWeight.value = data.overview.currentWeight
  form.targetWeight.value = data.overview.targetWeight
  form.bmi.value = data.overview.bmi
  form.bodyFat.value = data.overview.bodyFat
  form.muscleGain.value = data.overview.muscleGain

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = new FormData(form)
    data.overview.currentWeight = Number(f.get('currentWeight'))
    data.overview.targetWeight = Number(f.get('targetWeight'))
    data.overview.bmi = Number(f.get('bmi'))
    data.overview.bodyFat = Number(f.get('bodyFat'))
    data.overview.muscleGain = f.get('muscleGain')
    saveData(); reRenderAll(); hideModal()
  })
  form.querySelector('#cancelOverview').addEventListener('click', hideModal)
  return form
}

function buildPRForm(edit = null) {
  const form = document.createElement('form')
  form.innerHTML = `
    <h3>${edit ? 'Edit' : 'Add'} Personal Record</h3>
    <label class="input-row">Label<input name="label" type="text" required /></label>
    <label class="input-row">Value<input name="value" type="text" /></label>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
      <button type="submit" class="btn">${edit ? 'Save' : 'Add'}</button>
      <button type="button" id="cancelPR" class="btn ghost">Cancel</button>
    </div>
  `
  if (edit) {
    form.label.value = edit.label
    form.value.value = edit.value
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = new FormData(form)
    const label = f.get('label'), value = f.get('value')
    if (edit) {
      const pr = data.prs.find(p => p.id === edit.id)
      if (pr) { pr.label = label; pr.value = value }
    } else {
      data.prs.push({ id: id(), label, value })
    }
    saveData(); renderPRs(); hideModal()
  })
  form.querySelector('#cancelPR').addEventListener('click', hideModal)
  return form
}

function buildPlanForm(edit = null) {
  const form = document.createElement('form')
  form.innerHTML = `
    <h3>${edit ? 'Edit' : 'New'} Plan</h3>
    <label class="input-row">Date<input name="date" type="date" required /></label>
    <label class="input-row">Title<input name="title" type="text" required /></label>
    <label class="input-row">Notes<textarea name="notes" rows="4"></textarea></label>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
      <button type="submit" class="btn">${edit ? 'Save' : 'Add'}</button>
      <button type="button" id="cancelPlan" class="btn ghost">Cancel</button>
    </div>
  `
  if (edit) { form.date.value = edit.date; form.title.value = edit.title; form.notes.value = edit.notes }
  else form.date.value = new Date().toISOString().slice(0, 10)

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = new FormData(form)
    const obj = { id: edit ? edit.id : id(), date: f.get('date'), title: f.get('title'), notes: f.get('notes') }
    if (edit) {
      data.plans = data.plans.map(p => p.id === edit.id ? obj : p)
    } else data.plans.push(obj)
    saveData(); renderPlans(); hideModal()
  })
  form.querySelector('#cancelPlan').addEventListener('click', hideModal)
  return form
}

function buildCSV() {
  const rows = []
  rows.push(['FitDash Export', '', '', ''])
  rows.push(['Exported', new Date().toISOString(), '', ''])
  rows.push(['Overview'])
  rows.push(['CurrentWeight', data.overview.currentWeight])
  rows.push(['TargetWeight', data.overview.targetWeight])
  rows.push(['BMI', data.overview.bmi])
  rows.push(['BodyFat', data.overview.bodyFat])
  rows.push(['MuscleGain', data.overview.muscleGain])
  rows.push([''])
  rows.push(['Weekly'])
  rows.push(['date', 'weight', 'calories', 'minutes'])
  data.weekly.forEach(w => {
    rows.push([w.date, w.weight, w.calories, w.minutes])
  })
  rows.push([''])
  rows.push(['PRs'])
  rows.push(['label', 'value'])
  data.prs.forEach(p => rows.push([p.label, p.value]))
  rows.push([''])
  rows.push(['Plans'])
  rows.push(['date', 'title', 'notes'])
  data.plans.forEach(p => rows.push([p.date, p.title, p.notes]))

  return rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n')
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }

function applyDarkMode(enable) {
  if (enable) document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
  const meta = qs('#meta-theme-color')
  if (meta) meta.setAttribute('content', enable ? '#020617' : '#f8fafc')
}

function reRenderAll() {
  renderOverview(); renderAchievements(); renderPRs(); renderSchedule(); renderHydration(); renderPlans(); updateChart(qs('#chartMetric').value || 'all')
}

window.addEventListener('load', () => {
  initChart()
  renderOverview(); renderAchievements(); renderPRs(); renderSchedule(); renderHydration(); renderPlans()
  wire()
  setTimeout(() => updateChart('all'), 120)
})
