import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  effects, styles, opuscarStyles, whiteModels,
  searchable, stylePrompt, opuscarPrompt, pairStyles, mixPrompt, whitePrompt, zh, isPhysics, motionTheme,
  loadMotionCatalog, motionPrompt, motionSkillPrompt,
} from '../src/data.js';
import atlasMedia from '../data/atlas-media.json' with { type: 'json' };
import coverPreviews from '../data/cover-previews.json' with { type: 'json' };
import motionCatalog from '../data/motion-prompt.json' with { type: 'json' };
import { whiteTechniques } from '../src/white-animations.js';

test('LetzAI includes all 504 distinct public entries and has 29 categories', () => {
  assert.equal(effects.length, 504);
  assert.equal(new Set(effects.map(item => item.slug)).size, 504);
  assert.equal(effects.filter(item => item.kind === 'historical').length, 321);
  assert.equal(effects.filter(item => item.kind === 'digital').length, 183);
  assert.equal(new Set(effects.map(item => item.group)).size, 29);
  for (const item of effects) {
    assert.match(item.name, /[\p{Script=Han}]/u, item.slug);
    assert.equal(item.url, '/effect/' + item.slug);
  }
});

test('Motion Prompt includes every entry and preview asset in the pinned release', () => {
  const { revision, count, elements, packs } = motionCatalog;
  assert.match(revision, /^[a-f0-9]{40}$/);
  assert.equal(count, 240);
  assert.equal(packs.length, 10);
  assert.deepEqual(elements.map(item => +item.id), Array.from({length:count},(_,i)=>i+1));
  assert.ok(elements.some(item => isPhysics(item) && item.slug === 'overshoot'));
  for (const pack of packs) {
    const entries = elements.filter(item => item.pack === pack.pack);
    assert.equal(entries.length, pack.count);
    assert.equal(entries[0].id, pack.first);
    assert.equal(entries.at(-1).id, pack.last);
    assert.ok(existsSync('public/motion-prompt/' + pack.pack + '.js'));
    for (const image of pack.images ?? []) assert.ok(existsSync('public/motion-prompt/' + image), image);
    for (const item of entries) {
      assert.ok(pack.categories.some(category => category.slug === item.category), item.slug);
      assert.ok(item.name['zh-Hans'] && item.ask['zh-Hans'] && item.spec.en?.length, item.slug);
    }
  }
  assert.equal(motionTheme(elements[192]), '图像画风');
  assert.equal(motionTheme(elements[216]), '图解图表');
});

test('both copy modes identify the same Motion Prompt item and the full prompt carries its source specs', async () => {
  const { elements, revision } = await loadMotionCatalog();
  const api = 'https://raw.githubusercontent.com/showheyohtaki/motion-prompt/' + revision + '/api/v1/';
  for (const item of elements) {
    const full = motionPrompt(item);
    const skill = motionSkillPrompt(item);
    for (const copy of [full, skill]) {
      assert.ok(copy.includes('Motion Prompt #' + item.id));
      assert.ok(copy.includes(item.name['zh-Hans']));
      assert.ok(copy.includes(item.name.en));
      assert.ok(copy.includes('https://showheyohtaki.github.io/motion-prompt/#' + item.id));
    }
    assert.ok(full.includes(item.ask['zh-Hans']));
    assert.ok(full.includes('以原始规格为效果基准'));
    assert.ok(full.includes(api + 'en/e/' + item.id + '.txt'));
    assert.ok(full.includes(api + 'kit/' + item.pack + '.js'));
    for (const spec of item.spec.en) assert.ok(full.includes(spec), item.id);
    assert.ok(skill.includes('已安装的 motion-prompt Skill'));
    assert.ok(skill.length < full.length);
  }
  assert.match(motionPrompt(elements[192]), /静态图像只采用画风本身/);
  assert.match(motionPrompt(elements[216]), /用我的数据与标签重建图表/);
});

test('every Atlas entry has a distinct local WebP and verifiable cover provenance', () => {
  assert.equal(Object.keys(atlasMedia).length, effects.length);
  const hashes = new Set();
  for (const { slug } of effects) {
    const media = atlasMedia[slug];
    assert.ok(media?.title, slug);
    assert.equal(media.file, '/atlas-media/' + slug + '.webp');
    if (media.license) {
      assert.ok(media.artist && media.page.startsWith('https://'), slug);
      assert.match(media.license, /^(Public domain|CC0(?: 1\.0)?|CC BY(?:-SA)? [234]\.0)$/i);
    } else {
      assert.ok(['algorithm', 'illustration'].includes(media.originalMethod), slug);
    }
    const bytes = readFileSync('public' + media.file);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', slug);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', slug);
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert.ok(!hashes.has(hash), slug);
    hashes.add(hash);
  }
});

