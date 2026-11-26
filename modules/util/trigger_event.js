export function utilTriggerEvent(target, type, eventProperties) {
    target.each(function() {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent(type, true, true);
        for (var prop in eventProperties) {
            evt[prop] = eventProperties[prop];
        }
        this.dispatchEvent(evt);
    });
}
