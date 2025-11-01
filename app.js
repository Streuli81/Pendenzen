// --- einfache lokale Speicherung (localStorage) ---
const KEY = "pendenzen.v1";

const state = {
  items: load(),
  deferredPrompt: null,
};

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(state.items));
  render();
}

// DOM helper
const $ = (sel) => document.querySelector(sel);
const listEl = $("#list");
const countsEl = $("#counts");
const syncStatusEl = $("#syncStatus");

const inputs = {
  title: $("#title"),
  due: $("#due"),
  prio: $("#prio"),
  project: $("#project"),
  notes: $("#notes"),
  tags: $("#tags"),
  estimate: $("#estimate"),
  q: $("#q"),
  fProject: $("#fProject"),
  fStatus: $("#fStatus"),
  fSort: $("#fSort"),
};

$("#add").onclick = () => {
  const title = inputs.title.value.trim();
  if (!title) {
    alert("Titel fehlt");
    return;
  }
  const item = {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
    due: inputs.due.value || null,
    prio: inputs.prio.value,
    project: inputs.project.value.trim() || "",
    notes: inputs.notes.value.trim() || "",
    tags: (inputs.tags.value || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    estimate: Number(inputs.estimate.value || 0),
    status: "offen",
    progress: [], // Neu: Fortschritte
  };
  state.items.unshift(item);
  save();
  clearForm();
};

$("#clearForm").onclick = clearForm;
function clearForm() {
  for (const k of ["title", "due", "project", "notes", "tags", "estimate"])
    inputs[k].value = "";
  inputs.prio.value = "mittel";
  inputs.title.focus();
}

function toggleStatus(id) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  it.status = it.status === "offen" ? "erledigt" : "offen";
  save();
}
function removeItem(id) {
  if (!confirm("Eintrag wirklich löschen?")) return;
  state.items = state.items.filter((x) => x.id !== id);
  save();
}
function editInline(id, field, value) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  it[field] = value;
  save();
}

// ---------------- Fortschritte / Meilensteine ----------------
function addProgress(id, date, note) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  if (!date || !note.trim()) {
    alert("Bitte Datum und Beschreibung angeben.");
    return;
  }
  if (!Array.isArray(it.progress)) it.progress = [];
  it.progress.push({ date, note: note.trim() });
  save();
}

function removeProgress(id, index) {
  const it = state.items.find((x) => x.id === id);
  if (!it || !it.progress) return;
  if (!confirm("Diesen Fortschritt wirklich löschen?")) return;
  it.progress.splice(index, 1);
  save();
}

// ---------------- Filter + Sortierung ----------------
function renderFilters() {
  const projects = [
    ...new Set(state.items.map((i) => i.project).filter(Boolean)),
  ].sort();
  inputs.fProject.innerHTML =
    '<option value="">Alle Projekte</option>' +
    projects.map((p) => `<option>${p}</option>`).join("");
}

