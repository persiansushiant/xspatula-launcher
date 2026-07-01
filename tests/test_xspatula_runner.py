import pytest

import app.services.xspatula_runner as runner


class FakeXpatula:
    instances = []

    def __init__(self, setup_path):
        self.setup_path = setup_path
        self.scheme_file = None
        self.pilot_file = None
        self.database_runs = []
        self.process_runs = 0
        FakeXpatula.instances.append(self)

    def set_scheme(self, scheme_path):
        self.scheme_file = scheme_path
        return self

    def set_pilot(self, pilot_path):
        self.pilot_file = pilot_path
        return self

    def plan(self):
        return {
            "setup_path": str(self.setup_path),
            "scheme_file": self.scheme_file,
            "pilot_file": self.pilot_file,
        }

    def build_pipeline(self):
        return {
            "nodes": [
                {"id": "scheme", "label": "Scheme", "type": "scheme"},
                {"id": "job", "label": "Job", "type": "job"},
                {"id": "pilot", "label": "Pilot", "type": "pilot"},
                {"id": "process_files", "label": "Process Files", "type": "process_files"},
                {"id": "dispatcher", "label": "Dispatcher", "type": "dispatcher"},
                {"id": "python_actions", "label": "Python Actions", "type": "python_actions"},
                {"id": "metadata_registry", "label": "Metadata Registry", "type": "metadata_registry"},
                {"id": "postgresql", "label": "PostgreSQL", "type": "postgresql"},
            ],
            "edges": [],
            "execution": [],
            "metadata": {"lineage_ready": True, "traceability": True},
        }

    def run_database(self, interactive=True):
        self.database_runs.append(interactive)
        return "database-ok"

    def run_processes(self):
        self.process_runs += 1
        return "processes-ok"


@pytest.fixture(autouse=True)
def fake_xpatula(monkeypatch):
    FakeXpatula.instances.clear()
    monkeypatch.setattr(runner, "Xpatula", FakeXpatula)
    return FakeXpatula


def test_configure_xpatula_sets_setup_database_scheme_and_pilot():
    xp = runner.configure_xpatula("setup-db")

    assert xp.scheme_file == "./zzz/scheme_ai4sh_local_setup.json"
    assert xp.pilot_file == "job_setup_db.json"
    assert str(xp.setup_path).endswith("setup")


def test_configure_xpatula_sets_setup_processes_scheme_and_pilot():
    xp = runner.configure_xpatula("setup-processes")

    assert xp.scheme_file == "./zzz/scheme_ai4sh_local_use.json"
    assert xp.pilot_file == "job_setup_processes.json"


def test_configure_xpatula_sets_delete_database_scheme_and_pilot():
    xp = runner.configure_xpatula("delete-db")

    assert xp.scheme_file == "./zzz/scheme_ai4sh_local_delete.json"
    assert xp.pilot_file == "job_delete_db.json"


def test_configure_xpatula_rejects_unknown_task():
    with pytest.raises(ValueError, match="Unknown task"):
        runner.configure_xpatula("not-a-real-task")


def test_build_pipeline_returns_graph_contract():
    graph = runner.build_pipeline("setup-db")

    assert "nodes" in graph
    assert "edges" in graph
    assert "execution" in graph
    assert graph["metadata"]["lineage_ready"] is True
    assert graph["metadata"]["traceability"] is True

    node_ids = [node["id"] for node in graph["nodes"]]
    assert node_ids == [
        "scheme",
        "job",
        "pilot",
        "process_files",
        "dispatcher",
        "python_actions",
        "metadata_registry",
        "postgresql",
    ]


def test_run_setup_database_uses_non_interactive_database_run():
    result = runner.run_setup_database()

    xp = FakeXpatula.instances[-1]
    assert result == "database-ok"
    assert xp.scheme_file == "./zzz/scheme_ai4sh_local_setup.json"
    assert xp.pilot_file == "job_setup_db.json"
    assert xp.database_runs == [False]


def test_run_delete_database_uses_non_interactive_database_run():
    result = runner.run_delete_database()

    xp = FakeXpatula.instances[-1]
    assert result == "database-ok"
    assert xp.scheme_file == "./zzz/scheme_ai4sh_local_delete.json"
    assert xp.pilot_file == "job_delete_db.json"
    assert xp.database_runs == [False]


def test_run_setup_processes_calls_process_runner():
    result = runner.run_setup_processes()

    xp = FakeXpatula.instances[-1]
    assert result == "processes-ok"
    assert xp.scheme_file == "./zzz/scheme_ai4sh_local_use.json"
    assert xp.pilot_file == "job_setup_processes.json"
    assert xp.process_runs == 1
