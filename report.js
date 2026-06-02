// ── CONFIGURATION ──────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylBT8N2HmAPoxrlzXufSOprwx7kmYU8ZHAggDEIr0SVfcCApUsqKH31XWmxJi4g2zq/exec";
// ───────────────────────────────────────────────────────────────────────────

let charts = {};

async function loadData() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("error-box").style.display = "none";
  try {
    const res  = await fetch(APPS_SCRIPT_URL + "?action=getReports&t=" + Date.now());
    const json = await res.json();
    if (json.status !== "success") throw new Error(json.message);
    renderDashboard(json.data);
  } catch(err) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error-box").style.display = "block";
    console.error(err);
  }
}

function renderDashboard(rows) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  // Columns: [0]ID [1]DateTime [2]Day [3]Class [4]Period [5]Teacher [6]ReportedBy [7]Status [8]VerifiedBy [9]VerifiedAt
  const total     = rows.length;
  const verified  = rows.filter(r => r[7] === "CONFIRMED").length;
  const pending   = rows.filter(r => r[7] === "Pending").length;

  document.getElementById("stat-total").textContent    = total;
  document.getElementById("stat-verified").textContent = verified;
  document.getElementById("stat-pending").textContent  = pending;

  // Only count confirmed for "most absent"
  const confirmedRows = rows.filter(r => r[7] === "CONFIRMED");
  const byTeacherAll  = count(rows, 5);
  const byTeacherConf = count(confirmedRows, 5);
  const topConfirmed  = Object.entries(byTeacherConf).sort((a,b)=>b[1]-a[1])[0];
  const topOverall    = Object.entries(byTeacherAll).sort((a,b)=>b[1]-a[1])[0];
  if (topConfirmed) {
    document.getElementById("stat-top").textContent       = topConfirmed[0];
    document.getElementById("stat-top-count").textContent = topConfirmed[1] + " confirmed";
  } else if (topOverall) {
    document.getElementById("stat-top").textContent       = topOverall[0];
    document.getElementById("stat-top-count").textContent = topOverall[1] + " total reports";
  } else {
    document.getElementById("stat-top").textContent       = "—";
    document.getElementById("stat-top-count").textContent = "";
  }

  // Teacher tab — show total, confirmed, pending per teacher
  renderTeacherTable(rows);
  renderChart("chart-teacher", byTeacherAll, false);
  document.getElementById("teacher-count").textContent = Object.keys(byTeacherAll).length + " teachers";

  // Class tab
  const byClass = count(rows, 3);
  renderChart("chart-class", byClass, false);
  renderSimpleTable("table-class", byClass);
  document.getElementById("class-count").textContent = Object.keys(byClass).length + " classes";

  // Day tab
  const byDay = countDays(rows, 2);
  renderChart("chart-day", byDay, true);
  renderSimpleTable("table-day", byDay);

  // Full log
  renderLog(rows);

  document.getElementById("last-updated").textContent =
    "Last updated: " + new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
}

function count(rows, col) {
  const r = {};
  rows.forEach(row => { const k = row[col]||"Unknown"; r[k] = (r[k]||0)+1; });
  return Object.fromEntries(Object.entries(r).sort((a,b)=>b[1]-a[1]));
}

function countDays(rows, col) {
  const order = ["Day 1","Day 2","Day 3","Day 4","Day 5","Day 6"];
  const raw = count(rows, col);
  const result = {};
  order.forEach(d => { if (raw[d]) result[d] = raw[d]; });
  Object.entries(raw).forEach(([k,v]) => { if (!result[k]) result[k]=v; });
  return result;
}

