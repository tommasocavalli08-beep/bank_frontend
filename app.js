const API_URL = "https://TUO-BACKEND.onrender.com";

const mails = {};
let currentMail = null;

// CHAT
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
}

// MAIL DINAMICHE
async function fetchNewMail() {
    const res = await fetch(API_URL + "/new-mail");
    const mail = await res.json();

    const id = Date.now();
    mails[id] = mail;

    const li = document.createElement("li");
    li.className = "mail new";
    li.textContent = mail.title;
    li.onclick = () => openMail(id);

    document.getElementById("mailList").appendChild(li);
}

function openMail(id) {
    currentMail = id;
    document.getElementById("docProtocol").textContent = mails[id].title;
    document.getElementById("docBody").innerHTML = mails[id].body;
    document.querySelector(".actions").style.display = "grid";
}

// AZIONI
document.querySelector(".approve").onclick = () => closeMail("APPROVATA");
document.querySelector(".archive").onclick = () => closeMail("ARCHIVIATA");
document.querySelector(".report").onclick = () => closeMail("SEGNALATA");

function closeMail(action) {
    const li = document.createElement("li");
    li.textContent = `${mails[currentMail].title} — ${action}`;
    document.getElementById("historyList").appendChild(li);
    document.querySelector(".actions").style.display = "none";
}

// NUOVE MAIL AUTOMATICHE
setInterval(fetchNewMail, 30000);
