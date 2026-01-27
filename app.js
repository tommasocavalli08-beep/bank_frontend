const API_URL = "https://bank-backend-hm3q.onrender.com";

const mails = {};
let currentMail = null;
let playerProgress = 0; // 0-100 (più cresce, più lento arriva la posta)
let mailTimer = null;

// =======================
// CHAT
// =======================
document.getElementById("send-btn").onclick = async () => {
    const input = document.getElementById("chat-input");
    if (!input.value) return;

    addMsg(input.value, "user");
    const res = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.value })
    });

    const data = await res.json();
    addMsg(data.reply, "robot");
    input.value = "";
};

function addMsg(text, cls) {
    const div = document.createElement("div");
    div.className = "msg " + cls;
    div.textContent = text;
    document.getElementById("chat-body").appendChild(div);
    document.getElementById("chat-body").scrollTop = document.getElementById("chat-body").scrollHeight;
}

// =======================
// MAIL DINAMICHE
// =======================

async function fetchNewMail() {
    const res = await fetch(API_URL + "/new-mail");
    const mail = await res.json();

    const id = Date.now();
    mails[id] = {
        id,
        title: mail.title,
        body: mail.body,
        status: "inbox",   // inbox | archived
        read: false
    };

    const li = document.createElement("li");
    li.className = "mail new";
    li.textContent = mail.title;
    li.dataset.id = id;
    li.onclick = () => openMail(id);

    document.getElementById("mailList").appendChild(li);

    updateBadge();
}

// =======================
// APERTURA MAIL
// =======================

function openMail(id) {
    currentMail = id;
    const mail = mails[id];

    // visualizza contenuto
    document.getElementById("docProtocol").textContent = mail.title;
    document.getElementById("docBody").innerHTML = mail.body;

    // mostra bottoni azioni
    document.querySelector(".actions").classList.add("visible");

    // segnalino notifica via (diventa letta)
    mail.read = true;
    const li = document.querySelector(`li[data-id="${id}"]`);
    if (li) li.classList.remove("new");

    updateBadge();
}

// =======================
// AZIONI (APPROVA / ARCHIVIA / SEGNALA)
// =======================

document.querySelector(".approve").onclick = () => closeMail("APPROVATA");
document.querySelector(".archive").onclick = () => closeMail("ARCHIVIATA");
document.querySelector(".report").onclick = () => closeMail("SEGNALATA");

function closeMail(action) {
    const mail = mails[currentMail];
    if (!mail) return;

    mail.status = "archived";

    // sposta nello storico
    const liHistory = document.createElement("li");
    liHistory.textContent = `${mail.title} — ${action}`;
    document.getElementById("historyList").appendChild(liHistory);

    // rimuovi dalla inbox
    const liInbox = document.querySelector(`li[data-id="${currentMail}"]`);
    if (liInbox) liInbox.remove();

    // nascondi azioni
    document.querySelector(".actions").classList.remove("visible");

    currentMail = null;

    updateBadge();
}

// =======================
// NOTIFICA (badge)
// =======================

function updateBadge() {
    // se non esiste, crealo nel titolo "Posta"
    let badge = document.getElementById("mailBadge");
    if (!badge) {
        const title = document.querySelector(".mailbox h2");
        badge = document.createElement("span");
        badge.id = "mailBadge";
        badge.style.marginLeft = "10px";
        badge.style.color = "var(--accent)";
        title.appendChild(badge);
    }

    const unread = Object.values(mails).filter(m => m.status === "inbox" && !m.read).length;
    badge.textContent = unread > 0 ? `(${unread})` : "";

    // se non ci sono mail nuove, togli il segnalino anche dalla lista
    if (unread === 0) {
        document.querySelectorAll(".mail.new").forEach(el => el.classList.remove("new"));
    }
}

// =======================
// ARRIVO MAIL PROGRESSIVO
// =======================

function getMailDelay() {
    // più è alto il progresso, più lento arriva (proporzionale)
    return 30000 * (1 + playerProgress / 100);
}

function scheduleNextMail() {
    if (mailTimer) clearTimeout(mailTimer);
    mailTimer = setTimeout(async () => {
        await fetchNewMail();
        scheduleNextMail();
    }, getMailDelay());
}

// =======================
// INIZIALIZZAZIONE
// =======================

window.onload = () => {
    scheduleNextMail();
};
