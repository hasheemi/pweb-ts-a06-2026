/// <reference path="./shared.ts" />

const displayGrid =
  document.querySelector<HTMLElement>(".layar-grid")!;

const updateLabel =
  document.querySelector<HTMLElement>(".topbar-sub");

function renderScreen(): void {
  const tickets = getTickets();

  displayGrid.innerHTML = getTypes()
    .filter(type => type.active)
    .map(type => {
      const called = tickets
        .filter(ticket =>
          ticket.typeId === type.id &&
          ticket.status === "Dipanggil"
        )
        .sort((a, b) =>
          (b.calledAt || 0) - (a.calledAt || 0)
        )[0];

      const waiting = tickets.filter(ticket =>
        ticket.typeId === type.id &&
        ticket.status === "Menunggu"
      ).length;

      return `
        <article class="layar-card" data-type-id="${type.id}">
          <div class="layar-card-head">
            <span class="layar-nama">
              ${escapeText(type.name)}
            </span>
            <span class="badge-code">${type.code}</span>
          </div>

          <div class="layar-body">
            ${
              called
                ? `
                  <p class="layar-called-label">
                    <span class="dot"></span>Dipanggil
                  </p>
                  <p class="layar-call-number">
                    ${formatTicket(called)}
                  </p>
                `
                : `
                  <p class="layar-empty">
                    Belum ada nomor dipanggil
                  </p>
                  <p class="layar-empty-sub">
                    Nomor akan muncul setelah operator memanggil tiket.
                  </p>
                `
            }
          </div>

          <p class="layar-foot">
            ${waiting} tiket menunggu
          </p>
        </article>
      `;
    }).join("");

  if (updateLabel) {
    updateLabel.textContent =
      `Diperbarui ${new Date().toLocaleTimeString("id-ID")}`;
  }
}

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

document
  .querySelector<HTMLButtonElement>("#btn-layar")
  ?.addEventListener("click", () => {
    window.location.href = "layar.html";
  });

renderScreen();

window.setInterval(renderScreen, 2500);

window.addEventListener("storage", renderScreen);