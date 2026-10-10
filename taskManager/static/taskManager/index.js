document.addEventListener("DOMContentLoaded", () => {
  const landing = document.querySelector(".text-container");
  const loginBox = document.querySelector(".logIn");
  const registerBox = document.querySelector(".register");
  const loginMessage = document.querySelector("#login-message");
  const registerMessage = document.querySelector("#register-message");

  const show = (which) => {
    landing.hidden = which !== "landing";
    loginBox.hidden = which !== "login";
    registerBox.hidden = which !== "register";
    showMessage(loginMessage, "");
    showMessage(registerMessage, "");
  };

  document.querySelector("#loginView").addEventListener("click", () => show("login"));
  document.querySelector("#registerView").addEventListener("click", () => show("register"));
  document.querySelector("#showRegister").addEventListener("click", () => show("register"));
  document.querySelector("#showLogin").addEventListener("click", () => show("login"));

  document.querySelector("#btnLogin").addEventListener("click", () => logInUser(loginMessage));
  document.querySelector("#btnRegister").addEventListener("click", () => registerUser(registerMessage));

  document.querySelector("#passwordLogin").addEventListener("keydown", (event) => {
    if (event.key === "Enter") logInUser(loginMessage);
  });
  document.querySelector("#passwordConfirm").addEventListener("keydown", (event) => {
    if (event.key === "Enter") registerUser(registerMessage);
  });
});

async function logInUser(messageEl) {
  const username = document.querySelector("#usernameLogin").value.trim();
  const password = document.querySelector("#passwordLogin").value;
  if (!username || !password) {
    showMessage(messageEl, "Enter your username and password.");
    return;
  }
  try {
    const data = await apiPost("/login/", { username, password });
    localStorage.removeItem("activeOption");
    window.location.href = data.redirect || "/workspace";
  } catch (error) {
    showMessage(messageEl, error.message);
  }
}

async function registerUser(messageEl) {
  const email = document.querySelector("#email").value.trim();
  const username = document.querySelector("#usernameRegister").value.trim();
  const password = document.querySelector("#passwordRegister").value;
  const confirmation = document.querySelector("#passwordConfirm").value;
  try {
    const data = await apiPost("/register/", {
      email,
      username,
      password,
      "re-password": confirmation,
    });
    localStorage.removeItem("activeOption");
    window.location.href = data.redirect || "/workspace";
  } catch (error) {
    showMessage(messageEl, error.message);
  }
}
