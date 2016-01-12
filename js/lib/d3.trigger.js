// extend d3.selection, triger a custom html event on current selection
d3.selection.prototype.trigger = function (type) {
    this.each(function() {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent(type, true, true);
        this.dispatchEvent(evt);
    });
};
