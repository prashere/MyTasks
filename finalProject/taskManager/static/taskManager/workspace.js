function addTaskWorkCategory(tasklist_id, category, current_members) {
    /* Displaying different add task section for tasklists of Personal and Work category. */
    if (document.querySelector('#addTaskContainer')) {
        if (category == 'Personal') {
            // Adding the card to add task and save it to the tasklist
            const addTaskContainer = document.querySelector('#addTaskContainer');
            addTaskContainer.innerHTML = `<div class="card-body"><input type="text" class="title" style="background-color:white;" id='title-${tasklist_id}' placeholder="Add a task " required></input><select class="priority" id='priority-${tasklist_id}' style="margin-right: 15px; padding:2px;" required><option disabled selected value="">Select priority</option><option value="H">High</option><option value="M">Medium</option><option value="L">Low</option></select><label for="date" class="date" style="margin-bottom: 2px; margin-right:3px;">Due-date  </label><input type="date" class="dateVal" id='date-${tasklist_id}' name="date" pattern="\d{4}-\d{2}-\d{2}" required>&nbsp;<div class="btn btn-danger" id="save-task" data-save-id ='${tasklist_id}' style="background-color: black; border: none;"> Save</div></div>`;
        }
        else {
            const addTaskContainer = document.querySelector('#addTaskContainer');
            addTaskContainer.innerHTML = `<div class="card-body"><input type="text" class="title" style="background-color:white;" id='title-${tasklist_id}' placeholder="Add a task " required></input><select class="priority" id='priority-${tasklist_id}' style="margin-right: 15px; padding:2px;" required><option disabled selected value="">Select priority</option><option value="H">High</option><option value="M">Medium</option><option value="L">Low</option></select><label for="date" class="date" style="margin-bottom: 2px; margin-right:3px;">Due-date  </label><input type="date" class="dateVal" id='date-${tasklist_id}' name="date" pattern="\d{4}-\d{2}-\d{2}" required>&nbsp;<div class="btn btn-danger" id="save-task" data-save-id ='${tasklist_id}' style="background-color: black; border: none;"> Save</div></div>`;
            members = current_members

            const footer = document.createElement('div');
            footer.classList.add('card-footer');

            const p = document.createElement('p');
            p.innerHTML = 'Assign to : ';

            var select = document.createElement('select');
            select.id = 'assign';

            const placeholder = document.createElement('option');
            placeholder.text = "Select an user";
            placeholder.value = "";
            placeholder.disabled = true;
            placeholder.selected = true;

            select.append(placeholder);

            members.forEach(member => {
                var option = document.createElement('option');
                option.value = member;
                option.text = member;
                select.append(option);
            })
            footer.append(p);
            footer.append(select);
            addTaskContainer.append(footer);
        }
    }
}

function showTasklist(workspace_id) {
    /*
    On click of an individual list of the dropdown menu:
        - Displays the list with provided title
        - Adds the card for adding tasks into the tasklist
        - Calls respective functions to handle saving and displaying tasks of that particular tasklist.
    */
    document.querySelectorAll('.clickable-list').forEach(list => {
        const tasklist_id = list.getAttribute('data-list-id');

        list.addEventListener('click', () => {
            document.querySelector('.list').style.display = 'block';
            document.querySelector('#taskContainer').innerHTML = '';
            document.querySelector('.list_name').style.display = 'none';

            fetch('/workspaceInfo/', { method: 'POST', body: JSON.stringify({ 'workspace_id': workspace_id }) })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        addTaskWorkCategory(tasklist_id, data.category, data.current_members);
                        saveTasks(); //function call
                    }
                    else if (data.error) {
                        console.log(error);
                    }

                })
                .catch(error => {
                    console.log("Workspace info fetch error ", error)
                })
            setMinDate() //function call

            const list_title = list.innerHTML;
            document.querySelector('#add').innerHTML = list_title;

            showTasks(tasklist_id); //function call
        })
    })
}

