export function utilTriggerEvent(target, type, eventProperties) {
    target.each(function() {
        var evt = new Event(type, { bubbles: true, cancelable: true });
        Object.assign(evt, eventProperties);
        this.dispatchEvent(evt);
    });
}
