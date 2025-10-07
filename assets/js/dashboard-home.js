document.addEventListener("DOMContentLoaded", function () {
  console.log("Dashboard DOM loaded, checking for initialization...");

  // Wait for dependencies
  function checkAndInit() {
    if (
      typeof window.ApiService !== "undefined" &&
      typeof window.Utils !== "undefined" &&
      typeof window.AuthManager !== "undefined"
    ) {
      console.log("Dependencies loaded for dashboard");

      // If dashboard didn't initialize for some reason, force it
      setTimeout(() => {
        if (typeof initDashboard === "function") {
          console.log("Dashboard function available");
        } else {
          console.log("Dashboard function not available, retrying...");
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
