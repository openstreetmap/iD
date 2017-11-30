// note the function should be of low priority
// and should not be returning a value.
export function utilCallWhenIdle(func, timeout) {
    return function() {
        var args = arguments;
        var that = this;
        window.requestIdleCallback(function() {
            func.apply(that, args);
        }, {timeout: timeout});
    };
}
