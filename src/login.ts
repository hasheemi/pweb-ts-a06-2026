/// <reference path="./shared.ts" />

interface LoginResponse {
  accessToken?: string;
  token?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role?: string;
  message?: string;
}

const loginForm =
  document.querySelector<HTMLFormElement>("#login-form");

const loginButton =
  document.querySelector<HTMLButtonElement>("#login-submit");

const loginLoading =
  document.querySelector<HTMLElement>("#login-loading");

const loginError =
  document.querySelector<HTMLElement>("#login-error");

if (loginForm && loginButton) {
  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const username =
      (document.querySelector<HTMLInputElement>(
        "#login-username"
      )?.value || "").trim();

    const password =
      document.querySelector<HTMLInputElement>(
        "#login-password"
      )?.value || "";

    if (!username || !password) {
      showLoginError("Username dan password wajib diisi.");
      return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Memproses...";

    loginLoading?.classList.remove("hidden");
    loginError?.classList.add("hidden");

    try {
      const response = await fetch(
        "https://dummyjson.com/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            password,
            expiresInMins: 30
          })
        }
      );

      const data =
        await response.json() as LoginResponse;

      if (!response.ok) {
        throw new Error(
          data.message || "Username atau password salah."
        );
      }

      const token = data.accessToken || data.token;

      if (!token) {
        throw new Error(
          "Server tidak mengirim token autentikasi."
        );
      }

      const rawRole = (data.role || "user").toLowerCase();

      const role =
        rawRole === "moderator" ? "admin" : rawRole;

      const session: AuthSession = {
        token,
        role,
        firstName: data.firstName || data.username || username
      };

      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify(session)
      );

      window.location.replace(
        role === "admin"
          ? "index.html"
          : "operator.html"
      );
    } catch (error) {
      showLoginError(
        error instanceof Error
          ? error.message
          : "Koneksi gagal. Silakan coba lagi."
      );
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "Masuk";
      loginLoading?.classList.add("hidden");
    }
  });
}

function showLoginError(message: string): void {
  if (!loginError) return;

  loginError.textContent = message;
  loginError.classList.remove("hidden");
}