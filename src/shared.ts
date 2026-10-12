type Priority = "Normal" | "Lansia" | "Disabilitas" | "VIP";
type TicketStatus = "Menunggu" | "Dipanggil" | "Selesai" | "Dilewati";

interface QueueType {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

interface QueueTicket {
  id: string;
  typeId: string;
  code: string;
  number: number;
  priority: Priority;
  status: TicketStatus;
  createdAt: number;
  calledAt?: number;
}

interface AuthSession {
  token: string;
  role: string;
  firstName: string;
}

const AUTH_KEY = "pweb_auth";
const TYPES_KEY = "pweb_queue_types";
const TICKETS_KEY = "pweb_tickets";
const COUNTERS_KEY = "pweb_counters";

const PRIORITY_ORDER: Priority[] = [
  "VIP",
  "Disabilitas",
  "Lansia",
  "Normal"
];

function readStore<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession(): AuthSession | null {
  return readStore<AuthSession | null>(AUTH_KEY, null);
}

function requireSession(allowedRoles?: string[]): AuthSession {
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

function logout(): void {
  localStorage.removeItem(AUTH_KEY);
  window.location.replace("login.html");
}

function getTypes(): QueueType[] {
  let types = readStore<QueueType[]>(TYPES_KEY, []);

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

function saveTypes(types: QueueType[]): void {
  writeStore(TYPES_KEY, types);
}

function getTickets(): QueueTicket[] {
  return readStore<QueueTicket[]>(TICKETS_KEY, []);
}

function saveTickets(tickets: QueueTicket[]): void {
  writeStore(TICKETS_KEY, tickets);
}

function formatTicket(ticket: QueueTicket): string {
  return `${ticket.code}-${String(ticket.number).padStart(3, "0")}`;
}

function waitingFor(typeId: string): QueueTicket[] {
  return getTickets()
    .filter(ticket =>
      ticket.typeId === typeId &&
      ticket.status === "Menunggu"
    )
    .sort((a, b) =>
      PRIORITY_ORDER.indexOf(a.priority) -
      PRIORITY_ORDER.indexOf(b.priority) ||
      a.createdAt - b.createdAt ||
      a.number - b.number
    );
}

function calledFor(typeId: string): QueueTicket | undefined {
  return getTickets()
    .filter(ticket =>
      ticket.typeId === typeId &&
      ticket.status === "Dipanggil"
    )
    .sort((a, b) =>
      (b.calledAt || 0) - (a.calledAt || 0)
    )[0];
}

function issueTicket(
  typeId: string,
  priority: Priority
): QueueTicket {
  const type = getTypes().find(
    item => item.id === typeId && item.active
  );

  if (!type) {
    throw new Error(
      "Jenis antrian tidak aktif atau tidak ditemukan."
    );
  }

  const counters = readStore<Record<string, number>>(
    COUNTERS_KEY,
    {}
  );

  const number = (counters[typeId] || 0) + 1;
  counters[typeId] = number;

  writeStore(COUNTERS_KEY, counters);

  const ticket: QueueTicket = {
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

function escapeText(value: string): string {
  return value.replace(/[&<>"']/g, char =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char] || char)
  );
}

function showAlert(
  element: HTMLElement | null,
  message: string,
  error = false
): void {
  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");

  if (error) {
    element.classList.add("alert-error");
  } else {
    element.classList.remove("alert-error");
  }
}

function setUserLabel(session: AuthSession): void {
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

function bindLogoutButton(): void {
  document
    .querySelector<HTMLButtonElement>("#btn-keluar")
    ?.addEventListener("click", logout);
}