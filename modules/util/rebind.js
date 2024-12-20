// Copies a variable number of methods from source to target.
/**
 * @template T
 * @template S
 * @template {keyof S} Args
 * @param {T} target
 * @param {S} source
 * @param {...Args} args
 * @returns {T & Pick<S, Args>}
 */
export function utilRebind(target, source, ...args) {
    for (const method of args) {
        target[method] = d3_rebind(target, source, source[method]);
    }
    return target;
}

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
    return function() {
        var value = method.apply(source, arguments);
        return value === source ? target : value;
    };
}
