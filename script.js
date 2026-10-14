```javascript
/* ==========================================
   FF MAX ELITE - TOURNAMENT SYSTEM
========================================== */

"use strict";

const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "ffmaxEliteTournamentData";

let tournaments = loadTournaments();
let isAdmin = false;
let soundEnabled = false;
let audioContext = null;
let toastTimer = null;
let deleteTarget = null;

/* DEMO ADMIN LOGIN
   Username: 777
   Password: 888

   IMPORTANT:
   This is client-side demo authentication.
   Do not use it for sensitive information.
*/

const ADMIN_USERNAME = "777";
const ADMIN_PASSWORD = "888";


/* ==========================================
   STORAGE
========================================== */

function loadTournaments() {
    try {
        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

function saveTournaments() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(tournaments)
        );
    } catch (error) {
        showToast("Unable to save data in this browser.");
    }
}


/* ==========================================
   SAFE HTML TEXT
========================================== */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[char];
    });
}


/* ==========================================
   SOUND EFFECTS
========================================== */

function playTone(frequency, duration = 0.08) {
    if (!soundEnabled) return;

    try {
        if (!audioContext) {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) return;

            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
            0.035,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(
            audioContext.currentTime + duration
        );
    } catch (error) {
        // Sound may be unavailable on some devices.
    }
}

function playClickSound() {
    playTone(600, 0.06);

    setTimeout(function () {
        playTone(820, 0.06);
    }, 45);
}

$("soundBtn").addEventListener("click", function () {
    soundEnabled = !soundEnabled;

    this.textContent = soundEnabled
        ? "🔊 Sound ON"
        : "🔇 Sound OFF";

    if (soundEnabled) {
        playTone(700, 0.1);
        showToast("Sound effects enabled!");
    } else {
        showToast("Sound effects muted.");
    }
});

document.addEventListener("click", function (event) {
    if (event.target.closest("button")) {
        playClickSound();
    }
});


/* ==========================================
   NOTIFICATIONS
========================================== */

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 2600);
}


/* ==========================================
   DATE AND TIME
========================================== */

function formatTime(value) {
    if (!value) return "Not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}


/* ==========================================
   TOURNAMENT DISPLAY
========================================== */

function isCompleted(tournament) {
    return tournament.completed === true;
}

function renderTournaments() {
    const list = $("tournamentList");

    const sortedTournaments = [...tournaments].sort(
        function (a, b) {
            return new Date(a.time) - new Date(b.time);
        }
    );

    $("totalCount").textContent = tournaments.length;

    $("activeCount").textContent =
        tournaments.filter(function (tournament) {
            return !isCompleted(tournament);
        }).length;

    $("completedCount").textContent =
        tournaments.filter(isCompleted).length;

    if (sortedTournaments.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <strong>⚡ The arena is waiting!</strong>
                No tournaments published yet.<br>
                Check back soon for match timings,
                team codes and prizes.
            </div>
        `;

        renderAdminList();
        return;
    }

    list.innerHTML = sortedTournaments.map(function (tournament) {
        const done = isCompleted(tournament);

        return `
            <article class="tournament-card">

                <div class="card-top">
                    <span class="premium-tag ${done ? "done" : ""}">
                        ${done ? "✓ COMPLETED" : "✦ PREMIUM MATCH"}
                    </span>

                    <span style="color:#91a0b8;font-size:11px">
                        #${escapeHTML(String(tournament.id).slice(-4))}
                    </span>
                </div>

                <h3>${escapeHTML(tournament.name)}</h3>

                <p class="card-description">
                    FREE FIRE MAX • SQUAD TOURNAMENT
                </p>

                <div class="details-grid">

                    <div class="detail-box">
                        <span>◷ Match Time</span>
                        <strong>${escapeHTML(formatTime(tournament.time))}</strong>
                    </div>

                    <div class="detail-box">
                        <span>⌘ Team Code</span>
                        <strong>${escapeHTML(tournament.code || "Coming soon")}</strong>
                    </div>

                    <div class="detail-box">
                        <span>♛ Prize</span>
                        <strong>${escapeHTML(tournament.prize || "TBA")}</strong>
                    </div>

                </div>

                <div class="completion-status">
                    <span class="tick ${done ? "completed" : ""}">
                        ${done ? "✓" : "•"}
                    </span>

                    ${done
                        ? "Tournament completed by admin"
                        : "Awaiting completion confirmation"}
                </div>

            </article>
        `;
    }).join("");

    renderAdminList();
}


/* ==========================================
   ADMIN LOGIN
========================================== */

$("adminBtn").addEventListener("click", function () {
    if (isAdmin) {
        $("adminPanel").scrollIntoView({
            behavior: "smooth"
        });
        return;
    }

    $("loginPanel").classList.remove("hidden");

    $("loginPanel").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    $("username").focus();
});

$("cancelLogin").addEventListener("click", function () {
    $("loginPanel").classList.add("hidden");
});

