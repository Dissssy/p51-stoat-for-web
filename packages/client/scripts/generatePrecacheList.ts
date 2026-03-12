// scripts/generatePrecacheList.ts
// Usage: pnpm --filter client exec tsx ./scripts/generatePrecacheList.ts
import { writeFileSync } from "fs";
import { unicodeEmojiUrl } from "../components/markdown/emoji/util";
import emojiMapping from "../components/ui/emojiMapping.json";

function allEmojiUrls() {
  const urls = new Set<string>();
  for (const emoji of Object.values(emojiMapping)) {
    const url = unicodeEmojiUrl(emoji);
    if (url) urls.add(url);
  }
  return Array.from(urls);
}

function allPrecacheUrls() {
  return allEmojiUrls();
}

const urls = allPrecacheUrls();
writeFileSync("./public/precache.json", JSON.stringify(urls, null, 2));
console.log(`Wrote ${urls.length} URLs to ./public/precache.json`);
