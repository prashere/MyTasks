from django.contrib.auth.models import AbstractUser
from django.db import models


class Users(AbstractUser):
    def __str__(self):
        return self.username


class Workspace(models.Model):
    CATEGORY_CHOICES = [
        ("Personal", "Personal"),
        ("Work", "Work"),
    ]
    # Keep the original attribute name so existing templates keep working.
    choice = CATEGORY_CHOICES

    creator = models.ForeignKey(
        Users, on_delete=models.CASCADE, related_name="created_by"
    )
    title = models.CharField(max_length=64)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    members = models.ManyToManyField(Users, blank=True, related_name="members")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.category})"

    def user_can_access(self, user):
        if not user or not user.is_authenticated:
            return False
        if self.creator_id == user.id:
            return True
        return self.members.filter(pk=user.id).exists()

    def user_is_creator(self, user):
        return bool(user and user.is_authenticated and self.creator_id == user.id)


class TaskList(models.Model):
    title = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="space"
    )

    def __str__(self):
        return f"{self.title} — {self.workspace.title}"


class Task(models.Model):
    PRIORITY_CHOICES = [
        ("H", "High"),
        ("M", "Medium"),
        ("L", "Low"),
    ]
    choices = PRIORITY_CHOICES

    task_list = models.ForeignKey(
        TaskList, on_delete=models.CASCADE, related_name="list"
    )
    title = models.CharField(max_length=64)
    due_date = models.DateField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES)
    assigned_to = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name="worker",
        null=True,
        blank=True,
        default=None,
    )
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Notification(models.Model):
    receiver = models.ForeignKey(
        Users, on_delete=models.CASCADE, related_name="receiver"
    )
    text = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text
