// ── CONFIGURATION ──────────────────────────────────────────────────────────
// Replace this URL with your deployed Google Apps Script Web App URL
// See SETUP.md for instructions on how to get this URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylBT8N2HmAPoxrlzXufSOprwx7kmYU8ZHAggDEIr0SVfcCApUsqKH31XWmxJi4g2zq/exec";
// ───────────────────────────────────────────────────────────────────────────

// Hide config notice if URL has been set
if (APPS_SCRIPT_URL !== "PASTE_YOUR_APPS_SCRIPT_URL_HERE") {
  document.getElementById("config-notice").style.display = "none";
}

// ── TIMETABLE DATA ──────────────────────────────────────────────────────────
// Structure: timetable[day][class][period] = "TEACHER_CODE"
const timetable = {
  "Day 1": {
    "ACM": { 2: "ARO" },
    "1W":  { 1: "KRH" },
    "ADM": { 1: "KRH", 2: "KRH" },
    "L6":  { 4: "ARO", 1: "SM" },
    "3E":  { 1: "SBA" },
    "2W":  { 1: "SBA" },
    "5E/5M/5W": { 1: "NTPE" },
    "4E/4M/4W": { 1: "SR" },
    "U6":  { 1: "KF", 3: "DC" },
    "3W":  { 1: "NMP" },
    "1E":  { 1: "SA" },
    "2M":  { 1: "JS" },
    "2E":  { 1: "REH" },
  },
  "Day 2": {
    "5W":  { 1: "KRH" },
    "4M":  { 2: "KRH" },
    "U6":  { 3: "KRH" },
    "3E":  { 1: "AP" },
    "2W":  { 2: "AP" },
    "5M":  { 3: "AP" },
    "4E":  { 4: "AP", 1: "NMP" },
    "L6":  { 1: "SM" },
    "3W":  { 2: "NMP" },
    "4W":  { 3: "NMP" },
    "3M":  { 1: "CAL" },
    "4E/4M/4W": { 3: "CMB" },
    "5E/5M/5W": { 1: "NS" },
  },
  "Day 3": {
    "5W":  { 1: "NMP" },
    "5E":  { 2: "KRH" },
    "U6":  { 3: "ARO" },
    "4E":  { 1: "SBA" },
    "1E":  { 1: "BD" },
    "1W":  { 1: "ARM" },
    "4E/4M/4W": { 1: "NS" },
    "5E/5M/5W": { 2: "NTPE" },
    "3E":  { 1: "KF" },
    "2E":  { 2: "DG" },
    "3M":  { 7: "CD" },
  },
  "Day 4": {
    "L6":  { 1: "ARO" },
    "U6":  { 2: "ARO" },
    "3E":  { 3: "ARO" },
    "2E":  { 1: "SBA" },
    "4E/4M/4W": { 1: "NTPE" },
    "1W":  { 1: "CAL" },
    "2W":  { 2: "ROR" },
    "3W":  { 3: "ROR" },
    "1E":  { 1: "REH" },
    "1M":  { 4: "KDN" },
    "2M":  { 3: "KF" },
    "5E/5M/5W": { 2: "NS" },
    "3M":  { 1: "SA" },
  },
  "Day 5": {
    "L6":  { 1: "ARO" },
    "U6":  { 2: "ARO" },
    "4E":  { 3: "ARO" },
    "5W":  { 1: "KRH" },
    "3M":  { 2: "NMP" },
    "4W":  { 4: "NMP" },
    "1E":  { 1: "CAL" },
    "1W":  { 6: "CD" },
    "3E":  { 5: "NS" },
    "5E/5M/5W": { 1: "SR" },
    "4E/4M/4W": { 3: "MNP" },
    "2M":  { 2: "SBA" },
  },
  "Day 6": {
    "L6":  { 1: "ARO" },
    "U6":  { 2: "ARO" },
    "4E":  { 3: "ARO" },
    "3W":  { 8: "NMP" },
    "1M":  { 5: "CAL" },
    "2E":  { 4: "REH" },
    "2W":  { 5: "REH" },
    "5E/5M/5W": { 1: "NS" },
    "4E/4M/4W": { 2: "MNP" },
    "3E":  { 6: "KF" },
    "1E":  { 8: "AR" },
    "3M":  { 7: "DG" },
    "4M":  { 6: "DG" },
  },
};

// All unique classes sorted
const allClasses = [
  "1E","1M","1W","2E","2M","2W",
  "3E","3M","3W","4E","4M","4W",
  "4E/4M/4W","5E","5M","5W","5E/5M/5W",
  "L6","U6","ACM","ADM"
];

