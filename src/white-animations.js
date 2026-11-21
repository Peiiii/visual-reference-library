const tau = Math.PI * 2;
const clamp = n => Math.max(0, Math.min(1, n));
function ease(n) {
  const x = clamp(n);
  return x * x * (3 - 2 * x);
}
const mix = (a, b, p) => a + (b - a) * p;
const step = (p, i, count) => ease(p * count - i);

function reveal(s, p, variant, cue) {
  const y = variant === 1 ? 40 : 0;
  if (variant === 2) {
    s.disc(0, 0, 120 * p, s.accent);
    s.disc(-28, -10, 14 * p, s.ink);
    if (p > 0.4) s.text(cue, 16, 15);
    return;
  }
  s.line(-96 * p, y + 24, 96 * p, y + 24);
  if (variant === 3) {
    s.card(0, 0, 142, 88, cue);
    s.box(-76, -46 - 52 * p, 152, 46, s.background);
    s.box(-76, 52 * p, 152, 46, s.background);
    return;
  }
  s.clip(-108, y + 24 - 55 * p, 216, 55 * p, () => {
    if (variant === 1) s.card(0, y, 195, 46, cue);
    else s.text(cue, 0, y, 36);
  });
}

function stack(s, p, variant, cue) {
  for (let i = 0; i < 3; i++) {
    const t = step(p, i, 3);
    if (t === 0) continue;
    if (variant === 1) {
      const x = -74 + 74 * i;
      if (i) s.line(x - 74, 30, x - 74 + 74 * t, 30);
      s.disc(x, 30, 6 + 5 * t, s.ink);
      s.line(x, 22, x, 22 - 36 * t);
      s.text(String(i + 1), x, -25);
    } else if (variant === 2) {
      s.card(mix(-112, -30 + 30 * i, t), 50 - 42 * i, 128, 34, String(i + 1));
    } else if (variant === 3) {
      const y = 50 - 42 * i;
      const w = 176 - 30 * i;
      s.box(-w / 2, y + 34 * (1 - t), w, 31, i === 1 ? s.ink : s.accent);
    } else {
      s.rotated(22 * (i - 1), 20 * (i - 1) - 70 * (1 - t), (i - 1) * 0.16,
        () => s.card(0, 0, 106, 68, String(i + 1), i % 2));
    }
  }
  s.text(cue, 0, -94);
}

function count(s, p, variant, cue) {
  if (variant === 0) {
    s.card(0, 0, 151, 80, '');
    s.line(-75, 0, 75, 0);
    s.text(String(Math.round(Number(cue) * p)), 0, -4, 47);
  } else if (variant === 1) {
    s.card(0, 20, 190, 16, '');
    s.box(-95, 12, 190 * p, 16, s.ink);
    for (let i = 0; i < 4; i++) s.disc(-95 + i * 63, 45, 5, p * 3 >= i ? s.ink : s.accent);
    s.text(cue + ' ' + Math.round(p * 100) + '%', 0, -28, 25);
  } else if (variant === 2) {
    s.ring(0, 0, 60, 0, tau, s.accent, 11);
    s.ring(0, 0, 60, -tau / 4, -tau / 4 + tau * parseInt(cue, 10) * p / 100, s.ink, 11);
    s.text(Math.round(parseInt(cue, 10) * p) + '%', 0, 0, 30);
  } else {
    s.line(-99, 70, 99, 70);
    [49, 73, 111, 87].forEach((height, i) => {
      const h = height * ease(p * 1.55 - i * 0.18);
      s.box(-88 + 47 * i, 70 - h, 34, h, i === 2 ? s.ink : s.accent);
    });
    s.text(cue, 0, -77);
  }
}

