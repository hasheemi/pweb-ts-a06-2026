/// <reference path="./shared.ts" />

const adminSession = requireSession(["admin", "moderator"]);

setUserLabel(adminSession);
bindLogoutButton();

const typeList =
  document.querySelector<HTMLUListElement>("#jenis-list")!;

const codeInput =
  document.querySelector<HTMLInputElement>("#jenis-kode")!;

const nameInput =
  document.querySelector<HTMLInputElement>("#jenis-nama")!;

const addTypeButton =
  document.querySelector<HTMLButtonElement>("#jenis-tambah")!;

const ticketSelect =
  document.querySelector<HTMLSelectElement>("#terbit-jenis")!;

const prioritySelect =
  document.querySelector<HTMLSelectElement>(
    "#terbit-prioritas"
  )!;

const ticketContainer =
  document.querySelector<HTMLElement>(
    ".dash-grid .card:nth-child(2)"
  )!;

function renderTypes(): void {
  const types = getTypes();
  const tickets = getTickets();

  typeList.innerHTML = types.map(type => {
    const waiting = tickets.filter(ticket =>
      ticket.typeId === type.id &&
      ticket.status === "Menunggu"
    ).length;

    return `
      <li class="jenis-item ${type.active ? "" : "is-inactive"}"
          data-id="${type.id}">
        <div class="jenis-info">
          <span class="jenis-nama">
            ${escapeText(type.name)}
          </span>
          <span class="jenis-sub">
            Kode ${type.code} ·
            ${type.active ? `${waiting} menunggu` : "nonaktif"}
          </span>
        </div>

        <div class="jenis-actions">
          <button class="btn btn-outline-primary btn-sm"
                  type="button"
                  data-action="toggle">
            ${type.active ? "Nonaktifkan" : "Aktifkan"}
          </button>

          <button class="btn btn-outline-danger btn-sm"
                  type="button"
                  data-action="hapus">
            Hapus
          </button>
        </div>
      </li>
    `;
  }).join("");

  const activeTypes = types.filter(type => type.active);

  ticketSelect.innerHTML =
    `<option value="">Pilih jenis antrian</option>` +
    activeTypes.map(type =>
      `<option value="${type.id}">
        ${escapeText(type.name)}
      </option>`
    ).join("");
}

function renderTickets(): void {
  const types = getTypes();

  const tickets = [...getTickets()].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  ticketContainer
    .querySelectorAll<HTMLElement>(".ticket-group")
    .forEach(group => group.remove());

  const list = document.createElement("div");
  list.id = "admin-ticket-list";

  list.innerHTML = types.map(type => {
    const typeTickets = tickets.filter(
      ticket => ticket.typeId === type.id
    );

    return `
      <div class="ticket-group">
        <h3 class="ticket-group-title">
          ${escapeText(type.name)}
        </h3>

        ${
          typeTickets.length
            ? typeTickets.map(ticket => `
              <article class="ticket-row"
                       data-ticket-id="${ticket.id}">
                <span class="ticket-code">
                  ${formatTicket(ticket)}
                </span>

                <span class="ticket-meta">
                  ${ticket.priority} · ${ticket.status}
                </span>

                <span class="ticket-actions">
                  ${
                    ticket.status === "Menunggu"
                      ? `
                        <button class="btn btn-outline-primary btn-sm"
                                type="button"
                                data-action="panggil">
                          Panggil
                        </button>
                        <button class="btn btn-outline-danger btn-sm"
                                type="button"
                                data-action="lewati">
                          Lewati
                        </button>
                      `
                      : ticket.status === "Dipanggil"
                        ? `
                          <button class="btn btn-outline-primary btn-sm"
                                  type="button"
                                  data-action="selesai">
                            Selesai
                          </button>
                          <button class="btn btn-outline-danger btn-sm"
                                  type="button"
                                  data-action="lewati">
                            Lewati
                          </button>
                        `
                        : `<span class="badge-success">
                            ${ticket.status}
                          </span>`
                  }
                </span>
              </article>
            `).join("")
            : `<p class="jenis-sub">Belum ada tiket.</p>`
        }
      </div>
    `;
  }).join("");

  ticketContainer.appendChild(list);
}

function refreshAdmin(): void {
  renderTypes();
  renderTickets();
}

