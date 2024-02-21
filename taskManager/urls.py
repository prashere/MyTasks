from django.urls import path
from . import views

urlpatterns = [
    path('',views.index,name='index'),
    path('workspace', views.create_workspace, name='workspace'),
    path('logout/',views.logout_view, name='signout'),
    path('workspace/<int:id>', views.individual_workspace, name='indi_workspace'),
    path('notification', views.show_notification, name='notification'),

    # API paths
    path('login/', views.login_view, name='login'),
    path('register/',views.register_view, name='register'),
    path('tasklist/', views.create_taskList, name='tasklist'),
    path('task/', views.create_task, name='task'),
    path('userWorkspace/', views.user_workspace,name = 'userWorkspace'),
    path('userTasklists/', views.user_lists, name='userTasklists'),
    path('allTasks/', views.return_tasks, name='allTasks'),
    path('deleteTask/', views.delete_task, name='deleteTask'),
    path('editTask/', views.edit_task, name='editTask'),
    path('workspaceInfo/', views.return_workspace_info, name='workspaceInfo'),
]