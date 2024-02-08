// @ts-check
import { fileFetcher } from '../core';

/**
 * @typedef {{
 *  key: `Key:${string}`;
 *  url: string;
 *  source: string;
 *  rank: "normal" | "preferred";
 * }} Tag2LinkItem
 */

const RANKS = ['deprecated', 'normal', 'preferred'];

/** fetch the tag2link definitions from JOSM, and convert it to an object. */
export async function loadTag2Link() {
  /** @type {Tag2LinkItem[]} */
  const array = await fileFetcher.get('tag2link');

  /** @type {Map<string, string>} */
  const map = new Map();

  const allKeys = new Set(array.map(item => item.key));

  for (const key of allKeys) {
    // find an item with the best rank
    const bestDefinition = array
      .filter(item => item.key === key)
      .sort((a, b) =>  RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank))[0];

    map.set(key.replace('Key:', ''), bestDefinition.url);
  }

  return map;
}

