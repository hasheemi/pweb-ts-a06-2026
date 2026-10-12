/// <reference path="./shared.ts" />
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var adminSession = requireSession(["admin"]);
setUserLabel(adminSession);
bindLogoutButton();
var typeList = document.querySelector("#jenis-list");
var codeInput = document.querySelector("#jenis-kode");
var nameInput = document.querySelector("#jenis-nama");
var addTypeButton = document.querySelector("#jenis-tambah");
var ticketSelect = document.querySelector("#terbit-jenis");
var prioritySelect = document.querySelector("#terbit-prioritas");
var ticketContainer = document.querySelector(".dash-grid .card:nth-child(2)");
function renderTypes() {
    var types = getTypes();
    var tickets = getTickets();
    typeList.innerHTML = types.map(function (type) {
        var waiting = tickets.filter(function (ticket) {
            return ticket.typeId === type.id &&
                ticket.status === "Menunggu";
        }).length;
        return "\n      <li class=\"jenis-item ".concat(type.active ? "" : "is-inactive", "\"\n          data-id=\"").concat(type.id, "\">\n        <div class=\"jenis-info\">\n          <span class=\"jenis-nama\">\n            ").concat(escapeText(type.name), "\n          </span>\n          <span class=\"jenis-sub\">\n            Kode ").concat(type.code, " \u00B7\n            ").concat(type.active ? "".concat(waiting, " menunggu") : "nonaktif", "\n          </span>\n        </div>\n\n        <div class=\"jenis-actions\">\n          <button class=\"btn btn-outline-primary btn-sm\"\n                  type=\"button\"\n                  data-action=\"toggle\">\n            ").concat(type.active ? "Nonaktifkan" : "Aktifkan", "\n          </button>\n\n          <button class=\"btn btn-outline-danger btn-sm\"\n                  type=\"button\"\n                  data-action=\"hapus\">\n            Hapus\n          </button>\n        </div>\n      </li>\n    ");
    }).join("");
    var activeTypes = types.filter(function (type) { return type.active; });
    ticketSelect.innerHTML =
        "<option value=\"\">Pilih jenis antrian</option>" +
            activeTypes.map(function (type) {
                return "<option value=\"".concat(type.id, "\">\n        ").concat(escapeText(type.name), "\n      </option>");
            }).join("");
}
function renderTickets() {
    var types = getTypes();
    var tickets = __spreadArray([], getTickets(), true).sort(function (a, b) { return b.createdAt - a.createdAt; });
    ticketContainer
        .querySelectorAll(".ticket-group")
        .forEach(function (group) { return group.remove(); });
    var list = document.createElement("div");
    list.id = "admin-ticket-list";
    list.innerHTML = types.map(function (type) {
        var typeTickets = tickets.filter(function (ticket) { return ticket.typeId === type.id; });
        return "\n      <div class=\"ticket-group\">\n        <h3 class=\"ticket-group-title\">\n          ".concat(escapeText(type.name), "\n        </h3>\n\n        ").concat(typeTickets.length
            ? typeTickets.map(function (ticket) { return "\n              <article class=\"ticket-row\"\n                       data-ticket-id=\"".concat(ticket.id, "\">\n                <span class=\"ticket-code\">\n                  ").concat(formatTicket(ticket), "\n                </span>\n\n                <span class=\"ticket-meta\">\n                  ").concat(ticket.priority, " \u00B7 ").concat(ticket.status, "\n                </span>\n\n                <span class=\"ticket-actions\">\n                  ").concat(ticket.status === "Menunggu"
                ? "\n                        <button class=\"btn btn-outline-primary btn-sm\"\n                                type=\"button\"\n                                data-action=\"panggil\">\n                          Panggil\n                        </button>\n                        <button class=\"btn btn-outline-danger btn-sm\"\n                                type=\"button\"\n                                data-action=\"lewati\">\n                          Lewati\n                        </button>\n                      "
                : ticket.status === "Dipanggil"
                    ? "\n                          <button class=\"btn btn-outline-primary btn-sm\"\n                                  type=\"button\"\n                                  data-action=\"selesai\">\n                            Selesai\n                          </button>\n                          <button class=\"btn btn-outline-danger btn-sm\"\n                                  type=\"button\"\n                                  data-action=\"lewati\">\n                            Lewati\n                          </button>\n                        "
                    : "<span class=\"badge-success\">\n                            ".concat(ticket.status, "\n                          </span>"), "\n                </span>\n              </article>\n            "); }).join("")
            : "<p class=\"jenis-sub\">Belum ada tiket.</p>", "\n      </div>\n    ");
    }).join("");
    ticketContainer.appendChild(list);
}
function refreshAdmin() {
    renderTypes();
    renderTickets();
}
function setTicketStatus(ticketId, status) {
    var tickets = getTickets();
    var ticket = tickets.find(function (item) { return item.id === ticketId; });
    if (!ticket)
        return;
    ticket.status = status;
    if (status === "Dipanggil") {
        ticket.calledAt = Date.now();
    }
    saveTickets(tickets);
    refreshAdmin();
}
function callNext(typeId) {
    var tickets = getTickets();
    tickets
        .filter(function (ticket) {
        return ticket.typeId === typeId &&
            ticket.status === "Dipanggil";
    })
        .forEach(function (ticket) {
        ticket.status = "Selesai";
    });
    saveTickets(tickets);
    var next = waitingFor(typeId)[0];
    if (!next) {
        refreshAdmin();
        return;
    }
    var latest = getTickets();
    var target = latest.find(function (item) { return item.id === next.id; });
    if (target) {
        target.status = "Dipanggil";
        target.calledAt = Date.now();
    }
    saveTickets(latest);
    refreshAdmin();
}
addTypeButton.addEventListener("click", function () {
    var code = codeInput.value.trim().toUpperCase();
    var name = nameInput.value.trim();
    if (!/^[A-Z]$/.test(code)) {
        alert("Kode harus tepat satu huruf kapital.");
        return;
    }
    if (!name) {
        alert("Nama layanan wajib diisi.");
        return;
    }
    var types = getTypes();
    if (types.some(function (type) {
        return type.code.toLowerCase() === code.toLowerCase() ||
            type.name.toLowerCase() === name.toLowerCase();
    })) {
        alert("Kode atau nama layanan sudah digunakan.");
        return;
    }
    types.push({
        id: "jenis-".concat(Date.now()),
        code: code,
        name: name,
        active: true
    });
    saveTypes(types);
    codeInput.value = "";
    nameInput.value = "";
    refreshAdmin();
});
typeList.addEventListener("click", function (event) {
    var button = event.target
        .closest("button[data-action]");
    var item = button === null || button === void 0 ? void 0 : button.closest(".jenis-item");
    if (!button || !item)
        return;
    var types = getTypes();
    var type = types.find(function (entry) { return entry.id === item.dataset.id; });
    if (!type)
        return;
    if (button.dataset.action === "toggle") {
        type.active = !type.active;
    }
    if (button.dataset.action === "hapus") {
        if (!confirm("Hapus jenis antrian ".concat(type.name, "?"))) {
            return;
        }
        saveTypes(types.filter(function (entry) { return entry.id !== type.id; }));
        refreshAdmin();
        return;
    }
    saveTypes(types);
    refreshAdmin();
});
document
    .querySelector("#terbit-submit")
    .addEventListener("click", function () {
    if (!ticketSelect.value) {
        alert("Pilih jenis antrian yang aktif.");
        return;
    }
    try {
        var ticket = issueTicket(ticketSelect.value, prioritySelect.value);
        alert("Tiket ".concat(formatTicket(ticket), " berhasil diterbitkan."));
        refreshAdmin();
    }
    catch (error) {
        alert(error instanceof Error
            ? error.message
            : "Gagal menerbitkan tiket.");
    }
});
ticketContainer.addEventListener("click", function (event) {
    var button = event.target
        .closest("button[data-action]");
    var row = button === null || button === void 0 ? void 0 : button.closest("[data-ticket-id]");
    if (!button || !row)
        return;
    var ticket = getTickets().find(function (item) { return item.id === row.dataset.ticketId; });
    if (!ticket)
        return;
    if (button.dataset.action === "panggil") {
        callNext(ticket.typeId);
    }
    else if (button.dataset.action === "selesai") {
        setTicketStatus(ticket.id, "Selesai");
    }
    else if (button.dataset.action === "lewati") {
        setTicketStatus(ticket.id, "Dilewati");
    }
});
document
    .querySelector("#btn-reset-antrian")
    .addEventListener("click", function () {
    if (!confirm("Reset semua tiket dan penomoran antrian?")) {
        return;
    }
    saveTickets([]);
    writeStore(COUNTERS_KEY, {});
    refreshAdmin();
});
window.addEventListener("storage", refreshAdmin);
refreshAdmin();
