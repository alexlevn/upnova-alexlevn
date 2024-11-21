// [data-builder-content-id]:not([data-builder-component="symbol"])

console.log('inspector.js loaded');
class BuilderInspector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.highlightElement = null;
    this.labelElement = null;
    this.gap = 0; // Gap size in pixels
    this.currentTarget = null; // Store the current target element
    this.settings = null;
    this.handleLabelClick = this.handleLabelClick.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.updateHighlightPosition = this.updateHighlightPosition.bind(this);
    this.inspectorEnabled = true; // New state to track if inspector is enabled
  }

  connectedCallback() {
    this.render();
    this.loadSettings();
    this.addEventListeners();
    window.addEventListener('message', this.handleMessage);
    window.addEventListener('scroll', this.updateHighlightPosition);
    window.addEventListener('resize', this.updateHighlightPosition);
  }

  disconnectedCallback() {
    window.removeEventListener('message', this.handleMessage);
    window.removeEventListener('scroll', this.updateHighlightPosition);
    window.removeEventListener('resize', this.updateHighlightPosition);
  }

  async loadSettings() {
    this.settings = Object.entries(window.UPEZ_BUILDER_DATA)
      .flatMap(([templateKey, templateVal]) => {
        const templateKeyParts = templateKey.split(':');
        return templateVal[0].data.settings.map((setting) => ({
          ...setting,
          templateId: templateKeyParts.length > 1 ? templateKeyParts[1] : templateKeyParts[0]
        }));
      });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .preload-icon {
          width: 0;
          height: 0;
          position: absolute;
        }
        .icon {
          display: inline-block;
          width: 20px;
          height: 20px;
          background-size: 20px;
          background-repeat: no-repeat;
          background-position: center;
          vertical-align: middle;
        }
        .checked-icon {
          background-image: url("/svgs/checkedIcon.svg");
        }
        .unchecked-icon {
          background-image: url("/svgs/uncheckedIcon.svg");
        }
        .text-icon {
          background-image: url("/svgs/textIcon.svg");
        }
        .button-icon {
          background-image: url("/svgs/buttonIcon.svg");
        }
        .code-icon {
          background-image: url("/svgs/codeIcon.svg");
        }
        .color-icon {
          background-image: url("/svgs/colorIcon.svg");
        }
        .rich-text-icon {
          background-image: url("/svgs/richTextIcon.svg");
        }
        .select-icon {
          background-image: url("/svgs/selectIcon.svg");
        }
        .template-icon {
          background-image: url("/svgs/templateIcon.svg");
        }
        .toggle-icon {
          background-image: url("/svgs/toggleIcon.svg");
        }
        .highlight, .pinned {
          position: fixed;
          pointer-events: none;
          border: 2px solid #8fc552;
          box-sizing: border-box;
          z-index: 999999999;
          // transition: all 0.3s ease;
          cursor: pointer;
        }
        .highlight {
          background-color: #d3ecb554;
        }
        .pinned {
          border-color: #CDEDAF;
        }
        .label:empty, .highlight:empty {
          display: none;
        }
        .label, .pinned-label {
          position: fixed;
          background-color: #CDEDAF;
          color: black;
          font-size: 12px;
          font-family: Inter, sans-serif;
          z-index: 999999999;
        }
        .pinned-label {
          background-color: #d3ecb5;
        }
        .clickable-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          gap: 10px;
          padding: 4px 8px 4px 4px;
          background-color: #CDEDAF;
        }
        .clickable-label + .clickable-label {
          border-top: 1px solid black;
        }

        .clickable-label:hover {
          background-color: #e3f1d3;
        }
      </style>
      <div class="preload-icon text-icon"></div>
      <div class="preload-icon button-icon"></div>
      <div class="preload-icon code-icon"></div>
      <div class="preload-icon color-icon"></div>
      <div class="preload-icon rich-text-icon"></div>
      <div class="preload-icon select-icon"></div>
      <div class="preload-icon template-icon"></div>
      <div class="preload-icon toggle-icon"></div>
      <div class="preload-icon checked-icon"></div>
      <div class="preload-icon unchecked-icon"></div>
      <div class="highlight"></div>
      <div class="label"></div>
    `;
    this.highlightElement = this.shadowRoot.querySelector('.highlight');
    this.labelElement = this.shadowRoot.querySelector('.label');
    this.shadowRoot.addEventListener('click', this.handleLabelClick);
  }

  addEventListeners() {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
  }

  handleMouseOver(event) {
    if (!this.inspectorEnabled) return;
    if (!this.settings) return;

    let closestTarget = null;
    let closestDistance = Infinity;

    for (const setting of this.settings) {
      if (setting.highlightingElem) {
        const targets = event.composedPath().filter(elem => elem instanceof Element && elem.matches(setting.highlightingElem));
        
        if (targets.length > 0) {
          const target = targets[0]; // The first element in the path is the closest
          const distance = event.composedPath().indexOf(target);
          
          if (distance < closestDistance) {
            closestTarget = target;
            closestDistance = distance;
          }
        }
      }
    }

    if (closestTarget) {
      this.currentTarget = closestTarget;
      this.updateHighlight(closestTarget, `${this.getLabelForElement(closestTarget)}`);
    } else {
      // this.handleMouseOut();
    }
  }

  updateHighlight(target, label) {
    const rect = target.getBoundingClientRect();
    const builderId = target.getAttribute('builder-id');
    
    this.highlightElement.style.display = 'block';
    this.updateElementPosition(this.highlightElement, rect);

    this.labelElement.style.display = 'block';
    this.labelElement.innerHTML = label; // Changed from textContent to innerHTML

    // Position the label
    this.positionLabel(this.labelElement, rect);
  }

  updateElementPosition(element, rect) {
    element.style.top = `${rect.top - this.gap}px`;
    element.style.left = `${rect.left - this.gap}px`;
    element.style.width = `${rect.width + 2 * this.gap}px`;
    element.style.height = `${rect.height + 2 * this.gap}px`;
  }

  positionLabel(label, rect) {
    const labelRect = label.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Initialize positions
    let top = rect.top - labelRect.height - this.gap;
    let left = rect.left - this.gap;

    // Adjust vertical position
    if (top < 0) {
      // If not enough space above, try below
      top = rect.bottom + this.gap;
      // If still overflowing bottom, place where there's more space
      if (top + labelRect.height > viewportHeight) {
        top = (rect.top < viewportHeight - rect.bottom) ? 0 : viewportHeight - labelRect.height;
      }
    } else if (top + labelRect.height > viewportHeight) {
      // If overflowing bottom, try above
      top = rect.top - labelRect.height - this.gap;
      // If still overflowing top, place at top
      if (top < 0) {
        top = 0;
      }
    }

    // Adjust horizontal position
    if (left + labelRect.width > viewportWidth) {
      // If overflowing right, try to align with right edge of rect
      left = rect.right - labelRect.width + this.gap;
      // If still overflowing left, align with left edge of viewport
      if (left < 0) {
        left = 0;
      }
    }

    // Ensure the label is not positioned outside the right edge
    left = Math.min(left, viewportWidth - labelRect.width);

    // Apply the calculated position
    label.style.top = `${top}px`;
    label.style.left = `${left}px`;
  }

  handleMouseOut(e) {
    if (e && e.toElement && e.toElement.nodeName === 'BUILDER-INSPECTOR') {
      return;
    }
    this.highlightElement.style.display = 'none';
    this.labelElement.style.display = 'none';
    this.currentTarget = null; // Clear the current target
  }

  getValueForSetting(setting) {
    const templateKeys = Object.keys(window.UPEZ_BUILDER_DATA);
    const foundTemplateKey = templateKeys.find(key => key.includes(setting.templateId));
    let model = '';
    let parentTemplateKey = null;
    if (foundTemplateKey.includes(':')) {
      model = foundTemplateKey.split(':')[0];
      parentTemplateKey = this.settings.find(setting => setting.type === `template:${model}`)?.id;
    }

    const settingValues = document.querySelector(`#${document.querySelector('[data-inspect-id]').getAttribute('data-inspect-id')}`).builderPageRef.state.state.settings;

    const parentSettingValues = parentTemplateKey ? settingValues[`${parentTemplateKey}__settings`] : settingValues;

    if (setting.type === 'color') {
      return `<span style="display: inline-block; width: 15px; height: 15px; border-radius: 100px; background-color: ${parentSettingValues[setting.id] ?? setting.default};"></span>`;
    }

    if (setting.type === 'boolean') {
      return `<span class="icon ${parentSettingValues[setting.id] ? 'checked-icon' : 'unchecked-icon'}"></span>`;
    }

    return '';
  }

  getLabelForElement(element) {
    if (!this.settings) return '';

    const matchingLabels = this.settings
      .filter(setting => 
        setting.highlightingElem && 
        element.matches(setting.highlightingElem) && 
        setting.label &&
        ['text', 'button', 'code', 'color', 'richText', 'select', 'boolean'].includes(setting.type)
      )
      .map(setting => {
        let icon = '';
        switch (setting.type) {
          case 'text': icon = 'text-icon'; break;
          case 'button': icon = 'button-icon'; break;
          case 'code': icon = 'code-icon'; break;
          case 'color': icon = 'color-icon'; break;
          case 'richText': icon = 'rich-text-icon'; break;
          case 'select': icon = 'select-icon'; break;
          case 'boolean': icon = 'toggle-icon'; break;
        }
        if (setting.type.startsWith('template')) {
          icon = 'template-icon';
        }

        return `
        <div class="clickable-label" data-template-id="${setting.templateId}" data-setting-id="${setting.id}">
          <div>
            <span class="icon ${icon}"></span>
            <span>${setting.label}</span>
          </div>
          ${this.getValueForSetting(setting)}
        </div>`;
      });

    return matchingLabels.join('');
  }

  handleLabelClick(event) {
    if (!this.inspectorEnabled) return;
    const clickedLabel = event.target.closest('.clickable-label');

    if (clickedLabel) {
      event.stopPropagation();
      const settingId = clickedLabel.getAttribute('data-setting-id');
      const templateId = clickedLabel.getAttribute('data-template-id');

      console.log('Clicked setting id:', settingId, 'of template id:', templateId);
      window.parent.postMessage({ settingId, templateId }, "*");
    }
  }

  handleMessage(event) {
    if (event.data && typeof event.data === 'object' && event.data.action === 'highlight') {
      const {settingId, templateId} = event.data;
      console.log('Highlighted setting id:', settingId, 'of template id:', templateId);
      this.highlightField(settingId, templateId);
    }
    if (event.data && typeof event.data === 'object' && event.data.action === 'turn-off-inspector') {
      this.inspectorEnabled = false;
      this.handleMouseOut();
    }
    if (event.data && typeof event.data === 'object' && event.data.action === 'turn-on-inspector') {
      this.inspectorEnabled = true;
    }
  }

  highlightField(settingId, templateId) {
    if (!this.settings) return;
    if (!this.inspectorEnabled) return;
    const setting = this.settings.find(s => s.id === settingId && s.templateId === templateId);
    if (setting && setting.highlightingElem) {
      const target = document.querySelector(setting.highlightingElem);
      if (target) {
        this.currentTarget = target;
        const label = this.getLabelForElement(target);
        this.updateHighlight(target, label);
      }
    }
  }

  updateHighlightPosition() {
    if (!this.inspectorEnabled) return;
    if (this.currentTarget) {
      const rect = this.currentTarget.getBoundingClientRect();
      this.updateElementPosition(this.highlightElement, rect);
      this.positionLabel(this.labelElement, rect);
    }
  }
}

customElements.define('builder-inspector', BuilderInspector);

document.addEventListener('BUILDER_PAGE_REF_UPDATED', () => {
  console.log('listened BUILDER_PAGE_REF_UPDATED');
  document.body.appendChild(document.createElement('builder-inspector'));
});
