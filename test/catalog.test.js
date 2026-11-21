import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  effects, motions, packs, styles, whiteModels,
  searchable, stylePrompt, pairStyles, mixPrompt, whitePrompt, zh, isPhysics,
} from '../src/data.js';
import atlasMedia from '../data/atlas-media.json' with { type: 'json' };

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

test('Motion Prompt includes every ID in the pinned 192-entry release', () => {
  assert.equal(packs.length, 8);
  assert.deepEqual(motions.map(item => +item.id), Array.from({length:192},(_,i)=>i+1));
  assert.ok(motions.some(item => isPhysics(item) && item.slug === 'overshoot'));
  for (const pack of packs) {
    assert.equal(motions.filter(item => item.pack === pack.pack).length, 24);
    assert.ok(existsSync('public/motion-prompt/' + pack.pack + '.js'));
  }
  for (const item of motions) assert.ok(zh(item.name) && zh(item.ask));
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
  assert.deepEqual(whiteModels.map(item=>item.id), [
    'word-topple-ground', 'word-orbit-ring', 'fill-collapse-to-object', 'slam-behind-strike',
    'page-fold-turn', 'word-cut-backdrop', 'screen-step-focus',
  ]);
  const item = whiteModels[0];
  for (const [aspect,skin] of [['横版 16:9','灰块白模'],['竖版 9:16','纸本蓝'],['方版 1:1','满版橙']]) {
    const output = whitePrompt(item,aspect,skin);
    assert.ok(output.includes(item.prompt) && output.includes(aspect) && output.includes(skin));
  }
});
