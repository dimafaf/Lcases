// script.js

// ─── Настройки ─────────────────────────────
const REWARDS = [
    { name: "PrankMod",   icon: "🧨", color: "#8b5cf6" },
    { name: "PvPTrainer", icon: "🥊", color: "#f59e0b" },
    { name: "Spheres",    icon: "⚽", color: "#22c55e" },
    { name: "HvHCheat",   icon: "💀", color: "#ef4444" },
    { name: "FA1RPvP",    icon: "🎨", color: "#3b82f6" },
];

const COOLDOWN_MS = 5000;   // пауза между открытиями (5 сек)
const SPIN_DURATION = 4000; // длительность кручения (4 сек)
const ITEMS_IN_TRACK = 50;  // сколько элементов в ленте

let isSpinning = false;
let lastOpenTime = 0;

// ─── DOM ───────────────────────────────────
const track      = document.getElementById("caseTrack");
const openBtn    = document.getElementById("openBtn");
const result     = document.getElementById("result");
const resultIcon = document.getElementById("resultIcon");
const resultName = document.getElementById("resultName");
const keyInput   = document.getElementById("keyInput");
const copyBtn    = document.getElementById("copyBtn");
const rewardsGrid = document.getElementById("rewardsGrid");

// ─── Отрисовка ленты ───────────────────────
function renderTrack() {
    track.innerHTML = "";
    for (let i = 0; i < ITEMS_IN_TRACK; i++) {
        const r = REWARDS[Math.floor(Math.random() * REWARDS.length)];
        const el = document.createElement("div");
        el.className = "case-item";
        el.textContent = r.icon;
        track.appendChild(el);
    }
}

// ─── Сетка наград ──────────────────────────
function renderRewards() {
    rewardsGrid.innerHTML = "";
    REWARDS.forEach(r => {
        const el = document.createElement("div");
        el.className = "reward-item";
        el.innerHTML = `
            <div class="reward-icon">${r.icon}</div>
            <div class="reward-name">${r.name}</div>
        `;
        rewardsGrid.appendChild(el);
    });
}

// ─── Открытие кейса ────────────────────────
function openCase() {
    const now = Date.now();
    if (isSpinning) return;
    if (now - lastOpenTime < COOLDOWN_MS) {
        const left = Math.ceil((COOLDOWN_MS - (now - lastOpenTime)) / 1000);
        openBtn.textContent = `⏳ Подожди ${left} сек...`;
        return;
    }

    isSpinning = true;
    lastOpenTime = now;
    openBtn.disabled = true;
    openBtn.textContent = "🎲 Крутим...";
    result.classList.remove("show");

    // Скрываем старую кнопку «Скопировано»
    copyBtn.textContent = "📋 Скопировать";
    copyBtn.classList.remove("copied");

    // 1. Выбираем награду случайно (20% на каждую)
    const rewardIndex = Math.floor(Math.random() * REWARDS.length);
    const reward = REWARDS[rewardIndex];

    // 2. Строим ленту так, чтобы в центре оказалась нужная награда
    const totalItems = ITEMS_IN_TRACK;
    const winnerPos = totalItems - 5;   // позиция победителя ближе к концу

    track.innerHTML = "";
    for (let i = 0; i < totalItems; i++) {
        let r;
        if (i === winnerPos) {
            r = reward;
        } else {
            r = REWARDS[Math.floor(Math.random() * REWARDS.length)];
        }
        const el = document.createElement("div");
        el.className = "case-item";
        el.textContent = r.icon;
        track.appendChild(el);
    }

    // 3. Считаем сдвиг: центр окна - центр победителя
    requestAnimationFrame(() => {
        const windowEl = document.querySelector(".case-window");
        const windowWidth = windowEl.offsetWidth;
        const itemEl = track.children[winnerPos];
        const itemLeft = itemEl.offsetLeft;
        const itemWidth = itemEl.offsetWidth;

        const offset = itemLeft + itemWidth / 2 - windowWidth / 2 + (Math.random() * 60 - 30);

        track.style.transition = "none";
        track.style.transform = "translateX(0)";

        // Небольшая задержка чтобы transition применился
        setTimeout(() => {
            track.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
            track.style.transform = `translateX(${-offset}px)`;
        }, 50);
    });

    // 4. Через SPIN_DURATION показываем результат
    setTimeout(() => {
        showResult(reward);
        isSpinning = false;
        openBtn.disabled = false;
        openBtn.textContent = "🎁 ОТКРЫТЬ КЕЙС";
    }, SPIN_DURATION + 100);
}

// ─── Показ результата ──────────────────────
function showResult(reward) {
    resultIcon.textContent = reward.icon;
    resultName.textContent = reward.name;

    // Ищем ключ для этой награды
    const key = findKey(reward.name);
    keyInput.value = key || "Ключи закончились 😢";

    result.classList.add("show");
    result.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ─── Поиск ключа ───────────────────────────
function findKey(rewardName) {
    // KEYS приходит из keys.js
    if (typeof KEYS === "undefined") return null;

    const available = [];
    for (const [key, data] of Object.entries(KEYS)) {
        if (data.reward === rewardName) {
            available.push(key);
        }
    }
    if (available.length === 0) return null;

    // Берём случайный (можно доработать: не выдавать дважды в одной сессии)
    return available[Math.floor(Math.random() * available.length)];
}

// ─── Копирование ключа ─────────────────────
copyBtn.addEventListener("click", async () => {
    if (!keyInput.value || keyInput.value.includes("закончились")) return;
    try {
        await navigator.clipboard.writeText(keyInput.value);
        copyBtn.textContent = "✅ Скопировано!";
        copyBtn.classList.add("copied");
        setTimeout(() => {
            copyBtn.textContent = "📋 Скопировать";
            copyBtn.classList.remove("copied");
        }, 2000);
    } catch (e) {
        // Fallback
        keyInput.select();
        document.execCommand("copy");
        copyBtn.textContent = "✅ Скопировано!";
        copyBtn.classList.add("copied");
    }
});

// ─── Обработчик кнопки ─────────────────────
openBtn.addEventListener("click", openCase);

// ─── Обновление кулдауна ───────────────────
setInterval(() => {
    if (isSpinning) return;
    const now = Date.now();
    const left = COOLDOWN_MS - (now - lastOpenTime);
    if (left > 0) {
        openBtn.textContent = `⏳ Подожди ${Math.ceil(left / 1000)} сек...`;
        openBtn.disabled = true;
    } else if (openBtn.disabled === false) {
        openBtn.textContent = "🎁 ОТКРЫТЬ КЕЙС";
    } else {
        openBtn.textContent = "🎁 ОТКРЫТЬ КЕЙС";
        openBtn.disabled = false;
    }
}, 200);

// ─── Инициализация ─────────────────────────
renderTrack();
renderRewards();