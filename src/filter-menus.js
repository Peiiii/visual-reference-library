export class FilterMenus {
  #root;
  #select;
  #trigger;
  #list;
  #options = [];
  #active = -1;
  #search = '';
  #searchAt = 0;

  constructor(root, select) {
    this.#root = root;
    this.#select = select;
    root.addEventListener('click', this.#onClick);
    root.addEventListener('keydown', this.#onKey);
    root.addEventListener('mousedown', event => {
      if (this.#list?.contains(event.target)) event.preventDefault();
    });
    for (const event of ['pointerdown', 'focusin']) {
      root.addEventListener(event, ({ target }) => {
        if (this.#trigger && !this.#trigger.parentElement?.contains(target)) this.close();
      });
    }
  }

  close = () => {
    if (!this.#trigger) return;
    this.#trigger.setAttribute('aria-expanded','false');
    this.#trigger.removeAttribute('aria-activedescendant');
    this.#list.hidden = true;
    this.#trigger = undefined;
    this.#list = undefined;
    this.#options = [];
    this.#search = '';
  };

  #open = trigger => {
    this.close();
    this.#trigger = trigger;
    this.#list = this.#root.getElementById(trigger.getAttribute('aria-controls'));
    this.#options = [...this.#list.querySelectorAll('[role="option"]')];
    trigger.setAttribute('aria-expanded','true');
    this.#list.hidden = false;
    const bounds = trigger.getBoundingClientRect();
    const below = window.innerHeight - bounds.bottom - 8;
    const above = bounds.top - 8;
    const aboveTrigger = below < 176 && above > below;
    this.#list.dataset.side = aboveTrigger ? 'above' : 'below';
    this.#list.style.maxHeight = Math.max(60, Math.min(272, aboveTrigger ? above : below)) + 'px';
    this.#list.dataset.align = bounds.left + this.#list.offsetWidth > window.innerWidth - 8 ? 'end' : 'start';
    this.#highlight(Math.max(0,this.#options.findIndex(option => option.getAttribute('aria-selected') === 'true')));
  };

  #highlight = index => {
    this.#active = Math.max(0, Math.min(this.#options.length - 1,index));
    const option = this.#options[this.#active];
    for (const el of this.#options) el.toggleAttribute('data-highlighted', el === option);
    this.#trigger.setAttribute('aria-activedescendant',option.id);
    if (option.offsetTop < this.#list.scrollTop) this.#list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > this.#list.scrollTop + this.#list.clientHeight) {
      this.#list.scrollTop = option.offsetTop + option.offsetHeight - this.#list.clientHeight;
    }
  };

  #commit = option => {
    const trigger = this.#trigger;
    const value = option.dataset.option;
    for (const el of this.#options) el.setAttribute('aria-selected',String(el === option));
    trigger.querySelector('[data-current-option]').textContent = option.textContent.trim();
    this.close();
    trigger.focus({preventScroll:true});
    this.#select(trigger.dataset.menu,value,trigger);
  };

  #onClick = event => {
    const trigger = event.target.closest('[data-menu]');
    if (trigger) {
      if (trigger === this.#trigger) this.close();
      else this.#open(trigger);
      return;
    }
    const option = event.target.closest('[data-option]');
    if (option && this.#list?.contains(option)) this.#commit(option);
  };

  #onKey = event => {
    const trigger = event.target.closest('[data-menu]');
    if (!trigger || event.isComposing) return;
    const { key } = event;
    const opened = this.#trigger === trigger;
    if (key === 'Tab') {
      this.close();
      return;
    }
    if (key === 'Escape' && opened) {
      event.preventDefault();
      this.close();
      return;
    }
    if ((key === 'Enter' || key === ' ') && opened) {
      event.preventDefault();
      this.#commit(this.#options[this.#active]);
      return;
    }
    if (['ArrowDown','ArrowUp','Home','End'].includes(key)) {
      event.preventDefault();
      if (!opened) this.#open(trigger);
      const index = key === 'Home' ? 0 : key === 'End' ? this.#options.length - 1 :
        opened ? this.#active + (key === 'ArrowDown' ? 1 : -1) : this.#active;
      this.#highlight(index);
      return;
    }
    if (key.length !== 1 || key === ' ' || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    if (!opened) this.#open(trigger);
    const now = performance.now();
    this.#search = (now - this.#searchAt < 600 ? this.#search : '') + key.toLocaleLowerCase();
    this.#searchAt = now;
    const index = this.#options.findIndex(option => option.textContent.trim().toLocaleLowerCase().startsWith(this.#search));
    if (index !== -1) this.#highlight(index);
  };
}
