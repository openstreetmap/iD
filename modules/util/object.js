
export function utilObjectOmit(obj, omitKeys) {
    return Object.keys(obj).reduce(function(result, key) {
        if (omitKeys.indexOf(key) === -1) {
            result[key] = obj[key];  // keep
        }
        return result;
    }, {});
}
