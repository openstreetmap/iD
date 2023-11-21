// @ts-check
import tag2linkRaw from 'tag2link';

const RANKS = ['deprecated', 'normal', 'preferred'];

/** @param {import('tag2link').Tag2Link[]} input */
function convertSourceData(input) {
  /** @type {Record<string, string>} */
  const output = {};

  const allKeys = new Set(input.map(item => item.key));

  for (const key of allKeys) {
    // find the item with the best rank
    const bestDefinition = input
      .filter(item => item.key === key)
      .sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank))[0];

    output[key.replace('Key:', '')] = bestDefinition.url;
  }

  return output;
}

export const TAG2LINK = convertSourceData(tag2linkRaw);
