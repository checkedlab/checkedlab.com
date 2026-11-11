import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "https://api.indexnow.org/indexnow";
const HOST = "www.checkedlab.com";
const ORIGIN = "https://www.checkedlab.com";

const submit = process.argv.includes("--submit");
const soft = process.argv.includes("--soft");

function fail(message) {
  console.error(message);
  process.exit(soft ? 0 : 1);
}

function gitShow(rev, path) {
  try {
    return execFileSync("git", ["show", rev + ":" + path], { cwd: root, encoding: "utf8" });
  } catch {
    return "";
  }
}

function urlsFromSitemap(xml) {
  const map = new Map();
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (/<loc>([^<]+)<\/loc>/.exec(block[1]) || [])[1];
    const lastmod = (/<lastmod>([^<]+)<\/lastmod>/.exec(block[1]) || [])[1] || "";
    if (loc) map.set(loc, lastmod);
  }
  return map;
}

function changedUrls() {
  const disk = readFileSync(join(root, "sitemap.xml"), "utf8");
  const head = gitShow("HEAD", "sitemap.xml");
  const base = disk === head ? gitShow("HEAD~1", "sitemap.xml") : head;
  if (!base) return { urls: [], missingBase: true };
  const previous = urlsFromSitemap(base);
  const current = urlsFromSitemap(disk);
  const urls = [];
  for (const [loc, lastmod] of current) {
    if (!loc.startsWith(ORIGIN + "/")) continue;
    if (previous.get(loc) !== lastmod) urls.push(loc);
  }
  return { urls, missingBase: false };
}

const { urls, missingBase } = changedUrls();
if (missingBase) fail("IndexNow skipped: no parent sitemap to compare");
if (!urls.length) {
  console.log("IndexNow: no changed URLs");
  process.exit(0);
}
console.log("IndexNow changed URLs: " + urls.length);
if (!submit) {
  for (const url of urls) console.log(url);
  console.log("IndexNow dry run. Pass --submit to POST.");
  process.exit(0);
}

const key = readFileSync(join(root, "data", "indexnow-key"), "utf8").trim();
if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) fail("IndexNow key is missing");

const body = {
  host: HOST,
  key,
  keyLocation: ORIGIN + "/" + key + ".txt",
  urlList: urls
};

try {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000)
  });
  console.log("IndexNow status " + response.status);
  if (response.status !== 200 && response.status !== 202) {
    fail("IndexNow rejected the submission (" + response.status + ")");
  }
} catch (error) {
  fail("IndexNow request failed: " + (error && error.message ? error.message : error));
}
