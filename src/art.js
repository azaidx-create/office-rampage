// All character animation is baked into discrete raster frames at startup.
// Pose coordinates are authored per frame: no runtime limb rotation or tweening.
export const PALETTES = {
  hero: {
    shirt: "#d9e9df",
    light: "#f5f1d7",
    shade: "#8ba9a7",
    dark: "#4a6a76",
    pants: "#514635",
    pantLight: "#827259",
    skin: "#e5ac7e",
    skinLight: "#ffd2a0",
    skinShade: "#ae705e",
    hair: "#34303a",
    accent: "#393d48",
  },
  guard: {
    shirt: "#506a82",
    light: "#7794a2",
    shade: "#354a66",
    dark: "#24354f",
    pants: "#293c53",
    pantLight: "#465f75",
    skin: "#c38c6d",
    skinLight: "#e9b58b",
    skinShade: "#8b5854",
    hair: "#252c3d",
    accent: "#e2c57d",
  },
  intern: {
    shirt: "#bf9979",
    light: "#e5c9a0",
    shade: "#8b706c",
    dark: "#594e5a",
    pants: "#464a65",
    pantLight: "#6b6d86",
    skin: "#c88c6a",
    skinLight: "#f2b58b",
    skinShade: "#905653",
    hair: "#573b3c",
    accent: "#588b91",
  },
  boss: {
    shirt: "#6c5269",
    light: "#97728a",
    shade: "#4b3b57",
    dark: "#302d44",
    pants: "#34374c",
    pantLight: "#5d5870",
    skin: "#d8a17f",
    skinLight: "#f5caa1",
    skinShade: "#a97061",
    hair: "#4a3d49",
    accent: "#e7ba73",
  },
};
export function rect(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export function poly(c, pts, col) {
  c.fillStyle = col;
  let lo = Math.ceil(Math.min(...pts.map((p) => p[1]))),
    hi = Math.max(...pts.map((p) => p[1]));
  for (let y = lo; y < hi; y++) {
    let xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i],
        b = pts[j];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
        xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k < xs.length; k += 2)
      c.fillRect(
        Math.ceil(xs[k]),
        y,
        Math.ceil(xs[k + 1]) - Math.ceil(xs[k]),
        1,
      );
  }
}
function seg(c, a, b, width, col) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    l = Math.hypot(dx, dy) || 1,
    nx = ((-dy / l) * width) / 2,
    ny = ((dx / l) * width) / 2;
  poly(
    c,
    [
      [a[0] + nx, a[1] + ny],
      [b[0] + nx, b[1] + ny],
      [b[0] - nx, b[1] - ny],
      [a[0] - nx, a[1] - ny],
    ],
    col,
  );
  rect(c, b[0] - width / 2, b[1] - width / 2, width, width, col);
}
const base = {
  body: [0, 0],
  head: [0, 0],
  backArm: [-12, 42, -9, 51],
  frontArm: [13, 40, 12, 49],
  backLeg: [-6, 64, -9, 77],
  frontLeg: [7, 64, 10, 77],
};
const pose = (o = {}) => ({ ...base, ...o });
// Each list describes elbow/wrist and knee/ankle positions in a complete frame.
export const POSES = {
  idle: [
    pose(),
    pose({ body: [0, 1], head: [0, 1], frontArm: [14, 41, 13, 50] }),
    pose({ body: [0, 2], head: [0, 2], frontArm: [13, 42, 11, 51] }),
    pose({ body: [0, 1], head: [0, 1] }),
  ],
  walk: [
    pose({
      body: [0, 1],
      backArm: [-12, 38, -16, 45],
      frontArm: [15, 39, 20, 46],
      backLeg: [-10, 64, -15, 76],
      frontLeg: [9, 65, 17, 77],
    }),
    pose({
      body: [0, 0],
      backArm: [-12, 39, -14, 47],
      frontArm: [16, 38, 18, 46],
      backLeg: [-9, 65, -12, 77],
      frontLeg: [10, 62, 11, 75],
    }),
    pose({
      body: [0, -2],
      backArm: [-10, 42, -9, 50],
      frontArm: [13, 42, 11, 51],
      backLeg: [-5, 65, 1, 77],
      frontLeg: [6, 60, 0, 69],
    }),
    pose({
      body: [0, 0],
      backArm: [-9, 39, -3, 47],
      frontArm: [12, 43, 8, 50],
      backLeg: [0, 65, 9, 77],
      frontLeg: [0, 64, -8, 75],
    }),
    pose({
      body: [0, 1],
      backArm: [-8, 39, -1, 45],
      frontArm: [11, 41, 4, 48],
      backLeg: [5, 65, 15, 77],
      frontLeg: [-6, 65, -15, 77],
    }),
    pose({
      body: [0, 0],
      backArm: [-8, 38, -3, 45],
      frontArm: [12, 41, 5, 48],
      backLeg: [7, 62, 10, 75],
      frontLeg: [-8, 65, -12, 77],
    }),
    pose({
      body: [0, -2],
      backArm: [-10, 42, -9, 50],
      frontArm: [13, 42, 11, 51],
      backLeg: [0, 60, -5, 69],
      frontLeg: [-5, 65, 1, 77],
    }),
    pose({
      body: [0, 0],
      backArm: [-12, 41, -15, 48],
      frontArm: [15, 39, 18, 46],
      backLeg: [-8, 65, -12, 76],
      frontLeg: [4, 65, 10, 77],
    }),
  ],
  punch1: [
    pose({ body: [-2, 1], frontArm: [14, 35, 7, 30] }),
    pose({ body: [1, 0], frontArm: [21, 31, 28, 29] }),
    pose({
      body: [5, -1],
      head: [4, 0],
      frontArm: [24, 28, 39, 27],
      backArm: [-11, 36, -6, 28],
      frontLeg: [11, 65, 17, 77],
    }),
    pose({
      body: [4, 0],
      frontArm: [25, 29, 38, 29],
      frontLeg: [10, 65, 16, 77],
    }),
    pose({ body: [1, 1], frontArm: [20, 34, 25, 31] }),
    pose({ frontArm: [15, 37, 11, 34] }),
  ],
  punch2: [
    pose({
      body: [-3, 1],
      backArm: [-16, 32, -18, 27],
      frontArm: [17, 36, 12, 29],
    }),
    pose({
      body: [0, 0],
      backArm: [6, 28, 18, 25],
      frontArm: [15, 37, 12, 30],
    }),
    pose({
      body: [6, 0],
      head: [4, -1],
      backArm: [24, 28, 40, 28],
      frontArm: [14, 39, 9, 32],
      frontLeg: [13, 65, 20, 77],
    }),
    pose({
      body: [5, 1],
      backArm: [24, 29, 39, 30],
      frontArm: [15, 39, 10, 33],
    }),
    pose({ body: [2, 0], backArm: [10, 35, 19, 33] }),
    pose(),
  ],
  punch3: [
    pose({
      body: [-3, 4],
      head: [-2, 3],
      frontArm: [10, 43, 3, 47],
      backLeg: [-9, 65, -15, 77],
    }),
    pose({ body: [0, 3], frontArm: [18, 39, 22, 35] }),
    pose({
      body: [5, -1],
      head: [5, -2],
      frontArm: [25, 26, 35, 16],
      frontLeg: [12, 65, 20, 77],
    }),
    pose({
      body: [6, -4],
      head: [5, -5],
      frontArm: [24, 20, 30, 8],
      frontLeg: [13, 65, 21, 77],
      backArm: [-5, 34, -10, 25],
    }),
    pose({ body: [5, -2], frontArm: [25, 23, 32, 12] }),
    pose({ body: [2, 0], frontArm: [21, 31, 27, 24] }),
    pose(),
  ],
  kick: [
    pose({ body: [-3, 1], frontArm: [17, 35, 12, 28] }),
    pose({
      body: [-5, 0],
      head: [-4, 0],
      frontLeg: [17, 54, 11, 62],
      frontArm: [15, 34, 10, 27],
    }),
    pose({
      body: [-7, 0],
      head: [-6, 0],
      frontLeg: [24, 49, 38, 44],
      frontArm: [11, 34, 5, 27],
      backLeg: [-4, 65, -9, 77],
    }),
    pose({
      body: [-8, 1],
      head: [-7, 0],
      frontLeg: [24, 48, 44, 45],
      backArm: [-20, 40, -25, 45],
      frontArm: [12, 34, 4, 27],
    }),
    pose({ body: [-6, 1], frontLeg: [23, 51, 35, 48] }),
    pose({ body: [-3, 2], frontLeg: [15, 56, 10, 65] }),
    pose(),
  ],
  strike: [
    pose({ frontArm: [17, 35, 12, 27] }),
    pose({ body: [-4, 0], frontArm: [10, 32, 1, 27] }),
    pose({ body: [-5, 1], frontArm: [8, 31, -2, 25] }),
    pose({ body: [3, 0], frontArm: [24, 29, 36, 28] }),
    pose({ body: [5, 1], frontArm: [25, 30, 39, 30] }),
    pose({ frontArm: [18, 34, 22, 31] }),
    pose(),
  ],
  slam: [
    pose({
      body: [0, -1],
      frontArm: [16, 23, 9, 13],
      backArm: [-12, 23, -4, 12],
    }),
    pose({
      body: [-2, -3],
      frontArm: [14, 17, 4, 5],
      backArm: [-12, 18, -3, 5],
    }),
    pose({
      body: [-3, -4],
      frontArm: [14, 16, 4, 3],
      backArm: [-13, 17, -3, 3],
    }),
    pose({
      body: [-3, -4],
      frontArm: [14, 16, 4, 3],
      backArm: [-13, 17, -3, 3],
    }),
    pose({
      body: [8, 10],
      head: [9, 11],
      frontArm: [27, 40, 35, 52],
      backArm: [14, 40, 32, 51],
      frontLeg: [15, 66, 21, 77],
    }),
    pose({
      body: [9, 12],
      head: [10, 13],
      frontArm: [28, 44, 35, 57],
      backArm: [17, 44, 32, 56],
    }),
    pose({ body: [5, 6], frontArm: [22, 42, 25, 46] }),
    pose(),
  ],
  hurt: [
    pose({
      body: [-6, 1],
      head: [-8, 0],
      frontArm: [19, 36, 23, 30],
      backArm: [-19, 36, -23, 29],
      frontLeg: [12, 65, 19, 77],
    }),
    pose({ body: [-4, 3], head: [-7, 2], frontArm: [14, 40, 19, 35] }),
    pose({ body: [-2, 2], head: [-3, 1] }),
  ],
  dodge: [
    pose({
      body: [-3, 14],
      head: [-1, 15],
      frontArm: [20, 49, 26, 47],
      frontLeg: [19, 67, 25, 77],
      backLeg: [-12, 67, -25, 77],
    }),
    pose({
      body: [5, 19],
      head: [9, 20],
      frontArm: [25, 52, 34, 49],
      backArm: [-16, 50, -23, 44],
      frontLeg: [21, 66, 29, 77],
      backLeg: [-18, 69, -30, 77],
    }),
    pose({
      body: [9, 17],
      head: [12, 18],
      frontArm: [28, 51, 34, 46],
      frontLeg: [22, 66, 30, 77],
      backLeg: [-15, 68, -28, 77],
    }),
    pose({
      body: [5, 10],
      head: [7, 10],
      frontLeg: [18, 65, 23, 77],
      backLeg: [-10, 65, -18, 77],
    }),
  ],
  down: [
    pose({
      body: [-8, 7],
      head: [-10, 7],
      frontArm: [18, 40, 24, 33],
      frontLeg: [16, 65, 24, 77],
    }),
    pose({
      body: [-13, 22],
      head: [-17, 24],
      frontArm: [6, 57, 19, 62],
      backLeg: [-10, 70, -17, 78],
      frontLeg: [15, 69, 27, 78],
    }),
    pose({
      body: [-18, 37],
      head: [-25, 42],
      frontArm: [3, 72, 13, 77],
      backArm: [-27, 71, -30, 78],
      frontLeg: [15, 76, 29, 79],
      backLeg: [-2, 77, 12, 81],
    }),
  ],
};
POSES.jump = [
  pose({
    body: [0, 5],
    frontLeg: [12, 60, 6, 69],
    backLeg: [-10, 62, -16, 72],
    frontArm: [15, 31, 18, 23],
  }),
  pose({
    body: [0, -2],
    head: [0, -2],
    frontLeg: [16, 56, 8, 64],
    backLeg: [-13, 58, -20, 67],
    frontArm: [17, 27, 22, 18],
    backArm: [-15, 29, -20, 21],
  }),
  pose({
    body: [1, -1],
    head: [1, -1],
    frontLeg: [15, 57, 8, 67],
    backLeg: [-11, 60, -16, 70],
    frontArm: [18, 29, 23, 23],
  }),
  pose({
    body: [0, 2],
    frontLeg: [8, 63, 13, 75],
    backLeg: [-6, 65, -10, 76],
    frontArm: [16, 35, 20, 30],
  }),
];
POSES.airkick = [
  pose({
    body: [-3, 0],
    frontLeg: [17, 56, 8, 64],
    frontArm: [17, 32, 12, 25],
  }),
  pose({
    body: [-6, 0],
    head: [-6, 0],
    frontLeg: [25, 49, 42, 45],
    backLeg: [-11, 61, -18, 69],
    frontArm: [13, 32, 4, 24],
  }),
  pose({
    body: [-7, 1],
    head: [-6, 1],
    frontLeg: [26, 48, 43, 45],
    backLeg: [-13, 62, -21, 71],
    frontArm: [12, 33, 3, 26],
  }),
  pose({
    body: [-3, 2],
    frontLeg: [17, 56, 14, 66],
    backLeg: [-9, 64, -13, 73],
  }),
];
POSES.block = [
  pose({
    body: [-2, 2],
    head: [-3, 3],
    frontArm: [17, 28, 12, 15],
    backArm: [-2, 30, 8, 18],
  }),
  pose({
    body: [-3, 3],
    head: [-4, 4],
    frontArm: [16, 29, 11, 16],
    backArm: [-3, 31, 7, 19],
  }),
  pose({
    body: [-2, 3],
    head: [-3, 4],
    frontArm: [18, 29, 12, 16],
    backArm: [-1, 31, 8, 19],
  }),
];
POSES.pipe = [
  pose({body:[-3,1], frontArm:[9,29,-8,20], backArm:[-12,30,-15,22], pipe:[-8,20,-25,-2]}),
  pose({body:[-5,3], head:[-3,1], frontArm:[4,25,-12,13], backArm:[-14,28,-19,16], pipe:[-12,13,-27,-3]}),
  pose({body:[3,2], frontArm:[24,29,35,24], backArm:[4,32,22,27], pipe:[35,24,54,11]}),
  pose({body:[6,4], head:[4,2], frontArm:[29,38,39,43], backArm:[8,37,26,41], pipe:[39,43,55,52]}),
  pose({body:[4,5], frontArm:[24,43,28,51], backArm:[3,38,19,47], pipe:[28,51,48,65]}),
  pose({body:[1,2], frontArm:[18,40,20,46], pipe:[20,46,36,21]}),
];
POSES.pickup = [pose({body:[0,5],head:[3,7],frontArm:[19,48,23,63]}),pose({body:[3,11],head:[7,13],frontArm:[21,56,23,74],frontLeg:[14,65,12,77]}),pose({body:[1,5],head:[2,4],frontArm:[18,45,20,58]})];
function drawActor(c, p, colors, type) {
  const C = colors,
    ox = 39,
    oy = 4,
    outline = "#172533";
  let headMode = false;
  const point = (x, y) =>
    headMode
      ? [
          ox + p.head[0] + (x - p.head[0]) * 0.72,
          oy + 27 + p.head[1] + (y - 27 - p.head[1]) * 0.72,
        ]
      : [ox + x, oy + y];
  const r = (x, y, w, h, col) => {
    const [sx, sy] = point(x, y);
    rect(c, sx, sy, w * (headMode ? 0.72 : 1), h * (headMode ? 0.72 : 1), col);
  };
  const P = (points, col) =>
    poly(
      c,
      points.map(([x, y]) => point(x, y)),
      col,
    );
  const S = (a, b, w, col) =>
    seg(c, [a[0] + ox, a[1] + oy], [b[0] + ox, b[1] + oy], w, col);
  if (p.pipe) {
    const [x,y,ex,ey] = p.pipe;
    S([x,y],[ex,ey],7,outline);
    S([x,y],[ex,ey],5,"#6b8999");
    S([x-1,y-1],[ex-1,ey-1],2,"#e1ebdf");
  }
  const [bx, by] = p.body;
  const hip = [bx, 53 + by * 0.2];
  const leg = (arr, back) => {
    const [kx, ky, ax, ay] = arr;
    const h = [hip[0] + (back ? -5 : 5), hip[1]];
    S(h, [kx, ky], 10, outline);
    S([kx, ky], [ax, ay], 9, outline);
    S([h[0], h[1]], [kx, ky], 7, back ? C.dark : C.pants);
    S([kx, ky], [ax, ay - 2], 6, C.pants);
    S([h[0] + 2, h[1] + 1], [kx + 2, ky - 1], 2, C.pantLight);
    S([kx + 2, ky], [ax + 2, ay - 3], 2, back ? C.dark : C.pantLight);
    r(ax - 4, ay - 2, 14, 5, outline);
    r(ax - 2, ay - 2, 10, 2, "#536474");
    r(ax - 4, ay + 2, 15, 2, "#101c29");
  };
  leg(p.backLeg, true);
  const arm = (arr, back) => {
    const shoulder = [bx + (back ? -9 : 10), 30 + by],
      el = [arr[0], arr[1]],
      wr = [arr[2], arr[3]];
    S(shoulder, el, 10, outline);
    S(shoulder, el, 7, back ? C.shade : C.shirt);
    S([shoulder[0] + 1, shoulder[1]], el, 3, back ? C.dark : C.light);
    S(el, wr, 8, outline);
    S(el, wr, 5, C.skin);
    S([el[0] + 1, el[1] - 1], [wr[0] + 1, wr[1] - 1], 2, C.skinLight);
    r(el[0] - 4, el[1] - 3, 8, 4, C.light);
    r(wr[0] - 3, wr[1] - 3, 8, 7, C.skinShade);
    r(wr[0] - 2, wr[1] - 3, 7, 5, C.skinLight);
    r(wr[0] + 4, wr[1], 2, 3, C.skin);
  };
  arm(p.backArm, true);
  leg(p.frontLeg, false);
  P(
    [
      [bx - 10, 26 + by],
      [bx + 9, 25 + by],
      [bx + 15, 33 + by],
      [bx + 11, 53],
      [bx - 11, 53],
      [bx - 14, 33 + by],
    ],
    outline,
  );
  P(
    [
      [bx - 9, 27 + by],
      [bx + 8, 27 + by],
      [bx + 12, 34 + by],
      [bx + 9, 51],
      [bx - 9, 51],
      [bx - 11, 33 + by],
    ],
    C.shirt,
  );
  P(
    [
      [bx - 9, 31 + by],
      [bx - 5, 35 + by],
      [bx - 4, 48],
      [bx + 8, 51],
      [bx - 9, 51],
    ],
    C.shade,
  );
  r(bx - 9, 48, 19, 3, C.dark);
  r(bx - 9, 52, 19, 3, outline);
  r(bx + 1, 52, 4, 2, C.accent);
  P(
    [
      [bx - 5, 27 + by],
      [bx, 31 + by],
      [bx + 5, 27 + by],
      [bx + 7, 35 + by],
      [bx - 2, 47],
      [bx - 4, 35 + by],
    ],
    C.light,
  );
  P(
    [
      [bx, 31 + by],
      [bx + 3, 32 + by],
      [bx + 2, 37 + by],
      [bx + 5, 46 + by],
      [bx + 2, 49 + by],
      [bx - 1, 45 + by],
    ],
    C.accent,
  );
  r(bx + 6, 35 + by, 5, 1, C.dark);
  r(bx + 7, 37 + by, 4, 4, C.shade);
  r(bx + 8, 37 + by, 2, 2, C.light);
  arm(p.frontArm, false);
  headMode = true;
  const hx = p.head[0],
    hy = p.head[1];
  r(hx - 4, 22 + hy, 9, 7, C.skinShade);
  r(hx, 23 + hy, 6, 5, C.skin);
  P(
    [
      [hx - 9, 8 + hy],
      [hx + 7, 7 + hy],
      [hx + 12, 12 + hy],
      [hx + 12, 19 + hy],
      [hx + 15, 21 + hy],
      [hx + 11, 24 + hy],
      [hx + 8, 28 + hy],
      [hx - 3, 27 + hy],
      [hx - 9, 22 + hy],
    ],
    outline,
  );
  P(
    [
      [hx - 7, 9 + hy],
      [hx + 7, 9 + hy],
      [hx + 10, 13 + hy],
      [hx + 10, 20 + hy],
      [hx + 13, 21 + hy],
      [hx + 9, 23 + hy],
      [hx + 7, 26 + hy],
      [hx - 2, 25 + hy],
      [hx - 7, 20 + hy],
    ],
    C.skin,
  );
  r(hx - 5, 12 + hy, 13, 7, C.skinLight);
  r(hx + 8, 19 + hy, 4, 3, C.skinLight);
  r(hx - 6, 20 + hy, 5, 4, C.skinShade);
  r(hx + 3, 24 + hy, 6, 1, C.skinShade);
  r(hx + 6, 17 + hy, 4, 2, outline);
  r(hx + 8, 17 + hy, 1, 1, "#fff0c9");
  r(hx - 9, 17 + hy, 4, 5, C.skin);
  r(hx - 8, 18 + hy, 2, 2, C.skinShade);
  P(
    [
      [hx - 10, 8 + hy],
      [hx - 6, 5 + hy],
      [hx + 6, 5 + hy],
      [hx + 11, 8 + hy],
      [hx + 10, 12 + hy],
      [hx + 1, 12 + hy],
      [hx - 2, 15 + hy],
      [hx - 6, 14 + hy],
      [hx - 7, 19 + hy],
      [hx - 10, 16 + hy],
    ],
    C.hair,
  );
  r(hx - 5, 7 + hy, 11, 2, type === "hero" ? "#5c4846" : "#6b5658");
  r(hx - 8, 10 + hy, 3, 2, "#665452");
  if (type === "guard") {
    r(hx - 11, 7 + hy, 23, 5, C.dark);
    r(hx - 7, 5 + hy, 16, 3, C.shade);
    r(hx + 8, 11 + hy, 9, 2, outline);
    r(hx + 2, 7 + hy, 3, 3, C.accent);
    r(bx - 7, 32 + by, 4, 4, C.accent);
  }
  if (type === "boss") {
    r(hx - 4, 16 + hy, 8, 4, outline);
    r(hx + 6, 16 + hy, 7, 4, outline);
    r(hx + 2, 17 + hy, 5, 1, C.accent);
    r(hx - 3, 17 + hy, 4, 1, "#b1c8be");
    r(hx + 7, 17 + hy, 3, 1, "#b1c8be");
    r(bx - 7, 31 + by, 2, 9, C.accent);
  }
}
export function createAtlases() {
  const atlases = {};
  for (const [type, palette] of Object.entries(PALETTES)) {
    atlases[type] = {};
    for (const [action, poses] of Object.entries(POSES))
      atlases[type][action] = poses.map((p) => {
        const c = document.createElement("canvas");
        c.width = 96;
        c.height = 92;
        drawActor(c.getContext("2d"), p, palette, type);
        return c;
      });
  }
  return atlases;
}
export function frameIndex(a) {
  const count = POSES[a.state]?.length || 4;
  if (a.state === "walk") return Math.floor(a.walkTime * 12) % count;
  if (a.state === "block") return Math.floor(a.time * 7) % count;
  if (a.state === "jump")
    return a.vz > 150 ? 0 : a.vz > 0 ? 1 : a.vz > -170 ? 2 : 3;
  if (a.state === "idle") return Math.floor(a.time * 5) % count;
  const durations = {
    pipe: 0.48,
    pickup: 0.24,
    airkick: 0.4,
    punch1: 0.32,
    punch2: 0.34,
    punch3: 0.46,
    kick: 0.56,
    strike: 0.66,
    slam: 0.94,
    hurt: 0.24,
    dodge: 0.29,
    down: 0.44,
  };
  return Math.min(
    count - 1,
    Math.floor((a.time / (durations[a.state] || 1)) * count),
  );
}
export function text(
  c,
  str,
  x,
  y,
  size = 10,
  color = "#f5dfb5",
  align = "left",
) {
  c.fillStyle = color;
  c.font = `bold ${size}px monospace`;
  c.textAlign = align;
  c.fillText(str, Math.round(x), Math.round(y));
  c.textAlign = "left";
}
function plant(c, x, y) {
  rect(c, x - 9, y - 19, 18, 19, "#302b3b");
  poly(
    c,
    [
      [x - 12, y - 19],
      [x + 12, y - 19],
      [x + 8, y],
      [x - 7, y],
    ],
    "#ba8064",
  );
  rect(c, x - 10, y - 19, 21, 4, "#e5ac7d");
  rect(c, x - 7, y - 13, 3, 11, "#d59870");
  rect(c, x - 1, y - 56, 3, 38, "#426e63");
  for (const [dx, dy] of [
    [-14, -46],
    [9, -54],
    [-9, -64],
    [15, -39],
    [-18, -30],
  ]) {
    poly(
      c,
      [
        [x, dy + y + 10],
        [x + dx, dy + y],
        [x + dx + Math.sign(dx) * 7, dy + y + 3],
        [x + dx, dy + y + 10],
      ],
      "#365950",
    );
    rect(c, x + dx, dy + y + 3, Math.sign(dx) * 6 || 3, 2, "#79a479");
  }
}
function desk(c, x, y, variant = 0) {
  rect(c, x + 4, y + 4, 106, 36, "#16263555");
  rect(c, x + 7, y, 6, 37, "#203340");
  rect(c, x + 93, y, 7, 37, "#203340");
  rect(c, x + 8, y + 2, 3, 32, "#567075");
  rect(c, x + 81, y + 4, 22, 27, "#455761");
  for (let i = 0; i < 3; i++) {
    rect(c, x + 83, y + 5 + i * 8, 18, 7, "#586c70");
    rect(c, x + 89, y + 7 + i * 8, 7, 1, "#a0aaa0");
  }
  rect(c, x - 3, y - 3, 112, 6, "#523e42");
  rect(c, x - 3, y - 5, 112, 3, "#c09370");
  rect(c, x, y - 5, 107, 1, "#e2b48b");
  rect(c, x + 33, y - 14, 18, 7, "#253845");
  rect(c, x + 40, y - 19, 5, 8, "#8fa2a2");
  rect(c, x + 22, y - 47, 46, 29, "#172a37");
  rect(c, x + 24, y - 46, 42, 25, "#668993");
  rect(c, x + 26, y - 44, 38, 21, variant % 2 ? "#284950" : "#34576b");
  rect(c, x + 28, y - 42, 34, 2, "#91c5b3");
  for (let k = 0; k < 5; k++) {
    rect(
      c,
      x + 29,
      y - 37 + k * 3,
      8 + (k % 3) * 7,
      1,
      k % 2 ? "#a0c7b5" : "#71a3af",
    );
  }
  rect(c, x + 41, y - 20, 3, 1, "#90d2ba");
  poly(
    c,
    [
      [x + 24, y - 11],
      [x + 61, y - 11],
      [x + 66, y - 7],
      [x + 20, y - 7],
    ],
    "#b4b7a8",
  );
  for (let i = 0; i < 8; i++) rect(c, x + 25 + i * 4, y - 10, 2, 1, "#5d777b");
  rect(c, x + 74, y - 14, 7, 8, "#d6c6a3");
  rect(c, x + 80, y - 13, 3, 5, "#a5967d");
  rect(c, x + 75, y - 15, 5, 2, "#594548");
  rect(c, x + 4, y - 13, 13, 8, "#d3d0b1");
  rect(c, x + 6, y - 11, 8, 1, "#8a9691");
  // Upholstered task chair, castors and armrests.
  rect(c, x + 42, y + 18, 4, 19, "#1c303d");
  rect(c, x + 29, y + 33, 31, 3, "#263c47");
  rect(c, x + 26, y + 34, 6, 4, "#142631");
  rect(c, x + 57, y + 34, 6, 4, "#142631");
  rect(c, x + 31, y + 4, 27, 17, "#192c39");
  rect(c, x + 33, y + 5, 23, 12, "#47626b");
  rect(c, x + 32, y + 20, 28, 5, "#55717a");
  rect(c, x + 27, y + 16, 4, 10, "#253a46");
  rect(c, x + 58, y + 16, 4, 10, "#253a46");
}
export function createOffice() {
  const canvas = document.createElement("canvas");
  canvas.width = 1960;
  canvas.height = 360;
  const c = canvas.getContext("2d"),
    r = (...v) => rect(c, ...v);
  r(0, 0, 1960, 360, "#223746");
  r(0, 0, 1960, 27, "#182b36");
  r(0, 27, 1960, 166, "#506a6d");
  // Warm evening skyline seen through individually framed glazing.
  for (let x = 0; x < 1960; x += 192) {
    r(x + 8, 41, 176, 132, "#b87e78");
    r(x + 8, 42, 176, 24, "#778293");
    r(x + 8, 66, 176, 28, "#a18b93");
    r(x + 8, 94, 176, 28, "#d5a28f");
    r(x + 8, 122, 176, 51, "#e9bb91");
    for (let k = 0; k < 10; k++) {
      let bx = x + 10 + k * 17,
        bh = 25 + ((k * 17 + x * 7) % 65);
      r(bx, 170 - bh, 15, bh, "#777e8c");
      for (let wy = 175 - bh; wy < 169; wy += 9) r(bx + 3, wy, 3, 2, "#c1b3a1");
    }
    for (let k = 0; k < 5; k++) {
      let bx = x + 12 + k * 36,
        bh = 24 + ((k * 29 + x) % 43);
      r(bx, 175 - bh, 27, bh, "#546b7d");
      r(bx + 4, 171 - bh, 4, bh + 4, "#627e8a");
      for (let wy = 181 - bh; wy < 173; wy += 10)
        for (let wx = bx + 11; wx < bx + 25; wx += 7)
          r(wx, wy, 3, 3, (wx + wy) % 3 ? "#b0b3a0" : "#d5bc8f");
    }
    poly(
      c,
      [
        [x + 10, 42],
        [x + 63, 42],
        [x + 182, 142],
        [x + 182, 166],
      ],
      "#f5d8b01c",
    );
    r(x + 7, 39, 178, 4, "#263e4b");
    r(x + 7, 173, 178, 6, "#263e4b");
    r(x + 7, 42, 5, 132, "#243d4a");
    r(x + 181, 42, 5, 132, "#243d4a");
    r(x + 94, 42, 4, 132, "#28424f");
    r(x + 12, 109, 169, 3, "#3b5861");
    r(x + 12, 42, 167, 2, "#c1c4ae");
    for (let by = 45; by < 61; by += 4) {
      r(x + 13, by, 166, 2, "#586d7088");
    }
    r(x + 177, 60, 1, 64, "#cfbb99");
    r(x + 176, 122, 3, 5, "#d8c4a4");
  }
  r(0, 180, 1960, 40, "#526b6c");
  r(0, 180, 1960, 4, "#91a09a");
  r(0, 217, 1960, 6, "#263e47");
  r(0, 223, 1960, 137, "#506568");
  for (let y = 226; y < 360; y++) {
    if (y % 4 === 0) r(0, y, 1960, 1, "#556b6c");
  }
  for (let y = 232; y < 360; y += 24) r(0, y, 1960, 1, "#73817a");
  for (let x = -200; x < 2100; x += 80)
    poly(
      c,
      [
        [x, 223],
        [x + 1, 223],
        [x + 90, 360],
        [x + 88, 360],
      ],
      "#75817b",
    );
  for (let x = 0; x < 1960; x += 192) {
    poly(
      c,
      [
        [x + 17, 224],
        [x + 170, 224],
        [x + 271, 320],
        [x + 118, 320],
      ],
      "#efc69b12",
    );
    r(x + 187, 25, 9, 193, "#2e4853");
    r(x + 188, 27, 2, 188, "#79908b");
    r(x + 16, 15, 144, 7, "#0e222f");
    r(x + 21, 16, 134, 3, "#bdd8c7");
    r(x + 24, 19, 128, 2, "#f4eac8");
  }
  for (let i = 0; i < 10; i++) if (i !== 9) desk(c, 30 + i * 192, 200, i);
  // Office identity, noticeboard, wall clock and meeting room.
  r(636, 69, 117, 102, "#28434c");
  r(640, 73, 109, 94, "#b19977");
  r(644, 78, 45, 38, "#dfd4b5");
  text(c, "WORK", 647, 91, 10, "#566566");
  text(c, "HARDER.", 647, 103, 8, "#566566");
  r(696, 83, 40, 25, "#9fbbad");
  r(698, 118, 39, 38, "#dfb87d");
  for (let i = 0; i < 5; i++) r(702, 125 + i * 5, 29 - i * 3, 1, "#9b8067");
  r(648, 125, 36, 32, "#d8d6bd");
  r(653, 133, 25, 2, "#99aaa1");
  r(653, 140, 19, 2, "#99aaa1");
  r(1255, 42, 112, 138, "#243d49");
  r(1260, 47, 102, 128, "#476670");
  for (let y = 75; y < 157; y += 8) r(1260, y, 102, 3, "#91b0aa55");
  r(1310, 47, 3, 128, "#263e4a");
  r(1320, 118, 3, 16, "#cccfb4");
  text(c, "MEETING 04", 1276, 65, 8, "#c3d0bf");
  r(1768, 30, 192, 193, "#344d58");
  r(1775, 34, 177, 185, "#47636b");
  r(1828, 70, 104, 149, "#192e3c");
  r(1833, 76, 94, 140, "#849895");
  r(1837, 78, 40, 136, "#6b8284");
  r(1880, 78, 42, 136, "#758c8d");
  r(1878, 78, 2, 137, "#2e4652");
  r(1837, 78, 3, 135, "#a4b1a2");
  r(1919, 78, 3, 135, "#a4b1a2");
  r(1856, 47, 50, 17, "#203e43");
  text(c, "EXIT", 1881, 59, 11, "#a0e3bb", "center");
  r(1938, 124, 9, 23, "#203641");
  r(1941, 129, 3, 3, "#e5b47e");
  r(1941, 138, 3, 3, "#85bdad");
  r(1826, 217, 109, 5, "#a6b2a1");
  text(c, "01", 1793, 111, 24, "#c4c4a6");
  text(c, "EXECUTIVE", 1780, 132, 7, "#a2b1a4");
  text(c, "FLOOR", 1780, 142, 7, "#a2b1a4");
  plant(c, 17, 222);
  plant(c, 1729, 219);
  for (let x = 80; x < 1780; x += 347) {
    r(x, 296, 12, 7, "#d6cbb0");
    r(x + 2, 298, 7, 1, "#929d92");
    r(x + 22, 304, 8, 5, "#b7bda9");
  }
  // Foreground trim stays below the playable lane.
  r(0, 345, 1960, 15, "#203744");
  r(0, 344, 1960, 2, "#92a39a");
  return canvas;
}
export function drawProp(c, p) {
  const r = (x, y, w, h, col) => rect(c, p.x + x, p.y + y, w, h, col);
  if (p.hp <= 0) {
    r(-19, -4, 37, 6, "#273b45");
    r(-14, -8, 9, 6, "#809797");
    r(4, -7, 17, 3, "#a1b3a7");
    r(16, -11, 6, 9, "#496a75");
    return;
  }
  if (p.type === "plant") {
    plant(c, p.x, p.y);
    return;
  }
  r(-22, -3, 46, 6, "#263d46");
  r(-20, -43, 40, 40, "#253c47");
  r(-18, -40, 36, 34, "#a6b4aa");
  r(8, -38, 9, 29, "#789291");
  r(-20, -48, 41, 9, "#d0cfb7");
  r(-15, -52, 26, 5, "#425c69");
  r(-12, -51, 20, 2, "#8bbab5");
  r(-15, -36, 23, 8, "#2a4a58");
  r(-11, -35, 16, 4, "#b0ddd0");
  r(11, -35, 3, 3, "#e3b373");
  r(-14, -21, 25, 2, "#5b757c");
  r(-14, -10, 25, 2, "#5b757c");
  r(-5, -19, 8, 2, "#ccd0b6");
  r(-5, -8, 8, 2, "#ccd0b6");
  r(-14, -3, 5, 4, "#162c39");
  r(11, -3, 5, 4, "#162c39");
}
