export function bindOnce(target, type, listener, capture) {
    var typeOnce = type + ".once";
    function one() {
        target.on(typeOnce, null);
        listener.apply(this, arguments);
    }
    target.on(typeOnce, one, capture);
    return this;
};
