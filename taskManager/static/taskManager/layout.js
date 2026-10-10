function updateMarginLeft() {
  const sidebar = document.querySelector("#sidebar");
  const content = document.querySelector("#content");
  if (!sidebar || !content) return;
  content.style.marginLeft = `${sidebar.offsetWidth}px`;
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(updateMarginLeft, 100);
  window.addEventListener("resize", updateMarginLeft);

  const signout = document.querySelector("#signout");
  if (signout) {
    signout.addEventListener("click", () => localStorage.removeItem("activeOption"));
  }

  apiRequest("/userWorkspace/")
    .then((data) => {
      const parent = document.querySelector("#workspace_container");
      const empty = document.querySelector("#workspace-empty");
      const workspaces = data.workspaces || [];
      if (empty) empty.hidden = workspaces.length > 0;

      workspaces.forEach((workspace) => {
        const element = document.createElement("a");
        element.href = `/workspace/${workspace.id}`;
        element.className = "element my-spaces toggle-active";
        element.id = `workspace-${workspace.id}`;
        element.innerHTML = `<i class="fa-solid fa-briefcase"></i><p class="text-white d-none d-md-block">${workspace.title}</p>`;
        parent.append(element);
      });

      const options = document.querySelectorAll(".toggle-active");
      options.forEach((option) => {
        option.addEventListener("click", () => {
          options.forEach((item) => item.classList.remove("active"));
          option.classList.add("active");
          localStorage.setItem("activeOption", option.id);
        });
      });

      const activeOptionId = localStorage.getItem("activeOption");
      if (!activeOptionId) {
        const createWorkspaceOption = document.getElementById("create");
        if (createWorkspaceOption) {
          createWorkspaceOption.classList.add("active");
          localStorage.setItem("activeOption", "create");
        }
      } else {
        const activeOption = document.getElementById(activeOptionId);
        if (activeOption) activeOption.classList.add("active");
      }
    })
    .catch((error) => {
      console.log("Workspace list error", error);
    });
});