function compare(s, p, variant, cue) {
  const [before, after] = cue.split('/');
  if (variant === 0) {
    s.card(0, 0, 206, 122, '');
    const x = mix(-102, 102, (1 - Math.cos(tau * p)) / 2);
    s.clip(-103, -61, x + 103, 122, () => s.box(-103, -61, 206, 122, s.ink));
    s.line(x, -70, x, 70);
    s.disc(x, 0, 9, s.background);
    s.text(before, -57, 85);
    s.text(after, 57, 85);
  } else if (variant === 1) {
    const x = mix(100, 53, p);
    s.card(-x, 0, 97, 113, before);
    s.card(x, 0, 97, 113, after, true);
    for (let i = 0; i < 2; i++) {
      if (p < (i + 1) / 3) continue;
      s.line(-x - 31, 22 + i * 14, -x + 31, 22 + i * 14);
      s.box(x - 31, 20 + i * 14, 62, 3, s.background);
    }
  } else if (variant === 2) {
    s.box(-14, 50, 28, 28, s.ink);
    s.rotated(0, 17, mix(-0.17, 0.22, p), () => {
      s.line(-98, 0, 98, 0);
      s.card(-64, -24, 52, 38, before);
      s.card(64, -27, 60, 45, after, true);
    });
  } else {
    const isBefore = Math.floor(p * 3) % 2 === 0;
    s.card(0, 0, 198, 111, isBefore ? before : after, !isBefore);
    s.disc(-25, 69, 6, isBefore ? s.ink : s.accent);
    s.disc(25, 69, 6, isBefore ? s.accent : s.ink);
  }
}

function swap(s, p, variant, cue) {
  const [before, after] = cue.split('/');
  if (variant === 0) {
    s.clip(-108, -55, 216, 110, () => {
      s.card(-187 * p, 0, 144, 85, before);
      s.card(187 * (1 - p), 0, 144, 85, after, true);
    });
  } else if (variant === 1) {
    const w = Math.abs(Math.cos(Math.PI * p)) * 161;
    s.clip(-w / 2, -50, w, 100, () => s.card(0, 0, w, 94, p < 0.5 ? before : after, p >= 0.5));
  } else if (variant === 2) {
    s.card(0, 45, 165, 76, '');
    s.clip(-76, -95, 152, 176, () => {
      if (p < 0.5) s.card(0, 24 + 112 * p, 137, 65, before, true);
      else s.card(0, mix(-95, 24, (p - 0.5) * 2), 137, 65, after, true);
    });
  } else {
    s.card(0, 0, 197, 144, p < 0.5 ? before : after, p >= 0.5);
    s.box(mix(-345, 110, p), -130, 230, 260, s.accent);
  }
}

function focus(s, p, variant, cue) {
  if (variant === 0) {
    s.card(0, 0, 201, 122, '', true);
    const x = mix(-49, 48, p);
    s.disc(x, 0, 29, s.background);
    s.disc(-49, 0, 8, s.accent);
    s.disc(48, 0, 8, s.accent);
    s.text(cue, 0, 81);
  } else if (variant === 1) {
    s.card(-50, 16, 92, 78, '');
    s.box(-61, 12, 23, 16, s.ink);
    s.line(-37, 12, 21, mix(12, -25, p));
    s.card(51, -25, 93 * p, 73 * p, p > 0.55 ? cue : '', true);
  } else if (variant === 2) {
    s.card(-72, -44, 78, 28, '');
    s.card(69, 45, 79, 28, '');
    const x = 68 * p, y = 37 * p;
    s.card(0, 0, 130, 49, cue, true);
    for (const side of [-1, 1]) for (const edge of [-1, 1]) {
      s.line(side * (x + 11), edge * y, side * (x - 12), edge * y);
      s.line(side * (x + 11), edge * y, side * (x + 11), edge * (y - 12));
    }
  } else {
    const x = mix(-77, 72, p);
    s.line(-107, 32, 107, 32);
    s.disc(x, 32, 16);
    s.line(x, 12, x, -18);
    s.card(x * 0.7, -39, 70, 36, cue, true);
  }
}

