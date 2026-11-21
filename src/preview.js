const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const packLoads = new Map();

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/motion-prompt/' + src + '.js';
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      reject(new Error('无法加载动效示例'));
    };
    document.head.append(script);
  });
}

function loadPack(name) {
  if (!packLoads.has(name)) {
    if (!packLoads.has('runtime')) {
      packLoads.set('runtime', loadScript('runtime').catch(error => {
        packLoads.delete('runtime');
        throw error;
      }));
    }
    const pending = packLoads.get('runtime').then(() => loadScript(name))
      .then(() => window.MotionPrompt.packs[name])
      .catch(error => {
        packLoads.delete(name);
        throw error;
      });
    packLoads.set(name, pending);
  }
  return packLoads.get(name);
}

export class PreviewPlayer {
  #frames = new Map();
  #visible = new Set();
  #next = 0;
  #paused = reduce.matches;
  #last = 0;
  #observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.#visible.add(entry.target);
        this.#frames.get(entry.target)?.load?.();
      } else {
        this.#visible.delete(entry.target);
      }
    }
    this.#queue();
  }, { rootMargin: '100px 0px' });

  constructor() {
    reduce.addEventListener('change', event => {
      this.#paused = event.matches;
      for (const button of document.querySelectorAll('[data-action="pause"]')) {
        button.textContent = this.#paused ? '播放样张' : '暂停样张';
      }
      this.#queue();
    });
  }

  get paused() {
    return this.#paused;
  }

  toggle = () => {
    this.#paused = !this.#paused;
    this.#queue();
    return this.#paused;
  };

  clear = root => {
    for (const canvas of this.#frames.keys()) {
      if (root.contains(canvas) || !canvas.isConnected) {
        this.#observer.unobserve(canvas);
        this.#visible.delete(canvas);
        this.#frames.delete(canvas);
      }
    }
  };

  mountMotion = (canvas, item, pack) => {
    let started = false;
    const frame = { duration: item.cycle, load: async () => {
      if (started) return;
      started = true;
      try {
        const engine = await loadPack(item.pack);
        if (!canvas.isConnected) return;
        const cell = engine.cells[Number(item.id) - Number(pack.first)];
        const ctx = canvas.getContext('2d');
        canvas.width = engine.width;
        canvas.height = engine.height;
        frame.draw = time => cell(ctx, engine.width, engine.height, time);
        frame.draw(0.9);
        canvas.dataset.ready = 'true';
        this.#queue();
      } catch {
        if (canvas.isConnected) {
          const message = document.createElement('span');
          message.className = 'preview-error';
          message.textContent = '预览暂不可用，可打开原站';
          this.clear(canvas);
          canvas.replaceWith(message);
        }
      }
    } };
    this.#frames.set(canvas, frame);
    this.#observer.observe(canvas);
  };

  mountWhite = (canvas, item, skin) => {
    const ctx = canvas.getContext('2d');
    const draw = time => drawWhite(ctx, canvas.width, canvas.height, time / item.duration, item.id, skin);
    this.#frames.set(canvas, { duration:item.duration, draw });
    draw(item.duration * 0.27);
    canvas.dataset.ready = 'true';
    this.#observer.observe(canvas);
  };

  #queue = () => {
    if (!this.#next && !this.#paused && this.#visible.size) {
      this.#next = requestAnimationFrame(this.#tick);
    }
  };

  #tick = now => {
    this.#next = 0;
    if (this.#paused) return;
    if (now - this.#last > 1000 / 28) {
      this.#last = now;
      const dialog = document.querySelector('#detail[open]');
      for (const canvas of this.#visible) {
        if (dialog && !dialog.contains(canvas)) continue;
        const frame = this.#frames.get(canvas);
        frame?.draw?.((now / 1000) % frame.duration);
      }
    }
    this.#queue();
  };
}

export const skins = {
  gray: ['灰块白模','#dbdcd9','#9fa6a2','#535954'],
  'paper-blue': ['纸本蓝','#f1e8d0','#326e8a','#1d3b50'],
  'full-orange': ['满版橙','#d95621','#ffce78','#50251d'],
  'aurora-skin': ['极光玻璃','#2a255a','#b080dc','#a7c6f8'],
  'clay-skin': ['黏土糖果','#f8d9d4','#a783b8','#526e60'],
  'riso-skin': ['Riso 小报','#efe2c4','#d55076','#225580'],
};

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };

