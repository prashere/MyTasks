from django.shortcuts import render
from django.db import IntegrityError
from django.db.models import Q
from django.urls import reverse
from django.http import HttpResponseRedirect,JsonResponse
from django.contrib.auth import login, logout, authenticate

from .models import Users,Workspace,TaskList,Task,Notification

import json
from json.decoder import JSONDecodeError
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required


def index(request):
    """
    Renders the index page of the website
    """
    return render(request, 'taskManager/index.html')


def individual_workspace(request,id):
    """
    Renders the requested Workspace's page based on its ID
    """
    current_members = []

    details = Workspace.objects.get(pk=id)
    members = details.members.all()
    for user in members:
        current_members.append(user.username)

    return render(request,'taskManager/indi_workspace.html',{'details':details,'members':members})


def create_workspace(request):
    """
    If the request's method is post:
        Gets all the necessary values input by the user, creates a workspace object and saves
        it. Then it renders a new page for the created workspace.
    Else:
        Renders a page that contains a form which lets the user create a new workspace.
    """
    category = []
    choice = Workspace.choice

    user = Users.objects.all()
    for item in choice:
        category.append(item[0])

    if request.method == 'POST':
        creator = request.user
        title = request.POST['title']
        description = request.POST['description']
        category_sent = request.POST['category']
        selected_users = request.POST.getlist('selected_users')

        workspace = Workspace(title=title,description=description,category=category_sent,creator=creator)
        workspace.save()
        
        if category_sent =='Work':
             if selected_users:
                for user_id in selected_users:
                 # Retrieving Users instance via id
                 user = Users.objects.get(pk=int(user_id))  
                 title=f'You have been added to {workspace.title} workspace'

                # Creating and saving notification instance
                 notification = Notification(receiver=user,text=title)
                 notification.save()

                # Adding user object as a member of workspace
                 workspace.members.add(user) 

        url = reverse('indi_workspace', args=[workspace.id])
        return HttpResponseRedirect(url)

    return render(request, 'taskManager/createWork.html',{'choice':category,'users':user})


@csrf_exempt
def login_view(request):
    """
    Handles the user login through post request. If the username and password are correct,
    logs the user in otherwise returns appropriate error messages.
    """
    if request.method != 'POST':
        return JsonResponse({'error':'POST request required '},status = 400)
    
    data = json.loads(request.body.decode('utf-8'))
    username = data['username']
    password = data['password']

    user = authenticate(request, username=username,password=password)

    if user is not None:
        login(request,user)
        return JsonResponse({'message':'Login Successful'},status = 200)
    else:
        try:
            user = Users.objects.get(username=username)
        except Users.DoesNotExist:
            return JsonResponse({'error': "Username doesn't exist"}, status=400)
        
        return JsonResponse({'error': "Invalid password"}, status=400)


@csrf_exempt   
def register_view(request):
    """
    Handles the user registration through post request.
    """
    if request.method != 'POST':
        return JsonResponse({'error':'POST request required '},status = 400)
    
    data = json.loads(request.body)
    username = data['username']
    email = data['email']
    password = data['password']
    confirmation = data['re-password']
    if confirmation != password:
        return JsonResponse( {'error':'Passwords do not match'},status= 400)
    
    # Attempting to create a new user
    try:
        user = Users.objects.create_user(username,email,password)
        user.save()
        return JsonResponse({'message':"Successful Registration"},status = 200)
    except IntegrityError:
        return JsonResponse({'error':'Username already taken'}, status = 400)
    

def logout_view(request):
    """
    Log a user out and redirect them to the index page.
    """
    logout(request)
    return HttpResponseRedirect(reverse('index'))


