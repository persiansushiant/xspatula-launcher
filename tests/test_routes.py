import app.routes as routes


def fake_graph():
    return {
        "nodes": [
            {"id": "scheme", "label": "Scheme", "type": "scheme"},
            {"id": "job", "label": "Job", "type": "job"},
            {"id": "pilot", "label": "Pilot", "type": "pilot"},
        ],
        "edges": [
            {"source": "scheme", "target": "job"},
            {"source": "job", "target": "pilot"},
        ],
        "execution": [
            {"from": "scheme", "to": "job", "tokens": 1},
            {"from": "job", "to": "pilot", "tokens": 1},
        ],
        "metadata": {
            "traceability": True,
            "lineage_ready": True,
        },
    }


def test_index_page_loads(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Xspatula Launcher" in response.data


def test_pipeline_endpoint_returns_graph(client, monkeypatch):
    monkeypatch.setattr(routes, "build_pipeline", lambda task_name: fake_graph())

    response = client.get("/api/pipeline/setup-db")
    data = response.get_json()

    assert response.status_code == 200
    assert data["ok"] is True
    assert data["graph"]["metadata"]["traceability"] is True
    assert data["graph"]["metadata"]["lineage_ready"] is True
    assert data["graph"]["nodes"][0]["id"] == "scheme"


def test_pipeline_endpoint_returns_500_when_builder_fails(client, monkeypatch):
    def fail(task_name):
        raise RuntimeError("pipeline exploded")

    monkeypatch.setattr(routes, "build_pipeline", fail)

    response = client.get("/api/pipeline/setup-db")
    data = response.get_json()

    assert response.status_code == 500
    assert data["ok"] is False
    assert "pipeline exploded" in data["error"]


def test_run_endpoint_rejects_unknown_task(client):
    response = client.post("/api/run/unknown-task")
    data = response.get_json()

    assert response.status_code == 404
    assert data["ok"] is False
    assert "Unknown task" in data["log"]


def test_run_endpoint_executes_known_task(client, monkeypatch):
    def fake_task():
        print("fake task ran")
        return "ok"

    monkeypatch.setitem(routes.TASKS, "setup-db", fake_task)

    response = client.post("/api/run/setup-db")
    data = response.get_json()

    assert response.status_code == 200
    assert data["ok"] is True
    assert "fake task ran" in data["log"]


def test_run_endpoint_returns_500_when_task_fails(client, monkeypatch):
    def failing_task():
        print("before failure")
        raise RuntimeError("database dragon woke up")

    monkeypatch.setitem(routes.TASKS, "setup-db", failing_task)

    response = client.post("/api/run/setup-db")
    data = response.get_json()

    assert response.status_code == 500
    assert data["ok"] is False
    assert "before failure" in data["log"]
    assert "database dragon woke up" in data["log"]
