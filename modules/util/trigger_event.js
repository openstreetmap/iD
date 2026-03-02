export function utilTriggerEvent(target, type, eventProperties) {
    target.each(function() {
        const event = new Event(type, {
            bubbles: true,
            cancelable: true
        });
        Object.assign(event, eventProperties);
        this.dispatchEvent(event);
    });
}
