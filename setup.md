# Setup Guide

This guide runs myTasks on your own computer. You will use a Python virtual environment (no Docker, no API keys).

When you are done, you will have:

- The website at [http://localhost:8002](http://localhost:8002) (this checkout defaults to **8002** so it does not clash with Career Intelligence on 8000 or the Tech Market Trend Analyzer on 8001)
- Health check at [http://localhost:8002/health/](http://localhost:8002/health/)

---

## What you need

| Requirement | Why |
| --- | --- |
| **Python 3.10+** | Django 4.2 |
| **pip** | Installs packages from `requirements.txt` |

If Career Intelligence or the analyzer are already running, leave the app on **8002**. If this project is the only app on the machine, you can use `8000`.

---

## 1. Open the project

From the Career Intelligence root (where you cloned this folder):

```bash
cd MyTasks
```

Or clone it on its own:

```bash
git clone https://github.com/prashere/MyTasks.git
cd MyTasks
```

---

## 2. Create a virtual environment

macOS / Linux:

```bash
python3 --version
```

You need **3.10 or newer**. On many Macs `python3` is still 3.9. If so, use Homebrew Python:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

If `python3` is already 3.10+:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

Your prompt should show `(.venv)`.

---

## 3. Install packages

```bash
pip install -r requirements.txt
```

---

## 4. Create your environment file

```bash
cp .env.template .env
```

You can leave the defaults. Optional values:

| Variable | Meaning |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django secret. Change it if you ever expose the app beyond your machine. |
| `DEBUG` | `true` for local use |
| `ALLOWED_HOSTS` | Hosts Django will serve |
| `PORT` | Documented port for this checkout (`8002`) |

`.env` is listed in `.gitignore`. Do not add it to Git.

---

## 5. Create the database

```bash
python manage.py migrate
```

This creates `db.sqlite3` in this folder. That file is local and is not committed.

Optional — a Django admin user:

```bash
python manage.py createsuperuser
```

Admin is at [http://localhost:8002/admin/](http://localhost:8002/admin/).

---

## 6. Start the website

With `.venv` active, from `MyTasks/`:

```bash
python manage.py runserver 8002
```

In a **new** terminal:

```bash
curl http://localhost:8002/health/
```

You should see:

```json
{"status":"ok","service":"mytasks"}
```

Open [http://localhost:8002](http://localhost:8002). You should see the landing page.

---

## 7. Walk through the app once

Use two browsers or one normal window and one private window.

1. **Register** user `ada` (password at least 8 characters).
2. You should land on **Create workspace**. Make a **Personal** workspace, add a list, add a task, click the circle to complete it. The task should stay on the list with a strike-through. Click again to undo.
3. **Register** user `grace` in the other window.
4. As `ada`, create a **Work** workspace and invite `grace`.
5. As `grace`, open **Notifications**, then open the workspace from the sidebar. You should see only tasks assigned to you.

If a username is wrong on the Work form, the page stays on the form and tells you which names were not found.

---

## 8. Stop

In the terminal that is running Django, press **Ctrl+C**.

Deactivate the virtualenv:

```bash
deactivate
```

`db.sqlite3` stays on disk. The next `runserver` will reuse it.

To start clean (deletes all accounts and tasks):

```bash
rm -f db.sqlite3
python manage.py migrate
```

---

## Everyday commands

```bash
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python manage.py migrate
python manage.py runserver 8002
python manage.py test taskManager
curl http://localhost:8002/health/
```

---

## Troubleshooting

**`address already in use` on port 8002**  
Something else is bound to that port. Use another port: `python manage.py runserver 8003`.

**Landing page shows “Get started” even after you registered**  
You are not signed in. Register again or sign in. A successful sign-in redirects to `/workspace`.

**“These usernames were not found”**  
The teammate must already have an account. Usernames are case-sensitive.

**`You do not have access to this workspace`**  
You opened someone else’s workspace URL. Use the sidebar.

**Static images or CSS missing**  
Run the server from the `MyTasks/` folder, not from a parent directory.

**Want a full reset**

```bash
deactivate
rm -rf .venv db.sqlite3
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8002
```

---

## What “working” looks like

1. `curl http://localhost:8002/health/` returns `{"status":"ok","service":"mytasks"}`
2. [http://localhost:8002](http://localhost:8002) shows the landing page
3. Register → create workspace form
4. Personal workspace: add a list and a task; complete does not delete it
5. Work workspace: invite a second user; they see a notification and only their assignments

For what the product does, see [README.md](README.md).
