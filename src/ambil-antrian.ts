/// <reference path="./shared.ts" />

// Halaman ini hanya untuk pasien/user biasa yang sudah login.
// Operator yang mencoba masuk akan ditolak dan diarahkan ke login.
const session = requireSession(["user"]);

setUserLabel(session);
bindLogoutButton();

const takeGrid =
  document.querySelector<HTMLElement>(".ambil-grid")!;

const pageFoot =
  document.querySelector<HTMLElement>(".page-foot");

const selectedPriority = new Map<string, Priority>();
const LAST_TICKET_KEY = "pweb_last_ticket_id";
let monitoredTicketId = localStorage.getItem(LAST_TICKET_KEY);

const resultBox = document.createElement("div");

resultBox.id = "ticket-result";
resultBox.setAttribute("aria-live", "polite");
resultBox.style.cssText =
  "margin-top:18px;padding:16px;border-radius:12px;" +
  "background:#fff;border:1px solid #e5ecef;display:none";

takeGrid.insertAdjacentElement("afterend", resultBox);

function renderTicketResult(ticket: QueueTicket): void {
  resultBox.style.display = "block";

  resultBox.innerHTML = `
    <p id="ticket-called-label"
       class="layar-called-label ${
         ticket.status === "Dipanggil" ? "" : "hidden"
       }">
      <span class="dot"></span>Dipanggil
    </p>
    <p class="layar-empty-sub">Nomor antrean Anda</p>
    <p class="layar-call-number">${formatTicket(ticket)}</p>
    <p class="ambil-priority-label">
      Prioritas: ${escapeText(ticket.priority)}
    </p>
    <p id="ticket-status-message" aria-live="polite"></p>
  `;

  updateTicketStatusMessage();
}

function updateTicketStatusMessage(): void {
  if (!monitoredTicketId) return;

  const ticket = getTickets().find(
    item => item.id === monitoredTicketId
  );

  if (!ticket) return;

  const statusMessage =
    resultBox.querySelector<HTMLElement>("#ticket-status-message");

  if (!statusMessage) return;

  const calledLabel =
    resultBox.querySelector<HTMLElement>("#ticket-called-label");

  statusMessage.classList.remove(
    "alert",
    "alert-error",
    "text-success",
    "muted"
  );
  statusMessage.style.fontWeight = "";

  calledLabel?.classList.toggle(
    "hidden",
    ticket.status !== "Dipanggil"
  );

  if (ticket.status === "Dipanggil") {
    statusMessage.textContent =
      "Nomor antrean Anda telah dipanggil. Silakan menuju loket.";
    statusMessage.classList.add("text-success");
    statusMessage.style.fontWeight = "700";
  } else if (ticket.status === "Selesai") {
    statusMessage.textContent =
      "Pelayanan untuk nomor antrean Anda telah selesai.";
    statusMessage.classList.add("muted");
  } else if (ticket.status === "Dilewati") {
    statusMessage.textContent =
      "Nomor antrean Anda dilewati. Silakan hubungi petugas.";
    statusMessage.classList.add("alert", "alert-error");
    statusMessage.style.fontWeight = "600";
  } else {
    statusMessage.textContent =
      "Status: menunggu panggilan operator.";
    statusMessage.classList.add("muted");
  }
}

let lastGridSignature = "";

function gridSignature(): string {
  const tickets = getTickets();

  return getTypes()
    .filter(type => type.active)
    .map(type => {
      const waiting = tickets.filter(ticket =>
        ticket.typeId === type.id &&
        ticket.status === "Menunggu"
      ).length;

      const priority =
        selectedPriority.get(type.id) || "Normal";

      return `${type.id}:${waiting}:${priority}`;
    })
    .join("|");
}

function renderTakePage(): void {
  const tickets = getTickets();

  lastGridSignature = gridSignature();

  takeGrid.innerHTML = getTypes()
    .filter(type => type.active)
    .map(type => {
      const waiting = tickets.filter(ticket =>
        ticket.typeId === type.id &&
        ticket.status === "Menunggu"
      ).length;

      const priority =
        selectedPriority.get(type.id) || "Normal";

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
              ${
                ([
                  "Normal",
                  "Lansia",
                  "Disabilitas",
                  "VIP"
                ] as Priority[]).map(value => `
                  <button class="chip ${
                    priority === value ? "is-selected" : ""
                  }"
                          type="button"
                          data-action="prioritas"
                          data-priority="${value}">
                    ${value}
                  </button>
                `).join("")
              }
            </div>
          </details>

          <p class="ambil-priority-label">
            ${waiting} tiket menunggu
          </p>
        </article>
      `;
    }).join("");
}

function renderTakePageIfChanged(): void {
  if (gridSignature() === lastGridSignature) return;

  renderTakePage();
}

function updateClock(): void {
  if (!pageFoot) return;

  pageFoot.textContent =
    "Jenis antrian baru muncul otomatis. Data " +
    new Date().toLocaleTimeString("id-ID");
}

takeGrid.addEventListener("click", event => {
  const button =
    (event.target as HTMLElement)
      .closest<HTMLButtonElement>("button[data-action]");

  const card = button?.closest<HTMLElement>(".ambil-card");

  if (!button || !card) return;

  const typeId = card.dataset.typeId!;

  if (button.dataset.action === "prioritas") {
    selectedPriority.set(
      typeId,
      button.dataset.priority as Priority
    );

    renderTakePage();

    const updatedCard =
      takeGrid.querySelector<HTMLElement>(
        `[data-type-id="${typeId}"]`
      );

    updatedCard?.querySelector("details")?.setAttribute(
      "open",
      ""
    );
  } else if (button.dataset.action === "ambil") {
    try {
      const ticket = issueTicket(
        typeId,
        selectedPriority.get(typeId) || "Normal"
      );

      monitoredTicketId = ticket.id;
      localStorage.setItem(LAST_TICKET_KEY, ticket.id);

      renderTicketResult(ticket);
      renderTakePage();
    } catch (error) {
      resultBox.style.display = "block";

      resultBox.textContent =
        error instanceof Error
          ? error.message
          : "Gagal mengambil tiket.";
    }
  }
});

document
  .querySelector<HTMLButtonElement>("#btn-ambil")
  ?.addEventListener("click", () => {
    takeGrid.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

document
  .querySelector<HTMLButtonElement>("#btn-fullscreen")
  ?.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      alert("Browser tidak mengizinkan mode layar penuh.");
    }
  });

renderTakePage();
updateClock();

// Pulihkan tiket terakhir jika pasien memuat ulang halaman.
if (monitoredTicketId) {
  const previousTicket = getTickets().find(
    item => item.id === monitoredTicketId
  );

  if (previousTicket) {
    renderTicketResult(previousTicket);
  }
}

// Realtime: pantau perubahan status tiket dari panel operator.
window.setInterval(() => {
  renderTakePageIfChanged();
  updateTicketStatusMessage();
  updateClock();
}, 1000);

window.addEventListener("storage", () => {
  renderTakePageIfChanged();
  updateTicketStatusMessage();
  updateClock();
});
