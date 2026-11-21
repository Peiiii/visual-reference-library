import styleEntries from '../data/styles.json' with { type: 'json' };
import opuscar from '../data/opuscar.json' with { type: 'json' };
import atlasEntries from '../data/atlas.json' with { type: 'json' };
import whiteEntries from '../data/white-models.json' with { type: 'json' };

export const styles = styleEntries;
export const opuscarStyles = opuscar.entries;
export const opuscarBase = opuscar.source;
export const effects = atlasEntries;
export const whiteModels = whiteEntries;
export let motionCatalog;
export async function loadMotionCatalog() {
  motionCatalog ??= (await import('../data/motion-prompt.json', { with: { type: 'json' } })).default;
  return motionCatalog;
}
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
export const packName = id => zh(motionCatalog.packs.find(item => item.pack === id)?.title);
export const categoryName = item => zh(motionCatalog.packs.find(pack => pack.pack === item.pack)
  ?.categories.find(category => category.slug === item.category)) || item.category;

export function motionTheme(item) {
  if (item.pack.startsWith('camera')) return '运镜与转场';
  if (item.pack === 'photo') return '光影与摄影';
  if (item.pack === 'artstyle') return '图像画风';
  if (item.pack === 'diagram') return '图解图表';
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

export function opuscarPrompt(item) {
  return [
    '风格参考｜' + item.name + ' · ' + item.en,
    '参考样片｜《' + item.film + '》 · ' + item.source.url,
    '根据我的题材和已有素材，分析参考片的构图、色彩、材质和剪辑节奏。用我自己的主体和文案做一个 16:9 样镜，并给出可复用的风格配置。',
  ].join('\n');
}

const motionTitle = item => 'Motion Prompt #' + item.id + ' · ' + zh(item.name) + ' · ' + item.name.en;
const motionDemo = item => motionBase + '#' + item.id;

function motionApplication(item) {
  switch (item.pack) {
    case 'artstyle':
      return '把画风名称、媒材、笔触和用色融入我的主体与构图。静态图像只采用画风本身。';
    case 'photo':
      return '把光线、镜头或后期特征用在我的主体和场景。以最终画面效果为参考，只有明确需要时才制作演示中的前后对照。';
    case 'diagram':
      return '用我的数据与标签重建图表，保留原参考的布局、数据关系和阅读重点。如果需要动画，再采用演示中的出现顺序。';
    case 'ui':
    case 'lp':
    case 'lp2':
      return '在项目现有组件和技术栈中实现，用真实点击、悬停或滚动替代演示操作，保留相关动效时序与缓动，并尊重减少动态效果偏好。';
    default:
      return '保留动作路径、先后顺序和缓动，把演示主体、构图和颜色换成我的项目内容。按目标镜头时长适配各段节奏。若目标是视频生成模型，把运动规格写成连贯的镜头描述。';
  }
}

export function motionPrompt(item) {
  const revision = motionCatalog.revision;
  const api = 'https://raw.githubusercontent.com/showheyohtaki/motion-prompt/' + revision + '/api/v1/';
  const specs = item.spec['zh-Hans'] || item.spec.en;
  return [
    '请在我的任务中应用 ' + motionTitle(item) + '。',
    motionApplication(item),
    '',
    '效果｜' + zh(item.meaning),
    '官方示例用法｜' + zh(item.ask),
    '样张说明｜' + zh(item.summary),
    '适用场景｜' + zh(item.use),
    '',
    '原始规格',
    ...specs.map(line => '- ' + line),
    '',
    '官方演示｜' + motionDemo(item),
    '条目规格和参考代码｜' + api + 'en/e/' + item.id + '.txt',
    '系列共享代码｜' + api + 'kit/' + item.pack + '.js',
    '若要编码实现，参考条目代码及其系列共享代码，保留 Motion Prompt 的 MIT 署名。',
  ].join('\n');
}

export function motionSkillPrompt(item) {
  return [
    '请用已安装的 motion-prompt Skill 调用 ' + motionTitle(item) + '。',
    '按编号读取官方规格。需要编码时，同时读取条目代码和 ' + item.pack + ' 系列共享代码。',
    motionApplication(item),
    '官方演示｜' + motionDemo(item),
  ].join('\n');
}

export function whitePrompt(item, format, skin) {
  return ['白模动作｜' + item.name + ' [' + item.id + ']',
    '时长｜' + item.duration + ' 秒　画幅｜' + format + '　材质｜' + skin,
    '应用｜' + item.use, item.example && '口播示例｜' + item.example, '时序｜' + item.prompt,
    '复用｜锁定关键位置、时间与节奏，再按独立的风格配置调整配色、字体和质感。'].filter(Boolean).join('\n');
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
