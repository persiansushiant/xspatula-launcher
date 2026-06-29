import os
from pathlib import Path

from xspatula import Project


ROOT_DIR = Path(__file__).resolve().parents[2]
SETUP_DIR = ROOT_DIR / "setup"

ENVIRONMENT_DIR = ROOT_DIR / "src" / "postgres" / "environment"
os.environ["XSPATULA_ENVIRONMENT_DIR"] = str(ENVIRONMENT_DIR)

project = Project.open(SETUP_DIR)


def run_setup_database():
    print("Running setup database...", flush=True)
    return project.database.create(interactive=False)


def run_setup_processes():
    print("Running setup processes...", flush=True)
    return project.processes.setup()


def run_delete_database():
    print("Running delete database...", flush=True)
    return project.database.delete(interactive=False)