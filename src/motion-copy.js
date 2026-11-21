import { selectMotionSource } from './motion-source.js';
import { motionPrompt } from './data.js';

const sources = import.meta.glob('../public/motion-prompt/*.js', { query: '?raw', import: 'default' });

export async function motionPromptWithSource(item) {
  const [runtime, source] = await Promise.all([
    sources['../public/motion-prompt/runtime.js'](),
    sources['../public/motion-prompt/' + item.pack + '.js'](),
  ]);
  return motionPrompt(item, runtime + '\n' + selectMotionSource(source, item.no));
}