function showTasks(tasklist_id) {
    /*
     Retrieves and displays a list of tasks associated with a given tasklist ID.
    
     This function sends a POST request to '/allTasks/' with the provided 'tasklist_id',
     retrieves the tasks associated with that ID, and dynamically generates HTML elements
     to display the tasks in a card format within the 'taskContainer' element on the web page.
    */
    fetch('/allTasks/', {
        method: 'POST',
        body: JSON.stringify({ 'id': tasklist_id })
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const is_creator = data.task_data.is_creator;
            const category = data.task_data.category;
            const tasks = data.task_data.tasks;
            const not_assigned = data.task_data.not_assigned;


            const parentContainer = document.querySelector('#taskContainer');
            parentContainer.innerHTML = '';

            if(not_assigned){
                parentContainer.innerHTML='<p style="color:white;">No tasks !</p>';
            }

            tasks.forEach(task => {
                const card = document.createElement('div');
                const id = task.id;
                card.classList.add('card');
                card.innerHTML = `<div class="card-body display-card" id='card-${id}'><div class="upper-card"><i class="fa-regular fa-circle check" data-card-id=${id} id='check' ></i><p class="task-display" id='task-${id}'>${task.title}</p></div><div class="lower-card"><div class="priority" id='priority-${id}'><p style="display: inline-block;"> Priority :</p> <div class="btn btn-danger priority-icon">${task.priority}</div></div><p> Due : ${task.due_date} </p><div class="task-icons"><i class="fa-solid fa-trash delete" data-del-id ='${id}'></i><i class="fa-regular fa-pen-to-square edit" data-edit-id="${id}"></i></div></div></div>`;

                if (category == 'Work' && is_creator) {
                    const footer = document.createElement('div');
                    footer.classList.add('card-footer');
                    footer.classList.add('members');
                    footer.innerHTML = `<span>Assigned to:</span> <i class="fa-solid fa-user"></i>${task.assigned_to}`;
                    card.appendChild(footer);
                }
                
                parentContainer.append(card);
                
                if (category == 'Work' && is_creator) {
                const check = card.querySelector(`#check[data-card-id="${id}"]`);
                if (check) {
                    check.style.display = 'none';
                }
            }
                if (category == 'Work' && !is_creator) {
                    const del = card.querySelector(`.delete[data-del-id="${id}"]`);
                    const edit = card.querySelector(`.edit[data-edit-id="${id}"]`);
                    if (del) {
                        del.style.display = 'none';
                    }
                    if (edit) {
                        edit.style.display = 'none';
                    }
                }
            
            })

            taskComplete(tasklist_id); //function call
            deleteTask(tasklist_id);
            editTask(tasklist_id);
        })
        .catch(error => {
            console.log('Error fetching tasks for this list', error)
        })
}

function taskComplete(tasklist_id) {
    /*
     Marks a task as complete when its corresponding checkbox icon is clicked.
    
     This function adds a click event listener to all elements with the id of 'check',
     typically representing checkboxes. When a checkbox is clicked, it updates the
     visual style of the checkbox and disables further clicks on it, effectively marking
     the associated task as complete.
    */
    document.querySelectorAll('#check').forEach(icon => {
        icon.addEventListener('click', () => {
            const task_id = icon.getAttribute('data-card-id');
            icon.classList.remove('fa-circle');
            icon.classList.add('fa-circle-check');
            icon.style.pointerEvents = 'none';

            setTimeout(() => {
                fetch('/deleteTask/', {
                    method: 'POST',
                    body: JSON.stringify({ 'task_id': task_id })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message) {
                            console.log(data.message);
                            showTasks(tasklist_id); //function call to display remaining tasks only
                        } else if (data.error) {
                            console.log(data.error);
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }, 500);
        })
    })
}


function saveTasks() {
    /*
     Saves a new task to the specified tasklist when the 'Save' button is clicked.

     When 'Save' button is clicked, it retrieves task-related information from input containers 
     (title, priority, and date). It then sends a POST request to '/task/' to save the task to the 
     specified tasklist. After successfully saving the task, it clears the input containers and 
     makes a function call to display the updated list of tasks.
    */
    document.querySelectorAll('#save-task').forEach(saveBtn => {
        saveBtn.addEventListener('click', () => {
            const tasklist_id = saveBtn.getAttribute('data-save-id');

            const title_container = document.querySelector(`#title-${tasklist_id}`);
            const priority_container = document.querySelector(`#priority-${tasklist_id}`);
            const date_container = document.querySelector(`#date-${tasklist_id}`);

            const task = title_container.value;
            const priority = priority_container.value;
            const date = date_container.value;
            let assigned_to = '';

            if (document.querySelector('#assign')) {
                if (task === '' || priority === '' || date === '') {
                    alert('Please fill out all the fields!');
                }
                assigned_to = document.querySelector('#assign').value;
                if (assigned_to === '') {
                    alert('Please assign the task to someone!');
                }
                else {
                    fetch('/task/', {
                        method: 'POST',
                        body: JSON.stringify({ 'task': task, 'tasklist_id': tasklist_id, 'date': date, 'priority': priority, 'assigned_to': assigned_to })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message) {
                                console.log(data.message);

                                title_container.value = '';
                                priority_container.value = '';
                                date_container.value = '';
                                if (document.querySelector('#assign')) {
                                    document.querySelector('#assign').value = '';
                                }

                                showTasks(tasklist_id); //function call
                            }
                            else if (data.error) {
                                console.log(data.error)
                            }
                        })
                        .catch(error => {
                            console.log('Fetch error ', error)
                        })
                }
            }
            else {
                if (task === '' || priority === '' || date === '') {
                    alert('Please fill out all the fields!');
                }
                fetch('/task/', {
                    method: 'POST',
                    body: JSON.stringify({ 'task': task, 'tasklist_id': tasklist_id, 'date': date, 'priority': priority, 'assigned_to': assigned_to })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message) {
                            console.log(data.message);

                            title_container.value = '';
                            priority_container.value = '';
                            date_container.value = '';
                            if (document.querySelector('#assign')) {
                                document.querySelector('#assign').value = '';
                            }

                            showTasks(tasklist_id); //function call
                        }
                        else if (data.error) {
                            console.log(data.error)
                        }
                    })
                    .catch(error => {
                        console.log('Fetch error ', error)
                    })
            }
        })
    })
}

