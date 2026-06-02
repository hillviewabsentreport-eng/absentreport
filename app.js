// ── CONFIGURATION ──────────────────────────────────────────────────
const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";
// ───────────────────────────────────────────────────────────────────

// ── TIMETABLE DATA ──────────────────────────────────────────────────
const timetable = {
  "Day 1": {
    "ACM":{2:"ARO"},"1W":{1:"KRH"},"ADM":{1:"KRH",2:"KRH"},
    "L6":{4:"ARO",1:"SM"},"3E":{1:"SBA"},"2W":{1:"SBA"},
    "5E/5M/5W":{1:"NTPE"},"4E/4M/4W":{1:"SR"},
    "U6":{1:"KF",3:"DC"},"3W":{1:"NMP"},"1E":{1:"SA"},
    "2M":{1:"JS"},"2E":{1:"REH"},
  },
  "Day 2": {
    "5W":{1:"KRH"},"4M":{2:"KRH"},"U6":{3:"KRH"},
    "3E":{1:"AP"},"2W":{2:"AP"},"5M":{3:"AP"},"4E":{4:"AP",1:"NMP"},
    "L6":{1:"SM"},"3W":{2:"NMP"},"4W":{3:"NMP"},"3M":{1:"CAL"},
    "4E/4M/4W":{3:"CMB"},"5E/5M/5W":{1:"NS"},
  },
  "Day 3": {
    "5W":{1:"NMP"},"5E":{2:"KRH"},"U6":{3:"ARO"},
    "4E":{1:"SBA"},"1E":{1:"BD"},"1W":{1:"ARM"},
    "4E/4M/4W":{1:"NS"},"5E/5M/5W":{2:"NTPE"},
    "3E":{1:"KF"},"2E":{2:"DG"},"3M":{7:"CD"},
  },
  "Day 4": {
    "L6":{1:"ARO"},"U6":{2:"ARO"},"3E":{3:"ARO"},
    "2E":{1:"SBA"},"4E/4M/4W":{1:"NTPE"},"1W":{1:"CAL"},
    "2W":{2:"ROR"},"3W":{3:"ROR"},"1E":{1:"REH"},
    "1M":{4:"KDN"},"2M":{3:"KF"},"5E/5M/5W":{2:"NS"},"3M":{1:"SA"},
  },
  "Day 5": {
    "L6":{1:"ARO"},"U6":{2:"ARO"},"4E":{3:"ARO"},
    "5W":{1:"KRH"},"3M":{2:"NMP"},"4W":{4:"NMP"},
    "1E":{1:"CAL"},"1W":{6:"CD"},"3E":{5:"NS"},
    "5E/5M/5W":{1:"SR"},"4E/4M/4W":{3:"MNP"},"2M":{2:"SBA"},
  },
  "Day 6": {
    "L6":{1:"ARO"},"U6":{2:"ARO"},"4E":{3:"ARO"},
    "3W":{8:"NMP"},"1M":{5:"CAL"},"2E":{4:"REH"},
    "2W":{5:"REH"},"5E/5M/5W":{1:"NS"},"4E/4M/4W":{2:"MNP"},
    "3E":{6:"KF"},"1E":{8:"AR"},"3M":{7:"DG"},"4M":{6:"DG"},
  },
};

const allClasses = [
  "1E","1M","1W","2E","2M","2W","3E","3M","3W",
  "4E","4M","4W","4E/4M/4W","5E","5M","5W","5E/5M/5W",
  "L6","U6","ACM","ADM"
];

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

// ── STATE ────────────────────────────────────────────────────────────
let state = { day:null, cls:null, period:null, teacher:null };
let currentRole = null;
let pendingReports = [];
let passTarget = null; // which password being changed: 'admin' | 'user'

// ── SESSION ──────────────────────────────────────────────────────────
function getSession() {
  return sessionStorage.getItem("hc_role");
}
function setSession(role) {
  sessionStorage.setItem("hc_role", role);
}
function clearSession() {
  sessionStorage.removeItem("hc_role");
}

// ── BOOT ─────────────────────────────────────────────────────────────
(function boot() {
  const saved = getSession();
  if (saved) {
    showApp(saved);
  }
})();

// ── ROLE SELECTOR ────────────────────────────────────────────────────
let selectedRole = "user";
window.selectRole = function(role) {
  selectedRole = role;
  document.getElementById("role-user").classList.toggle("selected", role === "user");
  document.getElementById("role-admin").classList.toggle("selected", role === "admin");
  document.getElementById("pass-input").value = "";
  document.getElementById("pass-input").focus();
};

