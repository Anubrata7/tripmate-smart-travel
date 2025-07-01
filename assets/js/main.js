const items = document.querySelectorAll(".accordion-item");

items.forEach(item => {
  const accordingHeader = item.querySelector(".accordion-header");

  accordingHeader.addEventListener("click", () => {
    // Close all other items
    items.forEach(i => {
      if (i !== item) {
        i.classList.remove("active");
        i.querySelector("span").textContent = "+";
      }
    });

    // Toggle current item
    const isActive = item.classList.contains("active");
    item.classList.toggle("active");
    accordingHeader.querySelector("span").textContent = isActive ? "+" : "−";
  });
});
