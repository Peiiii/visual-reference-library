import './site.css';
import {
  styles, opuscarStyles, opuscarBase, effects, motionCatalog, loadMotionCatalog, whiteModels, atlasBase, motionBase, douyinSource,
  atlasGroup, zh, packName, categoryName, motionTheme, isPhysics,
  searchable, stylePrompt, opuscarPrompt, motionPrompt, motionSkillPrompt, whitePrompt, pairStyles, mixPrompt,
} from './data.js';
import atlasMedia from '../data/atlas-media.json' with { type: 'json' };
import atlasVideos from '../data/atlas-videos.json' with { type: 'json' };
import coverPreviews from '../data/cover-previews.json' with { type: 'json' };
import { PreviewPlayer, skins } from './preview.js';
import { FilterMenus } from './filter-menus.js';

const repository = 'https://github.com/Peiiii/visual-reference-library';
const motionSkillGuide = 'https://github.com/showheyohtaki/motion-prompt#skill-reference';

const pages = {
  styles: ['风格库', '浏览视觉包装样张，按题材选风格，把配置直接交给 AI。', [...styles, ...opuscarStyles]],
  atlas: ['视觉特效', '从摄影和电影史到机器技法，查找原始效果、示例与 LetzAI 提示词。', effects],
  motion: ['动效手法', '看循环演示，找到镜头、光影、转场、画风和图解的准确名称。', []],
  white: ['白模动作', '保留同一套关键帧，在横、竖、方与不同风格之间切换。', whiteModels],
  mix: ['风格组合', '从风格库取 3–5 套基底，两两组合，再套入自己的配色与 IP。', []],
};
const artFiles = new Set(['woodblock','clay','glass','collage','neon','papercut','shadow','lantern','crayon','wash','ink','impasto']);
const sortDefault = '最近入库';
const styleCollections = [['own','个人风格'],['opuscar','Lemo-Opuscar']];
const batchSize = 24;
const formats = { wide: ['横版 16:9', 512, 288], tall: ['竖版 9:16', 288, 512], square: ['方版 1:1', 320, 320] };
const whiteRelations = ['揭示','累积','计数','对照','替换','聚焦','拆分','聚合','传递','排序','演化','否定'];
const whiteTypes = ['数字','证据','对比','金句','步骤','引用','钩子','术语','列举','过渡','强调','换段'];
const whiteShortcuts = [['all','全部'],...['步骤','对比','数字','换段','钩子'].map(type => [type,type])];
const whiteGroups = ['录屏类','标题类','概念类','叠加卡类','连接类','转场类','转场类（片头）','转场类（片尾）'];
const motionAliases = {
  'dolly-zoom-vertigo': '希区柯克变焦 希区考克变焦',
  'rack-focus': '焦点切换 拉焦',
  'rim-light': '边缘光',
};
const programs = {
  all: '全部',
  '运镜与转场': '运镜与转场',
  '光影与摄影': '光影库',
  '动态图形': '动态图形',
  physics: '物理与缓动',
  'UI 组件': 'UI 组件',
  '落地页与网页': '网页效果',
  '图像画风': '图像画风',
  '图解图表': '图解图表',
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);

