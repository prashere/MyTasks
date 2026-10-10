from django.test import Client, TestCase
from django.urls import reverse

from .models import Task, TaskList, Users, Workspace


class MyTasksTests(TestCase):
    def setUp(self):
        self.owner = Users.objects.create_user("owner", "owner@example.com", "password12")
        self.member = Users.objects.create_user("member", "member@example.com", "password12")
        self.stranger = Users.objects.create_user(
            "stranger", "stranger@example.com", "password12"
        )

    def test_health(self):
        response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["service"], "mytasks")

    def test_register_and_login_redirects_authenticated_index(self):
        response = self.client.post(
            reverse("register"),
            data={
                "username": "newuser",
                "email": "new@example.com",
                "password": "password12",
                "re-password": "password12",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Users.objects.filter(username="newuser").exists())

        home = self.client.get(reverse("index"))
        self.assertEqual(home.status_code, 302)
        self.assertEqual(home.url, "/workspace")

    def test_workspace_requires_login(self):
        response = self.client.get(reverse("workspace"))
        self.assertEqual(response.status_code, 302)

    def test_cannot_open_someone_elses_workspace(self):
        workspace = Workspace.objects.create(
            title="Private",
            description="Mine",
            category="Personal",
            creator=self.owner,
        )
        self.client.force_login(self.stranger)
        response = self.client.get(reverse("indi_workspace", args=[workspace.id]))
        self.assertEqual(response.status_code, 403)

    def test_create_personal_workspace_and_task_flow(self):
        self.client.force_login(self.owner)
        response = self.client.post(
            reverse("workspace"),
            {
                "title": "Home",
                "description": "Personal chores",
                "category": "Personal",
            },
        )
        self.assertEqual(response.status_code, 302)
        workspace = Workspace.objects.get(title="Home")

        created = self.client.post(
            reverse("tasklist"),
            data={"title": "Today", "workspace_id": workspace.id},
            content_type="application/json",
        )
        self.assertEqual(created.status_code, 200)
        tasklist_id = created.json()["tasklist_id"]

        added = self.client.post(
            reverse("task"),
            data={
                "task": "Buy milk",
                "priority": "M",
                "date": "2030-01-01",
                "tasklist_id": tasklist_id,
                "assigned_to": "",
            },
            content_type="application/json",
        )
        self.assertEqual(added.status_code, 200)
        task = Task.objects.get(title="Buy milk")
        self.assertFalse(task.is_completed)

        completed = self.client.post(
            reverse("completeTask"),
            data={"task_id": task.id, "is_completed": True},
            content_type="application/json",
        )
        self.assertEqual(completed.status_code, 200)
        task.refresh_from_db()
        self.assertTrue(task.is_completed)
        self.assertTrue(Task.objects.filter(pk=task.id).exists())

    def test_work_member_sees_only_assigned_tasks(self):
        workspace = Workspace.objects.create(
            title="Team",
            description="Ship it",
            category="Work",
            creator=self.owner,
        )
        workspace.members.add(self.member)
        tasklist = TaskList.objects.create(title="Sprint", workspace=workspace)
        mine = Task.objects.create(
            title="Write tests",
            due_date="2030-01-01",
            priority="H",
            task_list=tasklist,
            assigned_to=self.member,
        )
        Task.objects.create(
            title="Secret",
            due_date="2030-01-01",
            priority="L",
            task_list=tasklist,
            assigned_to=self.owner,
        )

        member_client = Client()
        member_client.force_login(self.member)
        response = member_client.post(
            reverse("allTasks"),
            data={"id": tasklist.id},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        titles = [item["title"] for item in response.json()["task_data"]["tasks"]]
        self.assertEqual(titles, ["Write tests"])
        self.assertEqual(mine.assigned_to, self.member)

    def test_stranger_cannot_delete_task(self):
        workspace = Workspace.objects.create(
            title="Home",
            description="x",
            category="Personal",
            creator=self.owner,
        )
        tasklist = TaskList.objects.create(title="Today", workspace=workspace)
        task = Task.objects.create(
            title="Keep me",
            due_date="2030-01-01",
            priority="L",
            task_list=tasklist,
        )
        self.client.force_login(self.stranger)
        response = self.client.post(
            reverse("deleteTask"),
            data={"task_id": task.id},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Task.objects.filter(pk=task.id).exists())
