import { splitProps } from "solid-js";

import emojiRegex from "emoji-regex";

import { useState } from "@revolt/state";
import { EmojiBase, toCodepoint } from ".";

export type UnicodeEmojiPacks =
  | "fluent-3d"
  | "fluent-color"
  | "fluent-flat"
  | "mutant"
  | "noto"
  | "openmoji"
  | "twemoji";

export const UNICODE_EMOJI_PACKS: UnicodeEmojiPacks[] = [
  "fluent-3d",
  "fluent-color",
  "fluent-flat",
  "mutant",
  "noto",
  "openmoji",
  "twemoji",
];

export const UNICODE_EMOJI_PACK_PUA: Record = {
  // omit fluent-3d as it is the default (canonically \uE0E1)
  "fluent-flat": "\uE0E2",
  mutant: "\uE0E3",
  noto: "\uE0E4",
  openmoji: "\uE0E5",
  twemoji: "\uE0E6",
};

/**
 * Regex for matching emoji
 */
export const RE_UNICODE_EMOJI = new RegExp(
  "([\uE0E0-\uE0E6]?(?:" + emojiRegex().source + "))",
  "g",
);

export const UNICODE_EMOJI_MIN_PACK = "\uE0E0".codePointAt(0)!;
export const UNICODE_EMOJI_MAX_PACK = "\uE0E6".codePointAt(0)!;

export const UNICODE_EMOJI_PUA_PACK: Record = {
  ["\uE0E0"]: "fluent-3d", // default entry
  ["\uE0E1"]: "fluent-3d",
  ["\uE0E2"]: "fluent-flat",
  ["\uE0E3"]: "mutant",
  ["\uE0E4"]: "noto",
  ["\uE0E5"]: "openmoji",
  ["\uE0E6"]: "twemoji",
};

export const startsWithPackPUA = (emoji: string) => {
  if (emoji.startsWith(":")) return false;
  if (emoji.slice(0, 1).match("[\uE0E0-\uE0E6]")) return true;

  return false;
};

export function unicodeEmojiUrl(
  pack: UnicodeEmojiPacks = "fluent-3d",
  text: string,
) {
  var codePoint = toCodepoint(text);
  const codePointPieces = codePoint.split("-");
  // if codepoint is only 2 characters, and the second character is fe0f, remove the second character
  if (codePointPieces.length === 2 && codePointPieces[1] === "fe0f") {
    codePoint = codePoint.replace("-fe0f", "");
    return `https://static.planetfifty.one/emoji/twemoji-modern/${codePoint}.svg?v=1`;
  }
  // if codepoint is "2a-fe0f-20e3" (ie. #️⃣), change it to "2a-20e3" (just an example, match that format and rewrite)
  if (codePointPieces.length === 3 && codePointPieces[1] === "fe0f") {
    codePoint = codePointPieces[0] + "-" + codePointPieces[2];
    return `https://static.planetfifty.one/emoji/twemoji-modern/${codePoint}.svg?v=1`;
  }
  // if codepoint is "1f441-fe0f-200d-1f5e8-fe0f" (ie. 👁️‍🗨️), change it to "1f441-200d-1f5e8" (just an example, match that format and rewrite)
  if (
    codePointPieces.length === 5 &&
    codePointPieces[1] === "fe0f" &&
    codePointPieces[4] === "fe0f"
  ) {
    codePoint =
      codePointPieces[0] + "-" + codePointPieces[2] + "-" + codePointPieces[3];
    return `https://static.planetfifty.one/emoji/twemoji-modern/${codePoint}.svg?v=1`;
  }
  return `https://static.planetfifty.one/emoji/twemoji-modern/${codePoint}.svg?v=1`;
}

/**
 * Display Unicode emoji
 */
export function UnicodeEmoji(
  props: { emoji: string; pack?: UnicodeEmojiPacks } & Omit,
) {
  const [local, remote] = splitProps(props, ["emoji"]);
  const state = useState();

  return (
    <EmojiBase
      {...remote}
      loading="lazy"
      class="emoji"
      alt={local.emoji}
      draggable={false}
      src={unicodeEmojiUrl(
        props.pack ?? state.settings.getValue("appearance:unicode_emoji"),
        props.emoji,
      )}
    />
  );
}