function passFilters(it) {
  const q = inputs.q.value.toLowerCase();
  if (q) {
    const hay = [it.title, it.notes, it.tags.join(" "), it.project]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (inputs.fProject.value && it.project !== inputs.fProject.value) return false;
  if (inputs.fStatus.value && it.status !== inputs.fStatus.value) return false;
  return true;
}

function sortItems(a, b) {
  switch (inputs.fSort.value) {
    case "dueAsc":
      return (a.due || "9999") < (b.due || "9999") ? -1 : 1;
    case "prioDesc": {
      const w = { hoch: 3, mittel: 2, tief: 1 };
      return w[b.prio] - w[a.prio] || (a.due || "").localeCompare(b.due || "");
    }
    case "createdDesc":
    default:
      return b.createdAt.localeCompare(a.createdAt);
  }
}

// ---------------- Darstellung ----------------
function render() {
  const items = state.items.filter(passFilters).sort(sortItems);
  countsEl.textContent = `${items.length} von ${state.items.length} Einträgen angezeigt`;
  renderFilters();

  listEl.innerHTML = items
    .map(
      (it) => `
      <div class="item" data-id="${it.id}">
        <div class="item-header ${it.status === "erledigt" ? "status-done" : ""}">
          <span class="item-title">📋 ${escapeHTML(it.title)}</span>
          <span class="item-toggle">▶</span>
        </div>

        <div class="item-details">
          <div class="meta">
            <span>Prio: <b>${it.prio}</b></span>
            ${it.due ? `<span>Fällig: <b>${it.due}</b></span>` : `<span>Fällig: –</span>`}
            ${it.project ? `<span>Projekt: <b>${escapeHTML(it.project)}</b></span>` : ""}
            <span>Status: <b>${it.status}</b></span>
            ${it.estimate ? `<span>⏱ ${it.estimate}h</span>` : ""}
          </div>

          ${it.notes
            ? `<div class="muted" contenteditable="true" data-edit="notes">${escapeHTML(it.notes)}</div>`
            : `<div class="muted" contenteditable="true" data-edit="notes" data-placeholder="Notizen…"></div>`}

          <div class="tags">
            ${(it.tags || [])
              .map((t) => `<span class="tag">#${escapeHTML(t)}</span>`)
              .join("")}
          </div>

          <div class="progress-section">
            <h4>🧩 Fortschritte / Meilensteine</h4>
            <div class="progress-list">
              ${
                (it.progress || []).length
                  ? it.progress
                      .map(
                        (p, i) => `
                <div class="progress-item">
                  <span>📅 ${p.date} – ${escapeHTML(p.note)}</span>
                  <button class="remove-progress" data-pindex="${i}">✖</button>
                </div>`
                      )
                      .join("")
                  : '<p class="muted">Noch keine Fortschritte.</p>'
              }
            </div>
            <div class="progress-form">
              <input type="date" class="progress-date" value="${new Date()
                .toISOString()
                .slice(0, 10)}" />
              <input type="text" class="progress-note" placeholder="Was wurde gemacht?" />
              <button class="add-progress">➕</button>
            </div>
          </div>

          <div class="actions">
            <button data-action="toggle">${
              it.status === "offen" ? "Als erledigt" : "Wieder öffnen"
            }</button>
            <button class="secondary" data-action="delete">Löschen</button>
          </div>
        </div>
      </div>`
    )
  .join("");


  // Inline Edit
  listEl.querySelectorAll("[contenteditable][data-edit]").forEach((el) => {
    el.addEventListener("blur", (e) => {
      const id = el.closest(".item").dataset.id;
      editInline(id, el.dataset.edit, el.textContent.trim());
    });
  });

  // Status wechseln
  listEl.querySelectorAll("button[data-action='toggle']").forEach((btn) => {
    btn.onclick = () => toggleStatus(btn.closest(".item").dataset.id);
  });

  // Löschen
  listEl.querySelectorAll("button[data-action='delete']").forEach((btn) => {
    btn.onclick = () => removeItem(btn.closest(".item").dataset.id);
  });

  // Fortschritt hinzufügen
  listEl.querySelectorAll(".add-progress").forEach((btn) => {
    btn.onclick = () => {
      const itemEl = btn.closest(".item");
      const id = itemEl.dataset.id;
      const date = itemEl.querySelector(".progress-date").value;
      const note = itemEl.querySelector(".progress-note").value;
      addProgress(id, date, note);
    };
  });

  // Fortschritt löschen
  listEl.querySelectorAll(".remove-progress").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.closest(".item").dataset.id;
      const index = parseInt(btn.dataset.pindex);
      removeProgress(id, index);
    };
  });
}

["q", "fProject", "fStatus", "fSort"].forEach((id) => {
  inputs[id].addEventListener("input", render);
});

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}

// --- PWA Install ---
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  state.deferredPrompt = e;
});
document.getElementById("installPWA").onclick = async (e) => {
  e.preventDefault();
  if (state.deferredPrompt) {
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
  } else {
    alert("Auf iPhone: Teilen → Zum Home-Bildschirm.");
  }
};

// Initial render
render();
syncStatusEl.textContent = "Lokal gespeichert";

// Ein-/Ausklappen der Details
listEl.querySelectorAll(".item-header").forEach((header) => {
  header.onclick = () => {
    const parent = header.closest(".item");
    parent.classList.toggle("open");
  };
});

