function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(";").shift());
  }
  const hidden = document.querySelector("[name=csrfmiddlewaretoken]");
  return hidden ? hidden.value : "";
}

function csrfHeaders() {
  return {
    "Content-Type": "application/json",
    "X-CSRFToken": getCookie("csrftoken"),
  };
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...csrfHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

function apiPost(url, body) {
  return apiRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function showMessage(element, text, isError = true) {
  if (!element) {
    if (text) alert(text);
    return;
  }
  element.hidden = !text;
  element.textContent = text || "";
  element.classList.toggle("is-error", Boolean(isError && text));
}
