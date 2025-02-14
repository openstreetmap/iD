
export function utilObjectOmit(obj, omitKeys) {
    return Object.keys(obj).reduce(function(result, key) {
        if (omitKeys.indexOf(key) === -1) {
            result[key] = obj[key];  // keep
        }
        return result;
    }, {});
}

/**
 * @template T
 * @typedef {{ [key: string]: { [value: string]: T } }} TagDictionary<T>
 */

/**
 * searches a dictionary for a match, such as `osmOneWayForwardTags`,
 * `osmAreaKeysExceptions`, etc.
 * @template T
 * @param {Tags} tags
 * @param {TagDictionary<T>} tagDictionary
 * @returns {T | undefined}
 */
export function utilCheckTagDictionary(tags, tagDictionary) {
    for (const key in tags) {
        const value = tags[key];
        if (tagDictionary[key] && value in tagDictionary[key]) {
            return tagDictionary[key][value];
        }
    }
    return undefined;
}