// Full teacher list with display names
// UPDATE these with full names if known
const teachers = {
  "ARO":"ARO","KRH":"KRH","RRR":"RRR","SM":"SM","AP":"AP",
  "NMP":"NMP","CAL":"CAL","SSI":"SSI","SL":"SL","SBA":"SBA",
  "APP":"APP","BD":"BD","ARM":"ARM","TC":"TC","NTC":"NTC",
  "SMP":"SMP","NP":"NP","KF":"KF","ROR":"ROR","RIA":"RIA",
  "NS":"NS","SSS":"SSS","NTPE":"NTPE","FAH":"FAH","DG":"DG",
  "REH":"REH","AR":"AR","SA":"SA","CD":"CD","NR":"NR",
  "DC":"DC","KDN":"KDN","JS":"JS","NB":"NB","NK":"NK",
  "YJ":"YJ","ADA":"ADA","SB":"SB","VRS":"VRS","MNP":"MNP",
  "SR":"SR","MNM":"MNM","CMB":"CMB","NA":"NA","HRM":"HRM",
  "SK":"SK","NTD":"NTD","RR":"RR","SS":"SS","LJB":"LJB",
};

const days = ["Day 1","Day 2","Day 3","Day 4","Day 5","Day 6"];

// ── STATE ───────────────────────────────────────────────────────────────────
let state = { day: null, cls: null, period: null, teacher: null };

// ── INIT ────────────────────────────────────────────────────────────────────
function init() {
  // Build day chips
  const dayContainer = document.getElementById("day-chips");
  days.forEach(d => {
    const c = document.createElement("div");
    c.className = "chip";
    c.textContent = d;
    c.onclick = () => selectDay(d, c);
    dayContainer.appendChild(c);
  });

  // Build period buttons
  const periodContainer = document.getElementById("period-btns");
  for (let p = 1; p <= 8; p++) {
    const b = document.createElement("div");
    b.className = "p-btn";
    b.textContent = p;
    b.onclick = () => selectPeriod(p, b);
    periodContainer.appendChild(b);
  }

  // Populate teacher select
  const sel = document.getElementById("teacher-select");
  Object.entries(teachers).forEach(([code, name]) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = name;
    sel.appendChild(opt);
  });
}

// ── SELECTION HANDLERS ──────────────────────────────────────────────────────
function selectDay(day, el) {
  state.day = day;
  state.cls = null;
  state.period = null;
  state.teacher = null;

  document.querySelectorAll("#day-chips .chip").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("val-day").textContent = day;
  markDone("card-day");

  // Build class chips for this day
  const classContainer = document.getElementById("class-chips");
  classContainer.innerHTML = "";
  allClasses.forEach(cls => {
    const c = document.createElement("div");
    c.className = "chip";
    c.textContent = cls;
    c.onclick = () => selectClass(cls, c);
    classContainer.appendChild(c);
  });

  unlock("card-class");
  lock("card-period");
  lock("card-teacher");
  clearTeacher();
  updateProgress();
  checkSubmit();
}

