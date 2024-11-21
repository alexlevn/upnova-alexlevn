if (window.UPEZ_BUILDER_DATA) {
  const keys = Object.keys(window.UPEZ_BUILDER_DATA);

  if (keys.length > 0) {
    const jsonData = window.UPEZ_BUILDER_DATA[keys[0]][0].data;
    const settings = jsonData.settings;
    const blocks = jsonData.blocks;

    console.log(`Total settings found: ${settings.length}`);
    console.log(`Total blocks found: ${blocks.length}`);
  } else {
    console.log("UPEZ_BUILDER_DATA exists but has no valid keys.");
  }
} else {
  console.log("UPEZ_BUILDER_DATA does not exist.");
}

const elementsWithBuilderId = document.querySelectorAll("[builder-id]");

elementsWithBuilderId.forEach((element) => {
  const builderId = element.getAttribute("builder-id");

  element.addEventListener("mouseover", () => {
    element.style.outline = "2px solid red";
  });
  element.addEventListener("mouseout", () => {
    element.style.outline = "none";
  });

  element.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log(`Clicked element with builder-id: ${builderId}`);
  });
});

console.log(`Total elements with builder-id: ${elementsWithBuilderId.length}`);
