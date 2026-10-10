function addTaskWorkCategory(tasklistId, category, currentMembers) {
  const addTaskContainer = document.querySelector("#addTaskContainer");
  if (!addTaskContainer) return;

  addTaskContainer.innerHTML = `
    <div class="card-body">
      <input type="text" class="title" id="title-${tasklistId}" placeholder="Add a task" maxlength="64" required>
      <select class="priority" id="priority-${tasklistId}" required>
        <option disabled selected value="">Priority</option>
        <option value="H">High</option>
        <option value="M">Medium</option>
        <option value="L">Low</option>
      </select>
      <label class="date" for="date-${tasklistId}">Due</label>
      <input type="date" class="dateVal" id="date-${tasklistId}" required>
      <button type="button" class="btn btn-danger" id="save-task" data-save-id="${tasklistId}">Save</button>
    </div>
  `;

  if (category === "Work") {
    const footer = document.createElement("div");
    footer.className = "card-footer";
    const select = document.createElement("select");
    select.id = "assign";
    select.innerHTML = `<option value="" disabled selected>Assign to a teammate</option>`;
    (currentMembers || []).forEach((member) => {
      const option = document.createElement("option");
      option.value = member;
      option.textContent = member;
      select.append(option);
    });
    footer.innerHTML = "<p>Assign to</p>";
    footer.append(select);
    addTaskContainer.append(footer);
  }

  setMinDate();
}

function bindListClicks(workspaceId) {
  const menu = document.querySelector(".dropdown-menu");
  if (!menu || menu.dataset.bound === "1") return;
  menu.dataset.bound = "1";
  menu.addEventListener("click", (event) => {
    const list = event.target.closest(".clickable-list");
    if (!list) return;
    event.preventDefault();
    openTasklist(workspaceId, list.dataset.listId, list.textContent.trim());
  });
}

function openTasklist(workspaceId, tasklistId, title) {
  const listBox = document.querySelector(".list");
  const empty = document.querySelector("#empty-lists");
  const nameForm = document.querySelector(".list_name");
  listBox.hidden = false;
  if (empty) empty.hidden = true;
  if (nameForm) nameForm.hidden = true;
  document.querySelector("#taskContainer").innerHTML = "";
  document.querySelector("#add").textContent = title;

  apiPost("/workspaceInfo/", { workspace_id: workspaceId })
    .then((data) => {
      addTaskWorkCategory(tasklistId, data.category, data.current_members);
    })
    .catch((error) => console.log("Workspace info fetch error", error));

  showTasks(tasklistId);
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function showTasks(tasklistId) {
  apiPost("/allTasks/", { id: tasklistId })
    .then((data) => {
      const isCreator = data.task_data.is_creator;
      const category = data.task_data.category;
      const tasks = data.task_data.tasks;
      const parent = document.querySelector("#taskContainer");
      parent.innerHTML = "";

      if (!tasks.length) {
        parent.innerHTML = '<p class="no-tasks">No tasks in this list yet.</p>';
        return;
      }

      tasks.forEach((task) => {
        const card = document.createElement("div");
        card.className = `card${task.is_completed ? " completed-task" : ""}`;
        const overdue = task.due_date && !task.is_completed && task.due_date < todayIso();
        const checkClass = task.is_completed ? "fa-solid fa-circle-check check" : "fa-regular fa-circle check";
        card.innerHTML = `
          <div class="card-body display-card" id="card-${task.id}">
            <div class="upper-card">
              <i class="${checkClass}" data-card-id="${task.id}" data-completed="${task.is_completed}"></i>
              <p class="task-display${task.is_completed ? " completed" : ""}" id="task-${task.id}">${task.title}</p>
            </div>
            <div class="lower-card">
              <div class="priority">
                <p>Priority:</p>
                <div class="btn btn-danger priority-icon">${task.priority_label || task.priority}</div>
              </div>
              <p class="${overdue ? "due-overdue" : ""}">Due: ${task.due_date}${overdue ? " · overdue" : ""}</p>
              <div class="task-icons">
                <i class="fa-solid fa-trash delete" data-del-id="${task.id}" title="Delete"></i>
                <i class="fa-regular fa-pen-to-square edit" data-edit-id="${task.id}" title="Edit"></i>
              </div>
            </div>
          </div>
        `;

        if (category === "Work") {
          const footer = document.createElement("div");
          footer.className = "card-footer members";
          footer.innerHTML = `<span>Assigned to:</span> <i class="fa-solid fa-user"></i> ${task.assigned_to || "Unassigned"}`;
          card.appendChild(footer);
        }

        if (category === "Work" && !isCreator) {
          const del = card.querySelector(".delete");
          const edit = card.querySelector(".edit");
          if (del) del.hidden = true;
          if (edit) edit.hidden = true;
        }

        parent.append(card);
      });

      bindTaskActions(tasklistId);
    })
    .catch((error) => {
      console.log("Error fetching tasks for this list", error);
    });
}

function bindTaskActions(tasklistId) {
  document.querySelectorAll(".check").forEach((icon) => {
    icon.addEventListener("click", async () => {
      const taskId = icon.getAttribute("data-card-id");
      const currentlyDone = icon.getAttribute("data-completed") === "true";
      try {
        await apiPost("/task/complete/", {
          task_id: taskId,
          is_completed: !currentlyDone,
        });
        showTasks(tasklistId);
      } catch (error) {
        alert(error.message);
      }
    });
  });

  document.querySelectorAll(".delete").forEach((icon) => {
    icon.addEventListener("click", async () => {
      if (!window.confirm("Delete this task?")) return;
      try {
        await apiPost("/deleteTask/", { task_id: icon.getAttribute("data-del-id") });
        showTasks(tasklistId);
      } catch (error) {
        alert(error.message);
      }
    });
  });

  document.querySelectorAll(".edit").forEach((icon) => {
    icon.addEventListener("click", () => {
      const id = icon.getAttribute("data-edit-id");
      const card = document.querySelector(`#card-${id}`);
      const current = document.querySelector(`#task-${id}`).textContent;
      card.innerHTML = "";

      const input = document.createElement("input");
      input.id = "editTask";
      input.type = "text";
      input.value = current;
      input.maxLength = 64;

      const saveBtn = document.createElement("button");
      saveBtn.className = "btn btn-primary";
      saveBtn.id = "saveEdit";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", async () => {
        try {
          await apiPost("/editTask/", { task: input.value, task_id: id });
          showTasks(tasklistId);
        } catch (error) {
          alert(error.message);
        }
      });

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn btn-primary";
      cancelBtn.id = "cancelEdit";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => showTasks(tasklistId));

      const buttons = document.createElement("div");
      buttons.append(saveBtn, cancelBtn);
      card.append(input, buttons);
    });
  });
}

