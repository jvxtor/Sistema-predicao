const form = document.getElementById("predict-form");
const resultBox = document.getElementById("result");
const historyBody = document.getElementById("history-body");
const exportButton = document.getElementById("export-button");
const importButton = document.getElementById("import-button");
const importFileInput = document.getElementById("import-file-input");
const importStatus = document.getElementById("import-status");

const VALID_SEX = ["male", "female"];
const VALID_SMOKER = ["yes", "no"];
const VALID_REGION = ["northeast", "northwest", "southeast", "southwest"];
const IMPORT_CONCURRENCY = 5;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "USD",
});

const REGION_LABELS = {
  northeast: "Northeast",
  northwest: "Northwest",
  southeast: "Southeast",
  southwest: "Southwest",
};

let lastPredictions = [];
let charts = {};

function showResult(message, type) {
  resultBox.textContent = message;
  resultBox.className = `result ${type}`;
}

function renderHistory(predictions) {
  historyBody.innerHTML = "";
  for (const p of [...predictions].reverse()) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.age}</td>
      <td>${p.sex}</td>
      <td>${p.bmi}</td>
      <td>${p.children}</td>
      <td>${p.smoker}</td>
      <td>${p.region}</td>
      <td>${currencyFormatter.format(p.predicted_charges)}</td>
    `;
    historyBody.appendChild(row);
  }
}

function average(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function formatCurrencyShort(value) {
  return `$${Math.round(value / 1000)}k`;
}

function buildHistogram(values, binCount = 8) {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return { labels: [currencyFormatter.format(min)], counts: [values.length] };
  }

  const binSize = (max - min) / binCount;
  const counts = new Array(binCount).fill(0);
  for (const value of values) {
    let index = Math.floor((value - min) / binSize);
    if (index >= binCount) index = binCount - 1;
    counts[index]++;
  }
  const labels = counts.map((_, i) => {
    const start = min + i * binSize;
    const end = start + binSize;
    return `${formatCurrencyShort(start)}–${formatCurrencyShort(end)}`;
  });
  return { labels, counts };
}

function renderChart(key, config) {
  if (charts[key]) {
    charts[key].destroy();
  }
  const canvas = document.getElementById(key);
  charts[key] = new Chart(canvas, config);
}

function renderDashboard(predictions) {
  const countEl = document.getElementById("stat-count");
  const avgEl = document.getElementById("stat-avg");

  if (predictions.length === 0) {
    countEl.textContent = "0";
    avgEl.textContent = "—";
    return;
  }

  const charges = predictions.map((p) => p.predicted_charges);
  countEl.textContent = predictions.length;
  avgEl.textContent = currencyFormatter.format(average(charges));

  const regionKeys = Object.keys(REGION_LABELS).filter((region) =>
    predictions.some((p) => p.region === region)
  );
  const regionAverages = regionKeys.map((region) =>
    average(predictions.filter((p) => p.region === region).map((p) => p.predicted_charges))
  );

  renderChart("chart-region", {
    type: "bar",
    data: {
      labels: regionKeys.map((region) => REGION_LABELS[region]),
      datasets: [
        {
          label: "Custo médio previsto",
          data: regionAverages,
          backgroundColor: "#2563eb",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });

  const smokerYes = predictions.filter((p) => p.smoker === "yes").map((p) => p.predicted_charges);
  const smokerNo = predictions.filter((p) => p.smoker === "no").map((p) => p.predicted_charges);

  renderChart("chart-smoker", {
    type: "bar",
    data: {
      labels: ["Não fumante", "Fumante"],
      datasets: [
        {
          label: "Custo médio previsto",
          data: [smokerNo.length ? average(smokerNo) : 0, smokerYes.length ? average(smokerYes) : 0],
          backgroundColor: ["#2563eb", "#dc2626"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });

  const histogram = buildHistogram(charges);
  renderChart("chart-distribution", {
    type: "bar",
    data: {
      labels: histogram.labels,
      datasets: [
        {
          label: "Quantidade de predições",
          data: histogram.counts,
          backgroundColor: "#16a34a",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

function escapeCSVValue(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function buildCSV(predictions) {
  const headers = ["id", "age", "sex", "bmi", "children", "smoker", "region", "predicted_charges", "created_at"];
  const lines = [headers.join(",")];
  for (const p of predictions) {
    lines.push(headers.map((h) => escapeCSVValue(p[h])).join(","));
  }
  return lines.join("\n");
}

function downloadCSV(predictions) {
  const csv = buildCSV(predictions);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `predicoes_seguro_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function loadHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/predictions?limit=1000`);
    if (!response.ok) return;
    lastPredictions = await response.json();
    renderHistory(lastPredictions);
    renderDashboard(lastPredictions);
  } catch (error) {
    console.error("Falha ao carregar predições recentes:", error);
  }
}

exportButton.addEventListener("click", () => {
  if (lastPredictions.length === 0) {
    showResult("Não há predições para exportar ainda.", "error");
    return;
  }
  downloadCSV(lastPredictions);
});

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim() !== "");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });
    return row;
  });
}

function rowToPayload(row, rowNumber) {
  const age = Number(row.age);
  const bmi = Number(row.bmi);
  const children = Number(row.children);
  const sex = row.sex;
  const smoker = row.smoker;
  const region = row.region;

  if (!Number.isFinite(age) || age < 18 || age > 100) {
    throw new Error(`linha ${rowNumber}: idade inválida ("${row.age}")`);
  }
  if (!Number.isFinite(bmi) || bmi <= 0 || bmi > 80) {
    throw new Error(`linha ${rowNumber}: IMC inválido ("${row.bmi}")`);
  }
  if (!Number.isFinite(children) || children < 0 || children > 10) {
    throw new Error(`linha ${rowNumber}: número de filhos inválido ("${row.children}")`);
  }
  if (!VALID_SEX.includes(sex)) {
    throw new Error(`linha ${rowNumber}: sexo inválido ("${row.sex}")`);
  }
  if (!VALID_SMOKER.includes(smoker)) {
    throw new Error(`linha ${rowNumber}: fumante inválido ("${row.smoker}")`);
  }
  if (!VALID_REGION.includes(region)) {
    throw new Error(`linha ${rowNumber}: região inválida ("${row.region}")`);
  }

  return { age, sex, bmi, children, smoker, region };
}

async function predictOne(payload) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail = Array.isArray(data.detail)
      ? data.detail.map((d) => d.msg).join(", ")
      : data.detail || `HTTP ${response.status}`;
    throw new Error(detail);
  }
  return response.json();
}

function showImportStatus(message, type) {
  importStatus.textContent = message;
  importStatus.className = `import-status ${type}`;
}

async function importCSVFile(file) {
  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    showImportStatus("O arquivo CSV está vazio.", "error");
    return;
  }

  const payloads = [];
  const parseErrors = [];
  rows.forEach((row, index) => {
    try {
      payloads.push(rowToPayload(row, index + 2));
    } catch (error) {
      parseErrors.push(error.message);
    }
  });

  let done = 0;
  let failed = 0;
  const total = payloads.length;
  const requestErrors = [];

  importButton.disabled = true;
  showImportStatus(`Importando 0/${total}...`, "");

  let cursor = 0;
  async function worker() {
    while (cursor < payloads.length) {
      const payload = payloads[cursor++];
      try {
        await predictOne(payload);
      } catch (error) {
        failed++;
        requestErrors.push(error.message);
      }
      done++;
      showImportStatus(`Importando ${done}/${total}...`, "");
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(IMPORT_CONCURRENCY, payloads.length) }, worker)
  );

  await loadHistory();

  const succeeded = total - failed;
  const issues = parseErrors.length + failed;
  if (issues === 0) {
    showImportStatus(`${succeeded} predições importadas com sucesso.`, "success");
  } else {
    const allErrors = [...parseErrors, ...requestErrors];
    console.warn("Erros na importação do CSV:", allErrors);
    showImportStatus(
      `${succeeded} importadas, ${issues} com erro (veja o console para detalhes).`,
      "error"
    );
  }

  importButton.disabled = false;
}

importButton.addEventListener("click", () => importFileInput.click());

importFileInput.addEventListener("change", async () => {
  const file = importFileInput.files[0];
  importFileInput.value = "";
  if (!file) return;
  await importCSVFile(file);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    age: Number(form.age.value),
    sex: form.sex.value,
    bmi: Number(form.bmi.value),
    children: Number(form.children.value),
    smoker: form.smoker.value,
    region: form.region.value,
  };

  const submitButton = form.querySelector("button[type=submit]");
  submitButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const detail = Array.isArray(data.detail)
        ? data.detail.map((d) => d.msg).join(", ")
        : data.detail || "Erro ao processar a predição.";
      showResult(detail, "error");
      return;
    }

    showResult(
      `Custo estimado do seguro: ${currencyFormatter.format(data.predicted_charges)}`,
      "success"
    );
    await loadHistory();
  } catch (error) {
    showResult("Não foi possível conectar à API. Verifique se o backend está rodando.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

loadHistory();
