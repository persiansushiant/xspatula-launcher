---
layout: page
title: Quickstart
permalink: /quickstart/
---

# 🚀 Quickstart

This guide walks you through setting up **Xspatula Launcher** from scratch.

---

# Prerequisites

Before running the launcher, make sure you have:

- Python 3.12+
- PostgreSQL installed and running
- Git
- A local clone of the Xspatula Core Library

---

# Clone the repositories

Clone both repositories.

```powershell
git clone https://github.com/persiansushiant/xspatula.git

git clone https://github.com/persiansushiant/xspatula-launcher.git
```

---

# Install Xspatula

Go to the launcher project.

```powershell
cd xspatula-launcher
```

Install the Xspatula library.

For development:

```powershell
pip install -e ../xspatula
```

Or install the latest released version:

```powershell
pip install xspatula
```

---

# Configure PostgreSQL

Open:

```text
setup/zzz/scheme_ai4sh_local_setup.json
```

Update the PostgreSQL settings to match your local installation.

Example:

```json
{
  "postgresdb": {
    "host": "localhost",
    "port": 5432,
    "db": "ai4sh"
  }
}
```

---

# Run the Launcher

Start Flask.

```powershell
python run.py
```

Open your browser.

```
http://127.0.0.1:5000
```

---

# Initialize a Project

Inside the Launcher run the following steps.

1. Create Database
2. Setup Processes

The launcher will:

- Create the PostgreSQL database
- Create schemas
- Create tables
- Create users
- Generate environment files
- Register Xspatula processes

---

# Delete Database

If you want to start over, use:

- Delete Database

This executes the original Xspatula delete workflow.

---

# Learning Game

Click

**Open Learning Game**

to launch the interactive architecture tutorial.

---

# Troubleshooting

If PostgreSQL cannot be reached:

- Verify PostgreSQL is running.
- Check your credentials.
- Verify the configuration JSON.

If Xspatula cannot be imported:

```powershell
pip install -e ../xspatula
```

or

```powershell
pip install --upgrade xspatula
```

---

# Next

Continue with:

- Architecture
- Launcher UI
- AI4SH Integration