@csrf_exempt
def create_taskList(request):
    """
    If request's method is POST:
        Create a new task list associated with a workspace and saves it.

    In every case(success/error) it returns featured informative JSON responses.
    """
    if request.method != 'POST':
        return JsonResponse({'error':'POST request required'},status = 400)
    try:
         data = json.loads(request.body)
         workspace_id = data.get('workspace_id')
         title = data.get('title')

         workspace = Workspace.objects.get(pk=workspace_id)
         # Category of current workspace
         category = workspace.category
         # Members of the current workspace
         members = workspace.members.all()
         current_members = []

         for person in members:
             current_members.append(person.username)

         new_taskList = TaskList(title = title,workspace = workspace)
         new_taskList.save()
         return JsonResponse({'message':'Tasklist successfully created','tasklist_id':new_taskList.id,'category':category,'current_members':current_members},status = 200)
    except JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data in the request'}, status=400)
    except:
        return JsonResponse({'error':"Problem creating tasklist"}, status = 400)
    

@csrf_exempt  
def create_task(request):
    """
    If request's method is POST:
        Create a new task associated with a tasklist and saves it.

    In every case(success/error) it returns featured informative JSON responses.
    """
    if request.method != 'POST':
        return JsonResponse({'error':'POST request required'})
    try:
        data = json.loads(request.body)
        task = data.get('task')
        priority = data.get('priority')
        date = data.get('date')
        assigned_to = data.get('assigned_to')

        if assigned_to:
            assigned_user = Users.objects.get(username = assigned_to)
        else:
            assigned_user = None

        tasklist_id = data.get('tasklist_id')
        tasklist = TaskList.objects.get(pk=tasklist_id)
        if task.strip():
            new_task = Task(title = task, due_date = date, priority=priority,task_list = tasklist,assigned_to = assigned_user)
            new_task.save()
            return JsonResponse({'message':'Task successfully added'}, status = 200)
        else:
            return JsonResponse({'error':'Task cannot be empty'},status=400)
    except JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data in the request'}, status=400)
    except TaskList.DoesNotExist:
        return JsonResponse({'error': 'TaskList does not exist'}, status=400)
    

@login_required
def user_workspace(request):
    """
    Gets the currently authenticated user from the request.

    Tries to fetch all the workspaces created by the current user and sends it in the form of JSON response.
    If there is problem in fetching it, returns an error as a JSON response.
    """
    current_user = request.user
    try:
        workspaces = (Workspace.objects.filter(Q(creator=current_user) | Q(members=current_user)).distinct()).order_by('-created_at')
        workspace_data = [{
            'id': workspace.id,
            'title': workspace.title
        }
        for workspace in workspaces
        ] 
        return JsonResponse({'workspaces': workspace_data}, status=200, safe=False)
    except:
        return JsonResponse({'error':"Problem fetching user's workspaces"},status = 400)


@login_required
@csrf_exempt
def user_lists(request):
    """
    If request's method is post:
       - Gets the currently authenticated user form the request
       - Fetches the tasklists created by that user 
         within the specified workspace. 
       - It then returns a JSON response containing a list of tasklists.
    If an issue occurs:
        - Returns error as a JSON response.

    """
    if request.method != 'POST':
        return JsonResponse({'error':'POST request required'})
    
    try:
        data = json.loads(request.body)

        id = data.get('id')
        current_workspace = Workspace.objects.get(pk=id)

        created_tasklists = (TaskList.objects.filter(workspace = current_workspace)).order_by('-created_at')
        tasklists =[{
            'title':tasklist.title,
            'id':tasklist.id
        }
        for tasklist in created_tasklists]

        return JsonResponse({'tasklists':tasklists}, safe=False, status = 200)
    except:
        return JsonResponse({'error':"Problem fetching user's tasklists"},status = 400)


