// @ts-nocheck -- will be migrated in the next PR
// Copies a variable number of methods from source to target.
export function utilRebind<T, S, Args extends keyof S>(target: T, source: S, ...args: Args[]): T & Pick<S, Args> {
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
