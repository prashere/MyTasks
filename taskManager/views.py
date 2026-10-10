import json
import re
from json.decoder import JSONDecodeError

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponseForbidden, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

from .models import Notification, Task, TaskList, Users, Workspace

PRIORITY_LABELS = {"H": "High", "M": "Medium", "L": "Low"}
USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,30}$")


def _json_error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def _parse_json(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except (JSONDecodeError, UnicodeDecodeError):
        return None


def _workspace_or_403(request, workspace_id):
    workspace = get_object_or_404(Workspace, pk=workspace_id)
    if not workspace.user_can_access(request.user):
        return None, _json_error("You do not have access to this workspace.", 403)
    return workspace, None


def _task_or_403(request, task_id):
    task = get_object_or_404(Task, pk=task_id)
    workspace = task.task_list.workspace
    if not workspace.user_can_access(request.user):
        return None, _json_error("You do not have access to this task.", 403)
    return task, None


def _require_creator(request, workspace):
    if not workspace.user_is_creator(request.user):
        return _json_error("Only the workspace creator can do that.", 403)
    return None


def _task_payload(task):
    return {
        "id": task.id,
        "title": task.title,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "priority": task.priority,
        "priority_label": PRIORITY_LABELS.get(task.priority, task.priority),
        "assigned_to": task.assigned_to.username if task.assigned_to else None,
        "is_completed": task.is_completed,
    }


def health(request):
    return JsonResponse({"status": "ok", "service": "mytasks"})


def index(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse("workspace"))
    return render(request, "taskManager/index.html")


@login_required
def individual_workspace(request, id):
    workspace = get_object_or_404(Workspace, pk=id)
    if not workspace.user_can_access(request.user):
        return render(request, "taskManager/forbidden.html", status=403)
    members = workspace.members.all()
    return render(
        request,
        "taskManager/indi_workspace.html",
        {"details": workspace, "members": members},
    )


@login_required
def create_workspace(request):
    categories = [item[0] for item in Workspace.CATEGORY_CHOICES]
    context = {"choice": categories, "error": "", "form": {}}

    if request.method != "POST":
        return render(request, "taskManager/createWork.html", context)

    title = (request.POST.get("title") or "").strip()
    description = (request.POST.get("description") or "").strip()
    category_sent = request.POST.get("category") or ""
    raw_members = request.POST.get("member_usernames") or ""
    context["form"] = {
        "title": title,
        "description": description,
        "category": category_sent,
        "member_usernames": raw_members,
    }

    if not title or not description or category_sent not in {"Personal", "Work"}:
        context["error"] = "Title, description, and a valid category are required."
        return render(request, "taskManager/createWork.html", context)

    member_names = [name.strip() for name in raw_members.split(",") if name.strip()]
    members = []
    missing = []
    if category_sent == "Work":
        if not member_names:
            context["error"] = "Add at least one teammate username for a Work workspace."
            return render(request, "taskManager/createWork.html", context)
        for name in member_names:
            if name == request.user.username:
                continue
            try:
                members.append(Users.objects.get(username=name))
            except Users.DoesNotExist:
                missing.append(name)
        if missing:
            context["error"] = (
                "These usernames were not found: " + ", ".join(missing) + "."
            )
            return render(request, "taskManager/createWork.html", context)
        if not members:
            context["error"] = "Add at least one teammate besides yourself."
            return render(request, "taskManager/createWork.html", context)

    workspace = Workspace(
        title=title,
        description=description,
        category=category_sent,
        creator=request.user,
    )
    workspace.save()

    if category_sent == "Work":
        for user in members:
            Notification.objects.create(
                receiver=user,
                text=f"{request.user.username} added you to {workspace.title}.",
            )
            workspace.members.add(user)

    return HttpResponseRedirect(reverse("indi_workspace", args=[workspace.id]))


@require_POST
def login_view(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return _json_error("Username and password are required.")

    user = authenticate(request, username=username, password=password)
    if user is None:
        if Users.objects.filter(username=username).exists():
            return _json_error("Incorrect password.")
        return _json_error("That username does not exist.")

    login(request, user)
    return JsonResponse({"message": "Signed in.", "redirect": "/workspace"}, status=200)


@require_POST
def register_view(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    confirmation = data.get("re-password") or ""

    if not USERNAME_RE.match(username):
        return _json_error(
            "Username must be 3–30 characters: letters, numbers, dots, hyphens, or underscores."
        )
    if "@" not in email or "." not in email:
        return _json_error("Enter a valid email address.")
    if len(password) < 8:
        return _json_error("Password must be at least 8 characters.")
    if confirmation != password:
        return _json_error("Passwords do not match.")

    try:
        user = Users.objects.create_user(username, email, password)
    except IntegrityError:
        return _json_error("That username is already taken.")

    login(request, user)
    return JsonResponse(
        {"message": "Account created.", "redirect": "/workspace"}, status=200
    )


@login_required
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


@login_required
@require_POST
def create_taskList(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    title = (data.get("title") or "").strip()
    workspace_id = data.get("workspace_id")
    if not title:
        return _json_error("List title cannot be empty.")

    workspace, error = _workspace_or_403(request, workspace_id)
    if error:
        return error
    creator_error = _require_creator(request, workspace)
    if creator_error:
        return creator_error

    new_task_list = TaskList(title=title, workspace=workspace)
    new_task_list.save()
    return JsonResponse(
        {
            "message": "List created.",
            "tasklist_id": new_task_list.id,
            "category": workspace.category,
            "current_members": list(workspace.members.values_list("username", flat=True)),
        },
        status=200,
    )


@login_required
@require_POST
def create_task(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    title = (data.get("task") or "").strip()
    priority = data.get("priority")
    date = data.get("date")
    assigned_to = (data.get("assigned_to") or "").strip()
    tasklist_id = data.get("tasklist_id")

    if not title:
        return _json_error("Task cannot be empty.")
    if priority not in {"H", "M", "L"}:
        return _json_error("Choose a priority.")
    if not date:
        return _json_error("A due date is required.")

    tasklist = get_object_or_404(TaskList, pk=tasklist_id)
    workspace = tasklist.workspace
    if not workspace.user_can_access(request.user):
        return _json_error("You do not have access to this workspace.", 403)
    creator_error = _require_creator(request, workspace)
    if creator_error:
        return creator_error

    assigned_user = None
    if workspace.category == "Work":
        if not assigned_to:
            return _json_error("Assign the task to a teammate.")
        try:
            assigned_user = Users.objects.get(username=assigned_to)
        except Users.DoesNotExist:
            return _json_error("That teammate was not found.")
        if assigned_user != workspace.creator and not workspace.members.filter(
            pk=assigned_user.id
        ).exists():
            return _json_error("You can only assign tasks to workspace members.")

    Task.objects.create(
        title=title,
        due_date=date,
        priority=priority,
        task_list=tasklist,
        assigned_to=assigned_user,
    )
    return JsonResponse({"message": "Task added."}, status=200)


@login_required
@require_GET
def user_workspace(request):
    workspaces = (
        Workspace.objects.filter(Q(creator=request.user) | Q(members=request.user))
        .distinct()
        .order_by("-created_at")
    )
    workspace_data = [
        {
            "id": workspace.id,
            "title": workspace.title,
            "category": workspace.category,
        }
        for workspace in workspaces
    ]
    return JsonResponse({"workspaces": workspace_data}, status=200)


@login_required
@require_POST
def user_lists(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    workspace, error = _workspace_or_403(request, data.get("id"))
    if error:
        return error

    created_tasklists = TaskList.objects.filter(workspace=workspace).order_by(
        "-created_at"
    )
    tasklists = [{"title": item.title, "id": item.id} for item in created_tasklists]
    return JsonResponse({"tasklists": tasklists}, status=200)


@login_required
@require_POST
def return_tasks(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    tasklist = get_object_or_404(TaskList, pk=data.get("id"))
    workspace = tasklist.workspace
    if not workspace.user_can_access(request.user):
        return _json_error("You do not have access to this workspace.", 403)

    is_creator = workspace.user_is_creator(request.user)
    if workspace.category == "Work" and not is_creator:
        present_tasks = Task.objects.filter(
            task_list=tasklist, assigned_to=request.user
        )
    else:
        present_tasks = Task.objects.filter(task_list=tasklist)

    present_tasks = present_tasks.order_by("is_completed", "-created_at")
    payload = {
        "is_creator": is_creator,
        "category": workspace.category,
        "not_assigned": not present_tasks.exists(),
        "tasks": [_task_payload(task) for task in present_tasks],
    }
    return JsonResponse({"task_data": payload}, status=200)


@login_required
@require_POST
def delete_task(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    task, error = _task_or_403(request, data.get("task_id"))
    if error:
        return error
    creator_error = _require_creator(request, task.task_list.workspace)
    if creator_error:
        return creator_error

    task.delete()
    return JsonResponse({"message": "Task deleted."}, status=200)


@login_required
@require_POST
def edit_task(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    task, error = _task_or_403(request, data.get("task_id"))
    if error:
        return error
    creator_error = _require_creator(request, task.task_list.workspace)
    if creator_error:
        return creator_error

    title = (data.get("task") or "").strip()
    if not title:
        return _json_error("Task cannot be empty.")

    task.title = title
    task.save(update_fields=["title"])
    return JsonResponse({"message": "Task updated."}, status=200)


@login_required
@require_POST
def complete_task(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    task, error = _task_or_403(request, data.get("task_id"))
    if error:
        return error

    workspace = task.task_list.workspace
    is_assignee = task.assigned_to_id == request.user.id
    if workspace.category == "Work" and not (
        workspace.user_is_creator(request.user) or is_assignee
    ):
        return _json_error("You can only complete tasks assigned to you.", 403)

    task.is_completed = bool(data.get("is_completed", True))
    task.save(update_fields=["is_completed"])
    return JsonResponse(
        {"message": "Task updated.", "is_completed": task.is_completed}, status=200
    )


@login_required
def show_notification(request):
    notifs = Notification.objects.filter(receiver=request.user).order_by("-created_at")
    message = "No notifications yet." if not notifs.exists() else ""
    return render(
        request,
        "taskManager/notification.html",
        {"notifications": notifs, "message": message},
    )


@login_required
@require_POST
def return_workspace_info(request):
    data = _parse_json(request)
    if data is None:
        return _json_error("Invalid JSON data in the request")

    workspace, error = _workspace_or_403(request, data.get("workspace_id"))
    if error:
        return error

    return JsonResponse(
        {
            "message": "Workspace info fetch success",
            "category": workspace.category,
            "current_members": list(workspace.members.values_list("username", flat=True)),
            "is_creator": workspace.user_is_creator(request.user),
        },
        status=200,
    )


def csrf_failure(request, reason=""):
    if request.path.startswith("/login") or request.content_type == "application/json":
        return _json_error("Session expired. Refresh the page and try again.", 403)
    return HttpResponseForbidden("CSRF check failed. Refresh the page and try again.")