@csrf_exempt
def return_tasks(request):
    """
    If request's method is post:
        - It retrieves tasks associated with the
          specified tasklist, orders them by their creation date in descending order, and returns
          them as a JSON response.

    If an issue occurs:
        - Returns error as a JSON response.
    """
    if request.method != 'POST':
        return JsonResponse({'error':'POST request required'})
    
    #try:
    is_creator = False
    not_assigned= False
    data = json.loads(request.body)
    tasklist_id = data.get('id')
    current_tasklist = TaskList.objects.get(id=tasklist_id)
    workspace = current_tasklist.workspace
    creator = workspace.creator
    category = workspace.category
    if creator == request.user:
        is_creator = True
    if(category == 'Personal'):
        present_tasks = (Task.objects.filter(task_list = current_tasklist)).order_by('-created_at')
        if not present_tasks.exists():
            not_assigned = True
        data={'is_creator':is_creator,'category':category,'not_assigned':not_assigned,'tasks': [
        {'id':task.id,
         'title':task.title,
         'due_date':task.due_date,
         'priority':task.priority,
        }
         for task in present_tasks
    ]}
    elif(category == 'Work' and creator!=request.user):
        present_tasks = (Task.objects.filter(task_list = current_tasklist,assigned_to =request.user)).order_by('-created_at')
        if not present_tasks.exists():
            not_assigned = True
        data={'is_creator':is_creator,'category':category,'not_assigned':not_assigned,'tasks': [
        {'id':task.id,
         'title':task.title,
         'due_date':task.due_date,
         'priority':task.priority,
         'assigned_to':(task.assigned_to).username
        }
         for task in present_tasks
    ]}
    elif(category == 'Work' and creator == request.user):
        present_tasks = (Task.objects.filter(task_list = current_tasklist)).order_by('-created_at')
        if not present_tasks.exists():
            not_assigned = True
        data={'is_creator':is_creator,'category':category,'not_assigned':not_assigned,'tasks': [
        {'id':task.id,
         'title':task.title,
         'due_date':task.due_date,
         'priority':task.priority,
         'assigned_to':(task.assigned_to).username
        }
         for task in present_tasks
    ]}
    return JsonResponse({'task_data':data},safe=False, status = 200)
    #except:
        #return JsonResponse({'error':"Problem fetching user's tasks"},status = 400)


@csrf_exempt
def delete_task(request):
    """
    If request's method is post:
        - Fetches the tasklist via sent id and deletes it.
    Else:
        -Returns error in JSON response.
    """
    if request.method != 'POST':
        return JsonResponse({'error':'POST request required '},status = 400)
    try:
        data=json.loads(request.body)
        id = data.get('task_id')

        task = Task.objects.get(pk=id)
        task.delete()
        return JsonResponse({'message':'Task successfully deleted !'},status=200)
    except:
        return JsonResponse({'error':'Problem deleting the task!'},status = 400)


@csrf_exempt
def edit_task(request):
    """
    If request's method is post:
        - Fetches the tasklist via sent id, sets its content to sent content and saves it.
    Else:
        -Returns error in JSON response.
    """
    if request.method != 'POST':
        return JsonResponse({'error':'POST request required '},status = 400)
    try:
        data=json.loads(request.body)
        id = data.get('task_id')
        task_value = data.get('task')

        task = Task.objects.get(pk=id)
        task.title=task_value
        task.save()

        return JsonResponse({'message':'Task successfully edited and saved !'},status=200)
    except:
        return JsonResponse({'error':'Problem editing the task!'},status = 400)
    
@login_required
def show_notification(request):
    """
        It retrieves and displays notifications for the currently logged-in user.
    """
    current_user = request.user
    message = ''

    notifs = (Notification.objects.filter(receiver = current_user)).order_by('-created_at')
    if not notifs.exists():
        message='No notifications yet !'

    return render(request,'taskManager/notification.html',{'notifications':notifs,'message':message})


@csrf_exempt
def return_workspace_info(request):
    """
        It returns information about a workspace based on a POST request containing the workspace_id.
    """
    if request.method != 'POST':
        return JsonResponse({'error':'POST request required'},status = 400)
    try:
         data = json.loads(request.body)
         workspace_id = data.get('workspace_id')

         workspace = Workspace.objects.get(pk=workspace_id)
         category = workspace.category
         members = workspace.members.all()
         current_members = []

         for person in members:
             current_members.append(person.username)

         return JsonResponse({'message':'Workspace info fetch success','category':category,'current_members':current_members},status = 200)
    except JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data in the request'}, status=400)
    except:
        return JsonResponse({'error':"Problem fetching workspace info"}, status = 400)
    



