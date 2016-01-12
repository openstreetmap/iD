// extend d3.selection, similar as selection.on(), but the handler only could be executed once
d3.selection.prototype.one = function (type, listener, capture) {
    var target = this, typeOnce = type + ".once";
    function one() {
        target.on(typeOnce, null);
        listener.apply(this, arguments);
    }
    target.on(typeOnce, one, capture);
    return this;
};