// ── LOGIN ─────────────────────────────────────────────────────────────
window.doLogin = async function() {
  const password = document.getElementById("pass-input").value.trim();
  if (!password) return;

  const btn = document.getElementById("login-btn");
  btn.disabled = true;
  btn.textContent = "Signing in…";
  document.getElementById("login-err").style.display = "none";

  try {
    const res  = await fetch(APPS_SCRIPT_URL + "?action=validatePassword&role=" + selectedRole + "&pass=" + encodeURIComponent(password) + "&t=" + Date.now());
    const json = await res.json();

    if (json.status === "success") {
      setSession(selectedRole);
      showApp(selectedRole);
    } else {
      document.getElementById("login-err").style.display = "block";
    }
  } catch(err) {
    document.getElementById("login-err").textContent = "Connection error. Check your internet.";
    document.getElementById("login-err").style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
    document.getElementById("pass-input").value = "";
  }
};

// ── SHOW APP ──────────────────────────────────────────────────────────
function showApp(role) {
  currentRole = role;
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app").style.display = "block";

  const tag = document.getElementById("role-tag");
  tag.textContent = role === "admin" ? "Admin" : "Reporter";
  tag.className = "user-tag" + (role === "admin" ? " admin" : "");

  // Show admin tab only for admins
  document.getElementById("tab-admin").style.display = role === "admin" ? "flex" : "none";

  initForm();
  loadPendingReports();
}

window.doSignOut = function() {
  clearSession();
  currentRole = null;
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("app").style.display = "none";
  selectedRole = "user";
  document.getElementById("role-user").classList.add("selected");
  document.getElementById("role-admin").classList.remove("selected");
};

// ── TAB SWITCHING ─────────────────────────────────────────────────────
window.switchTab = function(tab) {
  ["report","approvals","admin"].forEach(t => {
    document.getElementById("tab-" + t)?.classList.toggle("active", t === tab);
    document.getElementById("panel-" + t)?.classList.toggle("active", t === tab);
  });
  if (tab === "approvals") loadPendingReports();
  if (tab === "admin")     loadAdminPanel();
};

// ── PENDING REPORTS ───────────────────────────────────────────────────
async function loadPendingReports() {
  const listEl    = document.getElementById("ap-list");
  const loadingEl = document.getElementById("ap-loading");
  const heroEl    = document.getElementById("approvals-hero");
  const hdrEl     = document.getElementById("ap-section-hdr");

  loadingEl.style.display = "block";
  listEl.innerHTML = "";
  heroEl.style.display = "none";
  hdrEl.style.display = "none";

  try {
    const res  = await fetch(APPS_SCRIPT_URL + "?action=getPending&t=" + Date.now());
    const json = await res.json();
    if (json.status !== "success") throw new Error(json.message);

    // Everyone can approve — no self-filter needed (no individual identity)
    pendingReports = json.data;

    // Update badge + alert banner
    const count = pendingReports.length;
    const badge = document.getElementById("tab-badge");
    const alert = document.getElementById("approval-alert");
    const alertCount = document.getElementById("alert-count");

    if (count > 0) {
      badge.textContent = count;
      badge.classList.add("show");
      alertCount.textContent = count;
      alert.style.display = "flex";
      heroEl.style.display = "block";
      document.getElementById("hero-count").textContent = count;
      hdrEl.style.display = "block";
    } else {
      badge.classList.remove("show");
      alert.style.display = "none";
    }

    loadingEl.style.display = "none";
    renderApprovals(pendingReports);

  } catch(err) {
    loadingEl.textContent = "Could not load pending reports.";
    console.error(err);
  }
}

function renderApprovals(reports) {
  const listEl = document.getElementById("ap-list");
  listEl.innerHTML = "";

  if (reports.length === 0) {
    listEl.innerHTML = `
      <div class="ap-empty">
        <div class="ap-empty-icon">✅</div>
        <p><strong>All clear!</strong><br>No pending reports to verify right now.</p>
      </div>`;
    return;
  }

  reports.forEach(row => {
    const reportId = row[0];
    const card = document.createElement("div");
    card.className = "approval-card";
    card.id = "apc-" + reportId;
    card.innerHTML = `
      <div class="apc-top">
        <div class="apc-chips">
          <span class="apc-chip">${row[2]}</span>
          <span class="apc-chip">Class ${row[3]}</span>
          <span class="apc-chip">Period ${row[4]}</span>
          <span class="apc-chip">${row[1]}</span>
        </div>
        <div class="apc-teacher">${row[5]}</div>
        <div class="apc-reporter">Reported anonymously · ${row[1]}</div>
      </div>
      <div class="apc-actions">
        <button class="apc-btn" onclick="verifyReport('${reportId}','CONFIRMED')">✓ Confirm absent</button>
        <button class="apc-btn" onclick="verifyReport('${reportId}','DENIED')">✗ Present</button>
      </div>`;
    listEl.appendChild(card);
  });
}

