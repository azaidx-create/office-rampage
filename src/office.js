// Oblique projection: the corridor recedes up/right, with real floor depth.
// All office artwork is original, generated once into small pixel-art tiles.
import { rect, poly, text } from "./art.js";
export const project = (x, y, camera = 0) => ({
  x: 120 + (x - camera) * 0.9 + (y - 280) * 0.55,
  y: 245 - (x - camera) * 0.24 + (y - 280) * 0.62,
});
export const screenToWorld = (x, y) => ({
  x: (0.62 * x - 0.55 * y) / 0.69,
  y: (0.24 * x + 0.9 * y) / 0.69,
});
function tile(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 250;
  canvas.height = 220;
  const c = canvas.getContext("2d");
  const p = (x, y, z = 0) => [
    90 + x * 0.9 + y * 0.55,
    150 - x * 0.24 + y * 0.62 - z,
  ];
  const face = (pts, col) =>
    poly(
      c,
      pts.map((v) => p(...v)),
      col,
    );
  const box = (
    x,
    y,
    w,
    d,
    h,
    col = ["#b8c9d9", "#778fa8", "#e0e5e4"],
    base = 0,
  ) => {
    face(
      [
        [x, y, h],
        [x + w, y, h],
        [x + w, y + d, h],
        [x, y + d, h],
      ],
      col[2],
    );
    face(
      [
        [x, y + d, h],
        [x + w, y + d, h],
        [x + w, y + d, base],
        [x, y + d, base],
      ],
      col[0],
    );
    face(
      [
        [x + w, y, h],
        [x + w, y + d, h],
        [x + w, y + d, base],
        [x + w, y, base],
      ],
      col[1],
    );
  };
  const mark = (x, y, z, str, size = 5, col = "#283f52") => {
    const [a, b] = p(x, y, z);
    text(c, str, a, b, size, col);
  };
  const monitor = (x, y) => {
    box(x + 10, y + 5, 14, 9, 36, ["#c5c4a8", "#777e77", "#e7e4ce"], 30);
    box(x, y, 36, 16, 59, ["#c1c5ac", "#768d91", "#eee8d1"], 36);
    face(
      [
        [x + 3, y + 16, 55],
        [x + 31, y + 16, 55],
        [x + 31, y + 16, 37],
        [x + 3, y + 16, 37],
      ],
      "#183d32",
    );
    for (let i = 0; i < 5; i++)
      face(
        [
          [x + 5, y + 16, 52 - i * 3],
          [x + 23 - (i % 3) * 4, y + 16, 52 - i * 3],
          [x + 23 - (i % 3) * 4, y + 16, 51 - i * 3],
          [x + 5, y + 16, 51 - i * 3],
        ],
        "#73bc80",
      );
  };
  if (kind === "cubicle") {
    box(-68, -63, 144, 5, 62);
    box(-68, -63, 5, 72, 62);
    box(73, -63, 5, 72, 62);
    // Fabric partition weave and frame edge.
    for (let x = -62; x < 72; x += 5)
      for (let z = 15; z < 60; z += 5) {
        const [sx, sy] = p(x, -58, z);
        rect(c, sx, sy, 1, 1, "#859bb455");
      }
    box(-58, -49, 124, 40, 30, ["#6d625e", "#464d58", "#a89e83"]);
    box(-55, -47, 26, 34, 28, ["#a5a494", "#727d80", "#c6c5ae"]);
    monitor(-13, -41);
    face(
      [
        [-8, -9, 31],
        [28, -9, 31],
        [28, 0, 31],
        [-8, 0, 31],
      ],
      "#d6d7bd",
    );
    for (let i = 0; i < 6; i++) {
      const [x, y] = p(-5 + i * 5, -5, 32);
      rect(c, x, y, 2, 1, "#7c877c");
    }
    box(42, -23, 9, 9, 40, ["#ded7b7", "#8c958c", "#655546"], 30);
    box(-48, -20, 16, 16, 34, ["#d9cba8", "#8c8e7d", "#f0e4c6"], 30);
    box(-9, 18, 28, 24, 22, ["#79412f", "#492f2e", "#ad6544"]);
    box(-9, 35, 28, 4, 51, ["#9d5438", "#61372d", "#c27b50"], 22);
    box(3, 25, 5, 5, 17, ["#485467", "#293647", "#82929b"]);
    // Paper stacks, small binders, cables and a wall memo.
    for (let i = 0; i < 4; i++)
      box(43, -45 + i * 3, 16, 3, 35 + i * 2, [
        "#9ba993",
        "#4a636c",
        "#c5d1ad",
      ]);
    face(
      [
        [-50, -57, 69],
        [-31, -57, 69],
        [-31, -57, 49],
        [-50, -57, 49],
      ],
      "#e3dbad",
    );
    mark(-48, -56, 63, "MEMO");
    mark(-48, -56, 56, "09:00");
  } else if (kind === "divider") {
    box(-72, -4, 150, 6, 40);
    for (let x = -68; x < 74; x += 5)
      for (let z = 5; z < 39; z += 4) {
        const [sx, sy] = p(x, 2, z);
        rect(c, sx, sy, 1, 1, "#7f98b566");
      }
  } else if (kind === "desk") {
    box(-32, -17, 64, 34, 34, ["#816c5f", "#4c4c55", "#ba9c7a"]);
    monitor(-20, -20);
    face(
      [
        [-13, 9, 35],
        [17, 9, 35],
        [17, 17, 35],
        [-13, 17, 35],
      ],
      "#d7d6b9",
    );
    box(22, -7, 7, 7, 42, ["#c1c4ac", "#8b9284", "#dedcc4"]);
  } else if (kind === "chair") {
    box(-13, -12, 26, 25, 19, ["#7f4535", "#4d3435", "#a76748"]);
    box(-13, 10, 26, 5, 48, ["#9d563f", "#4e373d", "#c38559"], 19);
    box(-2, 1, 5, 5, 14, ["#697b89", "#3d4a5d", "#8d9a9f"]);
  } else if (kind === "copier") {
    box(-29, -20, 58, 41, 46, ["#c6ccd6", "#657b96", "#e4e6df"]);
    box(-25, -18, 46, 32, 55, ["#9aabbf", "#576f8d", "#d9dfe0"]);
    box(-22, -20, 35, 25, 59, ["#768da7", "#475e77", "#afbec9"]);
    face(
      [
        [-19, -17, 60],
        [10, -17, 60],
        [10, 1, 60],
        [-19, 1, 60],
      ],
      "#265d55",
    );
    face(
      [
        [-16, -14, 61],
        [7, -14, 61],
        [7, -1, 61],
        [-16, -1, 61],
      ],
      "#78d0a3",
    );
    box(-29, 7, 58, 15, 31, ["#c5cbd7", "#6b8098", "#edf0e5"]);
    for (let z = 6; z < 29; z += 8)
      face(
        [
          [-24, 22, z],
          [20, 22, z],
          [20, 22, z + 2],
          [-24, 22, z + 2],
        ],
        "#728398",
      );
    mark(-13, 22, 36, "COPY", 6);
  } else if (kind === "plant") {
    box(-9, -8, 18, 16, 20, ["#9d644b", "#694a42", "#c49367"]);
    for (let i = 0; i < 8; i++) {
      const angle = i * 2.4;
      const x = Math.cos(angle) * 21,
        y = Math.sin(angle) * 12,
        z = 30 + i * 3;
      face(
        [
          [0, 0, 20],
          [x, y, z],
          [x + 8, y + 3, z + 3],
          [x + 4, y + 3, z - 4],
        ],
        i % 2 ? "#648567" : "#3e6656",
      );
    }
  } else if (kind === "elevator") {
    box(-9, -47, 18, 94, 125, ["#657c93", "#293e57", "#bfd0da"]);
    face(
      [
        [10, -38, 117],
        [10, 38, 117],
        [10, 38, 3],
        [10, -38, 3],
      ],
      "#bac5cb",
    );
    face(
      [
        [11, -36, 115],
        [11, 0, 115],
        [11, 0, 4],
        [11, -36, 4],
      ],
      "#8c9ead",
    );
    face(
      [
        [11, 2, 115],
        [11, 36, 115],
        [11, 36, 4],
        [11, 2, 4],
      ],
      "#9cabb6",
    );
    mark(14, -17, 125, "EXIT", 9, "#95dfb4");
  }
  return canvas;
}
export function createOffice() {
  const tiles = Object.fromEntries(
    ["cubicle", "divider", "desk", "chair", "copier", "plant", "elevator"].map(
      (k) => [k, tile(k)],
    ),
  );
  const decorations = [];
  for (let x = 0; x < 1900; x += 158) {
    decorations.push({ x, y: 185, type: "cubicle" });
    decorations.push({ x, y: 205, type: "divider" });
    decorations.push({ x: x + 75, y: 490, type: "cubicle" });
  }
  const floor = document.createElement("canvas");
  floor.width = 2460;
  floor.height = 1300;
  const c = floor.getContext("2d");
  const p = (x, y, z = 0) => [
    300 + x * 0.9 + y * 0.55,
    700 - x * 0.24 + y * 0.62 - z,
  ];
  const plane = (pts, col) =>
    poly(
      c,
      pts.map((v) => p(...v)),
      col,
    );
  rect(c, 0, 0, 2460, 1300, "#101b2f");
  plane(
    [
      [-300, -100],
      [2250, -100],
      [2250, 700],
      [-300, 700],
    ],
    "#293c59",
  );
  // Fine carpet grain is fixed in world space, so it never crawls with the camera.
  for (let x = -250; x < 2250; x += 5)
    for (let y = -80; y < 700; y += 5) {
      const [sx, sy] = p(x, y);
      const n = (x * 17 + y * 23) % 19;
      rect(c, sx, sy, 1, 1, n < 7 ? "#48617a55" : "#152c4955");
    }
  for (let x = -300; x < 2250; x += 80)
    plane(
      [
        [x, -100],
        [x + 1, -100],
        [x + 1, 700],
        [x, 700],
      ],
      "#22324d",
    );
  for (let y = -100; y < 700; y += 80)
    plane(
      [
        [-300, y],
        [2250, y],
        [2250, y + 1],
        [-300, y + 1],
      ],
      "#3d506555",
    );
  // Continuous rear wall, baseboard and pale pillars.
  plane(
    [
      [-300, 95, 0],
      [2250, 95, 0],
      [2250, 95, 145],
      [-300, 95, 145],
    ],
    "#8ba4ba",
  );
  plane(
    [
      [-300, 96, 0],
      [2250, 96, 0],
      [2250, 96, 8],
      [-300, 96, 8],
    ],
    "#3b506d",
  );
  for (let x = -200; x < 2150; x += 220) {
    plane(
      [
        [x, 96, 25],
        [x + 100, 96, 25],
        [x + 100, 96, 101],
        [x, 96, 101],
      ],
      "#483d41",
    );
    plane(
      [
        [x + 4, 97, 29],
        [x + 96, 97, 29],
        [x + 96, 97, 97],
        [x + 4, 97, 97],
      ],
      "#b4af93",
    );
    for (let i = 0; i < 6; i++) {
      let xx = x + 9 + (i % 3) * 29,
        zz = 42 + Math.floor(i / 3) * 27;
      plane(
        [
          [xx, 98, zz],
          [xx + 19, 98, zz],
          [xx + 19, 98, zz + 20],
          [xx, 98, zz + 20],
        ],
        i % 2 ? "#ddd8b2" : "#9fafa9",
      );
    }
    plane(
      [
        [x + 142, 98, 0],
        [x + 158, 98, 0],
        [x + 158, 98, 145],
        [x + 142, 98, 145],
      ],
      "#c7d3de",
    );
  }
  return { tiles, decorations, floor };
}
export function drawFloor(c, office, camera) {
  const o = project(0, 0, camera);
  c.drawImage(office.floor, Math.round(o.x - 300), Math.round(o.y - 700));
}
export function drawFurniture(c, office, item, camera, alpha = 1) {
  const p = project(item.x, item.y, camera);
  if (p.x < -200 || p.x > 850 || p.y < -100 || p.y > 560) return;
  c.save();
  c.globalAlpha = alpha;
  if (item.hp !== undefined && item.hp <= 0) {
    poly(
      c,
      [
        [p.x - 27, p.y],
        [p.x + 15, p.y - 10],
        [p.x + 36, p.y + 6],
        [p.x - 4, p.y + 16],
      ],
      "#18263c",
    );
    for (let i = 0; i < 12; i++)
      rect(
        c,
        p.x - 25 + i * 5,
        p.y + ((i * 7) % 17) - 10,
        5 + (i % 3),
        2,
        i % 2 ? "#a0aebc" : "#657b94",
      );
  } else
    c.drawImage(
      office.tiles[item.type],
      Math.round(p.x - 90),
      Math.round(p.y - 150),
    );
  c.restore();
}