async function saveTaskFromButton(saveBtn) {
  const tasklistId = saveBtn.getAttribute("data-save-id");
  const task = document.querySelector(`#title-${tasklistId}`).value;
  const priority = document.querySelector(`#priority-${tasklistId}`).value;
  const date = document.querySelector(`#date-${tasklistId}`).value;
  const assign = document.querySelector("#assign");
  const assignedTo = assign ? assign.value : "";

  if (!task.trim() || !priority || !date) {
    alert("Fill in the task, priority, and due date.");
    return;
  }
  if (assign && !assignedTo) {
    alert("Assign the task to a teammate.");
    return;
  }

  try {
    await apiPost("/task/", {
      task,
      tasklist_id: tasklistId,
      date,
      priority,
      assigned_to: assignedTo,
    });
    document.querySelector(`#title-${tasklistId}`).value = "";
    document.querySelector(`#priority-${tasklistId}`).value = "";
    document.querySelector(`#date-${tasklistId}`).value = "";
    if (assign) assign.value = "";
    showTasks(tasklistId);
  } catch (error) {
    alert(error.message);
  }
}

function setMinDate() {
  const currentDate = todayIso();
  document.querySelectorAll(".dateVal").forEach((date) => {
    date.min = currentDate;
  });
}

function appendListToMenu(tasklistId, title) {
  const parent = document.querySelector(".dropdown-menu");
  if (parent.textContent.includes("No lists yet")) {
    parent.innerHTML = "";
  } else if (parent.children.length) {
    const line = document.createElement("li");
    line.innerHTML = '<hr class="dropdown-divider">';
    parent.append(line);
  }
  const element = document.createElement("li");
  element.innerHTML = `<a class="dropdown-item text-white clickable-list" href="#" data-list-id="${tasklistId}">${title}</a>`;
  parent.append(element);
}

document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.querySelector("#list-title");
  const workspaceId = titleInput.getAttribute("data-workspace-id");
  const empty = document.querySelector("#empty-lists");

  apiPost("/userTasklists/", { id: workspaceId })
    .then((data) => {
      const parent = document.querySelector(".dropdown-menu");
      const lists = data.tasklists || [];
      if (!lists.length) {
        parent.innerHTML = '<li><span class="dropdown-item text-white">No lists yet</span></li>';
        if (empty) empty.hidden = false;
      } else {
        lists.forEach((item, index) => {
          if (index > 0) {
            const line = document.createElement("li");
            line.innerHTML = '<hr class="dropdown-divider">';
            parent.append(line);
          }
          const element = document.createElement("li");
          element.innerHTML = `<a class="dropdown-item text-white clickable-list" href="#" data-list-id="${item.id}">${item.title}</a>`;
          parent.append(element);
        });
      }
      bindListClicks(workspaceId);
    })
    .catch((error) => console.log(error));

  const addList = document.querySelector("#add-list");
  if (addList) {
    addList.addEventListener("click", () => {
      titleInput.value = "";
      document.querySelector(".list_name").hidden = false;
      document.querySelector(".list").hidden = true;
      if (empty) empty.hidden = true;
    });
  }

  document.querySelector("#create-list").addEventListener("click", async () => {
    const title = titleInput.value.trim();
    if (!title) {
      alert("Give the list a title.");
      return;
    }
    try {
      const data = await apiPost("/tasklist/", {
        title,
        workspace_id: workspaceId,
      });
      document.querySelector(".list_name").hidden = true;
      document.querySelector(".list").hidden = false;
      if (empty) empty.hidden = true;
      document.querySelector("#taskContainer").innerHTML = "";
      if (document.querySelector("#addTaskContainer")) {
        document.querySelector("#addTaskContainer").innerHTML = "";
      }
      addTaskWorkCategory(data.tasklist_id, data.category, data.current_members);
      document.querySelector("#add").textContent = title;
      appendListToMenu(data.tasklist_id, title);
      bindListClicks(workspaceId);
    } catch (error) {
      alert(error.message);
    }
  });

  document.addEventListener("click", (event) => {
    const saveBtn = event.target.closest("#save-task");
    if (saveBtn) saveTaskFromButton(saveBtn);
  });
});
