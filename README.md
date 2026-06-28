# Xspatula Seed Database

This project is a minimal consumer of the packaged `xspatula` library.

It keeps Thomas' original setup files under `setup/` and does not include AI4SH domain source code.

## What is included

- `setup/setup_db.ipynb`
- `setup/setup_processes.ipynb`
- `setup/delete_db.ipynb`
- `setup/zzz/...` original scheme/job/pilot/process JSON files
- a tiny Flask UI that calls the same setup actions through `xspatula`

## What is not included

- no top-level `ai4sh/` domain project
- no `src/ai4sh/`
- no import-data Excel workflow
- no copied Xspatula source code

Note: `setup/zzz/ai4sh/` is kept because the original scheme file uses `project_path: "./ai4sh"`. This is a legacy setup contract path, not the AI4SH domain project.

## Run

Install your local Xspatula package first:

```bash
pip install -e ../xspatula
```

Then run this app:

```bash
pip install -e .
python run.py
```

Open:

```text
http://127.0.0.1:5000
```

## Important

Before running `setup_db`, edit:

```text
setup/zzz/scheme_ai4sh_local_setup.json
```

and set your local PostgreSQL superuser password.
