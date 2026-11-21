import atlas from '../data/atlas.json' with { type: 'json' };
import motion from '../data/motion-prompt.json' with { type: 'json' };
import opuscar from '../data/opuscar.json' with { type: 'json' };

async function fetchSource(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(url + ' returned ' + response.status);
  return response;
}

function compare(label, local, official) {
  const localKeys = new Set(local);
  const officialKeys = new Set(official);
  const missing = [...officialKeys].filter(key => !localKeys.has(key));
  const removed = [...localKeys].filter(key => !officialKeys.has(key));
  if (missing.length || removed.length || localKeys.size !== local.length || officialKeys.size !== official.length) {
    throw new Error(label + ' catalog differs ' + JSON.stringify({ local: local.length, official: official.length, missing, removed }));
  }
  return label + ' ' + official.length + ' entries matched';
}

const checks = [
  async () => {
    const endpoint = 'https://atlas.letz.ai/api/public/atlas/catalog?limit=100&offset=';
    const page = await (await fetchSource(endpoint + '0')).json();
    const rest = await Promise.all(Array.from({ length: Math.ceil(page.total / 100) - 1 },
      (_, i) => fetchSource(endpoint + (i + 1) * 100).then(response => response.json())));
    const entries = [page, ...rest].flatMap(result => result.effects);
    return compare('LetzAI', atlas.map(entry => entry.slug), entries.map(entry => entry.slug));
  },
  async () => {
    const official = await (await fetchSource(motion.site + 'api/v1/catalog.json')).json();
    const key = item => [item.id, item.pack, item.slug].join('/');
    const matched = compare('Motion Prompt', motion.elements.map(key), official.elements.map(key));
    if (motion.version !== official.version) throw new Error('Motion Prompt version ' + motion.version + ' → ' + official.version);
    return matched + ' (' + motion.version + ')';
  },
  async () => {
    const html = await (await fetchSource(opuscar.source)).text();
    const index = html.match(/<script type="application\/json" id="idx">([\s\S]*?)<\/script>/);
    if (!index) throw new Error('Lemo-Opuscar source index missing');
    const ids = JSON.parse(index[1]).rows.map(([id]) => 'opuscar-' + id);
    return compare('Lemo-Opuscar', opuscar.entries.map(entry => entry.id), ids);
  },
];

for (const result of await Promise.allSettled(checks.map(run => run()))) {
  if (result.status === 'fulfilled') console.log(result.value);
  else {
    console.error(result.reason.message);
    process.exitCode = 1;
  }
}
