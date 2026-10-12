var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var AUTH_KEY = "pweb_auth";
var TYPES_KEY = "pweb_queue_types";
var TICKETS_KEY = "pweb_tickets";
var COUNTERS_KEY = "pweb_counters";
var PRIORITY_ORDER = [
    "VIP",
    "Disabilitas",
    "Lansia",
    "Normal"
];
function readStore(key, fallback) {
    try {
        var value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    }
    catch (_a) {
        return fallback;
    }
}
function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function getSession() {
    return readStore(AUTH_KEY, null);
}
function requireSession(allowedRoles) {
    var session = getSession();
    if (!session) {
        window.location.replace("login.html");
        throw new Error("Sesi login tidak ditemukan.");
    }
    if (allowedRoles && !allowedRoles.includes(session.role)) {
        window.location.replace("login.html");
        throw new Error("Role tidak memiliki akses.");
    }
    return session;
}
function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.replace("login.html");
}
function getTypes() {
    var types = readStore(TYPES_KEY, []);
    if (!types.length) {
        types = [
            { id: "umum-1", code: "A", name: "UMUM-1", active: true },
            { id: "umum-2", code: "B", name: "UMUM-2", active: true },
            { id: "umum-3", code: "C", name: "UMUM-3", active: true },
            { id: "gigi", code: "G", name: "GIGI", active: true },
            { id: "farmasi", code: "F", name: "FARMASI", active: true },
            { id: "psikolog", code: "P", name: "PSIKOLOG", active: true }
        ];
        writeStore(TYPES_KEY, types);
    }
    return types;
}
function saveTypes(types) {
    writeStore(TYPES_KEY, types);
}
function getTickets() {
    return readStore(TICKETS_KEY, []);
}
function saveTickets(tickets) {
    writeStore(TICKETS_KEY, tickets);
}
function formatTicket(ticket) {
    return "".concat(ticket.code, "-").concat(String(ticket.number).padStart(3, "0"));
}
function waitingFor(typeId) {
    return getTickets()
        .filter(function (ticket) {
        return ticket.typeId === typeId &&
            ticket.status === "Menunggu";
    })
        .sort(function (a, b) {
        return PRIORITY_ORDER.indexOf(a.priority) -
            PRIORITY_ORDER.indexOf(b.priority) ||
            a.createdAt - b.createdAt ||
            a.number - b.number;
    });
}
function calledFor(typeId) {
    return getTickets()
        .filter(function (ticket) {
        return ticket.typeId === typeId &&
            ticket.status === "Dipanggil";
    })
        .sort(function (a, b) {
        return (b.calledAt || 0) - (a.calledAt || 0);
    })[0];
}
function issueTicket(typeId, priority) {
    var type = getTypes().find(function (item) { return item.id === typeId && item.active; });
    if (!type) {
        throw new Error("Jenis antrian tidak aktif atau tidak ditemukan.");
    }
    var counters = readStore(COUNTERS_KEY, {});
    var number = (counters[typeId] || 0) + 1;
    counters[typeId] = number;
    writeStore(COUNTERS_KEY, counters);
    var ticket = {
        id: "".concat(typeId, "-").concat(Date.now(), "-").concat(Math.random()
            .toString(36).slice(2, 8)),
        typeId: typeId,
        code: type.code,
        number: number,
        priority: priority,
        status: "Menunggu",
        createdAt: Date.now()
    };
    saveTickets(__spreadArray(__spreadArray([], getTickets(), true), [ticket], false));
    return ticket;
}
function escapeText(value) {
    return value.replace(/[&<>"']/g, function (char) {
        return ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char] || char);
    });
}
function showAlert(element, message, error) {
    if (error === void 0) { error = false; }
    if (!element)
        return;
    element.textContent = message;
    element.classList.remove("hidden");
    if (error) {
        element.classList.add("alert-error");
    }
    else {
        element.classList.remove("alert-error");
    }
}
function setUserLabel(session) {
    var header = document.querySelector(".topbar-actions");
    if (!header || header.querySelector(".session-user")) {
        return;
    }
    var span = document.createElement("span");
    span.className = "session-user";
    span.textContent = "".concat(session.firstName, " \u00B7 ").concat(session.role);
    span.style.cssText =
        "font-size:12px;color:#667085;margin-right:8px";
    header.prepend(span);
}
function bindLogoutButton() {
    var _a;
    (_a = document
        .querySelector("#btn-keluar")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", logout);
}