function setTicketStatus(
  ticketId: string,
  status: TicketStatus
): void {
  const tickets = getTickets();
  const ticket = tickets.find(item => item.id === ticketId);

  if (!ticket) return;

  ticket.status = status;

  if (status === "Dipanggil") {
    ticket.calledAt = Date.now();
  }

  saveTickets(tickets);
  refreshAdmin();
}

function callNext(typeId: string): void {
  const tickets = getTickets();

  tickets
    .filter(ticket =>
      ticket.typeId === typeId &&
      ticket.status === "Dipanggil"
    )
    .forEach(ticket => {
      ticket.status = "Selesai";
    });

  saveTickets(tickets);

  const next = waitingFor(typeId)[0];

  if (!next) {
    refreshAdmin();
    return;
  }

  const latest = getTickets();
  const target = latest.find(item => item.id === next.id);

  if (target) {
    target.status = "Dipanggil";
    target.calledAt = Date.now();
  }

  saveTickets(latest);
  refreshAdmin();
}

addTypeButton.addEventListener("click", () => {
  const code = codeInput.value.trim().toUpperCase();
  const name = nameInput.value.trim();

  if (!/^[A-Z]$/.test(code)) {
    alert("Kode harus tepat satu huruf kapital.");
    return;
  }

  if (!name) {
    alert("Nama layanan wajib diisi.");
    return;
  }

  const types = getTypes();

  if (types.some(type =>
    type.code.toLowerCase() === code.toLowerCase() ||
    type.name.toLowerCase() === name.toLowerCase()
  )) {
    alert("Kode atau nama layanan sudah digunakan.");
    return;
  }

  types.push({
    id: `jenis-${Date.now()}`,
    code,
    name,
    active: true
  });

  saveTypes(types);

  codeInput.value = "";
  nameInput.value = "";

  refreshAdmin();
});

typeList.addEventListener("click", event => {
  const button =
    (event.target as HTMLElement)
      .closest<HTMLButtonElement>("button[data-action]");

  const item = button?.closest<HTMLElement>(".jenis-item");

  if (!button || !item) return;

  const types = getTypes();
  const type = types.find(
    entry => entry.id === item.dataset.id
  );

  if (!type) return;

  if (button.dataset.action === "toggle") {
    type.active = !type.active;
  }

  if (button.dataset.action === "hapus") {
    if (!confirm(`Hapus jenis antrian ${type.name}?`)) {
      return;
    }

    saveTypes(
      types.filter(entry => entry.id !== type.id)
    );

    refreshAdmin();
    return;
  }

  saveTypes(types);
  refreshAdmin();
});

document
  .querySelector<HTMLButtonElement>("#terbit-submit")!
  .addEventListener("click", () => {
    if (!ticketSelect.value) {
      alert("Pilih jenis antrian yang aktif.");
      return;
    }

    try {
      const ticket = issueTicket(
        ticketSelect.value,
        prioritySelect.value as Priority
      );

      alert(
        `Tiket ${formatTicket(ticket)} berhasil diterbitkan.`
      );

      refreshAdmin();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Gagal menerbitkan tiket."
      );
    }
  });

ticketContainer.addEventListener("click", event => {
  const button =
    (event.target as HTMLElement)
      .closest<HTMLButtonElement>("button[data-action]");

  const row = button?.closest<HTMLElement>(
    "[data-ticket-id]"
  );

  if (!button || !row) return;

  const ticket = getTickets().find(
    item => item.id === row.dataset.ticketId
  );

  if (!ticket) return;

  if (button.dataset.action === "panggil") {
    callNext(ticket.typeId);
  } else if (button.dataset.action === "selesai") {
    setTicketStatus(ticket.id, "Selesai");
  } else if (button.dataset.action === "lewati") {
    setTicketStatus(ticket.id, "Dilewati");
  }
});

document
  .querySelector<HTMLButtonElement>("#btn-reset-antrian")!
  .addEventListener("click", () => {
    if (!confirm("Reset semua tiket dan penomoran antrian?")) {
      return;
    }

    saveTickets([]);
    writeStore(COUNTERS_KEY, {});
    refreshAdmin();
  });

window.addEventListener("storage", refreshAdmin);

refreshAdmin();