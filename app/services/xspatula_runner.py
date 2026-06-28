from pathlib import Path

from xspatula import Initiate_process
from xspatula.setup import Initiate_database, Run_process


ROOT_DIR = Path(__file__).resolve().parents[2]
SETUP_DIR = ROOT_DIR / "setup"


def run_setup_database():
    notebook_path = str(SETUP_DIR)
    scheme_file = "./zzz/scheme_ai4sh_local_setup.json"
    job_file = "job_setup_db.json"

    print("Running setup database...", flush=True)
    print(f"notebook_path = {notebook_path}", flush=True)
    print(f"scheme_file = {scheme_file}", flush=True)
    print(f"job_file = {job_file}", flush=True)
    print("Calling Initiate_database now...", flush=True)

    Initiate_database(
        notebook_path,
        scheme_file,
        job_file,
        interactive=False
    )

    print("Initiate_database finished.", flush=True)

def run_setup_processes():
    notebook_path = str(SETUP_DIR)
    scheme_file = "./zzz/scheme_ai4sh_local_use.json"
    job_file = "job_setup_processes.json"

    print("Running setup processes...")
    print(f"notebook_path = {notebook_path}")
    print(f"scheme_file = {scheme_file}")
    print(f"job_file = {job_file}")

    structured_process_D, scheme_params_D = Initiate_process(
        notebook_path,
        scheme_file,
        job_file
    )

    if structured_process_D is not None:
        Run_process(structured_process_D, scheme_params_D)


def run_delete_database():
    notebook_path = str(SETUP_DIR)
    scheme_file = "./zzz/scheme_ai4sh_local_delete.json"
    job_file = "job_delete_db.json"

    print("Running delete database...")
    print(f"notebook_path = {notebook_path}")
    print(f"scheme_file = {scheme_file}")
    print(f"job_file = {job_file}")

    Initiate_database(
        notebook_path,
        scheme_file,
        job_file,
        interactive=False
    )