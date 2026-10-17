'use strict';
/// <reference path="./shared.ts" />
(() => {
    const TICKETS_KEY = 'pweb_tickets';
    const TYPES_KEY = 'pweb_queue_types';
    const POLL_MS = 1000;
    const MAX_REPEAT = 3;
    const REPEAT_DELAY = 5000;

    let initialized = false;
    let lastKey = '';
    let lastTicket = null;

    // Kontrol anti-loop
    let announceToken = 0; // naik setiap announce() baru
    let repeatTimer = null; // setTimeout yang sedang menunggu

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function getTicketList() {
        const list = readJson(TICKETS_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    function getTypeName(typeId) {
        const types = readJson(TYPES_KEY, []);
        const found = Array.isArray(types) ? types.find(type => type.id === typeId) : undefined;
        return found ? found.name : 'layanan';
    }

    function latestCalled(list) {
        const called = list.filter(t => t.status === 'Dipanggil' && t.calledAt);
        if (!called.length) return null;
        return called.sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0))[0];
    }

    function keyOf(ticket) {
        return `${ticket.id}:${ticket.calledAt || 0}`;
    }

    // ---------- Ejaan Indonesia ----------

    // Huruf -> nama huruf Indonesia (biar TTS tidak baca "M" jadi "em" Inggris)
    const HURUF = {
        A: 'a',
        B: 'be',
        C: 'ce',
        D: 'de',
        E: 'e',
        F: 'ef',
        G: 'ge',
        H: 'ha',
        I: 'i',
        J: 'je',
        K: 'ka',
        L: 'el',
        M: 'em',
        N: 'en',
        O: 'o',
        P: 'pe',
        Q: 'ki',
        R: 'er',
        S: 'es',
        T: 'te',
        U: 'u',
        V: 've',
        W: 'we',
        X: 'eks',
        Y: 'ye',
        Z: 'zet',
    };

    const ANGKA = {
        0: 'kosong',
        1: 'satu',
        2: 'dua',
        3: 'tiga',
        4: 'empat',
        5: 'lima',
        6: 'enam',
        7: 'tujuh',
        8: 'delapan',
        9: 'sembilan',
    };

    function spellCode(code) {
        const raw = String(code || '')
            .trim()
            .toUpperCase();
        if (!raw) return '';

        // Pisahkan jadi blok huruf & blok angka, buang pemisah (-, spasi, .)
        const parts = raw.match(/[A-Z]+|[0-9]+/g) || [];

        // Kalau hanya satu blok huruf (contoh: "UMUM"), baca sebagai kata biasa
        if (parts.length === 1 && /^[A-Z]+$/.test(parts[0])) {
            return parts[0].toLowerCase();
        }

        // Selain itu, eja per bagian
        return parts
            .map(part => {
                if (/^[0-9]+$/.test(part)) {
                    // angka: eja per digit
                    return part
                        .split('')
                        .map(d => ANGKA[d] || d)
                        .join(' ');
                }
                // huruf: eja per huruf pakai nama huruf Indonesia
                return part
                    .split('')
                    .map(ch => HURUF[ch] || ch.toLowerCase())
                    .join(' ');
            })
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function numberToIndonesian(n) {
        const satuan = [
            'nol',
            'satu',
            'dua',
            'tiga',
            'empat',
            'lima',
            'enam',
            'tujuh',
            'delapan',
            'sembilan',
            'sepuluh',
            'sebelas',
        ];
        n = Number(n);
        if (!isFinite(n)) return String(n);
        if (n < 12) return satuan[n];
        if (n < 20) return satuan[n - 10] + ' belas';
        if (n < 100) {
            const puluh = Math.floor(n / 10);
            const sisa = n % 10;
            return satuan[puluh] + ' puluh' + (sisa ? ' ' + satuan[sisa] : '');
        }
        if (n < 200) return 'seratus' + (n - 100 ? ' ' + numberToIndonesian(n - 100) : '');
        if (n < 1000) {
            const ratus = Math.floor(n / 100);
            const sisa = n % 100;
            return satuan[ratus] + ' ratus' + (sisa ? ' ' + numberToIndonesian(sisa) : '');
        }
        return String(n);
    }

    function pickVoice() {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        return (
            voices.find(v => v.lang.toLowerCase() === 'id-id') ||
            voices.find(v => v.lang.toLowerCase().indexOf('id') === 0) ||
            voices.find(v => /indonesia/i.test(v.name)) ||
            null
        );
    }

    function speakOnce(text, onEnd) {
        if (!('speechSynthesis' in window)) return;
        const utter = new SpeechSynthesisUtterance(text);
        const voice = pickVoice();
        if (voice) utter.voice = voice;
        utter.lang = 'id-ID';
        utter.rate = 0.95;
        utter.pitch = 1;
        utter.volume = 1;
        if (onEnd) utter.onend = onEnd;
        window.speechSynthesis.speak(utter);
    }

    function stopAll() {
        // Naikkan token -> semua callback lama otomatis batal
        announceToken++;
        if (repeatTimer) {
            clearTimeout(repeatTimer);
            repeatTimer = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    function announce(ticket) {
        lastTicket = ticket;
        if (!('speechSynthesis' in window)) return;

        // Hentikan panggilan sebelumnya (yang mungkin masih mengulang)
        stopAll();

        const myToken = announceToken; // token khusus panggilan ini

        const codeSpelled = spellCode(ticket.code);
        const numberSpelled = numberToIndonesian(ticket.number);
        const typeName = getTypeName(ticket.typeId).replace(/-/g, ' ');

        const text =
            `Nomor antrian ${codeSpelled} ${numberSpelled}. ` +
            `Layanan ${typeName}. Silakan menuju petugas.`;

        let count = 0;
        const doSpeak = () => {
            // Kalau sudah ada panggilan baru, batalkan
            if (myToken !== announceToken) return;
            count++;
            if (count > MAX_REPEAT) return; // safety guard

            speakOnce(text, () => {
                if (myToken !== announceToken) return; // dibatalkan
                if (count < MAX_REPEAT) {
                    repeatTimer = window.setTimeout(() => {
                        repeatTimer = null;
                        doSpeak();
                    }, REPEAT_DELAY);
                }
            });
        };
        doSpeak();
    }

    function check() {
        const latest = latestCalled(getTicketList());
        if (!initialized) {
            initialized = true;
            if (latest) {
                lastKey = keyOf(latest);
                lastTicket = latest;
            }
            return;
        }
        if (!latest) return;
        const key = keyOf(latest);
        if (key === lastKey) return;
        lastKey = key;
        announce(latest);
    }

    function init() {
        check();
        window.setInterval(check, POLL_MS);
        window.addEventListener('storage', event => {
            if (event.key === TICKETS_KEY || event.key === null) check();
        });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) check();
        });
        document.addEventListener(
            'click',
            () => {
                if ('speechSynthesis' in window) window.speechSynthesis.resume();
            },
            { capture: true }
        );
        window.setInterval(() => {
            if (
                'speechSynthesis' in window &&
                window.speechSynthesis.speaking &&
                window.speechSynthesis.paused
            ) {
                window.speechSynthesis.resume();
            }
        }, 5000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
