export function utilObjectOmit<T extends object, K extends keyof T>(obj: T, omitKeys: K[]): Omit<T, K> {
    return (<K[]>Object.keys(obj)).reduce<any>(function(result, key) {
        if (omitKeys.indexOf(key) === -1) {
            result[key] = obj[key];  // keep
        }
        return result;
    }, {});
}

export interface TagDictionary<T> {
    [key: TagKey]: {
        [value: TagValue]: T
    }
}


/**
 * searches a dictionary for a match, such as `osmOneWayForwardTags`,
 * `osmAreaKeysExceptions`, etc.
 */
export function utilCheckTagDictionary<T>(tags:Tags, tagDictionary: TagDictionary<T>): T | undefined {
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
 */
export function stringifyProperties(object: Record<string, unknown>): Tags {
    const tags: Tags = {};
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
