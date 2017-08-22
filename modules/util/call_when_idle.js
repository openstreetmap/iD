// note the function should be of low priority
// and should not be returning a value.
export function utilCallWhenIdle(func, timeout, name) {
    return function() {
        var args = arguments;
        var that = this;
        console.log('called ', name);
        window.requestIdleCallback(function() {
        console.log('idle succeed  ', name);
            func.apply(that, args);
        }, {timeout: timeout});
    };
}