// Kenya SMM Pro - Sign Up / Sign In Logic

// Get elements
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const showLogin = document.getElementById("show-login");
const showSignup = document.getElementById("show-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

// Switch between login and signup
showLogin.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  showLogin.classList.add("active");
  showSignup.classList.remove("active");
});

showSignup.addEventListener("click", () => {
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  showSignup.classList.add("active");
  showLogin.classList.remove("active");
});

// Sign Up Function
signupBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const username = document.getElementById("signup-username").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!username || !password) {
    alert("Please fill all fields!");
    return;
  }

  // Save to localStorage
  localStorage.setItem("kenyaSMM_username", username);
  localStorage.setItem("kenyaSMM_password", password);

  alert("Account created successfully ✅. Now sign in!");

  // Switch to login form
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  showLogin.classList.add("active");
  showSignup.classList.remove("active");
});

// Sign In Function
loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  const savedUser = localStorage.getItem("kenyaSMM_username");
  const savedPass = localStorage.getItem("kenyaSMM_password");

  if (username === savedUser && password === savedPass) {
    alert("Login successful ✅ Redirecting to your dashboard...");
    window.location.href = "dashboard.html"; // This will be the next page
  } else {
    alert("Invalid username or password ❌");
  }
});
