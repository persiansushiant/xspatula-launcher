import pytest


EXPECTED_NODE_IDS = [
    "scheme",
    "job",
    "pilot",
    "process_files",
    "dispatcher",
    "python_actions",
    "metadata_registry",
    "postgresql",
]


@pytest.mark.integration
def test_real_xspatula_pipeline_contract_for_all_tasks():
    xspatula = pytest.importorskip("xspatula")

    from app.services.xspatula_runner import build_pipeline

    task_names = ["setup-db", "setup-processes", "delete-db"]

    for task_name in task_names:
        graph = build_pipeline(task_name)

        assert graph["metadata"]["traceability"] is True
        assert graph["metadata"]["lineage_ready"] is True
        assert "execution" in graph
        assert len(graph["execution"]) >= 1

        node_ids = [node["id"] for node in graph["nodes"]]
        assert node_ids == EXPECTED_NODE_IDS

        for node in graph["nodes"]:
            assert "metadata" in node
            assert "trace" in node
            assert "lineage" in node
            assert "audit" in node

        process_files = next(node for node in graph["nodes"] if node["id"] == "process_files")
        assert "count" in process_files["metadata"]
        assert "files" in process_files["metadata"]
