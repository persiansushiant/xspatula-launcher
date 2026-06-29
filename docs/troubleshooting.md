---
layout: page
title: Troubleshooting
permalink: /troubleshooting/
---

# 🔧 Troubleshooting

This page lists the most common problems encountered when using Xspatula Launcher.

---

# PostgreSQL Connection Failed

Example

```
Could not connect to Postgres server
```

Possible causes

- PostgreSQL is not running.
- Wrong credentials.
- Wrong port.
- Firewall restrictions.

Verify your PostgreSQL configuration.

---

# Environment File Not Found

Example

```
.login_evaluation.env does not exist
```

Verify that

```
src/postgres/environment
```

contains the generated environment files.

If necessary, run

**Create Database**

again.

---

# Process Registration Failed

Verify that

```
job_setup_processes.json
```

exists.

Also verify the selected scheme file.

---

# Missing Library

Example

```
ModuleNotFoundError
```

Install Xspatula.

```powershell
pip install -e ../xspatula
```

or

```powershell
pip install xspatula
```

---

# Wrong Xspatula Version

Check the installed version.

```powershell
python -c "import importlib.metadata as m; print(m.version('xspatula'))"
```

Update if necessary.

```powershell
pip install --upgrade xspatula
```

---

# Interactive Prompt Appears

If the Launcher still asks for

```
y / n
```

verify that

```
interactive=False
```

is passed to

```
Initiate_database(...)
```

---

# Git Repository Issues

If Git reports

```
detected dubious ownership
```

verify that you are inside the project repository.

Check

```powershell
pwd
```

and

```powershell
git rev-parse --show-toplevel
```

The project repository should never be the root of the `C:` drive.

---

# Need More Help?

If the issue persists, please include:

- Launcher version
- Xspatula version
- Operating system
- Python version
- Full console output

This information makes diagnosing problems much easier.