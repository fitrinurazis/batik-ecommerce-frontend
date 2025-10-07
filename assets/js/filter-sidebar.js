document.addEventListener("DOMContentLoaded", function () {
  const mobileFilterToggle = document.getElementById("mobile-filter-toggle");
  const mobileFilterOverlay = document.getElementById("mobile-filter-overlay");
  const filterSidebar = document.getElementById("filter-sidebar");
  const closeMobileFilter = document.getElementById("close-mobile-filter");
  const sidebarSearch = document.getElementById("search-input");

  function openMobileFilter() {
    mobileFilterOverlay.classList.remove("hidden");
    filterSidebar.classList.remove("hidden", "-translate-x-full", "opacity-0");
    filterSidebar.classList.add("translate-x-0", "opacity-100");
    document.body.style.overflow = "hidden";
  }

  function closeMobileFilterFunc() {
    filterSidebar.classList.add("-translate-x-full", "opacity-0");
    filterSidebar.classList.remove("translate-x-0", "opacity-100");
    setTimeout(() => {
      mobileFilterOverlay.classList.add("hidden");
      filterSidebar.classList.add("hidden");
      document.body.style.overflow = "";
    }, 300);
  }

  mobileFilterToggle.addEventListener("click", openMobileFilter);
  closeMobileFilter.addEventListener("click", closeMobileFilterFunc);
  mobileFilterOverlay.addEventListener("click", closeMobileFilterFunc);

  function handleSidebarSearch() {
    const query = sidebarSearch?.value;
    if (typeof window.filterProducts === "function") {
      window.filterProducts({ search: query });
    }
  }

  let searchTimeout;
  sidebarSearch?.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSidebarSearch, 300);
  });

  document.querySelectorAll('input[name="category"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      document.querySelectorAll('input[name="category"]').forEach((r) => {
        const radioDiv = r.parentNode.querySelector(".w-4.h-4");
        if (r.checked) {
          radioDiv.classList.add("border-amber-500", "bg-amber-500");
          radioDiv.classList.remove("border-gray-300");
          radioDiv.innerHTML =
            '<div class="w-2 h-2 bg-white rounded-full"></div>';
        } else {
          radioDiv.classList.remove("border-amber-500", "bg-amber-500");
          radioDiv.classList.add("border-gray-300");
          radioDiv.innerHTML = "";
        }
      });

      if (typeof window.filterProducts === "function") {
        window.filterProducts({ category: this.value });
      }
    });
  });
});
