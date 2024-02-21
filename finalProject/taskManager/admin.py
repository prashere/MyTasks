from django.contrib import admin
from .models import Users,Workspace,TaskList,Task,Notification

# Register your models here.
admin.site.register(Workspace)
admin.site.register(Users)
admin.site.register(Task)
admin.site.register(TaskList)
admin.site.register(Notification)