$("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const username = $("username").value.trim();
    const password = $("password").value;

    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {
        isAdmin = true;

        $("loginPanel").classList.add("hidden");
        $("adminPanel").classList.remove("hidden");

        renderAdminList();

        $("adminPanel").scrollIntoView({
            behavior: "smooth"
        });

        showToast("Welcome, Admin!");
        $("loginForm").reset();
    } else {
        showToast("Incorrect username or password!");
        $("password").value = "";
    }
});


/* ==========================================
   LOGOUT
========================================== */

$("logoutBtn").addEventListener("click", function () {
    isAdmin = false;

    $("adminPanel").classList.add("hidden");

    resetTournamentForm();

    showToast("Admin logged out.");
});


/* ==========================================
   TOURNAMENT FORM
========================================== */

function resetTournamentForm() {
    $("tournamentForm").reset();

    $("editId").value = "";

    $("saveBtn").textContent =
        "＋ PUBLISH TOURNAMENT";
}

$("clearBtn").addEventListener("click", resetTournamentForm);

$("tournamentForm").addEventListener("submit", function (event) {
    event.preventDefault();

    if (!isAdmin) {
        showToast("Please log in as admin.");
        return;
    }

    const editId = $("editId").value;

    const name = $("tName").value.trim();
    const time = $("tTime").value;
    const code = $("tCode").value.trim();
    const prize = $("tPrize").value.trim();

    if (!name || !time || !prize) {
        showToast("Please complete all required fields.");
        return;
    }

    if (Number.isNaN(new Date(time).getTime())) {
        showToast("Please enter a valid tournament time.");
        return;
    }

    if (editId) {
        const oldTournament = tournaments.find(function (t) {
            return String(t.id) === String(editId);
        });

        tournaments = tournaments.map(function (tournament) {
            if (String(tournament.id) === String(editId)) {
                return {
                    ...tournament,
                    name: name,
                    time: time,
                    code: code,
                    prize: prize
                };
            }

            return tournament;
        });

        showToast("Tournament updated!");
    } else {
        tournaments.push({
            id: Date.now().toString(36) +
                Math.random().toString(36).slice(2, 7),
            name: name,
            time: time,
            code: code,
            prize: prize,
            completed: false
        });

        showToast("Tournament published!");
    }

    saveTournaments();
    resetTournamentForm();
    renderTournaments();
});


/* ==========================================
   ADMIN TOURNAMENT MANAGEMENT
========================================== */

function renderAdminList() {
    const adminList = $("adminList");

    if (!isAdmin) return;

    if (tournaments.length === 0) {
        adminList.innerHTML = `
            <p style="color:#a0aec5;font-size:13px">
                No tournaments yet. Add your first tournament above.
            </p>
        `;

        return;
    }

    const sorted = [...tournaments].sort(function (a, b) {
        return new Date(a.time) - new Date(b.time);
    });

    adminList.innerHTML = sorted.map(function (tournament) {
        const done = isCompleted(tournament);

        return `
            <div class="admin-row">

                <div>
                    <strong>${escapeHTML(tournament.name)}</strong>

                    <p>
                        ${escapeHTML(formatTime(tournament.time))}
                        · Prize: ${escapeHTML(tournament.prize)}
                        · ${done ? "Completed" : "Pending"}
                    </p>
                </div>

                <div class="admin-controls">

                    <button
                        class="small-btn"
                        data-action="toggle"
                        data-id="${escapeHTML(tournament.id)}">
                        ${done ? "↶ Undo Tick" : "✓ Mark Complete"}
                    </button>

                    <button
                        class="small-btn"
                        data-action="edit"
                        data-id="${escapeHTML(tournament.id)}">
                        ✎ Edit
                    </button>

                    <button
                        class="small-btn delete-btn"
                        data-action="delete"
                        data-id="${escapeHTML(tournament.id)}">
                        ✕ Delete
                    </button>

                </div>
            </div>
        `;
    }).join("");
}

$("adminList").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button || !isAdmin) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    const tournament = tournaments.find(function (t) {
        return String(t.id) === String(id);
    });

    if (!tournament) return;

    if (action === "toggle") {
        tournament.completed = !isCompleted(tournament);

        saveTournaments();
        renderTournaments();

        showToast(
            tournament.completed
                ? "Tournament marked completed ✓"
                : "Completion tick removed."
        );
    }

    if (action === "edit") {
        $("editId").value = tournament.id;
        $("tName").value = tournament.name;
        $("tTime").value = tournament.time;
        $("tCode").value = tournament.code || "";
        $("tPrize").value = tournament.prize;

        $("saveBtn").textContent = "SAVE CHANGES";

        $("tournamentForm").scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    if (action === "delete") {
        const confirmed = window.confirm(
            "Delete this tournament permanently from this browser?"
        );

        if (!confirmed) return;

        tournaments = tournaments.filter(function (t) {
            return String(t.id) !== String(id);
        });

        saveTournaments();
        renderTournaments();

        showToast("Tournament deleted.");
    }
});


/* ==========================================
   PAGE BUTTONS
========================================== */

function scrollToTournaments() {
    $("tournaments").scrollIntoView({
        behavior: "smooth"
    });
}

window.scrollToTournaments = scrollToTournaments;


/* ==========================================
   INITIALIZE WEBSITE
========================================== */

renderTournaments();
```

