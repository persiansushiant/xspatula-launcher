from flask import Blueprint, render_template, jsonify
import io
import sys
import traceback
from contextlib import redirect_stdout, redirect_stderr

from app.services.xspatula_runner import (
    run_setup_database,
    run_setup_processes,
    run_delete_database,
    build_pipeline,
)

bp = Blueprint("main", __name__)

TASKS = {
    "setup-db": run_setup_database,
    "setup-processes": run_setup_processes,
    "delete-db": run_delete_database,
}


class Tee:
    def __init__(self, *streams):
        self.streams = streams

    def write(self, data):
        for stream in self.streams:
            try:
                stream.write(data)
                stream.flush()
            except OSError:
                pass

    def flush(self):
        for stream in self.streams:
            try:
                stream.flush()
            except OSError:
                pass


@bp.route("/")
def index():
    return render_template("index.html")


@bp.route("/api/pipeline/<task_name>", methods=["GET"])
def pipeline_graph(task_name):
    try:
        graph = build_pipeline(task_name)

        return jsonify({
            "ok": True,
            "graph": graph,
        })

    except Exception:
        error_log = traceback.format_exc()
        print(error_log, flush=True)

        return jsonify({
            "ok": False,
            "error": error_log,
        }), 500


@bp.route("/api/run/<task_name>", methods=["POST"])
def run_task(task_name):
    if task_name not in TASKS:
        return jsonify({
            "ok": False,
            "log": f"Unknown task: {task_name}"
        }), 404

    buffer = io.StringIO()
    tee_out = Tee(buffer)
    tee_err = Tee(buffer)

    try:
        print(f"API received task: {task_name}", flush=True)

        with redirect_stdout(tee_out), redirect_stderr(tee_err):
            TASKS[task_name]()

        return jsonify({
            "ok": True,
            "log": buffer.getvalue() or "Done. No console output."
        })

    except Exception:
        error_log = buffer.getvalue() + "\n\n" + traceback.format_exc()
        print(error_log, flush=True)

        return jsonify({
            "ok": False,
            "log": error_log
        }), 500