function httpsUrl(value, base) {
  try {
    const url = new URL(value, base);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

const link = (label, url) => `<a href="${esc(httpsUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
const act = (label, action, id = '', classes = '') => `<button class="action ${classes}" data-action="${action}" data-id="${esc(id)}">${esc(label)}</button>`;
const detailsButton = (name, id) => `<button class="card-title" data-action="detail" data-id="${esc(id)}">${esc(name)}</button>`;

function groupSelect(key, label, options, selected) {
  const choices = options.map(value => Array.isArray(value) ? value : [value,value]);
  const current = choices.find(([id]) => String(id) === String(selected)) ?? choices[0];
  const id = 'options-' + key;
  return `<div class="filter select-menu"><span id="label-${key}">${esc(label)}</span>
    <button type="button" class="select-trigger" role="combobox" aria-labelledby="label-${key} value-${key}" aria-controls="${id}" aria-expanded="false" data-menu="${key}">
      <span id="value-${key}" data-current-option>${esc(current[1])}</span><i aria-hidden="true"></i>
    </button>
    <div id="${id}" class="select-popup" role="listbox" aria-labelledby="label-${key}" hidden>
      ${choices.map(([value,text],index) => `<div id="${id}-${index}" role="option" aria-selected="${String(value) === String(current[0])}" data-option="${esc(value)}">${esc(text)}</div>`).join('')}
    </div></div>`;
}

function quickFilters(key, label, options, selected) {
  return `<div class="quick-filters" role="group" aria-label="${esc(label)}">
    ${options.map(([value,text]) => `<button type="button" class="quick-filter" data-quick="${key}" data-value="${esc(value)}" aria-pressed="${value === selected}">${esc(text)}</button>`).join('')}
    </div>`;
}

function coverImage(original, alt, mode) {
  const preview = coverPreviews[original];
  const src = mode === 'detail' ? original : (preview?.thumb ?? original);
  const priority = mode === 'priority' ? ' fetchpriority="high"' : '';
  const fallback = src !== original ? ` data-original="${esc(original)}"` : '';
  return `<img loading="${mode === 'lazy' ? 'lazy' : 'eager'}" decoding="async"${priority}${fallback}
    ${preview ? 'data-card-image' : ''} src="${esc(src)}" alt="${esc(alt)}">${inlineCover(preview)}`;
}

function inlineCover(preview) {
  return preview ? `<span class="cover-preview" aria-hidden="true" style="background-image:url(data:image/webp;base64,${preview.preview})"></span>` : '';
}

function styleArt(item, mode = 'detail') {
  const customImage = typeof item.image === 'string' && item.image.startsWith('/samples/') ? item.image : null;
  if (customImage || artFiles.has(item.preview)) {
    const src = customImage || '/samples/' + item.preview + '.webp';
    const artwork = src.split('/').at(-1);
    const label = item.film ? (item.stationCover ? '工位图' : '样片封面') : '';
    const alt = label ? item.group + ' · ' + (item.stationCover ? label : item.film) : item.name + '原创样张';
    return `<div class="cover" data-art="${esc(artwork)}">${coverImage(src, alt, mode)}
      ${label ? `<small class="media-label">${label}</small>` : ''}</div>`;
  }
  const colors = item.colors.map((value, index) => '--c' + index + ':' + value).join(';');
  const label = item.preview === 'swiss' ? '<b>形与序</b><small>FORM & RHYTHM</small>' : '<i></i><i></i><i></i><i></i>';
  return `<div class="cover graphic graphic-${esc(item.preview)}" style="${esc(colors)}" role="img" aria-label="${esc(item.name)}原创样张">
    <div class="graphic-paper">${label}</div></div>`;
}

function motionCanvas(item) {
  const preview = item.pack === 'artstyle' && coverPreviews['/motion-prompt/img/style-' + item.no + '.webp'];
  return `<div class="cover motion-cover"><canvas data-motion="${item.id}" width="${item.width}" height="${item.height}" role="img" aria-label="${esc(zh(item.name))}循环样张"></canvas>${inlineCover(preview)}</div>`;
}

function whiteCanvas(item, format = 'wide', skin = 'gray') {
  const [size, width, height] = formats[format];
  return `<div class="cover white-cover white-${format}" data-skin="${skin}">
    <canvas data-white="${item.id}" data-skin="${skin}" width="${width}" height="${height}" role="img" aria-label="${esc(item.name)}的${size}${skins[skin][0]}预览"></canvas></div>`;
}

function effectCover(item, mode = 'detail') {
  const media = atlasMedia[item.slug];
  const previewType = media.license ? '来源示例' : media.originalMethod === 'algorithm' ? '效果演示' : '技法示意';
  return `<div class="cover atlas-picture">${coverImage(media.file, item.name + '：' + media.title, mode)}
    <small class="media-label">${previewType}</small></div>`;
}

function atlasImageCredit(media) {
  if (!media?.license) return '';
  const code = media.license.match(/^CC BY(-SA)? ([234]\.0)$/i);
  const licenseUrl = code ? 'https://creativecommons.org/licenses/by' + (code[1] ? '-sa' : '') + '/' + code[2] + '/'
    : media.license.startsWith('CC0') ? 'https://creativecommons.org/publicdomain/zero/1.0/'
    : 'https://creativecommons.org/publicdomain/mark/1.0/';
  return `<p class="credit">图像 ${esc(media.artist)} · ${link(media.license, licenseUrl)} · ${link('图片出处',media.page)}</p>`;
}

function styleCard(item, mode) {
  if (item.film) {
    return `<article class="card">
      ${styleArt(item, mode)}
      <div class="card-body"><div class="meta">${esc(item.group)} <span>${esc(item.duration)}</span></div>
      <h3>${detailsButton(item.name,item.id)}</h3><p class="en">${esc(item.en)}</p>
      <p class="description">《${esc(item.film)}》</p>
      <div class="card-actions">${act('复制参考提示词','copy-opuscar',item.id,'primary')} ${link('官方样片',item.source.url)}</div>
      </div></article>`;
  }
  return `<article class="card">
    ${styleArt(item, mode)}
    <div class="card-body"><div class="meta">${esc(item.group)} <span>${item.level === 'A' ? '换题即用' : item.level === 'B' ? '换题需改' : '特定题材'}</span></div>
    <h3>${detailsButton(item.name,item.id)}</h3><p class="en">${esc(item.en)}</p>
    <p class="description">${esc(item.description)}</p>
    <p class="use"><b>适合</b> ${esc(item.use)}</p>
    <div class="card-actions">${act('复制风格配置','copy-style',item.id,'primary')} ${act('查看来源','detail',item.id,'subtle')}</div>
    </div></article>`;
}

function atlasCard(item, mode) {
  return `<article class="card">
    ${effectCover(item, mode)}
    <div class="card-body"><div class="meta">${item.kind === 'historical' ? '年代史' : '机器技法'} <span>${esc(atlasGroup(item))}${atlasVideos[item.slug] ? ' · 视频片段' : ''}</span></div>
    <h3>${detailsButton(item.name,item.slug)}</h3><p class="en">${esc(item.en)}</p>
    <div class="card-actions">${act('复制提示词','copy-atlas',item.slug,'primary')} ${act('详情','detail',item.slug,'subtle')} ${link('官方原页',atlasBase+item.url)}</div></div></article>`;
}

function motionCard(item) {
  return `<article class="card">
    ${motionCanvas(item)}
    <div class="card-body"><div class="meta">${motionTheme(item)} <span>#${item.id} · ${esc(categoryName(item))}</span></div>
    <h3>${detailsButton(zh(item.name),item.id)}</h3><p class="en">${esc(item.name.en)}</p>
    <p class="description">${esc(zh(item.meaning))}</p>
    <div class="card-actions">${motionActions(item)}</div></div></article>`;
}

function motionActions(item) {
  return `${act('复制完整提示词','copy-motion',item.id,'primary')}
    ${act('复制 Skill 调用','copy-motion-skill',item.id)}
    ${act('复制中文名','copy-name',item.id,'subtle')}`;
}

function whiteCard(item) {
  return `<article class="card">
    ${whiteCanvas(item)}
    <div class="card-body"><div class="meta">${esc(item.group)} <span>${item.duration} 秒 · ${esc(item.relation)}</span></div>
    <h3>${detailsButton(item.name,item.id)}</h3><p class="en">${esc(item.id)} · v${item.version}</p>
    <p class="description">${esc(item.description)}</p>
    <p class="use"><b>适合</b> ${esc(item.use)}</p>
    <div class="card-actions">${act('看白模和换皮','detail',item.id,'primary')} ${act('复制调用配置','copy-white',item.id,'subtle')}</div></div></article>`;
}

const renderCard = { styles: styleCard, atlas: atlasCard, motion: motionCard, white: whiteCard };

class Library {
  #app = document.querySelector('#app');
  #dialog = document.querySelector('#detail');
  #status = document.querySelector('#status');
  #player = new PreviewPlayer();
  #filters = {};
  #slugs = new Map();
  #view;
  #opened;
  #whiteFormat = 'wide';
  #whiteSkin = 'gray';
  #atlasCache = new Map();
  #menus;
  #rows = [];
  #shown = 0;
  #tail;
  #loadObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting && entry.target === this.#tail)) this.#appendResults();
  }, {rootMargin:'0px 0px 1250px'});
  #selection = [];
  #mixOptions = { colors:'', character:'' };
  #noticeTimer;

  constructor() {
    for (const [id, entry] of Object.entries(pages)) {
      this.#filters[id] = { query:'', group:'all', kind:'all', pack:'all', category:'all',
        relation:'all', type:'all', duration:'all', added:'all', before:'', after:'', sort:sortDefault, images:false, videos:false };
      this.#slugs.set(id, new Map(entry[2].map(item => [item.id || item.slug, item])));
    }
    const params = new URLSearchParams(location.search);
    this.#view = Object.hasOwn(pages, params.get('view')) ? params.get('view') : 'styles';
    this.#filters.styles.collection = params.get('source') === 'opuscar' ? 'opuscar' : 'own';
    this.#menus = new FilterMenus(document,this.#applyFilter);
    document.addEventListener('load', this.#revealCover, true);
    document.addEventListener('error', this.#recoverCover, true);
    this.#app.addEventListener('click', this.#onClick);
    this.#app.addEventListener('input', this.#onInput);
    this.#app.addEventListener('change', this.#onChange);
    this.#dialog.addEventListener('click', this.#onClick);
    this.#dialog.addEventListener('change', this.#onChange);
    this.#dialog.addEventListener('click', event => {
      if (event.target === this.#dialog) {
        const bounds = this.#dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.#dialog.close();
      }
    });
    this.#dialog.addEventListener('close', () => {
      if (this.#dialog.open) return;
      this.#menus.close();
      this.#player.clear(this.#dialog);
      this.#opened = undefined;
      if (new URLSearchParams(location.search).has('item')) this.#updateUrl(false);
    });
    window.addEventListener('popstate', this.#restore);
    this.#renderPage();
    const id = params.get('item');
    if (id) this.#showDetail(id, false);
  }

  #revealCover = async ({target: image}) => {
    if (!image.matches?.('img[data-card-image]')) return;
    try {
      await image.decode();
      image.dataset.ready = 'true';
    } catch {
      // Preserve the preview when the image cannot be decoded.
    }
  };

  #recoverCover = ({target: image}) => {
    const original = image.dataset?.original;
    if (!original) return;
    delete image.dataset.original;
    image.src = original;
  };

  #restore = () => {
    const params = new URLSearchParams(location.search);
    const view = Object.hasOwn(pages, params.get('view')) ? params.get('view') : 'styles';
    const collection = params.get('source') === 'opuscar' ? 'opuscar' : 'own';
    const stylesChanged = view === 'styles' && this.#filters.styles.collection !== collection;
    if (stylesChanged) Object.assign(this.#filters.styles, { collection, group:'all' });
    if (this.#dialog.open) this.#dialog.close();
    if (view !== this.#view || stylesChanged) {
      this.#view = view;
      this.#renderPage();
    }
    const id = params.get('item');
    if (id) this.#showDetail(id, false);
  };

  #updateUrl = (push, item) => {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    if (this.#view !== 'styles') url.searchParams.set('view',this.#view);
    else if (this.#filters.styles.collection === 'opuscar') url.searchParams.set('source','opuscar');
    if (item) url.searchParams.set('item',item);
    history[push ? 'pushState' : 'replaceState'](null,'',url);
  };

  #renderPage = () => {
    this.#menus.close();
    this.#loadObserver.disconnect();
    this.#tail = undefined;
    this.#player.clear(this.#app);
    const [name, intro, set] = pages[this.#view];
    const loadingMotion = this.#view === 'motion' && !motionCatalog;
    const counts = this.#view === 'atlas' ? '504 项 · 321 年代史 · 183 机器技法'
      : this.#view === 'motion' && motionCatalog ? motionCatalog.count + ' 项 · ' + motionCatalog.packs.length + ' 个系列'
      : this.#view === 'white' ? set.length + ' 个动作样片'
      : this.#view === 'styles' ? styles.length + ' 套个人风格 · ' + opuscarStyles.length + ' 项公开参考' : '';
    const subtitle = intro;
    this.#app.innerHTML = `
      <header class="site-header"><div class="topline wrap">
        <a class="brand" href="/" data-view="styles"><img src="/mark.svg" width="34" height="34" alt=""><span>视觉素材图鉴</span></a>
        <div class="header-actions">
          <span class="owner">Peiiii</span>
          ${link('GitHub',repository)}
        </div>
      </div></header>
      <div class="wrap"><nav class="tabs" aria-label="图鉴目录">
        ${Object.entries(pages).map(([key,[label]]) => `<a href="${key === 'styles' ? '/' : '/?view='+key}" data-view="${key}" ${key === this.#view ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
      </nav></div>
      <main id="main" class="wrap">
        <header class="section-head">
          <div><h1>${name}</h1><p>${subtitle}</p>
          ${this.#view === 'motion' ? `<p>完整提示词可直接交给 AI。已安装 Motion Prompt Skill 时可按编号调用。${link('官方 Skill 用法',motionSkillGuide)}</p>` : ''}</div>
          ${counts || loadingMotion ? `<p class="catalog-count" ${loadingMotion ? 'hidden' : ''}>${counts}</p>` : ''}
        </header>
        ${this.#view === 'mix' ? '<section id="mix"></section>' : `
        <section aria-label="筛选${name}">
          <div class="filters" id="filters">${loadingMotion ? '' : this.#filterControls()}</div>
          <div class="results-head"><p id="result-count" role="status"></p>
          ${['motion','white'].includes(this.#view) ? act(this.#player.paused ? '播放样张' : '暂停样张','pause') : ''}</div>
          <div id="results" tabindex="-1"></div>
        </section>`}
      </main>
      <footer class="wrap site-footer">
        <span>视觉素材图鉴 · Peiiii</span>
        <div>${link('原片参考',douyinSource)} ${link('LetzAI',atlasBase)} ${link('Motion Prompt',motionBase)}
        ${link('Lemo-Opuscar',opuscarBase)}</div>
      </footer>`;
    document.title = name + ' · 视觉素材图鉴';
    if (this.#view === 'mix') this.#renderMix();
    else if (loadingMotion) this.#renderMotionCatalog();
    else this.#renderResults();
  };

  #renderMotionCatalog = async () => {
    const results = this.#app.querySelector('#results');
    results.innerHTML = '<p role="status">正在读取 Motion Prompt 目录…</p>';
    try {
      const { elements } = await loadMotionCatalog();
      this.#slugs.set('motion', new Map(elements.map(item => [item.id, item])));
      if (!results.isConnected) return;
      const count = this.#app.querySelector('.catalog-count');
      count.textContent = motionCatalog.count + ' 项 · ' + motionCatalog.packs.length + ' 个系列';
      count.hidden = false;
      this.#app.querySelector('#filters').innerHTML = this.#filterControls();
      this.#renderResults();
      const id = new URLSearchParams(location.search).get('item');
      if (id) this.#showDetail(id, false);
    } catch {
      results.innerHTML = `<div class="empty"><p>暂时无法读取 Motion Prompt 目录。</p>${act('重试','retry-motion')}</div>`;
    }
  };

  #filterControls = () => {
    const f = this.#filters[this.#view];
    const search = this.#view === 'white' ? '搜动作、用途、口播例句…' : '搜索中文或英文名称…';
    const standard = `<label class="search"><span class="visually-hidden">搜索</span><span class="glass-icon" aria-hidden="true"></span><input type="search" data-filter="query" value="${esc(f.query)}" placeholder="${search}"></label>`;
    const all = (label, items) => [['all',label],...items];
    const select = (key,label,items) => groupSelect(key,label,items,f[key]);
    if (this.#view === 'styles') {
      const entries = f.collection === 'opuscar' ? opuscarStyles : styles;
      const groups = [...new Set(entries.map(item => item.group))];
      return quickFilters('collection','风格来源',styleCollections,f.collection)
        + standard + select('group','分类',all('全部风格',groups));
    }
    if (this.#view === 'atlas') {
      const groups = [...new Map(effects.filter(item => f.kind === 'all' || item.kind === f.kind)
        .map(item => [item.group,atlasGroup(item)])).entries()].sort((a,b) => a[1].localeCompare(b[1]));
      const kinds = [['historical','年代史'],['digital','机器技法']];
      return quickFilters('kind','视觉特效范围',all('全部',kinds),f.kind) + standard + select('group','年代 / 机器章节',all('全部分组',groups))
        + `<label class="check"><input type="checkbox" data-filter="images" ${f.images ? 'checked' : ''}>仅看有授权图像</label>
        <label class="check"><input type="checkbox" data-filter="videos" ${f.videos ? 'checked' : ''}>仅看有视频片段</label>`;
    }
    if (this.#view === 'motion') {
      const { packs, elements } = motionCatalog;
      const activePacks = packs.filter(pack => {
        const entries = elements.filter(item => item.pack === pack.pack);
        return this.#inMotionTheme(entries, f.group);
      });
      const categories = [...new Map(activePacks.filter(pack => f.pack === 'all' || pack.pack === f.pack)
        .flatMap(pack => pack.categories.map(item => [item.slug,zh(item)]))).entries()];
      return quickFilters('group','动效手法',Object.entries(programs),f.group) + standard +
        select('pack','系列', all('全部系列',activePacks.map(pack => [pack.pack,zh(pack.title)]))) +
        select('category','分类',all('全部分类',categories));
    }
    return quickFilters('type','常用用途',whiteShortcuts,f.type)
      + standard + select('added','入库时间',all('所有日期',[['week','最近 7 天'],['month','最近 30 天'],['custom','日期范围']])) +
      (f.added === 'custom' ? `<label class="filter"><span>开始日期</span><input type="date" data-filter="after" value="${esc(f.after)}"></label>
      <label class="filter"><span>截止日期</span><input type="date" data-filter="before" value="${esc(f.before)}"></label>` : '') +
      select('duration','时长',all('全部时长',['≤2 秒','2–5 秒','5–10 秒','>10 秒'])) +
      select('relation','关系',all('全部关系',whiteRelations)) +
      select('type','主类型',all('全部用途',whiteTypes)) +
      select('group','分类',all('全部分类',whiteGroups)) +
      select('sort','排序',[sortDefault,'最早入库','原始顺序']);
  };

  #inMotionTheme = (entries, theme) => {
    if (theme === 'all') return true;
    return entries.some(item => theme === 'physics' ? isPhysics(item) : motionTheme(item) === theme);
  };

  #getRows = () => {
    const f = this.#filters[this.#view];
    const match = (...parts) => searchable(f.query,...parts);
    if (this.#view === 'styles') {
      const entries = f.collection === 'opuscar' ? opuscarStyles : styles;
      return entries.filter(x => (f.group === 'all' || x.group === f.group)
        && match(x.name,x.en,x.group,x.description,x.use,x.film,x.tags,x.id));
    }
    if (this.#view === 'atlas') {
      return effects.filter(x => (f.kind === 'all' || x.kind === f.kind) && (f.group === 'all' || String(x.group) === f.group)
        && (!f.images || atlasMedia[x.slug]?.license) && (!f.videos || atlasVideos[x.slug]) && match(x.name,x.en,x.slug,atlasGroup(x)))
        .sort((a,b) => Number(a.kind==='digital')-Number(b.kind==='digital') || String(a.group).localeCompare(String(b.group)));
    }
    if (this.#view === 'motion') {
      const id = f.query.trim().match(/^#?\s*(\d{1,3})$/);
      return motionCatalog.elements.filter(x => this.#inMotionTheme([x],f.group) &&
        (f.pack === 'all' || x.pack === f.pack) && (f.category === 'all' || x.category === f.category) &&
        (id ? Number(x.id) === Number(id[1]) : match(zh(x.name),x.name.en,x.slug,x.tags,
          motionAliases[x.slug],categoryName(x),packName(x.pack),zh(x.meaning),zh(x.use),zh(x.summary))));
    }
    const date = new Date();
    const ending = item => new Date(item.added + 'T23:59:59+08:00').getTime();
    const filtered = whiteModels.filter(x => {
      const timeGroup = x.duration <= 2 ? '≤2 秒' : x.duration <= 5 ? '2–5 秒' : x.duration <= 10 ? '5–10 秒' : '>10 秒';
      const recent = f.added === 'week' ? 7 : f.added === 'month' ? 30 : 0;
      const added = recent ? date.getTime() - ending(x) <= recent * 86400000
        : f.added !== 'custom' || ((!f.after || x.added >= f.after) && (!f.before || x.added <= f.before));
      return added && (f.group === 'all' || x.group === f.group) && (f.relation === 'all' || x.relation === f.relation)
        && (f.type === 'all' || x.type === f.type) && (f.duration === 'all' || f.duration === timeGroup)
        && match(x.name,x.id,x.use,x.description,x.example);
    });
    if (f.sort === '原始顺序') return filtered;
    const direction = f.sort === sortDefault ? -1 : 1;
    return filtered.sort((a,b) => direction * a.added.localeCompare(b.added));
  };

  #renderResults = () => {
    const result = this.#app.querySelector('#results');
    this.#loadObserver.disconnect();
    this.#tail = undefined;
    this.#player.clear(result);
    this.#rows = this.#getRows();
    this.#shown = 0;
    if (!this.#rows.length) {
      this.#app.querySelector('#result-count').textContent = '0 项';
      result.innerHTML = `<div class="empty"><p>没有找到匹配的条目。</p>${act('清除筛选','clear','','secondary')}</div>`;
      return;
    }
    result.innerHTML = '<div id="result-list"></div><div class="load-tail">' +
      '<button type="button" class="action" data-action="more" aria-controls="result-list">加载更多</button></div>';
    this.#tail = result.querySelector('.load-tail');
    this.#appendResults();
  };

  #appendResults = (moveFocus = false) => {
    if (!this.#tail?.isConnected || this.#shown >= this.#rows.length) return;
    this.#loadObserver.unobserve(this.#tail);
    const list = this.#app.querySelector('#result-list');
    const focusedTail = this.#tail.contains(document.activeElement);
    const rowGroups = new Map();
    const groupKey = this.#view === 'atlas' ? atlasGroup
      : this.#view === 'motion' ? item => packName(item.pack)
      : this.#view === 'styles' && this.#filters.styles.collection === 'opuscar' ? item => item.group : () => '';
    for (const row of this.#rows.slice(this.#shown,this.#shown + batchSize)) {
      const group = groupKey(row);
      if (!rowGroups.has(group)) rowGroups.set(group,[]);
      rowGroups.get(group).push(row);
    }

    let firstNewCard;
    let position = this.#shown;
    const card = renderCard[this.#view];
    for (const [group, items] of rowGroups) {
      let section = list.lastElementChild;
      if (section?.dataset.group !== group) {
        section = document.createElement('section');
        section.className = 'card-section';
        section.dataset.group = group;
        section.innerHTML = `${group ? `<h2 class="group-title">${esc(group)}</h2>` : ''}<div class="grid ${this.#view === 'atlas' ? 'compact' : ''}"></div>`;
        list.append(section);
      }
      const fragment = document.createRange().createContextualFragment(
        items.map(item => card(item, position++ < 2 ? 'priority' : 'lazy')).join('')
      );
      firstNewCard ??= fragment.firstElementChild;
      this.#mountPreviews(fragment);
      section.querySelector('.grid').append(fragment);
    }
    this.#shown = Math.min(this.#shown + batchSize,this.#rows.length);
    this.#app.querySelector('#result-count').textContent = '已显示 ' + this.#shown + ' / ' + this.#rows.length + ' 项';
    this.#tail.hidden = this.#shown === this.#rows.length;
    if (!this.#tail.hidden) this.#loadObserver.observe(this.#tail);
    if (moveFocus || focusedTail) firstNewCard?.querySelector('.card-title').focus();
  };

  #mountPreviews = root => {
    for (const canvas of root.querySelectorAll('[data-motion]')) {
      const item = this.#slugs.get('motion').get(canvas.dataset.motion);
      this.#player.mountMotion(canvas,item,motionCatalog.packs.find(pack=>pack.pack===item.pack));
    }
    for (const canvas of root.querySelectorAll('[data-white]')) {
      this.#player.mountWhite(canvas,this.#slugs.get('white').get(canvas.dataset.white),canvas.dataset.skin);
    }
  };

  #renderMix = () => {
    const selected = this.#selection.map(id => this.#slugs.get('styles').get(id));
    this.#app.querySelector('#mix').innerHTML = `
      <div class="mix-layout">
        <section class="mix-panel"><h2>选择基础风格 <small id="selection-count">${selected.length} / 5</small></h2>
          <div class="selection-list">${styles.map(item => `<label class="check choice">
            <input type="checkbox" data-select="${item.id}" ${this.#selection.includes(item.id) ? 'checked' : ''}
            ${selected.length===5 && !this.#selection.includes(item.id) ? 'disabled' : ''}>
            <i style="background:${esc(item.colors[1])}" aria-hidden="true"></i>${esc(item.name)}</label>`).join('')}</div>
        </section>
        <section class="mix-panel mix-options"><h2>个人元素</h2>
          <label>配色<input type="text" data-mix="colors" maxlength="140" value="${esc(this.#mixOptions.colors)}" placeholder="例如 午夜蓝与暖白"></label>
          <label>IP 或个人标记<input type="text" data-mix="character" maxlength="160" value="${esc(this.#mixOptions.character)}" placeholder="例如 片头用一只圆形白猫"></label>
          <div id="pairs"></div>
        </section>
      </div>`;
    this.#renderPairs();
  };

  #renderPairs = () => {
    const pairs = pairStyles(this.#selection);
    this.#app.querySelector('#pairs').innerHTML = pairs.length ? `
      <h2 class="pair-heading">${pairs.length} 种风格组合</h2>
      <div class="pair-list">${pairs.map(([first,second]) => {
        const a = this.#slugs.get('styles').get(first);
        const b = this.#slugs.get('styles').get(second);
        return `<details><summary>${esc(a.name)} <b>×</b> ${esc(b.name)}</summary>
          <pre>${esc(mixPrompt(a,b,this.#mixOptions))}</pre>${act('复制组合提示词','copy-mix',first+'|'+second,'primary')}</details>`;
      }).join('')}</div>` : '<p class="empty-note">选满 3 套风格后，显示可复制的配对方案。</p>';
  };

  #showDetail = (id, update = true) => {
    const item = this.#slugs.get(this.#view).get(id);
    if (!item) return;
    this.#opened = item;
    this.#whiteFormat = 'wide';
    this.#whiteSkin = 'gray';
    this.#renderDetail();
    if (!this.#dialog.open) this.#dialog.showModal();
    if (update) this.#updateUrl(false,id);
    if (this.#view === 'atlas') this.#loadAtlas(item);
  };

  #renderDetail = () => {
    const item = this.#opened;
    this.#player.clear(this.#dialog);
    const title = this.#view === 'motion' ? zh(item.name) : item.name;
    const en = this.#view === 'motion' ? item.name.en : item.en;
    let body;
    switch (this.#view) {
      case 'styles':
        if (item.film) {
          body = `${styleArt(item)}<p>${esc(item.group)} · 《${esc(item.film)}》 · ${esc(item.duration)}</p>
            <h3>参考提示词</h3><pre>${esc(opuscarPrompt(item))}</pre>
            <div class="card-actions">${act('复制参考提示词','copy-opuscar',item.id,'primary')} ${link('官方样片与风格说明',item.source.url)}</div>
            <p class="credit">${item.stationCover ? '工位图' : '样片封面'}经缩放 · ${item.artist ? esc(item.artist) + ' · ' : ''}${link('Lemo-Opuscar by Lemomo (LemoLab)',opuscarBase)} ·
              ${link('CC BY 4.0','https://creativecommons.org/licenses/by/4.0/')} · ${link('图像来源',item.imageSource)}</p>`;
          break;
        }
        body = `${styleArt(item)}<div class="palette" aria-label="参考配色">${item.colors.map(color=>`<span><i style="background:${esc(color)}"></i>${esc(color)}</span>`).join('')}</div>
          <p>${esc(item.description)}</p><p><b>适合</b> ${esc(item.use)}</p>
          <h3>提示词</h3><pre>${esc(stylePrompt(item))}</pre>
          <div class="card-actions">${act('复制风格配置','copy-style',item.id,'primary')} ${link(item.source.label,item.source.url)}</div>`;
        break;
      case 'atlas': {
        const video = atlasVideos[item.slug];
        const footage = video ? `<h3>视频片段</h3><video controls playsinline preload="none" src="${esc(video.file)}" aria-label="${esc(item.name)}视频示例"></video>
          <p class="credit">${esc(video.artist)} · ${link(video.license,video.licenseUrl)} · ${link('视频原页',video.page)} · 截取开头 10 秒，无声预览</p>` : '';
        body = `${effectCover(item)}${atlasImageCredit(atlasMedia[item.slug])}${footage}<div class="card-actions detail-links">${link('LetzAI 官方原页',atlasBase+item.url)}</div>
          <div id="atlas-detail"><p role="status">正在读取 LetzAI 官方条目…</p></div>`;
        break;
      }
      case 'motion': {
        const spec = item.spec?.['zh-Hans'] || item.spec?.en || [];
        body = `${motionCanvas(item)}<p>${esc(zh(item.meaning))}</p>
          <p><b>编号及分类</b> #${item.id} · ${esc(packName(item.pack))} · ${esc(categoryName(item))}</p>
          <h3>官方示例用法</h3><pre>${esc(zh(item.ask))}</pre>
          <div class="card-actions">${motionActions(item)} ${act(this.#player.paused?'播放样张':'暂停样张','pause')}</div>
          <details><summary>查看复制内容</summary>
            <h3>完整提示词</h3><pre>${esc(motionPrompt(item))}</pre>
            <h3>Skill 调用</h3><pre>${esc(motionSkillPrompt(item))}</pre>
          </details>
          <details><summary>用途、要点与概要</summary><p>${esc(zh(item.use))}</p><p>${esc(zh(item.summary))}</p><ul>${spec.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>
          <p class="credit">${link('Motion Prompt · Shohei Ohtaki',motionBase+'#'+item.id)} · <a href="/motion-prompt/LICENSE">MIT</a></p>`;
        break;
      }
      default:
        body = `<div class="white-bar">
          ${groupSelect('format','画幅',Object.entries(formats).map(([key,[name]])=>[key,name]),this.#whiteFormat)}
          ${groupSelect('skin','材质',Object.entries(skins).map(([key,[name]])=>[key,name]),this.#whiteSkin)}
          ${act(this.#player.paused?'播放样张':'暂停样张','pause')}
          </div><div id="white-stage">${whiteCanvas(item,this.#whiteFormat,this.#whiteSkin)}</div>
          <p>${esc(item.description)}</p><p><b>适合</b> ${esc(item.use)} · ${item.duration} 秒</p>
          ${item.example ? `<p><b>口播示例</b> ${esc(item.example)}</p>` : ''}
          <h3>动作配置</h3><pre id="white-config">${esc(this.#whiteConfig(item))}</pre>
          <div class="card-actions">${act('复制调用配置','copy-white',item.id,'primary')}
            ${item.source === 'video' ? link('对照原片约 04:08',douyinSource) : '<span class="credit">本站原创白模</span>'}</div>`;
    }
    this.#dialog.innerHTML = `<header class="detail-head"><div><h2 id="detail-title">${esc(title)}</h2>${en ? `<p>${esc(en)}</p>` : ''}</div>
      <button type="button" class="action close" data-action="close" aria-label="关闭详情" autofocus>×</button>
      </header><div class="detail-body">${body}</div><div class="copy-feedback" role="status"></div>`;
    this.#mountPreviews(this.#dialog);
  };

  #whiteConfig = item => whitePrompt(item,formats[this.#whiteFormat][0],skins[this.#whiteSkin][0]);

  #redrawWhite = () => {
    const stage = this.#dialog.querySelector('#white-stage');
    this.#player.clear(stage);
    stage.innerHTML = whiteCanvas(this.#opened,this.#whiteFormat,this.#whiteSkin);
    this.#dialog.querySelector('#white-config').textContent = this.#whiteConfig(this.#opened);
    this.#mountPreviews(stage);
  };

  #readAtlas = slug => {
    let pending = this.#atlasCache.get(slug);
    if (!pending) {
      pending = fetch('/api/atlas/' + encodeURIComponent(slug), { signal:AbortSignal.timeout(14000) })
        .then(response => {
          if (!response.ok) throw new Error('官方接口暂不可用');
          return response.json();
        }).then(record => {
          if (!record?.effect || typeof record.prompt !== 'string') throw new Error('官方资料不完整');
          return record;
        }).catch(error => {
          this.#atlasCache.delete(slug);
          throw error;
        });
      this.#atlasCache.set(slug,pending);
    }
    return pending;
  };

  #loadAtlas = async item => {
    const target = this.#dialog.querySelector('#atlas-detail');
    if (!target) return;
    target.innerHTML = '<p role="status">正在读取 LetzAI 官方条目…</p>';
    try {
      const record = await this.#readAtlas(item.slug);
      if (target.isConnected && this.#opened === item) target.innerHTML = this.#atlasEntry(item,record);
    } catch {
      if (!target.isConnected || this.#opened !== item) return;
      target.innerHTML = `<p role="status">暂时无法读取官方条目。可重试，或从上方官方原页查看和复制提示词。</p>${act('重新读取','retry-atlas',item.slug)}`;
    }
  };

  #copyAtlas = async (item, button) => {
    if (button.getAttribute('aria-busy') === 'true') return;
    const label = button.textContent;
    button.setAttribute('aria-busy','true');
    button.textContent = '正在复制…';
    let promptIssue = '';
    const prompt = this.#readAtlas(item.slug).then(record => {
      if (record.prompt.trim()) return record.prompt;
      promptIssue = '此条目暂无官方提示词。';
      throw new Error(promptIssue);
    },error => {
      promptIssue = '暂时读不到官方提示词，可重新点击或打开官方原页。';
      throw error;
    });
    try {
      if (window.ClipboardItem && navigator.clipboard?.write) {
        const contents = prompt.then(value => new Blob([value],{type:'text/plain'}));
        const writing = (async () => navigator.clipboard.write([new ClipboardItem({'text/plain':contents})]))();
        const [written, read] = await Promise.allSettled([writing,contents]);
        if (read.status === 'rejected') throw read.reason;
        if (written.status === 'rejected') throw written.reason;
      } else {
        const value = await prompt;
        await navigator.clipboard.writeText(value);
      }
      this.#notify('已复制到剪贴板');
    } catch {
      this.#notify(promptIssue || '剪贴板不可用，可从官方原页复制。');
    } finally {
      button.textContent = label;
      button.removeAttribute('aria-busy');
    }
  };

  #atlasEntry = (item, record) => {
    const source = record.effect;
    const media = atlasMedia[item.slug];
    const allowed = value => /^(Public domain|CC0(?: 1\.0)?|CC BY(?:-SA)? [234]\.0)$/i.test((value || '').trim());
    const alt = (record.gallery || []).find(x => allowed(x.license) && x.artist && httpsUrl(x.page) && httpsUrl(x.src,atlasBase));
    const dating = source.dating || source.context?.[0];
    const context = source.body?.find(x=>x.label==='Identify')?.text || source.context?.[1];
    const principle = source.body?.find(x=>x.label==='Principle')?.text;
    const copy = record.prompt.trim() ? act('复制官方提示词','copy-atlas',item.slug,'primary') : '<p>此条目暂无可复制的官方提示词。</p>';
    const dynamicImage = !media.license && alt && !/\.(mp4|webm)(\?|$)/i.test(alt.src);
    return `${dynamicImage ? `<figure><img loading="lazy" src="${esc(httpsUrl(alt.src,atlasBase))}" alt="${esc(alt.title)}"></figure>` : ''}
      ${dynamicImage ? atlasImageCredit(alt) : ''}
      <h3>来历与视觉特征</h3>
      ${dating ? `<p>${esc(dating)}</p>` : ''}${context ? `<p>${esc(context)}</p>` : ''}
      ${principle ? `<details><summary>工作原理</summary><p>${esc(principle)}</p></details>` : ''}
      ${source.funFact ? `<details><summary>官方补充</summary><p>${esc(source.funFact)}</p></details>` : ''}
      <h3>LetzAI 官方提示词</h3>${record.prompt.trim() ? `<pre>${esc(record.prompt)}</pre>` : ''}
      <div class="card-actions">${copy}</div>`;
  };

  #notify = message => {
    clearTimeout(this.#noticeTimer);
    const status = this.#dialog.open ? this.#dialog.querySelector('.copy-feedback') : this.#status;
    status.textContent = message;
    this.#noticeTimer = setTimeout(() => { status.textContent = ''; },2500);
  };

  #copy = async text => {
    try {
      await navigator.clipboard.writeText(text);
      this.#notify('已复制到剪贴板');
    } catch {
      this.#notify('剪贴板不可用，请在条目详情中手动复制。');
    }
  };

  #onClick = event => {
    const tab = event.target.closest('[data-view]');
    if (tab && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      if (tab.dataset.view !== this.#view) {
        this.#view = tab.dataset.view;
        this.#updateUrl(true);
        this.#renderPage();
        window.scrollTo(0,0);
        this.#app.querySelector('a[aria-current="page"]')?.focus({preventScroll:true});
      }
      return;
    }
    const quick = event.target.closest('[data-quick]');
    if (quick) {
      this.#applyFilter(quick.dataset.quick,quick.dataset.value,quick);
      return;
    }
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const {action,id} = button.dataset;
    const item = this.#slugs.get(this.#view).get(id);
    switch (action) {
      case 'detail': this.#showDetail(id); break;
      case 'close': this.#dialog.close(); break;
      case 'retry-atlas': this.#loadAtlas(this.#opened); break;
      case 'retry-motion': this.#renderMotionCatalog(); break;
      case 'copy-style': this.#copy(stylePrompt(item)); break;
      case 'copy-opuscar': this.#copy(opuscarPrompt(item)); break;
      case 'copy-motion': this.#copy(motionPrompt(item)); break;
      case 'copy-motion-skill': this.#copy(motionSkillPrompt(item)); break;
      case 'copy-name': this.#copy(zh(item.name)); break;
      case 'copy-atlas': this.#copyAtlas(item,button); break;
      case 'copy-white': this.#copy(this.#dialog.open ? this.#whiteConfig(item) : whitePrompt(item,formats.wide[0],skins.gray[0])); break;
      case 'copy-mix': {
        const [first,second] = id.split('|').map(key=>this.#slugs.get('styles').get(key));
        this.#copy(mixPrompt(first,second,this.#mixOptions));
        break;
      }
      case 'pause': {
        const paused = this.#player.toggle();
        document.querySelectorAll('[data-action="pause"]').forEach(x => { x.textContent = paused ? '播放样张' : '暂停样张'; });
        break;
      }
      case 'clear':
        Object.assign(this.#filters[this.#view], { query:'', group:'all', kind:'all', pack:'all',
          category:'all', relation:'all', type:'all', duration:'all', added:'all', before:'', after:'', images:false, videos:false });
        document.querySelector('#filters').innerHTML = this.#filterControls();
        this.#renderResults();
        document.querySelector('[data-filter="query"]').focus();
        break;
      case 'more': this.#appendResults(true); break;
    }
  };

  #onInput = event => {
    const input = event.target;
    if (event.isComposing) return;
    if (input.dataset.filter === 'query') {
      this.#filters[this.#view].query = input.value;
      this.#renderResults();
    }
    if (input.dataset.mix) {
      this.#mixOptions[input.dataset.mix] = input.value.trim();
      this.#renderPairs();
    }
  };

  #applyFilter = (key, value, trigger) => {
    if (key === 'format' || key === 'skin') {
      if (key === 'format') this.#whiteFormat = value;
      else this.#whiteSkin = value;
      this.#redrawWhite();
      return;
    }
    const f = this.#filters[this.#view];
    if (f[key] === value) return;
    f[key] = value;
    if (key === 'kind') f.group = 'all';
    if (key === 'collection') {
      f.group = 'all';
      this.#updateUrl(true);
    }
    if (key === 'pack' || (this.#view === 'motion' && key === 'group')) f.category = 'all';
    if (this.#view === 'motion' && key === 'group') f.pack = 'all';
    if (trigger) {
      const focus = trigger.dataset.quick
        ? '[data-quick="' + key + '"][data-value="' + CSS.escape(value) + '"]'
        : '[data-menu="' + key + '"]';
      const filters = this.#app.querySelector('#filters');
      filters.innerHTML = this.#filterControls();
      filters.querySelector(focus)?.focus({preventScroll:true});
    }
    this.#renderResults();
  };

  #onChange = event => {
    const input = event.target;
    const key = input.dataset.filter;
    if (key && key !== 'query') this.#applyFilter(key,input.type === 'checkbox' ? input.checked : input.value);
    if (input.dataset.select) {
      const id = input.dataset.select;
      if (input.checked && this.#selection.length < 5) this.#selection.push(id);
      else this.#selection = this.#selection.filter(item => item !== id);
      const chosen = this.#selection.length;
      this.#app.querySelector('#selection-count').textContent = chosen + ' / 5';
      this.#app.querySelectorAll('[data-select]').forEach(checkbox => {
        checkbox.disabled = chosen===5 && !checkbox.checked;
      });
      this.#renderPairs();
    }
  };
}

new Library();
