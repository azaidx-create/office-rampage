// npm install --no-save playwright@1.62.1 && npx playwright install --with-deps webkit
const { webkit } = require("playwright");
const assert = require("node:assert/strict"),
  http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(root, pathname === "/" ? "index.html" : pathname);
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  res.setHeader(
    "Content-Type",
    file.endsWith(".js")
      ? "application/javascript"
      : file.endsWith(".css")
        ? "text/css"
        : "text/html",
  );
  try {
    res.end(fs.readFileSync(file));
  } catch {
    res.writeHead(404).end();
  }
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  let browser;
  try {
    browser = await webkit.launch({ headless: true });
    fs.mkdirSync(path.join(root, "test-results"), { recursive: true });
    const errors = [];
    for (const viewport of [
      { width: 844, height: 390 },
      { width: 390, height: 844 },
      { width: 667, height: 375 },
      { width: 1280, height: 800 },
    ]) {
      const page = await browser.newPage({
        viewport,
        deviceScaleFactor: 1,
        isMobile: viewport.width < 1000,
        hasTouch: true,
      });
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/?debug`);
      await page.locator("#start").click();
      assert.equal(await page.evaluate(() => __office.game.status), "playing");
      const before = await page.evaluate(() => __office.game.player.x);
      await page.keyboard.down("KeyD");
      await page.waitForTimeout(320);
      await page.keyboard.up("KeyD");
      assert.ok(
        (await page.evaluate(() => __office.game.player.x)) > before + 20,
      );
      await page.locator("#pause").click();
      const pauseX = await page.evaluate(() => __office.game.player.x);
      await page.keyboard.down("KeyD");
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => __office.game.player.x), pauseX);
      await page.keyboard.up("KeyD");
      await page.locator("#resume").click();
      // Pointer capture on the stick plus a separate touch attack verifies simultaneous input.
      const box = await page.locator("#stick").boundingBox();
      await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.waitForTimeout(200);
      const button = await page.locator('[data-action="punch"]').boundingBox();
      await page.touchscreen.tap(
        button.x + button.width / 2,
        button.y + button.height / 2,
      );
      await page.waitForTimeout(70);
      assert.ok(
        (await page.evaluate(() => __office.game.player.state)).startsWith(
          "punch",
        ),
      );
      await page.mouse.up();
      await page.waitForTimeout(400);
      assert.deepEqual(await page.evaluate(() => __office.joy()), {
        x: 0,
        y: 0,
      });
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      assert.equal(await page.evaluate(() => __office.paused), true);
      await page.locator("#resume").click();
      const bounds = await page.locator("[data-action]").evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        }),
      );
      for (const r of bounds) {
        assert.ok(
          r.x >= 0 &&
            r.right <= viewport.width + 1 &&
            r.y >= 0 &&
            r.bottom <= viewport.height + 1,
          JSON.stringify({ viewport, r }),
        );
        assert.ok(r.width >= 44 && r.height >= 44);
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.screenshot({
        path: path.join(
          root,
          `test-results/${viewport.width}x${viewport.height}.png`,
        ),
      });
      // Raster frames themselves must change, not merely their positions in the scene.
      const uniqueness = await page.evaluate(() =>
        Object.fromEntries(
          Object.entries(__office.atlases.hero).map(([name, frames]) => [
            name,
            new Set(frames.map((f) => f.toDataURL())).size,
          ]),
        ),
      );
      for (const [name, n] of Object.entries(uniqueness))
        assert.ok(n >= 3, `${name}: ${n}`);
      await page.evaluate(() => {
        __office.game.player.hp = 1;
        __office.game.spawnWave(0);
        const e = __office.game.enemies[0];
        __office.game.damage(__office.game.player, e, { damage: 10, push: 0 });
      });
      await page.waitForTimeout(1100);
      assert.equal(await page.locator("#overlay").isVisible(), true);
      await page.locator("#start").click();
      assert.equal(await page.evaluate(() => __office.game.player.hp), 140);
      assert.equal(await page.evaluate(() => __office.game.enemies.length), 0);
      console.log(
        `PASS WebKit ${viewport.width}x${viewport.height}: start, movement, multi-input, pause, blur, layout, distinct animation frames, death/restart`,
      );
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log("PASS no uncaught browser errors");
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
