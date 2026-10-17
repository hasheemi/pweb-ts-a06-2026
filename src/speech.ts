/// <reference path="./shared.ts" />

(() => {
  const TICKETS_KEY = "pweb_tickets";
  const TYPES_KEY = "pweb_queue_types";
  const MUTE_KEY = "pweb_speech_muted";
  const POLL_MS = 1000;

  let initialized = false;
  let lastKey = "";
  let lastTicket: QueueTicket | null = null;
  let muted = localStorage.getItem(MUTE_KEY) === "1";

  let statusEl: HTMLElement | null = null;
  let bodyEl: HTMLElement | null = null;
  let toggleButton: HTMLButtonElement | null = null;
  let replayButton: HTMLButtonElement | null = null;

  function readJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  function getTicketList(): QueueTicket[] {
    const list = readJson<QueueTicket[]>(TICKETS_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function getTypeName(typeId: string): string {
    const types = readJson<QueueType[]>(TYPES_KEY, []);
    const found = Array.isArray(types)
      ? types.find(type => type.id === typeId)
      : undefined;

    return found ? found.name : "layanan";
  }

  function latestCalled(list: QueueTicket[]): QueueTicket | null {
    const called = list.filter(
      ticket => ticket.status === "Dipanggil" && ticket.calledAt
    );

    if (!called.length) return null;

    return called.sort(
      (a, b) => (b.calledAt || 0) - (a.calledAt || 0)
    )[0];
  }

  function keyOf(ticket: QueueTicket): string {
    return `${ticket.id}:${ticket.calledAt || 0}`;
  }

  function ticketLabel(ticket: QueueTicket): string {
    return `${ticket.code}-${String(ticket.number).padStart(3, "0")}`;
  }

  function setStatus(message: string): void {
    if (statusEl) statusEl.textContent = message;
  }

  function pickVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();

    return (
      voices.find(
        voice => voice.lang.toLowerCase() === "id-id"
      ) ||
      voices.find(
        voice => voice.lang.toLowerCase().indexOf("id") === 0
      ) ||
      voices.find(
        voice => /indonesia/i.test(voice.name)
      ) ||
      null
    );
  }

  function speak(text: string, onEnd?: () => void): void {
    if (!("speechSynthesis" in window)) {
      setStatus("Browser tidak mendukung suara.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();

    if (voice) utterance.voice = voice;

    utterance.lang = "id-ID";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
  }

  function announce(ticket: QueueTicket): void {
    lastTicket = ticket;

    if (replayButton) replayButton.disabled = false;

    if (muted) {
      setStatus(
        `Panggilan ${ticketLabel(ticket)} · suara dibisukan`
      );
      return;
    }

    const typeName = getTypeName(ticket.typeId)
      .replace(/-/g, " ");

    const text =
      `Nomor antrian ${ticket.code} ${ticket.number}. ` +
      `Layanan ${typeName}. Silakan menuju petugas.`;

    setStatus(
      `Memanggil ${ticketLabel(ticket)} · ${typeName}`
    );

    speak(text, () => {
      window.setTimeout(() => speak(text), 700);
    });
  }

  function updateToggle(): void {
    if (!toggleButton) return;

    toggleButton.textContent = muted ? "Aktifkan" : "Bisukan";
    toggleButton.style.background = muted ? "#fef3f2" : "#ffffff";
    toggleButton.style.color = muted ? "#b42318" : "#344054";
    toggleButton.style.borderColor = muted ? "#fecdca" : "#d0d5dd";
  }

  function styleButton(button: HTMLButtonElement): void {
    button.style.cssText =
      "border:1px solid #d0d5dd;background:#ffffff;color:#344054;" +
      "border-radius:8px;padding:5px 9px;font-size:11px;" +
      "font-family:inherit;cursor:pointer";
  }

  function buildPanel(): void {
    if (document.getElementById("speech-window")) return;

    const box = document.createElement("div");
    box.id = "speech-window";
    box.style.cssText =
      "position:fixed;right:16px;bottom:16px;z-index:9999;" +
      "width:248px;background:#ffffff;border:1px solid #d0d5dd;" +
      "border-radius:12px;box-shadow:0 12px 30px rgba(16,24,40,.18);" +
      "font-family:inherit;font-size:12px;color:#344054;" +
      "overflow:hidden";

    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:#101828;color:#ffffff;font-weight:600">
        <span>Pemanggil Suara</span>
        <button id="speech-min" type="button" title="Ringkas"
                style="background:transparent;border:0;color:#ffffff;font-size:16px;line-height:1;cursor:pointer">
          &ndash;
        </button>
      </div>

      <div id="speech-body" style="padding:10px 12px">
        <p id="speech-status" style="margin:0 0 9px;color:#667085;line-height:1.5">
          Menunggu panggilan...
        </p>

        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button id="speech-toggle" type="button">Bisukan</button>
          <button id="speech-test" type="button">Tes</button>
          <button id="speech-replay" type="button" disabled>Ulangi</button>
        </div>
      </div>
    `;

    document.body.appendChild(box);

    statusEl = box.querySelector<HTMLElement>("#speech-status");
    bodyEl = box.querySelector<HTMLElement>("#speech-body");
    toggleButton =
      box.querySelector<HTMLButtonElement>("#speech-toggle");
    replayButton =
      box.querySelector<HTMLButtonElement>("#speech-replay");

    const testButton =
      box.querySelector<HTMLButtonElement>("#speech-test");

    if (toggleButton) styleButton(toggleButton);
    if (testButton) styleButton(testButton);
    if (replayButton) styleButton(replayButton);

    updateToggle();

    toggleButton?.addEventListener("click", () => {
      muted = !muted;
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
      updateToggle();

      if (muted) {
        window.speechSynthesis.cancel();
        setStatus("Suara dibisukan.");
      } else {
        setStatus("Suara diaktifkan.");
        speak("Suara pemanggil antrian diaktifkan.");
      }
    });

    testButton?.addEventListener("click", () => {
      setStatus("Tes suara diputar.");
      speak("Tes pemanggil suara antrian.");
    });

    replayButton?.addEventListener("click", () => {
      if (lastTicket) announce(lastTicket);
    });

    box
      .querySelector<HTMLButtonElement>("#speech-min")
      ?.addEventListener("click", event => {
        if (!bodyEl) return;

        const hidden = bodyEl.style.display === "none";
        bodyEl.style.display = hidden ? "" : "none";

        const button = event.currentTarget as HTMLButtonElement;
        button.textContent = hidden ? "\u2013" : "+";
      });
  }

  function check(): void {
    const latest = latestCalled(getTicketList());

    if (!initialized) {
      initialized = true;

      if (latest) {
        lastKey = keyOf(latest);
        lastTicket = latest;

        if (replayButton) replayButton.disabled = false;

        setStatus(`Terakhir: ${ticketLabel(latest)}`);
      }

      return;
    }

    if (!latest) return;

    const key = keyOf(latest);

    if (key === lastKey) return;

    lastKey = key;
    announce(latest);
  }

  function init(): void {
    buildPanel();
    check();

    window.setInterval(check, POLL_MS);

    window.addEventListener("storage", event => {
      if (event.key === TICKETS_KEY || event.key === null) {
        check();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) check();
    });

    document.addEventListener(
      "click",
      () => {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.resume();
        }
      },
      { capture: true }
    );

    window.setInterval(() => {
      if (
        "speechSynthesis" in window &&
        window.speechSynthesis.speaking &&
        window.speechSynthesis.paused
      ) {
        window.speechSynthesis.resume();
      }
    }, 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
