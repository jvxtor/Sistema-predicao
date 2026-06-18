const form = document.getElementById("predict-form");
const resultBox = document.getElementById("result");
const historyBody = document.getElementById("history-body");

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "USD",
});

function showResult(message, type) {
  resultBox.textContent = message;
  resultBox.className = `result ${type}`;
}

function renderHistory(predictions) {
  historyBody.innerHTML = "";
  for (const p of predictions) {
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

async function loadHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/predictions?limit=20`);
    if (!response.ok) return;
    const predictions = await response.json();
    renderHistory(predictions.reverse());
  } catch (error) {
    console.error("Falha ao carregar predições recentes:", error);
  }
}

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
