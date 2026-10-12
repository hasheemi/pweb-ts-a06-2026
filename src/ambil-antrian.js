/// <reference path="./shared.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
var _this = this;
var takeGrid = document.querySelector(".ambil-grid");
var selectedPriority = new Map();
var resultBox = document.createElement("div");
resultBox.id = "ticket-result";
resultBox.setAttribute("aria-live", "polite");
resultBox.style.cssText =
    "margin-top:18px;padding:16px;border-radius:12px;" +
        "background:#fff;border:1px solid #e5ecef;display:none";
takeGrid.insertAdjacentElement("afterend", resultBox);
function renderTakePage() {
    var tickets = getTickets();
    takeGrid.innerHTML = getTypes()
        .filter(function (type) { return type.active; })
        .map(function (type) {
        var waiting = tickets.filter(function (ticket) {
            return ticket.typeId === type.id &&
                ticket.status === "Menunggu";
        }).length;
        var priority = selectedPriority.get(type.id) || "Normal";
        return "\n        <article class=\"ambil-card\" data-type-id=\"".concat(type.id, "\">\n          <div class=\"ambil-card-head\">\n            <span class=\"ambil-nama\">\n              ").concat(escapeText(type.name), "\n            </span>\n            <span class=\"badge-code\">").concat(type.code, "</span>\n          </div>\n\n          <button class=\"btn btn-primary btn-block\"\n                  type=\"button\"\n                  data-action=\"ambil\">\n            Ambil Nomor\n          </button>\n\n          <details>\n            <summary class=\"ambil-priority-label\">\n              Prioritas: ").concat(priority, " \u25BC\n            </summary>\n\n            <div class=\"ambil-chips\">\n              ").concat([
            "Normal",
            "Lansia",
            "Disabilitas",
            "VIP"
        ].map(function (value) { return "\n                  <button class=\"chip ".concat(priority === value ? "is-selected" : "", "\"\n                          type=\"button\"\n                          data-action=\"prioritas\"\n                          data-priority=\"").concat(value, "\">\n                    ").concat(value, "\n                  </button>\n                "); }).join(""), "\n            </div>\n          </details>\n\n          <p class=\"ambil-priority-label\">\n            ").concat(waiting, " tiket menunggu\n          </p>\n        </article>\n      ");
    }).join("");
}
takeGrid.addEventListener("click", function (event) {
    var _a;
    var button = event.target
        .closest("button[data-action]");
    var card = button === null || button === void 0 ? void 0 : button.closest(".ambil-card");
    if (!button || !card)
        return;
    var typeId = card.dataset.typeId;
    if (button.dataset.action === "prioritas") {
        selectedPriority.set(typeId, button.dataset.priority);
        renderTakePage();
        var updatedCard = takeGrid.querySelector("[data-type-id=\"".concat(typeId, "\"]"));
        (_a = updatedCard === null || updatedCard === void 0 ? void 0 : updatedCard.querySelector("details")) === null || _a === void 0 ? void 0 : _a.setAttribute("open", "");
    }
    else if (button.dataset.action === "ambil") {
        try {
            var ticket = issueTicket(typeId, selectedPriority.get(typeId) || "Normal");
            resultBox.style.display = "block";
            resultBox.innerHTML = "\n        <p class=\"layar-empty-sub\">Nomor antrian Anda</p>\n        <p class=\"layar-call-number\">\n          ".concat(formatTicket(ticket), "\n        </p>\n        <p>\n          Prioritas: ").concat(ticket.priority, ".\n          Silakan menunggu panggilan operator.\n        </p>\n      ");
            renderTakePage();
        }
        catch (error) {
            resultBox.style.display = "block";
            resultBox.textContent =
                error instanceof Error
                    ? error.message
                    : "Gagal mengambil tiket.";
        }
    }
});
(_a = document
    .querySelector("#btn-ambil")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
    takeGrid.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});
(_b = document
    .querySelector("#btn-fullscreen")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                if (!!document.fullscreenElement) return [3 /*break*/, 2];
                return [4 /*yield*/, document.documentElement.requestFullscreen()];
            case 1:
                _b.sent();
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, document.exitFullscreen()];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                _a = _b.sent();
                alert("Browser tidak mengizinkan mode layar penuh.");
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
renderTakePage();
window.setInterval(renderTakePage, 2500);
window.addEventListener("storage", renderTakePage);