window.verifyReport = async function(reportId, verdict) {
  const card = document.getElementById("apc-" + reportId);
  card.querySelectorAll(".apc-btn").forEach(b => b.disabled = true);

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action:"verify", reportId, verdict, verifierEmail: "app-" + currentRole }),
    });

    const actionsEl = card.querySelector(".apc-actions");
    actionsEl.outerHTML = `<div class="apc-done ${verdict === 'CONFIRMED' ? 'confirmed' : 'denied'}">
      ${verdict === 'CONFIRMED' ? '✓ Confirmed — absence recorded' : '✗ Denied — teacher marked present'}
    </div>`;

    pendingReports = pendingReports.filter(r => r[0] !== reportId);
    const count = pendingReports.length;
    const badge = document.getElementById("tab-badge");
    const alert = document.getElementById("approval-alert");
    const heroEl = document.getElementById("approvals-hero");
    const hdrEl  = document.getElementById("ap-section-hdr");

    if (count > 0) {
      badge.textContent = count;
      document.getElementById("alert-count").textContent = count;
      document.getElementById("hero-count").textContent = count;
    } else {
      badge.classList.remove("show");
      alert.style.display = "none";
      heroEl.style.display = "none";
      hdrEl.style.display = "none";
      document.getElementById("ap-list").innerHTML = `
        <div class="ap-empty"><div class="ap-empty-icon">✅</div>
        <p><strong>All done!</strong><br>No more pending reports.</p></div>`;
    }

    showToast(verdict === 'CONFIRMED' ? '✓ Absence confirmed' : '✗ Report denied');

  } catch(err) {
    card.querySelectorAll(".apc-btn").forEach(b => b.disabled = false);
    showToast('Failed — please try again');
  }
};

// ── ADMIN PANEL ────────────────────────────────────────────────────────
async function loadAdminPanel() {
  const listEl = document.getElementById("verifiers-list");
  listEl.innerHTML = '<div style="padding:14px 16px;color:var(--text3);font-size:14px">Loading…</div>';

  try {
    const res  = await fetch(APPS_SCRIPT_URL + "?action=getVerifiers&t=" + Date.now());
    const json = await res.json();
    if (json.status !== "success") throw new Error(json.message);

    renderVerifiers(json.data);
  } catch(err) {
    listEl.innerHTML = '<div style="padding:14px 16px;color:var(--red);font-size:13px">Could not load overseers.</div>';
  }
}

function renderVerifiers(verifiers) {
  const listEl = document.getElementById("verifiers-list");
  if (!verifiers || verifiers.length === 0) {
    listEl.innerHTML = '<div style="padding:14px 16px;color:var(--text3);font-size:14px">No overseers yet. Add one below.</div>';
    return;
  }
  listEl.innerHTML = verifiers.map((v, i) => {
    const isActive = (v[2] || "").toString().toLowerCase() === "yes";
    return `
    <div class="admin-row" id="vrow-${i}">
      <div class="admin-row-icon ${isActive ? 'green' : 'orange'}">👤</div>
      <div class="admin-row-body">
        <div class="admin-row-label">${v[1] || v[0]}</div>
        <div class="admin-row-sub">${v[0]}</div>
      </div>
      <button class="toggle ${isActive ? 'on' : ''}" onclick="toggleVerifier(${i},'${v[0]}','${isActive ? 'No' : 'Yes'}')"></button>
    </div>`;
  }).join("");
}

window.toggleVerifier = async function(idx, email, newStatus) {
  const btn = document.querySelector(`#vrow-${idx} .toggle`);
  if (btn) btn.style.opacity = "0.5";
  try {
    await fetch(APPS_SCRIPT_URL, {
      method:"POST", mode:"no-cors",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"updateVerifier", email, active: newStatus }),
    });
    showToast(newStatus === 'Yes' ? '✓ Overseer activated' : 'Overseer deactivated');
    setTimeout(loadAdminPanel, 600);
  } catch(err) {
    showToast('Failed to update');
    if (btn) btn.style.opacity = "1";
  }
};

