const menuButton = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

menuButton.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", isOpen);
});

document.querySelectorAll("#navMenu a").forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
