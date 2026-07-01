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
let currentPipelineGraph = null;
let pipelineCy = null;
let activePipelineTask = null;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function ensureGraphLibraries() {
    if (window.cytoscape && window.dagre && window.cytoscapeDagre) {
        cytoscape.use(cytoscapeDagre);
        return;
    }

    await loadScript("https://unpkg.com/cytoscape@3.29.2/dist/cytoscape.min.js");
    await loadScript("https://unpkg.com/dagre@0.8.5/dist/dagre.min.js");
    await loadScript("https://unpkg.com/cytoscape-dagre@2.5.0/cytoscape-dagre.js");

    cytoscape.use(cytoscapeDagre);
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

async function loadPipeline(taskName) {
    const container = document.getElementById("pipeline-flow");
    const subtitle = document.getElementById("pipeline-subtitle");
    const edgeInfo = document.getElementById("pipeline-edge-info");

    if (!container) return;

    if (pipelineCy) {
        pipelineCy.destroy();
        pipelineCy = null;
    }

    clearVisualOverlays();

    currentPipelineGraph = null;
    activePipelineTask = null;

    container.innerHTML = `
        <div class="pipeline-empty">
            <i class="bi bi-hourglass-split"></i>
            <span>Loading graph from Xspatula...</span>
        </div>
    `;

    try {
        await ensureGraphLibraries();

        container.innerHTML = "";

        const response = await fetch("/api/pipeline/" + taskName);
        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.error || "Could not build pipeline graph.");
        }

        currentPipelineGraph = data.graph;
        activePipelineTask = taskName;

        if (subtitle && TASK_CONFIG[taskName]) {
            subtitle.innerText = TASK_CONFIG[taskName].title + " graph loaded from Xspatula.";
        }

        renderWorkflowGraph(currentPipelineGraph);

        if (edgeInfo) {
            const edges = currentPipelineGraph.edges || [];
            edgeInfo.innerText = edges
                .map(edge => `${edge.source} → ${edge.target}`)
                .join("   |   ");
        }

    } catch (error) {
        currentPipelineGraph = null;
        activePipelineTask = null;
        pipelineCy = null;

        container.innerHTML = `
            <div class="pipeline-empty">
                <i class="bi bi-exclamation-triangle"></i>
                <span>${escapeHtml(error.message)}</span>
            </div>
        `;
    }
}

function renderWorkflowGraph(graph) {
    const container = document.getElementById("pipeline-flow");

    const elements = [];

    (graph.nodes || []).forEach(node => {
        elements.push({
            data: {
                id: node.id,
                label: node.label || node.id,
                type: node.type,
                status: node.status || "pending",
                metadata: node.metadata || {}
            },
            classes: node.type
        });
    });

    (graph.edges || []).forEach(edge => {
        elements.push({
            data: {
                id: `${edge.source}-${edge.target}`,
                source: edge.source,
                target: edge.target,
                label: edge.label || ""
            }
        });
    });

    pipelineCy = cytoscape({
        container,
        elements,
        wheelSensitivity: 0.25,
        minZoom: 0.35,
        maxZoom: 1.8,
        style: [
            {
                selector: "node",
                style: {
                    "shape": "round-rectangle",
                    "width": 180,
                    "height": 104,
                    "background-color": "#111827",
                    "border-width": 2,
                    "border-color": "#475569",
                    "label": "data(label)",
                    "color": "#ffffff",
                    "font-size": 13,
                    "font-weight": "700",
                    "text-valign": "center",
                    "text-halign": "center",
                    "text-wrap": "wrap",
                    "text-max-width": 140,
                    "overlay-opacity": 0
                }
            },
            {
                selector: "node[type='scheme']",
                style: {
                    "border-color": "#22d3ee",
                    "background-color": "#083344"
                }
            },
            {
                selector: "node[type='pilot']",
                style: {
                    "border-color": "#60a5fa",
                    "background-color": "#172554"
                }
            },
            {
                selector: "node[type='process_file']",
                style: {
                    "border-color": "#a855f7",
                    "background-color": "#2e1065"
                }
            },
            {
                selector: "node[type='job_bundle']",
                style: {
                    "border-color": "#f59e0b",
                    "background-color": "#451a03"
                }
            },
            {
                selector: "node[type='postgresql_action']",
                style: {
                    "border-color": "#22c55e",
                    "background-color": "#052e16"
                }
            },
            {
                selector: "edge",
                style: {
                    "width": 3,
                    "line-color": "#22c55e",
                    "target-arrow-color": "#22c55e",
                    "target-arrow-shape": "triangle",
                    "curve-style": "bezier",
                    "arrow-scale": 1.2,
                    "opacity": 0.85
                }
            },
            {
                selector: ".running",
                style: {
                    "border-width": 4,
                    "border-color": "#facc15"
                }
            },
            {
                selector: ".success",
                style: {
                    "border-width": 4,
                    "border-color": "#22c55e"
                }
            },
            {
                selector: ".failed",
                style: {
                    "border-width": 4,
                    "border-color": "#ef4444"
                }
            }
        ],
        layout: {
            name: "dagre",
            rankDir: "LR",
            nodeSep: 80,
            edgeSep: 30,
            rankSep: 120,
            animate: false
        }
    });

    pipelineCy.ready(() => {
        pipelineCy.fit(undefined, 50);
    });

    pipelineCy.on("tap", "node", event => {
        const node = event.target;
        showNodeMetadata(node);
    });
}

