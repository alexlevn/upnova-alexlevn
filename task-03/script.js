const upezData = window.UPEZ_BUILDER_DATA;

let blocks;
const blockDatas = [];

// Recursive function to process blocks and their children
function processBlock(block) {
  const { layerName, id, children } = block;
  if (layerName && id) {
    blockDatas.push({ layerName, id, settingId: block.bindings?.["component.options.code"] || "No settingId" });
  }

  if (children && Array.isArray(children)) {
    children.forEach(child => processBlock(child));
  }
}

// Retrieve blocks from upezData
for (const key in upezData) {
  if (Array.isArray(upezData[key])) {
    const firstItem = upezData[key][0];
    if (firstItem && firstItem.data && firstItem.data.blocks) {
      blocks = firstItem.data.blocks;
      break;
    }
  }
}

// Process blocks
if (blocks) {
  blocks.forEach(block => processBlock(block));
}

// Link blockDatas with DOM
const builderBlocks = document.querySelectorAll('.builder-block');

builderBlocks.forEach(block => {
  const builderId = block.getAttribute('builder-id');

  if (builderId) {
    // Find the corresponding blockData using builderId
    const matchingBlock = blockDatas.find(data => data.id === builderId);

    if (matchingBlock) {
      // Add hover event
      block.addEventListener('mouseenter', () => {
        block.style.outline = '2px solid lightgreen';
      });

      block.addEventListener('mouseleave', () => {
        block.style.outline = '';
      });

      // Add click event
      block.addEventListener('click', (event) => {
        event.preventDefault(); 
        event.stopPropagation();
        console.log(`Clicked Block "${matchingBlock.layerName}"  - ID: ${matchingBlock.id}`);
      });
    }
  }
});
