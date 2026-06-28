const GAME_URL = "https://exhibitiongames.se/game/the-risk-arena/r5/";

const TASK_CONFIG = {
    "setup-db": {
        title: "Create Database",
        message: "This operation will prepare the PostgreSQL database for Xspatula.",
        items: [
            "Create the configured PostgreSQL database",
            "Create schemas and tables",
            "Create database users and roles",
            "Generate project environment files"
        ],
        buttonText: "Create Database",
        buttonClass: "btn-primary"
    },

    "setup-processes": {
        title: "Setup Processes",
        message: "This operation will register the original process definitions.",
        items: [
            "Read the setup process pilot file",
            "Register root processes",
            "Register process parameters",
            "Prepare the database process registry"
        ],
        buttonText: "Setup Processes",
        buttonClass: "btn-success"
    },

    "delete-db": {
        title: "Delete Database",
        message: "This operation is destructive. It will delete configured database content.",
        items: [
            "Delete schemas and tables",
            "Remove process definitions",
            "Remove utility and community tables",
            "This action cannot be undone"
        ],
        buttonText: "Delete Database",
        buttonClass: "btn-danger"
    }
};

let pendingTask = null;

function setGlobalStatus(status, label) {
    const el = document.getElementById("global-status");
    if (!el) return;

    el.innerHTML = `<span class="dot ${status}"></span>${label}`;
}

function setTaskStatus(taskName, status, label) {
    const el = document.getElementById("status-" + taskName);
    if (!el) return;

    el.className = "badge-soft " + status;
    el.innerText = label;
}

function setProgress(percent, label) {
    const bar = document.getElementById("progress-bar");
    const progressLabel = document.getElementById("progress-label");

    if (bar) bar.style.width = percent + "%";
    if (progressLabel) progressLabel.innerText = label;
}

function showLoading(title, message) {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) return;

    document.getElementById("loading-title").innerText = title;
    document.getElementById("loading-message").innerText = message;

    overlay.classList.remove("d-none");
}

function hideLoading() {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) return;

    overlay.classList.add("d-none");
}

function disableButtons(disabled) {
    document.querySelectorAll(".task-button").forEach(button => {
        button.disabled = disabled;
    });
}

function clearLog() {
    const logBox = document.getElementById("log-box");
    if (logBox) logBox.innerText = "Console cleared.";
}

function confirmTask(taskName) {
    const config = TASK_CONFIG[taskName];
    if (!config) return;

    pendingTask = taskName;

    document.getElementById("confirm-title").innerText = config.title;
    document.getElementById("confirm-message").innerText = config.message;

    const list = document.getElementById("confirm-list");
    list.innerHTML = "";

    config.items.forEach(item => {
        const li = document.createElement("li");
        li.innerText = item;
        list.appendChild(li);
    });

    const runButton = document.getElementById("confirm-run-button");
    runButton.className = "btn " + config.buttonClass;
    runButton.innerText = config.buttonText;

    const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
    modal.show();
}

function openGame() {
    const frame = document.getElementById("game-frame");
    frame.src = GAME_URL;

    const modal = new bootstrap.Modal(document.getElementById("gameModal"));
    modal.show();
}

async function runTask(taskName, title) {
    const logBox = document.getElementById("log-box");

    disableButtons(true);
    setTaskStatus(taskName, "running", "Running");
    setProgress(15, "Starting");

    showLoading(title, "Running. Please wait...");

    if (logBox) {
        logBox.innerText = `> ${title}\n> Sending request to Flask backend...\n`;
    }

    try {
        setProgress(45, "Executing");

        const response = await fetch("/api/run/" + taskName, {
            method: "POST"
        });

        setProgress(75, "Reading result");

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch (error) {
            hideLoading();
            disableButtons(false);
            setProgress(100, "Invalid JSON");
            setTaskStatus(taskName, "failed", "Failed");

            if (logBox) {
                logBox.innerText = "❌ Backend returned non-JSON response\n\n" + text;
            }

            return;
        }

        hideLoading();
        disableButtons(false);

        if (response.ok && data.ok) {
            setProgress(100, "Completed");
            setTaskStatus(taskName, "success", "Success");

            if (logBox) {
                logBox.innerText = "✅ SUCCESS\n\n" + (data.log || "Done.");
            }
        } else {
            setProgress(100, "Failed");
            setTaskStatus(taskName, "failed", "Failed");

            if (logBox) {
                logBox.innerText = "❌ FAILED\n\n" + (data.log || text);
            }
        }

    } catch (error) {
        hideLoading();
        disableButtons(false);

        setProgress(100, "UI Error");
        setTaskStatus(taskName, "failed", "Failed");

        if (logBox) {
            logBox.innerText = "❌ UI / Network Error\n\n" + error;
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    hideLoading();
    setProgress(0, "Waiting");

    const runButton = document.getElementById("confirm-run-button");

    if (runButton) {
        runButton.addEventListener("click", function () {
            if (!pendingTask) return;

            const config = TASK_CONFIG[pendingTask];

            const modalElement = document.getElementById("confirmModal");
            const modal = bootstrap.Modal.getInstance(modalElement);

            if (modal) modal.hide();

            runTask(pendingTask, config.title);

            pendingTask = null;
        });
    }
});