async function playPipelineAnimation() {
    if (!pipelineCy || !currentPipelineGraph) return;

    clearVisualOverlays();
    resetNodeStates();

    const orderedNodeIds = getOrderedNodeIdsFromGraph();

    for (let i = 0; i < orderedNodeIds.length; i++) {
        const nodeId = orderedNodeIds[i];
        const node = pipelineCy.getElementById(nodeId);

        if (node.length) {
            node.addClass("running");
            await sleep(380);
            node.removeClass("running");
            node.addClass("success");
        }

        const nextNodeId = orderedNodeIds[i + 1];

        if (nextNodeId) {
            if (nodeId === "job_bundle") {
                await animateParallelJobTokens(nodeId, nextNodeId);
            } else {
                await animateTokenBetweenNodes(nodeId, nextNodeId, false, 620);
            }
        }
    }

    addJobBundleBurstPreview();
}

function getOrderedNodeIdsFromGraph() {
    const nodes = currentPipelineGraph?.nodes || [];
    const edges = currentPipelineGraph?.edges || [];

    if (!nodes.length) return [];

    const nodeIds = nodes.map(node => node.id);
    const targets = new Set(edges.map(edge => edge.target));
    const startNode = nodeIds.find(id => !targets.has(id)) || nodeIds[0];

    const ordered = [];
    const visited = new Set();

    let current = startNode;

    while (current && !visited.has(current)) {
        ordered.push(current);
        visited.add(current);

        const nextEdge = edges.find(edge => edge.source === current && !visited.has(edge.target));
        current = nextEdge ? nextEdge.target : null;
    }

    nodeIds.forEach(id => {
        if (!visited.has(id)) ordered.push(id);
    });

    return ordered;
}

function resetNodeStates() {
    if (!pipelineCy) return;
    pipelineCy.nodes().removeClass("running success failed");
}

function animateTokenBetweenNodes(sourceId, targetId, isParallel = false, duration = 700, yOffset = 0) {
    return new Promise(resolve => {
        if (!pipelineCy) {
            resolve();
            return;
        }

        const source = pipelineCy.getElementById(sourceId);
        const target = pipelineCy.getElementById(targetId);

        if (!source.length || !target.length) {
            resolve();
            return;
        }

        const container = document.getElementById("pipeline-flow");
        const start = source.renderedPosition();
        const end = target.renderedPosition();

        const token = document.createElement("div");
        token.className = isParallel ? "pipeline-token parallel" : "pipeline-token";
        token.style.left = `${start.x}px`;
        token.style.top = `${start.y + yOffset}px`;

        container.appendChild(token);

        token.animate(
            [
                { left: `${start.x}px`, top: `${start.y + yOffset}px`, opacity: 1 },
                { left: `${end.x}px`, top: `${end.y + yOffset}px`, opacity: 1 }
            ],
            {
                duration,
                easing: "cubic-bezier(.22,.61,.36,1)"
            }
        ).onfinish = () => {
            token.remove();
            resolve();
        };
    });
}

async function animateParallelJobTokens(sourceId, targetId) {
    const graphNode = (currentPipelineGraph.nodes || []).find(node => node.id === "job_bundle");
    const count = graphNode?.metadata?.count || graphNode?.metadata?.files?.length || 8;

    const visibleTokenCount = Math.min(Math.max(count, 4), 14);
    const promises = [];

    for (let i = 0; i < visibleTokenCount; i++) {
        const offset = (i - (visibleTokenCount - 1) / 2) * 16;

        promises.push(
            delay(i * 55).then(() => {
                return animateTokenBetweenNodes(sourceId, targetId, true, 850, offset);
            })
        );
    }

    await Promise.all(promises);
}

