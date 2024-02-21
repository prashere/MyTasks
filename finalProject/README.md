# Workspace Task Manager

## Description

Workspace Task Manager is a feature rich task management web application built on a combination of HTML, CSS, Bootstrap, Django and JavaScript.
 It allows users to efficiently manage their tasks and workspaces. Whether its organizing personal to-do lists or collaborating with colleagues on work-related projects, it caters to both the needs.

## Distinctiveness & Complexity

This project's fulfillment of distinctiveness and complexity requirements is evidenced by the following:

- This application's distinctiveness is evident in its versatile workspace management, role-based task creation, customizable task prioritization, support for both individual and team workspaces, member addition, task manipulation, multiple to-do lists within a single workspace, notification feature, responsiveness, multiple navbars, and dynamic updates via AJAX.

- In 'Work' category workspaces, differentiating between creators and members, and loading specific content, involved intricate coding and meticulous testing.
- Adding role-based access control made things more complicated. It allowed creators to have full control over tasks but needed careful management to limit what members could do.
- Allowing creators to manage tasks across multiple workspaces demanded complex model design, dynamic front-end handling across various sections, which posed a challenge.
- Achieving responsiveness for small screen sizes with numerous icons and text in the side navbar was also a significant challenge.


# Files and Description

This Django Project consists of a single app named `taskManager`. All of the app's files are located within the `/taskManager` directory. The `urls.py` file within this directory contains URL patterns for both the web application and APIs.

The `views.py` file contains numerous functions, each documented with specific functionality in their respective docstrings.

Within the `/templates/taskManager` directory, you'll find 5 HTML templates:

1. `index.html`: This serves as the main landing page when opening the app. It dynamically generates the sign-in and register forms through the associated JavaScript file `index.js`.

2. `notification.html`: This template is used for displaying notifications and inherits from `layout.html`.

3. `createWork.html`: This template is for creating new workspaces and inherits from `layout.html`.

4. `indi_workspace.html`: This template inherits from `layout.html`, which includes a side navbar. `workspace.js` is linked to `indi_workspace.html`, containing functions that make API calls and dynamically modify page content.

Additionally, there are two CSS files:

1. `layout.css`: This file contains styling information for the layout.

2. `style.css`: This file contains additional styling rules for the application.

## Features:

1. **User Account Creation**
   - Users create accounts to manage workspaces and task lists.

2. **New Workspace Creation**
   - Upon signing in, users access a workspace creation form.
   - Form includes fields for title (text), description (textarea), and category (select: 'Personal' or 'Work'). Choosing 'Work' adds user checkboxes, with at least one selection required.
   - After workspace creation, users are redirected to the workspace page.

3. **Task Lists**
   - Within workspaces, users click '+ ADD NEW LIST' to create task lists.
   - They must enter title and click 'Create' to add the task list.
   - Task lists are accessible via the 'Lists' dropdown in the top navbar.

4. **Task Creation**
   - In each task list, below the title, there's a form with a 'Save' button to add tasks.
   - For Personal workspaces, users input task, due-date, and priority.
   - In Work workspaces, creators assign tasks to members, inputting task, due-date, priority, and assignee.
   - Non-creators in Work workspaces can't add tasks.

5. **Task Management**
   - Users view, edit, or delete tasks.
   - Tasks can be marked as completed by checking the leftmost button.

6. **Task Management in Work Workspaces**
   - Workspace members view assigned tasks but can't edit or delete them.
   - They can only mark tasks as completed.
   - Creators can edit, delete tasks, and assign them.

7. **Notifications**
   - Users receive notifications when added to 'Work' category workspaces. Notifications are accessible in their notification page.

## Installation and Usage
1.	Clone this repository in your local device.
2. Run 'python manage.py makemigrations taskManager' in terminal.
3. Run 'python manage.py migrate' in terminal.
2.	In terminal run ‘python manage.py runserver’ to start the web app.