function setMinDate() {
    // Sets the min value of date field to current day preventing the user from selecting earlier dates
    const dates = document.querySelectorAll('.dateVal');
    if (dates) {
        dates.forEach(date => {
            const currentDate = new Date().toISOString().split('T')[0];
            date.min = currentDate;
        })
    }
}


function deleteTask(tasklist_id) {
    // For deleting individual tasks within a tasklist
    const icons = document.querySelectorAll('.delete');
    if (icons) {
        icons.forEach(icon => {
            icon.addEventListener('click', () => {
                if (window.confirm("Are you sure you want to proceed?")) {
                    const task_id = icon.getAttribute('data-del-id');

                    fetch('/deleteTask/', { method: 'POST', body: JSON.stringify({ 'task_id': task_id }) })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message) {
                                console.log(data.message);

                                showTasks(tasklist_id); //function call
                                // To display remaining tasks only.
                            }
                            else if (data.error) {
                                console.log(data.error);
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        })
                }
            })
        })
    }
}


function editTask(tasklist_id) {
    // For editing individual tasks within a tasklist
    const icons = document.querySelectorAll('.edit');
    if (icons) {
        icons.forEach(icon => {
            icon.addEventListener('click', () => {
                const id = icon.getAttribute('data-edit-id');
                const card = document.querySelector(`#card-${id}`);

                const task = document.querySelector(`#task-${id}`).innerHTML;

                const element = document.createElement('input');
                element.id = 'editTask';
                element.setAttribute('type', 'text');
                element.value = task;

                const saveBtn = document.createElement('button');
                saveBtn.id = 'saveEdit';
                saveBtn.classList.add('btn', 'btn-primary');
                saveBtn.style.display = 'inline-block';
                saveBtn.innerHTML = 'Save';
                saveBtn.addEventListener('click', () => {
                    fetch('/editTask/', {
                        method: 'POST',
                        body: JSON.stringify({ 'task': element.value, 'task_id': id })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message) {
                                console.log(data.message);
                                showTasks(tasklist_id); //function call
                            }
                            else if (data.error) {
                                console.log(data.error);
                            }
                        })
                        .catch(error => {
                            console.log('Edit fetch error ', error);
                        })
                })

                const cancelBtn = document.createElement('button');
                cancelBtn.id = 'cancelEdit';
                cancelBtn.classList.add('btn', 'btn-primary');
                cancelBtn.style.display = 'inline-block';
                cancelBtn.innerHTML = 'Cancel';
                cancelBtn.addEventListener('click', () => {
                    showTasks(tasklist_id);
                })

                const btnContainer = document.createElement('div');
                btnContainer.appendChild(saveBtn);
                btnContainer.appendChild(cancelBtn);

                card.innerHTML = '';
                card.append(element);
                card.append(btnContainer);
            })
        })
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Getting the current workspace's id via the data attribute
    const current_space_id = document.querySelector('#list-title').getAttribute('data-workspace-id');

    // Sending the workspace id via POST method and working with the sent JSONResponse
    fetch('/userTasklists/', {
        method: 'POST',
        body: JSON.stringify({ 'id': current_space_id })
    })
        .then(response => response.json())
        .then(data => {
            if (data.tasklists) {
                const parentContainer = document.querySelector('.dropdown-menu');

                if (data.tasklists.length === 0) {
                    // If no tasklist are created by user in the current workspace
                    const element = document.createElement('li');
                    element.innerHTML = '<a class="dropdown-item text-white"> No Lists </a>';

                    parentContainer.append(element);
                }
                else {
                    /*
                    If tasklists are created by the user in the workspace:
                        Loop over every single one of them, create <li> element 
                        that displays each of their title and append it inside
                        the dropdown menu
                    */
                    for (let i = 0; i < data.tasklists.length; i++) {
                        const element = document.createElement('li');
                        element.innerHTML = `<a class="dropdown-item text-white clickable-list" data-list-id='${data.tasklists[i].id}'>${data.tasklists[i].title}</a>`;
                        parentContainer.append(element);

                        // Adding the <hr> below every element except the last one.
                        if (i < data.tasklists.length - 1) {
                            const line = document.createElement('li');
                            line.innerHTML = '<hr class="dropdown-divider">';
                            parentContainer.append(line);
                        }
                    }
                    showTasklist(current_space_id) //function call
                }
            }
        })//fetch ends
    if (document.querySelector('#add-list')) {
        document.querySelector('#add-list').addEventListener('click', () => {
            // When the 'ADD NEW LIST' button is clicked
            document.querySelector('#list-title').value = '';
            document.querySelector('.list_name').style.display = 'block';
            document.querySelector('.list').style.display = 'none';
        })
    }


    document.querySelector('#create-list').addEventListener('click', () => {
        // When 'Create' button is clicked 
        const title_container = document.querySelector('#list-title');
        const title = title_container.value;
        const workspace_id = title_container.getAttribute('data-workspace-id');

        fetch('/tasklist/',
            {
                method: 'POST',
                body: JSON.stringify({ 'title': title, 'workspace_id': workspace_id })
            })
            .then(response => response.json())
            .then(data => {
                let tasklist_id;
                if (data.message) {
                    console.log(data.message);

                    tasklist_id = data.tasklist_id;

                    document.querySelector('.list_name').style.display = 'none';
                    document.querySelector('.list').style.display = 'block';
                    document.querySelector('#taskContainer').innerHTML = '';
                    if (document.querySelector('#addTaskContainer')) {
                        document.querySelector('#addTaskContainer').innerHTML = '';
                    }

                    addTaskWorkCategory(tasklist_id, data.category, data.current_members);
                }
                else if (data.error) {
                    console.log(data.error)
                }
                setMinDate() //function call

                // Setting the title of the list to the input title.
                document.querySelector('#add').innerHTML = title;

                saveTasks(); //function call

                // Adding the currently created tasklist in the dropdown menu
                const parentContainer = document.querySelector('.dropdown-menu');
                if (parentContainer.innerHTML.includes('No Lists')) {
                    parentContainer.innerHTML = '';

                    const element = document.createElement('li');
                    element.innerHTML = `<a class="dropdown-item text-white clickable-list" data-list-id='${tasklist_id}'>${title}</a>`;
                    parentContainer.append(element);
                }
                else {
                    const line = document.createElement('li');
                    line.innerHTML = '<hr class="dropdown-divider">';
                    parentContainer.append(line);

                    const element = document.createElement('li');
                    element.innerHTML = `<a class="dropdown-item text-white clickable-list" data-list-id='${tasklist_id}'>${title}</a>`;
                    parentContainer.append(element);
                }
                showTasklist(workspace_id);
            })
            .catch(error => {
                console.log('Fetch error ', error)
            })
    })
})