window.toggleAddForm = function() {
  const form = document.getElementById("add-form");
  form.classList.toggle("open");
  if (form.classList.contains("open")) {
    document.getElementById("new-name").focus();
  }
};

window.addVerifier = async function() {
  const name  = document.getElementById("new-name").value.trim();
  const email = document.getElementById("new-email").value.trim();
  if (!name || !email || !email.includes("@")) {
    showToast("Please enter a valid name and email"); return;
  }
  try {
    await fetch(APPS_SCRIPT_URL, {
      method:"POST", mode:"no-cors",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"addVerifier", name, email }),
    });
    document.getElementById("new-name").value = "";
    document.getElementById("new-email").value = "";
    document.getElementById("add-form").classList.remove("open");
    showToast("✓ Overseer added");
    setTimeout(loadAdminPanel, 800);
  } catch(err) {
    showToast("Failed to add overseer");
  }
};

window.togglePassForm = function(target) {
  passTarget = target;
  const form = document.getElementById("pass-form");
  document.getElementById("pass-form-label").textContent = "New " + target + " password";
  document.getElementById("new-pass").value = "";
  document.getElementById("confirm-pass").value = "";
  form.classList.toggle("open");
  if (form.classList.contains("open")) document.getElementById("new-pass").focus();
};

window.closePassForm = function() {
  document.getElementById("pass-form").classList.remove("open");
};

window.changePassword = async function() {
  const np = document.getElementById("new-pass").value.trim();
  const cp = document.getElementById("confirm-pass").value.trim();
  if (!np || np.length < 6) { showToast("Password must be at least 6 characters"); return; }
  if (np !== cp)             { showToast("Passwords don't match"); return; }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method:"POST", mode:"no-cors",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"changePassword", role: passTarget, password: np }),
    });
    closePassForm();
    showToast("✓ Password updated");
  } catch(err) {
    showToast("Failed to update password");
  }
};

// ── FORM LOGIC ─────────────────────────────────────────────────────────
let formInited = false;
function initForm() {
  if (formInited) return;
  formInited = true;

  const dayContainer = document.getElementById("day-chips");
  days.forEach(d => {
    const c = document.createElement("div");
    c.className = "chip"; c.textContent = d;
    c.onclick = () => selectDay(d, c);
    dayContainer.appendChild(c);
  });

  const pContainer = document.getElementById("period-btns");
  for (let p = 1; p <= 8; p++) {
    const b = document.createElement("div");
    b.className = "p-btn"; b.textContent = p;
    b.onclick = () => selectPeriod(p, b);
    pContainer.appendChild(b);
  }

  const sel = document.getElementById("teacher-select");
  Object.entries(teachers).forEach(([code, name]) => {
    const opt = document.createElement("option");
    opt.value = code; opt.textContent = name;
    sel.appendChild(opt);
  });
}

window.selectDay = function(day, el) {
  state = {day, cls:null, period:null, teacher:null};
  document.querySelectorAll("#day-chips .chip").forEach(c => c.classList.remove("sel"));
  el.classList.add("sel");
  document.getElementById("val-day").textContent = day;
  markDone("card-day");
  const cc = document.getElementById("class-chips");
  cc.innerHTML = "";
  allClasses.forEach(cls => {
    const c = document.createElement("div");
    c.className = "chip"; c.textContent = cls;
    c.onclick = () => selectClass(cls, c);
    cc.appendChild(c);
  });
  unlock("card-class"); lock("card-period"); lock("card-teacher");
  clearTeacher(); updateProgress(); checkSubmit();
};

window.selectClass = function(cls, el) {
  state.cls = cls; state.period = null; state.teacher = null;
  document.querySelectorAll("#class-chips .chip").forEach(c => c.classList.remove("sel"));
  el.classList.add("sel");
  document.getElementById("val-class").textContent = cls;
  markDone("card-class");
  document.querySelectorAll(".p-btn").forEach(b => b.classList.remove("sel"));
  document.getElementById("val-period").textContent = "";
  unlock("card-period"); lock("card-teacher"); clearTeacher(); updateProgress(); checkSubmit();
};

window.selectPeriod = function(period, el) {
  state.period = period;
  document.querySelectorAll(".p-btn").forEach(b => b.classList.remove("sel"));
  el.classList.add("sel");
  document.getElementById("val-period").textContent = "Period " + period;
  markDone("card-period");
  const suggested = timetable[state.day]?.[state.cls]?.[period] || null;
  state.teacher = suggested;
  buildTeacherDisplay(suggested);
  unlock("card-teacher"); updateProgress(); checkSubmit();
};

