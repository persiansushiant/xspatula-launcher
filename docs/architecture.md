---
layout: page
title: Architecture
permalink: /architecture/
---

# 🏗 Architecture

Xspatula follows a modular architecture.

The ecosystem is intentionally divided into multiple independent repositories.

```
                    +--------------------+
                    |   Xspatula Core    |
                    |  Python Library    |
                    +----------+---------+
                               |
                               |
                +--------------+--------------+
                |                             |
                |                             |
      +---------v---------+        +----------v----------+
      | Xspatula Launcher |        |       AI4SH         |
      | Flask UI          |        | Real Application    |
      +-------------------+        +---------------------+
```

---

# Xspatula

The Xspatula repository contains the reusable core library.

Responsibilities:

- PostgreSQL management
- Database initialization
- Process execution
- Notebook compatibility
- Utility functions
- Core business logic

The library contains no graphical interface.

---

# Xspatula Launcher

The Launcher is a Flask application.

Responsibilities:

- Modern graphical interface
- Database wizard
- Process wizard
- Execution logs
- Progress tracking
- Learning game
- User onboarding

The Launcher contains almost no business logic.

Instead it calls functions provided by the Xspatula library.

Example:

```python
from xspatula.setup import Initiate_database

Initiate_database(...)
```

---

# AI4SH

AI4SH is a consumer project.

Instead of copying source code it imports Xspatula.

```python
from xspatula import Initiate_process
```

This keeps every application synchronized with the latest version of the library.

---

# Why this architecture?

Separating responsibilities has several advantages.

- Single source of truth
- Easier maintenance
- Smaller applications
- Independent releases
- Cleaner testing
- Better documentation

---

# Interactive Mode

Xspatula supports two execution modes.

## Interactive

Used by notebooks.

The library asks the user for confirmation.

```
Create database?

y / n
```

## Headless

Used by Flask.

```
interactive=False
```

No user interaction is required.

---

# Repository Structure

```
xspatula/
```

Core Library

```
xspatula-launcher/
```

Graphical Interface

```
ai4sh/
```

Application

---

# Future

Additional applications can reuse the same library.

Examples

- AI4Soil
- AI4Education
- AI4Health
- AI4Anything