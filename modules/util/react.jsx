
/**
 * Binds many functions to an object.
 *
 * @param {any} object The object where to bind the functions.
 * @param  {...string} keys The names of the object's properties to bind.
 */
export function bindMany(object, ...keys) {
    for (const key of keys) {
        const value = object[key]
        if (typeof value === 'function') {
            object[key] = value.bind(object)
        } else {
            throw new Error(`bindMany failed: '${key}' is no function`)
        }
    }
}