function addJobBundleBurstPreview() {
    if (!pipelineCy || !currentPipelineGraph) return;

    const jobNode = pipelineCy.getElementById("job_bundle");
    const postgresNode = pipelineCy.getElementById("postgresql_action");

    if (!jobNode.length || !postgresNode.length) return;

    const graphNode = (currentPipelineGraph.nodes || []).find(node => node.id === "job_bundle");
    if (!graphNode) return;

    const files = graphNode.metadata?.files || [];
    const count = graphNode.metadata?.count || files.length || 0;

    if (!count) return;

    const container = document.getElementById("pipeline-flow");
    const jobPos = jobNode.renderedPosition();
    const pgPos = postgresNode.renderedPosition();

    const visibleFiles = files.slice(0, 6);
    const startX = jobPos.x + 115;
    const endX = pgPos.x - 170;
    const midX = (startX + endX) / 2;

    visibleFiles.forEach((file, index) => {
        const yOffset = (index - (visibleFiles.length - 1) / 2) * 48;

        const chip = document.createElement("div");
        chip.className = "pipeline-file-burst small";
        chip.style.left = `${midX}px`;
        chip.style.top = `${pgPos.y + yOffset}px`;
        chip.innerText = file.name || file.path || `job_${index + 1}.json`;

        container.appendChild(chip);
    });

    if (count > visibleFiles.length) {
        const badge = document.createElement("div");
        badge.className = "pipeline-file-count";
        badge.style.left = `${midX + 28}px`;
        badge.style.top = `${pgPos.y + 170}px`;
        badge.innerText = `+${count - visibleFiles.length} more JSON jobs`;

        container.appendChild(badge);
    }
}

function clearVisualOverlays() {
    document.querySelectorAll(".pipeline-file-burst, .pipeline-file-count, .pipeline-token").forEach(el => {
        el.remove();
    });
}

function showNodeMetadata(cyNode) {
    const data = cyNode.data();
    const metadata = data.metadata || {};
    const edgeInfo = document.getElementById("pipeline-edge-info");

    if (!edgeInfo) return;

    let text = `${data.label} | type: ${data.type}`;

    const bestPath =
        metadata.absolute_path ||
        metadata.path ||
        metadata.trace?.resolved_path ||
        metadata.files?.[0]?.absolute_path ||
        metadata.files?.[0]?.path;

    if (bestPath) {
        text += ` | path: ${bestPath}`;
    }

    if (metadata.relative_path) {
        text += ` | relative: ${metadata.relative_path}`;
    }

    if (typeof metadata.count !== "undefined") {
        text += ` | count: ${metadata.count}`;
    }

    if (metadata.files && metadata.files.length) {
        const names = metadata.files
            .slice(0, 10)
            .map(file => file.absolute_path || file.path || file.name)
            .join(", ");

        text += ` | files: ${names}`;
    }

    if (metadata.trace?.discovered_from) {
        text += ` | discovered from: ${metadata.trace.discovered_from}`;
    }

    edgeInfo.innerText = text;
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

    showLoading(title, "Loading graph and starting execution...");

    if (logBox) {
        logBox.innerText = `> ${title}\n> Loading Xspatula pipeline graph...\n`;
    }

    if (!pipelineCy || !currentPipelineGraph || activePipelineTask !== taskName) {
        await loadPipeline(taskName);
    }

    if (pipelineCy && currentPipelineGraph) {
        playPipelineAnimation();
    }

    if (logBox) {
        logBox.innerText += `> Sending request to Flask backend...\n`;
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

            if (pipelineCy) {
                pipelineCy.nodes().removeClass("running success").addClass("failed");
            }

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

            if (pipelineCy) {
                pipelineCy.nodes().removeClass("running failed").addClass("success");
            }

            if (logBox) {
                logBox.innerText = "✅ SUCCESS\n\n" + (data.log || "Done.");
            }
        } else {
            setProgress(100, "Failed");
            setTaskStatus(taskName, "failed", "Failed");

            if (pipelineCy) {
                pipelineCy.nodes().removeClass("running success").addClass("failed");
            }

            if (logBox) {
                logBox.innerText = "❌ FAILED\n\n" + (data.log || text);
            }
        }

    } catch (error) {
        hideLoading();
        disableButtons(false);

        setProgress(100, "UI Error");
        setTaskStatus(taskName, "failed", "Failed");

        if (pipelineCy) {
            pipelineCy.nodes().removeClass("running success").addClass("failed");
        }

        if (logBox) {
            logBox.innerText = "❌ UI / Network Error\n\n" + error;
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
    hideLoading();
    setProgress(0, "Waiting");

    const runButton = document.getElementById("confirm-run-button");

    if (runButton) {
        runButton.addEventListener("click", function () {
            if (!pendingTask) return;

            const taskName = pendingTask;
            const config = TASK_CONFIG[taskName];

            const modalElement = document.getElementById("confirmModal");
            const modal = bootstrap.Modal.getInstance(modalElement);

            if (modal) modal.hide();

            pendingTask = null;

            runTask(taskName, config.title);
        });
    }
});