function split(s, p, variant, cue) {
  if (variant === 3) {
    for (let i = -1; i <= 1; i++) {
      s.rotated(0, 61, i * 0.56 * p, () => s.card(0, -56, 69, 104, String(i + 2), i === 0));
    }
    return;
  }
  const points = variant === 0 ? [[-61, 0], [61, 0]]
    : variant === 1 ? [[-52, -47], [52, -47], [-52, 47], [52, 47]]
    : [[0, -62], [0, 0], [0, 62]];
  if (variant === 2) s.line(0, -62 * p, 0, 62 * p);
  points.forEach(([x, y], i) => s.card(x * p, y * p,
    variant === 2 ? 133 : 81, variant === 1 ? 66 : 44, p > 0.35 ? String(i + 1) : '', i % 2));
  s.text(cue, 0, -102);
}

function merge(s, p, variant, cue) {
  if (variant === 0) {
    for (let i = 0; i < 5; i++) {
      const angle = tau * i / 5;
      const x = 97 * Math.cos(angle), y = 70 * Math.sin(angle);
      s.line(x, y, 0, 0);
      s.disc(x * (1 - p), y * (1 - p), 13, s.ink);
    }
    s.disc(0, 0, 18 + 15 * p);
  } else if (variant === 1) {
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      const d = mix(68, 29, p);
      s.card(x * d, y * d, 56, 56, '', x !== y);
    }
  } else if (variant === 2) {
    for (let i = -1; i <= 1; i++) {
      s.card(i * mix(50, 5, p), i * mix(40, 13, p), mix(103, 158, p), 12, '', i === 0);
    }
    const summary = ease((p - 0.72) / 0.28);
    if (summary > 0) s.card(0, 0, 158, 44 * summary, summary > 0.75 ? cue : '', true);
    return;
  } else {
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      s.disc(x * 97 * (1 - p), y * 68 * (1 - p), 13, s.accent);
    }
    s.card(0, 0, 175 * p, 72 * p, p > 0.6 ? cue : '', true);
    return;
  }
  s.text(cue, 0, 105);
}

function pass(s, p, variant, cue) {
  if (variant === 1 || variant === 2) {
    const x = mix(-75, 75, p);
    s.card(-72, 0, 64, 89, '');
    s.card(72, 0, 64, 89, '');
    if (variant === 2) s.card(0, 0, 23, 120, '', true);
    s.card(x, 0, 36, 28, variant === 2 ? (p < 0.5 ? '入' : '出') : '', true);
    if (variant === 1) {
      s.line(x + 10, 7, x + 13, 28);
      s.line(x + 10, 7, x + 26, 20);
      s.line(x + 13, 28, x + 26, 20);
    }
    s.text(cue, 0, 80);
    return;
  }
  const points = variant === 0 ? [[-93, 39], [0, -38], [93, 39]]
    : [[-98, 23], [-32, -23], [32, 23], [98, -23]];
  const labels = cue.split('/');
  points.forEach(([x, y], i) => {
    if (i) {
      const [lastX, lastY] = points[i - 1];
      const connected = variant === 0 ? 1 : clamp(p * (points.length - 1) - i + 1);
      s.line(lastX, lastY, mix(lastX, x, connected), mix(lastY, y, connected));
    }
    s.disc(x, y, 12, p * (points.length - 1) >= i ? s.ink : s.accent);
    s.text(labels[i] || String(i + 1), x, y + 33);
  });
  const progress = p * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(progress));
  s.disc(mix(points[i][0], points[i + 1][0], progress - i),
    mix(points[i][1], points[i + 1][1], progress - i), 8, s.background);
}

function sort(s, p, variant, cue) {
  if (variant === 2) {
    s.line(0, -54, 0, 84);
    s.text('待办', -63, -76);
    s.text('完成', 63, -76);
  }
  const total = variant === 3 ? 4 : 3;
  for (let i = 0; i < total; i++) {
    const t = ease(p * 1.3 - i * 0.1);
    const target = (i + 1) % total;
    if (variant === 0) {
      s.card(Math.sin(t * Math.PI) * (i === 2 ? -21 : 21), mix(i - 1, target - 1, t) * 45,
        157, 33, String(i + 1), i === 2);
    } else if (variant === 1) {
      const height = 47 + i * 24;
      const x = mix(i - 1, target - 1, t) * 61 + Math.sin(Math.PI * t) * 12;
      s.box(x - 20, 56 - height, 40, height, i === 2 ? s.ink : s.accent);
    } else if (variant === 2) {
      s.card(i === 1 ? -62 : mix(-62, 63, t), 48 - i * 42, 83, 28, String(i + 1), i !== 1);
    } else {
      const x = mix(i % 2, target % 2, t) * 102 - 51;
      const y = mix(i >> 1, target >> 1, t) * 83 - 32;
      s.card(x, y, 67, 58, String(i + 1), i % 2);
    }
  }
  if (variant !== 2) s.text(cue, 0, -91);
}