function drawWhite(ctx, width, height, t, id, skin) {
  const [,background,accent,ink] = skins[skin];
  const unit = Math.min(width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(unit / 280, unit / 280);
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  let px = 0;
  let py = 0;
  const rect = (x,y,w,h,color=accent) => {
    ctx.fillStyle = color;
    ctx.fillRect(x,y,w,h);
  };
  const label = (text, x, y, size, color=ink) => {
    ctx.font = '800 ' + size + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text,x,y);
  };
  const circle = (x,y,r,color=accent) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
  };
  const line = (x,y,toX,toY) => {
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(toX,toY);
    ctx.stroke();
  };

  switch (id) {
    case 'word-topple-ground': {
      line(-118,67,118,67);
      ctx.save();
      ctx.translate(0,54);
      ctx.transform(1,0,0.65*smooth((t-0.28)*3),1-0.78*smooth((t-0.28)*3),0,0);
      label('重点',0,-35,64);
      ctx.restore();
      for (let i=0;i<3;i++) if (t > 0.54+i*0.09) circle(-48+i*48,36,9);
      break;
    }
    case 'word-orbit-ring':
      ctx.beginPath();
      ctx.ellipse(0,0,99,46,0,0,Math.PI*2);
      ctx.stroke();
      for (let i=0;i<5;i++) {
        const angle = t*Math.PI*2 + i*Math.PI*0.4;
        px = Math.cos(angle)*99;
        py = Math.sin(angle)*46;
        circle(px,py,11,py>16 ? ink : accent);
        label('0'+(i+1),px,py-19,12);
      }
      label('概念',0,0,32);
      break;
    case 'fill-collapse-to-object': {
      const progress=smooth(t*2.4);
      const w=(width * 280 / unit-66)*(1-progress)+66;
      const h=(height * 280 / unit-74)*(1-progress)+74;
      rect(-w/2,-h/2,w,h);
      if (progress>0.9) {
        rect(-40,-18,80,61,ink);
        rect(-13,-43,26,23,ink);
        circle(0,12,16,accent);
      }
      break;
    }
    case 'slam-behind-strike':
      label('误区', 0, -19 - (1-smooth(t*4))*100, 68);
      circle(0,38,24);
      rect(-26,62,52,28);
      if (t>0.44) line(-66,-58,-66+132*smooth((t-0.44)*7),-58+105*smooth((t-0.44)*7));
      if (t>0.57) line(66,-58,66-132*smooth((t-0.57)*7),-58+105*smooth((t-0.57)*7));
      break;
    case 'page-fold-turn': {
      const page=smooth((t-0.15)*2);
      rect(-102,-70,204,139,ink);
      label('后一页',0,0,34,background);
      ctx.save();
      ctx.translate(-102,-70);
      ctx.transform(Math.cos(page*Math.PI*0.5),-page*0.62,0,1,0,0);
      rect(0,0,204,139,accent);
      label('当前页',102,69,34);
      ctx.restore();
      break;
    }
    case 'word-cut-backdrop': {
      const beat=Math.min(3,Math.floor(t*4));
      for(let i=0;i<4;i++) {
        ctx.rotate(Math.PI*0.5);
        if(i===beat) rect(-88,-87,176,66);
      }
      circle(0,-8,27,ink);
      rect(-21,19,42,50,ink);
      label(['先','看','再','选'][beat],0,94,22);
      break;
    }
    default: {
      rect(-103,-66,206,132,ink);
      rect(-95,-58,190,116,background);
      for(let i=0;i<3;i++) {
        circle(-57+i*57,-33,13,t>0.16+i*0.13 ? accent : ink);
        label('0'+(i+1),-57+i*57,-33,13,background);
        rect(-72+i*57,-6,46,36,accent);
      }
      if (t>0.58) {
        const rise = smooth((t-0.58)*5);
        rect(-52,11+18*(1-rise),104,34,ink);
        label('完成',0,28+18*(1-rise),20,background);
      }
    }
  }
  ctx.restore();
}
