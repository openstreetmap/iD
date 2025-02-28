export function utilTriggerEvent(target, type, eventProperties) {
    target.each(function() {
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent(type, true, true);
        for (const prop in eventProperties) {
            evt[prop] = eventProperties[prop];
        }
        this.dispatchEvent(evt);
    });
}
