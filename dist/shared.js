"use strict";
const AUTH_KEY = "pweb_auth";
const TYPES_KEY = "pweb_queue_types";
const TICKETS_KEY = "pweb_tickets";
const COUNTERS_KEY = "pweb_counters";
const PRIORITY_ORDER = [
    "VIP",
    "Disabilitas",
    "Lansia",
    "Normal"
];
function readStore(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    }
    catch {
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
    const session = getSession();
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
    let types = readStore(TYPES_KEY, []);
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
    return `${ticket.code}-${String(ticket.number).padStart(3, "0")}`;
}
function waitingFor(typeId) {
    return getTickets()
        .filter(ticket => ticket.typeId === typeId &&
        ticket.status === "Menunggu")
        .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) -
        PRIORITY_ORDER.indexOf(b.priority) ||
        a.createdAt - b.createdAt ||
        a.number - b.number);
}
function calledFor(typeId) {
    return getTickets()
        .filter(ticket => ticket.typeId === typeId &&
        ticket.status === "Dipanggil")
        .sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0))[0];
}
function issueTicket(typeId, priority) {
    const type = getTypes().find(item => item.id === typeId && item.active);
    if (!type) {
        throw new Error("Jenis antrian tidak aktif atau tidak ditemukan.");
    }
    const counters = readStore(COUNTERS_KEY, {});
    const number = (counters[typeId] || 0) + 1;
    counters[typeId] = number;
    writeStore(COUNTERS_KEY, counters);
    const ticket = {
        id: `${typeId}-${Date.now()}-${Math.random()
            .toString(36).slice(2, 8)}`,
        typeId,
        code: type.code,
        number,
        priority,
        status: "Menunggu",
        createdAt: Date.now()
    };
    saveTickets([...getTickets(), ticket]);
    return ticket;
}
function escapeText(value) {
    return value.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char] || char));
}
function showAlert(element, message, error = false) {
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
    const header = document.querySelector(".topbar-actions");
    if (!header || header.querySelector(".session-user")) {
        return;
    }
    const span = document.createElement("span");
    span.className = "session-user";
    span.textContent = `${session.firstName} · ${session.role}`;
    span.style.cssText =
        "font-size:12px;color:#667085;margin-right:8px";
    header.prepend(span);
}
function bindLogoutButton() {
    document
        .querySelector("#btn-keluar")
        ?.addEventListener("click", logout);
}