test('style entries are editable and produce their own copyable configuration', () => {
  const ids = new Set();
  for (const item of styles) {
    assert.match(item.id, /^[a-z0-9-]+$/);
    assert.ok(!ids.has(item.id), item.id);
    ids.add(item.id);
    assert.ok(item.name && item.en && item.description && item.use && item.prompt);
    assert.ok(item.colors.every(value => /^#[\da-f]{6}$/i.test(value)));
    assert.ok(stylePrompt(item).includes(item.prompt));
  }
  assert.ok(searchable('ＲＩＳＯ 小报', 'Riso 小报'));
  assert.ok(!searchable('riso 水墨', 'Riso 小报', '印刷版画'));
});

test('the full Opuscar style index has covers, source links and copyable references', () => {
  assert.equal(opuscarStyles.length, 99);
  assert.equal(new Set(opuscarStyles.map(item => item.id)).size, 99);
  assert.equal(new Set(opuscarStyles.map(item => item.group)).size, 15);
  for (const item of opuscarStyles) {
    assert.ok(item.name && item.en && item.film, item.id);
    assert.ok(item.source.url.endsWith('/styles/' + item.id.slice(8) + '/'), item.id);
    assert.ok(coverPreviews[item.image] && existsSync('public' + item.image), item.id);
    assert.ok(opuscarPrompt(item).includes(item.source.url), item.id);
  }
});

test('all WebP covers have an inline preview and versioned smaller thumbnails when available', () => {
  const originals = ['atlas-media', 'samples', 'motion-prompt/img'].flatMap(directory =>
    readdirSync('public/' + directory)
      .filter(name => name.endsWith('.webp'))
      .map(name => '/' + directory + '/' + name)
  ).sort();
  assert.deepEqual(Object.keys(coverPreviews).sort(), originals);
  const thumbnails = new Set();
  for (const [original, { preview, thumb }] of Object.entries(coverPreviews)) {
    const inline = Buffer.from(preview, 'base64');
    assert.equal(inline.toString('ascii', 8, 12), 'WEBP', original);
    assert.ok(inline.length <= 400, original);
    if (!thumb) continue;
    assert.match(thumb, /^\/cover-thumbs\/[^/]+\.[a-f0-9]{12}\.webp$/);
    const bytes = readFileSync('public' + thumb);
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    assert.ok(thumb.endsWith('.' + hash + '.webp'), thumb);
    assert.ok(bytes.length < readFileSync('public' + original).length * 0.9, thumb);
    thumbnails.add(thumb.split('/').at(-1));
  }
  assert.deepEqual(readdirSync('public/cover-thumbs').sort(), [...thumbnails].sort());
});

test('three to five selected styles form unique pairs with individual context', () => {
  const pool = styles.slice(0,5);
  assert.equal(pairStyles(pool.slice(0,2)).length, 0);
  assert.equal(pairStyles(pool.slice(0,3)).length, 3);
  assert.equal(pairStyles(pool.slice(0,4)).length, 6);
  assert.equal(pairStyles(pool).length, 10);
  assert.equal(pairStyles([...pool,pool[0]]).length, 0);
  assert.equal(pairStyles([pool[0],pool[0],pool[1]]).length, 0);
  const prompt = mixPrompt(pool[0],pool[1],{colors:'#333333',character:'几何猫'});
  for (const term of [pool[0].name,pool[1].name,'#333333','几何猫']) assert.ok(prompt.includes(term));
});

test('all on-screen white-model cases are represented with independent timing', () => {
  assert.deepEqual(whiteModels.filter(item => item.source === 'video').map(item=>item.id), [
    'word-topple-ground', 'word-orbit-ring', 'fill-collapse-to-object', 'slam-behind-strike',
    'page-fold-turn', 'word-cut-backdrop', 'screen-step-focus',
  ]);
  const item = whiteModels[0];
  for (const [aspect,skin] of [['横版 16:9','灰块白模'],['竖版 9:16','纸本蓝'],['方版 1:1','满版橙']]) {
    const output = whitePrompt(item,aspect,skin);
    assert.ok(output.includes(item.prompt) && output.includes(aspect) && output.includes(skin));
  }
});

test('original white models have unique playable techniques and span all catalog facets', () => {
  const originals = whiteModels.filter(item => item.source === 'original');
  assert.equal(whiteModels.length, 55);
  assert.equal(new Set(whiteModels.map(item => item.id)).size, 55);
  assert.equal(new Set(originals.map(item => item.relation)).size, 12);
  assert.equal(new Set(originals.map(item => item.type)).size, 12);
  assert.equal(new Set(originals.map(item => item.group)).size, 8);
  const variants = new Set();
  for (const item of originals) {
    const { technique, variant, cue } = item.choreography;
    assert.ok(Object.hasOwn(whiteTechniques, technique), item.id);
    assert.ok([0, 1, 2, 3].includes(variant) && cue && item.duration > 0, item.id);
    variants.add(technique + ':' + variant);
    assert.ok(whitePrompt(item, '竖版 9:16', '纸本蓝').includes(item.example), item.id);
  }
  assert.equal(variants.size, originals.length);
});
