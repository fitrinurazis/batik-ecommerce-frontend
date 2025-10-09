document.addEventListener("DOMContentLoaded", function () {
  console.log("Dashboard DOM loaded, checking for initialization...");

  // Wait for dependencies
  function checkAndInit() {
    if (
      typeof window.ApiService !== "undefined" &&
      typeof window.Utils !== "undefined" &&
      typeof window.AuthManager !== "undefined"
    ) {
      // If dashboard didn't initialize for some reason, force it
      setTimeout(() => {
        if (typeof initDashboard === "function") {
        } else {
          setTimeout(checkAndInit, 500);
        }
      }, 1000);
    } else {
      console.log("Waiting for dependencies...", {
        ApiService: typeof window.ApiService,
        Utils: typeof window.Utils,
        AuthManager: typeof window.AuthManager,
      });
      setTimeout(checkAndInit, 100);
    }
  }

  checkAndInit();
});
