from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Notification, Task, TaskList, Users, Workspace


@admin.register(Users)
class UsersAdmin(UserAdmin):
    list_display = ("username", "email", "is_staff", "date_joined")


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "creator", "created_at")
    list_filter = ("category",)
    search_fields = ("title", "creator__username")


@admin.register(TaskList)
class TaskListAdmin(admin.ModelAdmin):
    list_display = ("title", "workspace", "created_at")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "task_list", "priority", "due_date", "is_completed", "assigned_to")
    list_filter = ("priority", "is_completed")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("receiver", "text", "created_at")
