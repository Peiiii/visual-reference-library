import styleEntries from '../data/styles.json' with { type: 'json' };
import atlasEntries from '../data/atlas.json' with { type: 'json' };
import motionCatalog from '../data/motion-prompt.json' with { type: 'json' };
import whiteEntries from '../data/white-models.json' with { type: 'json' };

export const styles = styleEntries;
export const effects = atlasEntries;
export const whiteModels = whiteEntries;
export const motions = motionCatalog.elements;
export const packs = motionCatalog.packs;
export const atlasBase = 'https://atlas.letz.ai';
export const motionBase = 'https://showheyohtaki.github.io/motion-prompt/';
export const douyinSource = 'https://www.douyin.com/video/7708581319843794191';

export const atlasChapters = [
  '边缘与特征', '遮罩与控制', '颜色与量化', '印刷与抖动',
  '视频与故障', '空间与光学', '滤镜与运动', 'AI 生成流程',
];

export const atlasGroup = item => item.kind === 'historical'
  ? item.group : (String(item.group).padStart(2, '0') + ' · ' + atlasChapters[item.group - 1]);

export const zh = localization => localization?.['zh-Hans'] || localization?.en || '';
export const packName = id => zh(packs.find(item => item.pack === id)?.title);
export const categoryName = item => zh(packs.find(pack => pack.pack === item.pack)
  ?.categories.find(category => category.slug === item.category)) || item.category;

export function motionTheme(item) {
  if (item.pack.startsWith('camera')) return '运镜与转场';
  if (item.pack === 'photo') return '光影与摄影';
  if (item.pack.startsWith('motion')) return '动态图形';
  if (item.pack === 'ui') return 'UI 组件';
  return '落地页与网页';
}

const physics = /overshoot|squash|stretch|bounce|spring|eas(e|ing)|inertia|gravity|pendulum|elastic|ricochet/i;
export const isPhysics = item => item.pack.startsWith('motion')
  && physics.test([item.slug, ...item.tags].join(' '));

export function searchable(query, ...parts) {
  const haystack = parts.flat().join(' ').normalize('NFKC').toLowerCase();
  return query.normalize('NFKC').toLowerCase().trim().split(/\s+/).every(term => haystack.includes(term));
}

export function stylePrompt(item) {
  return [
    '风格｜' + item.name + ' · ' + item.en,
    '适用｜' + item.use,
    '色板｜' + item.colors.join(' / '),
    '画面与节奏｜' + item.prompt,
  ].join('\n');
}

export function motionPrompt(item) {
  return ['Motion Prompt #' + item.id + ' · ' + zh(item.name) + ' · ' + item.name.en, zh(item.ask)].join('\n');
}

export function whitePrompt(item, format, skin) {
  return ['白模动作｜' + item.name + ' [' + item.id + ']',
    '时长｜' + item.duration + ' 秒　画幅｜' + format + '　材质｜' + skin,
    '应用｜' + item.use, '时序｜' + item.prompt,
    '复用｜锁定关键位置、时间与节奏，再按独立的风格配置调整配色、字体和质感。'].join('\n');
}

export function pairStyles(selected) {
  if (selected.length < 3 || selected.length > 5 || new Set(selected).size !== selected.length) return [];
  return selected.flatMap((first, index) => selected.slice(index + 1).map(second => [first, second]));
}

export function mixPrompt(first, second, options) {
  return [
    '给我做一个用于视频包装的新风格：' + first.name + ' × ' + second.name,
    '骨架｜沿用「' + first.name + '」的构图与读序。' + first.prompt,
    '表面｜从「' + second.name + '」借用材质与用色，次要层才使用其动效。' + second.prompt,
    options.colors && '个人配色｜' + options.colors + '。优先于参考色板，保留主体对比。',
    options.character && '个人 IP｜' + options.character + '。结合场景在关键节点出现。',
    '交付｜给出一个 16:9 代表镜头、色板、字体和转场配置，保留原动作的关键帧和时长。',
  ].filter(Boolean).join('\n');
}
