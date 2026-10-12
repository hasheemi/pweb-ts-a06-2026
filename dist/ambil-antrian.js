"use strict";
/// <reference path="./shared.ts" />
const takeGrid = document.querySelector(".ambil-grid");
const selectedPriority = new Map();
const resultBox = document.createElement("div");
resultBox.id = "ticket-result";
resultBox.setAttribute("aria-live", "polite");
resultBox.style.cssText =
    "margin-top:18px;padding:16px;border-radius:12px;" +
        "background:#fff;border:1px solid #e5ecef;display:none";
takeGrid.insertAdjacentElement("afterend", resultBox);
function renderTakePage() {
    const tickets = getTickets();
    takeGrid.innerHTML = getTypes()
        .filter(type => type.active)
        .map(type => {
        const waiting = tickets.filter(ticket => ticket.typeId === type.id &&
            ticket.status === "Menunggu").length;
        const priority = selectedPriority.get(type.id) || "Normal";
        return `
        <article class="ambil-card" data-type-id="${type.id}">
          <div class="ambil-card-head">
            <span class="ambil-nama">
              ${escapeText(type.name)}
            </span>
            <span class="badge-code">${type.code}</span>
          </div>

          <button class="btn btn-primary btn-block"
                  type="button"
                  data-action="ambil">
            Ambil Nomor
          </button>

          <details>
            <summary class="ambil-priority-label">
              Prioritas: ${priority} ▼
            </summary>

            <div class="ambil-chips">
              ${[
            "Normal",
            "Lansia",
            "Disabilitas",
            "VIP"
        ].map(value => `
                  <button class="chip ${priority === value ? "is-selected" : ""}"
                          type="button"
                          data-action="prioritas"
                          data-priority="${value}">
                    ${value}
                  </button>
                `).join("")}
            </div>
          </details>

          <p class="ambil-priority-label">
            ${waiting} tiket menunggu
          </p>
        </article>
      `;
    }).join("");
}
takeGrid.addEventListener("click", event => {
    const button = event.target
        .closest("button[data-action]");
    const card = button?.closest(".ambil-card");
    if (!button || !card)
        return;
    const typeId = card.dataset.typeId;
    if (button.dataset.action === "prioritas") {
        selectedPriority.set(typeId, button.dataset.priority);
        renderTakePage();
        const updatedCard = takeGrid.querySelector(`[data-type-id="${typeId}"]`);
        updatedCard?.querySelector("details")?.setAttribute("open", "");
    }
    else if (button.dataset.action === "ambil") {
        try {
            const ticket = issueTicket(typeId, selectedPriority.get(typeId) || "Normal");
            resultBox.style.display = "block";
            resultBox.innerHTML = `
        <p class="layar-empty-sub">Nomor antrian Anda</p>
        <p class="layar-call-number">
          ${formatTicket(ticket)}
        </p>
        <p>
          Prioritas: ${ticket.priority}.
          Silakan menunggu panggilan operator.
        </p>
      `;
            renderTakePage();
        }
        catch (error) {
            resultBox.style.display = "block";
            resultBox.textContent =
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil tiket.";
        }
    }
});
document
    .querySelector("#btn-ambil")
    ?.addEventListener("click", () => {
    takeGrid.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});
document
    .querySelector("#btn-fullscreen")
    ?.addEventListener("click", async () => {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        }
        else {
            await document.exitFullscreen();
        }
    }
    catch {
        alert("Browser tidak mengizinkan mode layar penuh.");
    }
});
renderTakePage();
window.setInterval(renderTakePage, 2500);
window.addEventListener("storage", renderTakePage);
