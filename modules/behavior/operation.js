import { t } from '../core';

/* Creates a keybinding behavior for an operation */
export function behaviorOperation(context) {
    var _operation;

    /** @param {KeyboardEvent} d3_event */
    function keypress(d3_event) {
        // prevent operations during low zoom selection
        if (!context.map().withinEditableZoom()) return;

        // ignore (temporarily) disabled operation keyboard shortcuts,
        // e.g. Ctrl+C while text is selected
        if (_operation.availableForKeypress?.() === false) return;

        d3_event.preventDefault();

        if (!_operation.available()) {
            context.ui().flash
                .duration(4000)
                .iconName('#iD-operation-' + _operation.id)
                .iconClass('operation disabled')
                .label(t.append('operations._unavailable', {
                    operation: t(`operations.${_operation.id}.title`) || _operation.id
                }))();
        } else if (_operation.disabled()) {
            context.ui().flash
                .duration(4000)
                .iconName('#iD-operation-' + _operation.id)
                .iconClass('operation disabled')
                .label(_operation.tooltip())();
        } else {
            context.ui().flash
                .duration(2000)
                .iconName('#iD-operation-' + _operation.id)
                .iconClass('operation')
                .label(_operation.annotation() || _operation.title)();

            if (_operation.point) _operation.point(null);
            _operation(d3_event);
        }
    }


    function behavior() {
        if (_operation && _operation.available()) {
            behavior.on();
        }

        return behavior;
    }


    behavior.on = function() {
        context.keybinding()
            .on(_operation.keys, keypress);
    };


    behavior.off = function() {
        context.keybinding()
            .off(_operation.keys);
    };


    behavior.which = function (_) {
        if (!arguments.length) return _operation;
        _operation = _;
        return behavior;
    };


    return behavior;
}