function renderTeacherTable(rows) {
  const tbody   = document.getElementById("table-teacher");
  const teachers = {};
  rows.forEach(row => {
    const t = row[5]||"Unknown";
    if (!teachers[t]) teachers[t] = {total:0,confirmed:0,pending:0};
    teachers[t].total++;
    if (row[7]==="CONFIRMED") teachers[t].confirmed++;
    if (row[7]==="Pending")   teachers[t].pending++;
  });
  const sorted = Object.entries(teachers).sort((a,b)=>b[1].total-a[1].total);
  const max    = sorted.length > 0 ? sorted[0][1].total : 1;
  tbody.innerHTML = "";
  sorted.forEach(([name, d], i) => {
    const pct  = Math.round((d.total/max)*100);
    let badge  = `<span class="badge badge-green">${d.total}</span>`;
    if (i===0 && d.total>1) badge = `<span class="badge badge-red">${d.total}</span>`;
    else if (i===1 && sorted.length>2) badge = `<span class="badge badge-yellow">${d.total}</span>`;
    tbody.innerHTML += `<tr>
      <td>${name}</td>
      <td>${badge}</td>
      <td><span class="badge badge-confirmed">${d.confirmed}</span></td>
      <td><span class="badge badge-pending">${d.pending}</span></td>
      <td class="bar-cell"><div class="mini-bar-wrap"><div class="mini-bar" style="width:${pct}%"></div></div></td>
    </tr>`;
  });
  if (sorted.length===0) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem">No data yet</td></tr>`;
}

function renderSimpleTable(tbodyId, data) {
  const tbody   = document.getElementById(tbodyId);
  const entries = Object.entries(data);
  const max     = entries.length > 0 ? entries[0][1] : 1;
  tbody.innerHTML = "";
  entries.forEach(([key,val],i) => {
    const pct  = Math.round((val/max)*100);
    let badge  = `<span class="badge badge-green">${val}</span>`;
    if (i===0&&val>1) badge = `<span class="badge badge-red">${val}</span>`;
    else if (i===1&&entries.length>2) badge = `<span class="badge badge-yellow">${val}</span>`;
    tbody.innerHTML += `<tr><td>${key}</td><td>${badge}</td>
      <td class="bar-cell"><div class="mini-bar-wrap"><div class="mini-bar" style="width:${pct}%"></div></div></td></tr>`;
  });
  if (entries.length===0) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:2rem">No data yet</td></tr>`;
}

function renderLog(rows) {
  const tbody = document.getElementById("table-log");
  document.getElementById("log-count").textContent = rows.length + " reports";
  tbody.innerHTML = "";
  // Most recent first
  [...rows].reverse().forEach(row => {
    const status = row[7] || "Pending";
    let badgeClass = "badge-pending";
    if (status==="CONFIRMED") badgeClass="badge-confirmed";
    if (status==="DENIED")    badgeClass="badge-denied";
    tbody.innerHTML += `<tr>
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3]}</td>
      <td>${row[4]}</td>
      <td>${row[5]}</td>
      <td style="font-family:'DM Sans',sans-serif;font-size:11px;color:var(--muted)">${row[6]||""}</td>
      <td><span class="badge ${badgeClass}">${status}</span></td>
    </tr>`;
  });
  if (rows.length===0) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:2rem">No reports yet</td></tr>`;
}

function renderChart(canvasId, data, isDay) {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const greens = ["#1E4636","#2D6A4F","#4D7C5A","#B8954A","#C2410C","#8A938C"];
  const colors = labels.map((_,i) => greens[i % greens.length]);
  if (charts[canvasId]) charts[canvasId].destroy();
  const ctx = document.getElementById(canvasId).getContext("2d");
  charts[canvasId] = new Chart(ctx, {
    type:"bar",
    data:{ labels, datasets:[{ data:values, backgroundColor:colors, borderRadius:6, borderSkipped:false }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{backgroundColor:"#1A2420",borderColor:"#1E4636",borderWidth:1,titleColor:"#B8954A",bodyColor:"#FBF9F4",padding:10,cornerRadius:8,
          callbacks:{label:ctx=>` ${ctx.parsed.y} report${ctx.parsed.y!==1?"s":""}`}}
      },
      scales:{
        x:{grid:{display:false},ticks:{color:"#8A938C",font:{family:"Libre Franklin",size:11,weight:"600"}}},
        y:{grid:{color:"rgba(26,36,32,0.06)"},ticks:{color:"#8A938C",font:{family:"Libre Franklin",size:11},stepSize:1,precision:0},beginAtZero:true}
      }
    }
  });
}

function showTab(name, el) {
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("panel-"+name).classList.add("active");
}

loadData();
