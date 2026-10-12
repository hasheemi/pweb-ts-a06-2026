/// <reference path="./shared.ts" />
var operatorSession = requireSession(["admin", "user"]);
setUserLabel(operatorSession);
bindLogoutButton();
var operatorGrid = document.querySelector(".op-grid");
function renderOperator() {
    operatorGrid.innerHTML = getTypes()
        .filter(function (type) { return type.active; })
        .map(function (type) {
        var called = calledFor(type.id);
        var next = waitingFor(type.id)[0];
        var waitingCount = waitingFor(type.id).length;
        return "\n        <article class=\"op-card\" data-type-id=\"".concat(type.id, "\">\n          <div class=\"op-card-head\">\n            <span class=\"op-nama\">").concat(escapeText(type.name), "</span>\n            <span class=\"op-menunggu\">\n              ").concat(waitingCount, " menunggu\n            </span>\n          </div>\n\n          <div class=\"op-body\">\n            <div class=\"op-col\">\n              <p class=\"op-col-label\">Sedang dipanggil</p>\n              <p class=\"op-number current\">\n                ").concat(called ? formatTicket(called) : "—", "\n              </p>\n            </div>\n\n            <div class=\"op-col op-col-right\">\n              <p class=\"op-col-label\">Berikutnya</p>\n              <p class=\"op-number next\">\n                ").concat(next ? formatTicket(next) : "—", "\n              </p>\n              <p class=\"op-priority\">\n                ").concat(next ? "Prioritas ".concat(next.priority) : "&nbsp;", "\n              </p>\n            </div>\n          </div>\n\n          <p class=\"op-empty ").concat(next ? "hidden" : "", "\">\n            Tidak ada tiket menunggu untuk jenis antrian ini.\n          </p>\n\n          <div class=\"op-foot\">\n            <button class=\"btn btn-primary btn-block\"\n                    type=\"button\"\n                    data-action=\"panggil\"\n                    ").concat(next ? "" : "disabled", ">\n              Panggil Berikutnya\n            </button>\n\n            <button class=\"btn btn-outline btn-sm\"\n                    type=\"button\"\n                    data-action=\"selesai\"\n                    ").concat(called ? "" : "disabled", ">\n              Selesai\n            </button>\n\n            ").concat(called
            ? "<button class=\"btn btn-outline-danger btn-sm\"\n                           type=\"button\"\n                           data-action=\"lewati\">\n                     Lewati\n                   </button>"
            : "", "\n          </div>\n        </article>\n      ");
    }).join("");
}
operatorGrid.addEventListener("click", function (event) {
    var button = event.target
        .closest("button[data-action]");
    var card = button === null || button === void 0 ? void 0 : button.closest(".op-card");
    if (!button || !card)
        return;
    var typeId = card.dataset.typeId;
    var tickets = getTickets();
    if (button.dataset.action === "panggil") {
        tickets
            .filter(function (ticket) {
            return ticket.typeId === typeId &&
                ticket.status === "Dipanggil";
        })
            .forEach(function (ticket) {
            ticket.status = "Selesai";
        });
        saveTickets(tickets);
        var latest = getTickets();
        var next_1 = waitingFor(typeId)[0];
        var ticket = latest.find(function (item) { return item.id === (next_1 === null || next_1 === void 0 ? void 0 : next_1.id); });
        if (ticket) {
            ticket.status = "Dipanggil";
            ticket.calledAt = Date.now();
        }
        saveTickets(latest);
    }
    else if (button.dataset.action === "selesai") {
        tickets
            .filter(function (ticket) {
            return ticket.typeId === typeId &&
                ticket.status === "Dipanggil";
        })
            .forEach(function (ticket) {
            ticket.status = "Selesai";
        });
        saveTickets(tickets);
    }
    else if (button.dataset.action === "lewati") {
        tickets
            .filter(function (ticket) {
            return ticket.typeId === typeId &&
                ticket.status === "Dipanggil";
        })
            .forEach(function (ticket) {
            ticket.status = "Dilewati";
        });
        saveTickets(tickets);
    }
    renderOperator();
});
window.addEventListener("storage", renderOperator);
renderOperator();
