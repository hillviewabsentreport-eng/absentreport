// ── CONFIGURATION ──────────────────────────────────────────────────────────
// Must match the same URL in app.js 
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbylBT8N2HmAPoxrlzXufSOprwx7kmYU8ZHAggDEIr0SVfcCApUsqKH31XWmxJi4g2zq/exec";
// ───────────────────────────────────────────────────────────────────────────

let charts = {};

// ── LOAD DATA ───────────────────────────────────────────────────────────────
async function loadData() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("error-box").style.display = "none";

  try {
    const url = APPS_SCRIPT_URL + "?action=getReports&t=" + Date.now();
    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== "success") throw new Error(json.message);

    renderDashboard(json.data);
  } catch (err) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error-box").style.display = "block";
    console.error(err);
  }
}

// ── RENDER ──────────────────────────────────────────────────────────────────
function renderDashboard(rows) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  // rows = array of [reportId, timestamp, day, class, period, teacher, reportedAt]
  const total = rows.length;

  // Count by teacher
  const byTeacher = count(rows, 5);
  // Count by class
  const byClass = count(rows, 3);
  // Count by day
  const byDay = countDays(rows, 2);

  // Stat cards
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-teachers").textContent = Object.keys(byTeacher).length;

  const topTeacher = Object.entries(byTeacher).sort((a,b) => b[1]-a[1])[0];
  if (topTeacher) {
    document.getElementById("stat-top").textContent = topTeacher[0];
    document.getElementById("stat-top-count").textContent = topTeacher[1] + " report" + (topTeacher[1] > 1 ? "s" : "");
  }

  // Render all views
  renderChart("chart-teacher", byTeacher, "bar");
  renderTable("table-teacher", byTeacher);
  document.getElementById("teacher-count").textContent = Object.keys(byTeacher).length + " teachers";

  renderChart("chart-class", byClass, "bar");
  renderTable("table-class", byClass);
  document.getElementById("class-count").textContent = Object.keys(byClass).length + " classes";

  renderChart("chart-day", byDay, "bar", true);
  renderTable("table-day", byDay);

  document.getElementById("last-updated").textContent =
    "Last updated: " + new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
}

// ── COUNT HELPERS ────────────────────────────────────────────────────────────
function count(rows, colIndex) {
  const result = {};
  rows.forEach(row => {
    const key = row[colIndex] || "Unknown";
    result[key] = (result[key] || 0) + 1;
  });
  // Sort descending
  return Object.fromEntries(Object.entries(result).sort((a,b) => b[1]-a[1]));
}

function countDays(rows, colIndex) {
  const order = ["Day 1","Day 2","Day 3","Day 4","Day 5","Day 6"];
  const raw = count(rows, colIndex);
  const result = {};
  order.forEach(d => { if (raw[d]) result[d] = raw[d]; });
  // Add any unexpected values
  Object.entries(raw).forEach(([k,v]) => { if (!result[k]) result[k] = v; });
  return result;
}

// ── CHART ────────────────────────────────────────────────────────────────────
function renderChart(canvasId, data, type, isDay = false) {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const maxVal = Math.max(...values);

  const colors = labels.map((_, i) => {
    const greens = ["#4ADE80","#34D399","#6EE7B7","#86EFAC","#A7F3D0","#D1FAE5"];
    return greens[i % greens.length];
  });

  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  const ctx = document.getElementById(canvasId).getContext("2d");
  charts[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1E2B1A",
          borderColor: "#2A3D24",
          borderWidth: 1,
          titleColor: "#4ADE80",
          bodyColor: "#E8F0E4",
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} report${ctx.parsed.y !== 1 ? "s" : ""}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: "#1E2B1A" },
          ticks: { color: "#7A9470", font: { family: "DM Sans", size: 11 } }
        },
        y: {
          grid: { color: "#1E2B1A" },
          ticks: {
            color: "#7A9470",
            font: { family: "DM Mono", size: 11 },
            stepSize: 1,
            precision: 0
          },
          beginAtZero: true,
        }
      }
    }
  });
}

// ── TABLE ─────────────────────────────────────────────────────────────────────
function renderTable(tbodyId, data) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = "";
  const entries = Object.entries(data);
  const max = entries.length > 0 ? entries[0][1] : 1;

  entries.forEach(([key, val], i) => {
    const pct = Math.round((val / max) * 100);
    let badge = `<span class="badge badge-green">${val}</span>`;
    if (i === 0 && val > 1) badge = `<span class="badge badge-red">${val}</span>`;
    else if (i === 1 && entries.length > 2) badge = `<span class="badge badge-yellow">${val}</span>`;

    tbody.innerHTML += `
      <tr>
        <td>${key}</td>
        <td>${badge}</td>
        <td class="bar-cell">
          <div class="mini-bar-wrap">
            <div class="mini-bar" style="width:${pct}%"></div>
          </div>
        </td>
      </tr>`;
  });

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:2rem">No data yet</td></tr>`;
  }
}

// ── TABS ──────────────────────────────────────────────────────────────────────
function showTab(name, el) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("panel-" + name).classList.add("active");
}

// ── START ─────────────────────────────────────────────────────────────────────
loadData();