function selectClass(cls, el) {
  state.cls = cls;
  state.period = null;
  state.teacher = null;

  document.querySelectorAll("#class-chips .chip").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("val-class").textContent = cls;
  markDone("card-class");

  document.querySelectorAll(".p-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById("val-period").textContent = "";

  unlock("card-period");
  lock("card-teacher");
  clearTeacher();
  updateProgress();
  checkSubmit();
}

function selectPeriod(period, el) {
  state.period = period;

  document.querySelectorAll(".p-btn").forEach(b => b.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("val-period").textContent = `Period ${period}`;
  markDone("card-period");

  // Auto-lookup teacher
  const suggested = lookupTeacher(state.day, state.cls, period);
  state.teacher = suggested;

  buildTeacherDisplay(suggested);
  unlock("card-teacher");
  updateProgress();
  checkSubmit();
}

function overrideTeacher(val) {
  if (val) {
    state.teacher = val;
  } else {
    state.teacher = lookupTeacher(state.day, state.cls, state.period);
  }
  checkSubmit();
}

// ── TEACHER LOOKUP ──────────────────────────────────────────────────────────
function lookupTeacher(day, cls, period) {
  try {
    return timetable[day]?.[cls]?.[period] || null;
  } catch { return null; }
}

function buildTeacherDisplay(suggested) {
  const display = document.getElementById("teacher-display");
  const sel = document.getElementById("teacher-select");

  if (suggested) {
    const initials = suggested.substring(0, 2);
    display.innerHTML = `
      <div class="teacher-card">
        <div class="teacher-avatar">${initials}</div>
        <div>
          <div class="teacher-name">${teachers[suggested] || suggested}</div>
          <div class="teacher-sub">Auto-matched from timetable</div>
        </div>
      </div>`;
    sel.value = suggested;
  } else {
    display.innerHTML = `
      <div class="teacher-card" style="background:#FFF8F0;border-color:#F0C080">
        <div class="teacher-avatar" style="background:#C07000">?</div>
        <div>
          <div class="teacher-name">No match found</div>
          <div class="teacher-sub">Please select manually below</div>
        </div>
      </div>`;
    sel.value = "";
  }
}

function clearTeacher() {
  document.getElementById("teacher-display").innerHTML = "";
  document.getElementById("teacher-select").value = "";
}

// ── CARD STATE ──────────────────────────────────────────────────────────────
function lock(id) {
  const c = document.getElementById(id);
  c.classList.add("locked");
  c.classList.remove("done");
}

function unlock(id) {
  document.getElementById(id).classList.remove("locked", "done");
}

function markDone(id) {
  const c = document.getElementById(id);
  c.classList.remove("locked");
  c.classList.add("done");
}

function updateProgress() {
  const steps = [
    state.day !== null,
    state.cls !== null,
    state.period !== null,
    state.teacher !== null,
  ];
  steps.forEach((done, i) => {
    const seg = document.getElementById(`seg${i + 1}`);
    seg.className = "progress-seg" + (done ? " done" : (i === steps.filter(Boolean).length ? " active" : ""));
  });
}

function checkSubmit() {
  const ok = state.day && state.cls && state.period && state.teacher;
  document.getElementById("submit-btn").disabled = !ok;
}

// ── SUBMIT ──────────────────────────────────────────────────────────────────
async function submitReport() {
  const btn = document.getElementById("submit-btn");
  const errorBanner = document.getElementById("error-banner");
  errorBanner.style.display = "none";

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting…';

  const payload = {
    day: state.day,
    class: state.cls,
    period: state.period,
    teacher: state.teacher,
    timestamp: new Date().toISOString(),
  };

  try {
    // Google Apps Script requires no-cors for cross-origin form posts
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // no-cors means we can't read the response, but if fetch didn't throw, it was sent
    showSuccess(payload);
  } catch (err) {
    errorBanner.style.display = "block";
    btn.disabled = false;
    btn.innerHTML = "Submit absence report";
  }
}

function showSuccess(payload) {
  document.getElementById("form-area").style.display = "none";
  const screen = document.getElementById("success-screen");
  screen.style.display = "block";

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  document.getElementById("summary-box").innerHTML = `
    <div class="summary-row"><span class="summary-key">Day</span><span class="summary-val">${payload.day}</span></div>
    <div class="summary-row"><span class="summary-key">Class</span><span class="summary-val">${payload.class}</span></div>
    <div class="summary-row"><span class="summary-key">Period</span><span class="summary-val">${payload.period}</span></div>
    <div class="summary-row"><span class="summary-key">Teacher</span><span class="summary-val">${payload.teacher}</span></div>
    <div class="summary-row"><span class="summary-key">Time</span><span class="summary-val">${time}</span></div>
    <div class="summary-row"><span class="summary-key">Status</span><span class="summary-val" style="color:#1B4332">✓ Recorded</span></div>
  `;
}

function resetForm() {
  state = { day: null, cls: null, period: null, teacher: null };

  document.getElementById("form-area").style.display = "block";
  document.getElementById("success-screen").style.display = "none";

  document.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
  document.querySelectorAll(".p-btn").forEach(b => b.classList.remove("selected"));
  ["val-day","val-class","val-period"].forEach(id => document.getElementById(id).textContent = "");
  ["card-day","card-class","card-period","card-teacher"].forEach(id => {
    document.getElementById(id).classList.remove("done", "locked");
  });
  lock("card-class");
  lock("card-period");
  lock("card-teacher");
  clearTeacher();

  ["seg1","seg2","seg3","seg4"].forEach(id => {
    document.getElementById(id).className = "progress-seg";
  });

  document.getElementById("submit-btn").disabled = true;
  document.getElementById("submit-btn").innerHTML = "Submit absence report";
  document.getElementById("error-banner").style.display = "none";
}

// ── START ───────────────────────────────────────────────────────────────────
init();