window.overrideTeacher = function(val) {
  state.teacher = val || timetable[state.day]?.[state.cls]?.[state.period] || null;
  checkSubmit();
};

function buildTeacherDisplay(suggested) {
  const display = document.getElementById("teacher-display");
  const sel = document.getElementById("teacher-select");
  if (suggested) {
    display.innerHTML = `<div class="t-card"><div class="t-avatar">${suggested.substring(0,2)}</div><div><div class="t-name">${teachers[suggested]||suggested}</div><div class="t-sub">Auto-matched from timetable</div></div></div>`;
    sel.value = suggested;
  } else {
    display.innerHTML = `<div class="t-card" style="background:#FFF3E0;border-color:rgba(255,149,0,0.3)"><div class="t-avatar" style="background:linear-gradient(145deg,#E65100,#FF9500)">?</div><div><div class="t-name">No match found</div><div class="t-sub">Please select manually below</div></div></div>`;
    sel.value = "";
  }
}

function clearTeacher() {
  document.getElementById("teacher-display").innerHTML = "";
  document.getElementById("teacher-select").value = "";
}

function lock(id) { const c=document.getElementById(id); c.classList.add("locked"); c.classList.remove("done"); }
function unlock(id) { document.getElementById(id).classList.remove("locked","done"); }
function markDone(id) { const c=document.getElementById(id); c.classList.remove("locked"); c.classList.add("done"); }

function updateProgress() {
  [state.day,state.cls,state.period,state.teacher].forEach((v,i) => {
    document.getElementById("seg"+(i+1)).className = "prog-seg" + (v ? " done" : "");
  });
}

function checkSubmit() {
  document.getElementById("submit-btn").disabled = !(state.day && state.cls && state.period && state.teacher);
}

window.submitReport = async function() {
  const btn = document.getElementById("submit-btn");
  document.getElementById("err-banner").style.display = "none";
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span>Submitting…';

  const payload = {
    action: "submit",
    day: state.day, class: state.cls,
    period: state.period, teacher: state.teacher,
    reporterEmail: "anonymous-" + currentRole,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(APPS_SCRIPT_URL, {
      method:"POST", mode:"no-cors",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(payload),
    });

    document.querySelectorAll(".step-card,.progress-row,.submit-btn,.err-banner").forEach(el => el.style.display="none");
    const time = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    document.getElementById("sum-box").innerHTML = `
      <div class="sum-row"><span class="sum-k">Day</span><span class="sum-v">${payload.day}</span></div>
      <div class="sum-row"><span class="sum-k">Class</span><span class="sum-v">${payload.class}</span></div>
      <div class="sum-row"><span class="sum-k">Period</span><span class="sum-v">${payload.period}</span></div>
      <div class="sum-row"><span class="sum-k">Teacher</span><span class="sum-v">${payload.teacher}</span></div>
      <div class="sum-row"><span class="sum-k">Time</span><span class="sum-v">${time}</span></div>
      <div class="sum-row"><span class="sum-k">Status</span><span class="sum-v" style="color:var(--orange)">⏳ Pending</span></div>`;
    document.getElementById("success-scr").style.display = "block";
    loadPendingReports();
  } catch(err) {
    document.getElementById("err-banner").style.display = "block";
    btn.disabled = false;
    btn.innerHTML = "Submit Absence Report";
  }
};

window.resetForm = function() {
  state = {day:null,cls:null,period:null,teacher:null};
  document.querySelectorAll(".step-card,.progress-row,.submit-btn,.err-banner").forEach(el=>el.style.display="");
  document.getElementById("success-scr").style.display = "none";
  document.querySelectorAll(".chip").forEach(c=>c.classList.remove("sel"));
  document.querySelectorAll(".p-btn").forEach(b=>b.classList.remove("sel"));
  ["val-day","val-class","val-period"].forEach(id=>document.getElementById(id).textContent="");
  ["card-day","card-class","card-period","card-teacher"].forEach(id=>
    document.getElementById(id).classList.remove("done","locked"));
  lock("card-class"); lock("card-period"); lock("card-teacher"); clearTeacher();
  ["seg1","seg2","seg3","seg4"].forEach(id=>document.getElementById(id).className="prog-seg");
  document.getElementById("submit-btn").disabled = true;
  document.getElementById("submit-btn").innerHTML = "Submit Absence Report";
};

// ── TOAST ──────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}
