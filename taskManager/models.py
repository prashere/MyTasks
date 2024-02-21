from django.db import models
from django.contrib.auth.models import AbstractUser

class Users(AbstractUser):
    pass

class Workspace(models.Model):
    choice =[
        ('Personal','Personal'),
        ('Work', 'Work')
    ]
    creator =models.ForeignKey(Users, on_delete=models.CASCADE, related_name='created_by') 
    title = models.CharField(max_length=64,blank=False)
    description = models.TextField(blank= False)
    category = models.CharField(max_length=30,choices=choice,blank = False)
    members = models.ManyToManyField(Users,blank=True,related_name='members')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"workspace: {self.title} by {self.creator}"
    
class TaskList(models.Model):
    title = models.CharField(max_length=64, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='space')

    def __str__(self):
        return f"{self.title}, {self.workspace}"
    

class Task(models.Model):
    choices = [
        ('H','High'),
        ('M','Medium'),
        ('L','Low')
    ]
    task_list = models.ForeignKey(TaskList,on_delete=models.CASCADE, related_name='list')
    title = models.CharField(max_length=64, blank=False)
    due_date = models.DateField()
    priority = models.CharField(max_length=10, choices=choices, blank=False)
    assigned_to = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='worker',null=True, blank=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title}(list : {self.task_list})"
   
   
class Notification(models.Model):
    receiver = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='receiver')
    text = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.text}"