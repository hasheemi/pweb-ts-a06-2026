/// <reference path="./shared.ts" />

const operatorSession = requireSession(["operator"]);

setUserLabel(operatorSession);
bindLogoutButton();

const operatorGrid =
  document.querySelector<HTMLElement>(".op-grid")!;

function renderOperator(): void {
  operatorGrid.innerHTML = getTypes()
    .filter(type => type.active)
    .map(type => {
      const called = calledFor(type.id);
      const next = waitingFor(type.id)[0];
      const waitingCount = waitingFor(type.id).length;

      return `
        <article class="op-card" data-type-id="${type.id}">
          <div class="op-card-head">
            <span class="op-nama">${escapeText(type.name)}</span>
            <span class="op-menunggu">
              ${waitingCount} menunggu
            </span>
          </div>

          <div class="op-body">
            <div class="op-col">
              <p class="op-col-label">Sedang dipanggil</p>
              <p class="op-number current">
                ${called ? formatTicket(called) : "—"}
              </p>
            </div>

            <div class="op-col op-col-right">
              <p class="op-col-label">Berikutnya</p>
              <p class="op-number next">
                ${next ? formatTicket(next) : "—"}
              </p>
              <p class="op-priority">
                ${next ? `Prioritas ${next.priority}` : "&nbsp;"}
              </p>
            </div>
          </div>

          <p class="op-empty ${next ? "hidden" : ""}">
            Tidak ada tiket menunggu untuk jenis antrian ini.
          </p>

          <div class="op-foot">
            <button class="btn btn-primary btn-block"
                    type="button"
                    data-action="panggil"
                    ${next ? "" : "disabled"}>
              Panggil Berikutnya
            </button>

            <button class="btn btn-outline btn-sm"
                    type="button"
                    data-action="selesai"
                    ${called ? "" : "disabled"}>
              Selesai
            </button>

            ${
              called
                ? `<button class="btn btn-outline-danger btn-sm"
                           type="button"
                           data-action="lewati">
                     Lewati
                   </button>`
                : ""
            }
          </div>
        </article>
      `;
    }).join("");
}

operatorGrid.addEventListener("click", event => {
  const button =
    (event.target as HTMLElement)
      .closest<HTMLButtonElement>("button[data-action]");

  const card = button?.closest<HTMLElement>(".op-card");

  if (!button || !card) return;

  const typeId = card.dataset.typeId!;
  const tickets = getTickets();

  if (button.dataset.action === "panggil") {
    tickets
      .filter(ticket =>
        ticket.typeId === typeId &&
        ticket.status === "Dipanggil"
      )
      .forEach(ticket => {
        ticket.status = "Selesai";
      });

    saveTickets(tickets);

    const latest = getTickets();
    const next = waitingFor(typeId)[0];
    const ticket = latest.find(
      item => item.id === next?.id
    );

    if (ticket) {
      ticket.status = "Dipanggil";
      ticket.calledAt = Date.now();
    }

    saveTickets(latest);
  } else if (button.dataset.action === "selesai") {
    tickets
      .filter(ticket =>
        ticket.typeId === typeId &&
        ticket.status === "Dipanggil"
      )
      .forEach(ticket => {
        ticket.status = "Selesai";
      });

    saveTickets(tickets);
  } else if (button.dataset.action === "lewati") {
    tickets
      .filter(ticket =>
        ticket.typeId === typeId &&
        ticket.status === "Dipanggil"
      )
      .forEach(ticket => {
        ticket.status = "Dilewati";
      });

    saveTickets(tickets);
  }

  renderOperator();
});

window.addEventListener("storage", renderOperator);

renderOperator();