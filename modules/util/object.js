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

/**
 * converts every value in an object to a string, if
 * it's not already a string.
 * @param {Record<string, unknown>} object
 */
export function stringifyProperties(object) {
    /** @type {Tags} */
    const tags = {};
    for (const key in object) {
        switch (typeof object[key]) {
            case 'undefined':
                break; // skip property
            case 'string':
                tags[key] = object[key];
                break;
            default:
                tags[key] = JSON.stringify(
                    object[key],
                    (_, value) => typeof value === 'bigint' ? value.toString() : value
                );
        }
    }
    return tags;
}