function evolve(s, p, variant, cue) {
  if (variant === 0) {
    s.round(-53, -58, 106, 106, 53 * (1 - p));
  } else if (variant === 1) {
    s.line(-100, 1, mix(-100, 100, p), 1);
    const fork = ease((p - 0.4) / 0.6);
    s.line(-27, 1, mix(-27, 67, fork), -57 * fork);
    s.line(18, 1, mix(18, 90, fork), 58 * fork);
    s.disc(mix(-100, 100, p), 1, 7);
  } else if (variant === 2) {
    for (let i = 0; i < 3; i++) s.ring(-69 + 69 * i, 0, 22, 0, tau, s.ink, 2);
    s.round(mix(-69, 69, p) - 22, -22, 44, 44, 22 * (1 - p));
  } else {
    let lastX = -105, lastY = 0;
    for (let i = 1; i <= 36; i++) {
      const n = i / 36;
      const x = -105 + 210 * n, y = Math.sin(n * tau * 2) * 40 * p;
      s.line(lastX, lastY, x, y);
      lastX = x;
      lastY = y;
    }
  }
  s.text(cue, 0, 91);
}

function deny(s, p, variant, cue) {
  if (variant === 0) {
    s.card(0, 0, 158, 92, cue);
    const a = step(p, 0, 2), b = step(p, 1, 2);
    s.line(-75, -47, -75 + 150 * a, -47 + 94 * a);
    s.line(75, -47, 75 - 150 * b, -47 + 94 * b);
  } else if (variant === 1) {
    const [wrong, right] = cue.split('/');
    s.text(wrong, 0, -31, 31);
    s.line(-53, -31, mix(-53, 53, p), -31);
    s.clip(-87, 9, 174, 49 * p, () => s.card(0, 30, 140, 41, right, true));
  } else if (variant === 2) {
    s.line(-103, 0, 47, 0);
    s.box(51, -54, 12, 108, s.ink);
    const x = p < 0.65 ? mix(-102, 36, p / 0.65) : mix(36, 2, (p - 0.65) / 0.35);
    s.disc(x, 0, 14);
    s.text(cue, 0, 78);
  } else {
    const shake = Math.sin(p * tau * 6) * (1 - p) * 10;
    s.card(68 * p + shake, 61 * p, mix(151, 87, p), mix(78, 35, p), cue, true);
    s.line(-102, 80, 102, 80);
  }
}

export const whiteTechniques = { reveal, stack, count, compare, swap, focus, split, merge, pass, sort, evolve, deny };

export function drawWhiteTechnique(ctx, t, choreography, colors, primitives) {
  const { technique, variant, cue } = choreography;
  const { rect: box, label: text, circle: disc, line } = primitives;
  const [background, accent, ink] = colors;
  const scene = {
    background, accent, ink, box, text, disc, line,
    card(x, y, width, height, label, solid) {
      box(x - width / 2, y - height / 2, width, height, solid ? ink : accent);
      if (label) text(label, x, y, 18, solid ? background : ink);
    },
    ring(x, y, radius, start, end, color, width) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(x, y, radius, start, end);
      ctx.stroke();
      ctx.restore();
    },
    round(x, y, width, height, radius) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    },
    clip(x, y, width, height, draw) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      draw();
      ctx.restore();
    },
    rotated(x, y, angle, draw) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      draw();
      ctx.restore();
    },
  };
  whiteTechniques[technique](scene, ease((t - 0.12) / 0.64), variant, cue);
}
