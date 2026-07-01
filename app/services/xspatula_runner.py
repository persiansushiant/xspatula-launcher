import os
from pathlib import Path

from xspatula import Xpatula


ROOT_DIR = Path(__file__).resolve().parents[2]
SETUP_DIR = ROOT_DIR / "setup"

ENVIRONMENT_DIR = ROOT_DIR / "src" / "postgres" / "environment"
os.environ["XSPATULA_ENVIRONMENT_DIR"] = str(ENVIRONMENT_DIR)


TASK_PIPELINE_CONFIG = {
    "setup-db": {
        "scheme": "./zzz/scheme_ai4sh_local_setup.json",
        "pilot": "job_setup_db.json",
    },
    "setup-processes": {
        "scheme": "./zzz/scheme_ai4sh_local_use.json",
        "pilot": "job_setup_processes.json",
    },
    "delete-db": {
        "scheme": "./zzz/scheme_ai4sh_local_delete.json",
        "pilot": "job_delete_db.json",
    },
}


def make_xpatula():
    return Xpatula(SETUP_DIR)


def configure_xpatula(task_name):
    if task_name not in TASK_PIPELINE_CONFIG:
        raise ValueError(f"Unknown task: {task_name}")

    config = TASK_PIPELINE_CONFIG[task_name]

    xp = make_xpatula()
    xp.set_scheme(config["scheme"])
    xp.set_pilot(config["pilot"])

    return xp


def build_pipeline(task_name):
    xp = configure_xpatula(task_name)
    return xp.build_pipeline()


def run_setup_database():
    xp = make_xpatula()

    print("Running setup database...", flush=True)
    print("Scheme: ./zzz/scheme_ai4sh_local_setup.json", flush=True)
    print("Pilot: job_setup_db.json", flush=True)
    print(
        "Execution plan:",
        xp.set_scheme("./zzz/scheme_ai4sh_local_setup.json")
        .set_pilot("job_setup_db.json")
        .plan(),
        flush=True,
    )

    return xp.run_database(interactive=False)


def run_setup_processes():
    xp = make_xpatula()

    print("Running setup processes...", flush=True)
    print("Scheme: ./zzz/scheme_ai4sh_local_use.json", flush=True)
    print("Pilot: job_setup_processes.json", flush=True)
    print(
        "Execution plan:",
        xp.set_scheme("./zzz/scheme_ai4sh_local_use.json")
        .set_pilot("job_setup_processes.json")
        .plan(),
        flush=True,
    )

    return xp.run_processes()


def run_delete_database():
    xp = make_xpatula()

    print("Running delete database...", flush=True)
    print("Scheme: ./zzz/scheme_ai4sh_local_delete.json", flush=True)
    print("Pilot: job_delete_db.json", flush=True)
    print(
        "Execution plan:",
        xp.set_scheme("./zzz/scheme_ai4sh_local_delete.json")
        .set_pilot("job_delete_db.json")
        .plan(),
        flush=True,
    )

    return xp.run_database(interactive=False)