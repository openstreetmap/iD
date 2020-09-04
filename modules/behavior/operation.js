import { event as d3_event } from 'd3-selection';


/* Creates a keybinding behavior for an operation */
export function behaviorOperation(context) {
    var _operation;

    function keypress() {
        // prevent operations during low zoom selection
        if (!context.map().withinEditableZoom()) return;

        if (_operation.availableForKeypress && !_operation.availableForKeypress()) return;

        d3_event.preventDefault();

        var disabled = _operation.disabled();

        if (disabled) {
            context.ui().flash
                .duration(4000)
                .iconName('#iD-operation-' + _operation.id)
                .iconClass('operation disabled')
                .text(_operation.tooltip)();

        } else {
            context.ui().flash
                .duration(2000)
                .iconName('#iD-operation-' + _operation.id)
                .iconClass('operation')
                .text(_operation.annotation() || _operation.title)();

            if (_operation.point) _operation.point(null);
            _operation();
        }
    }


    function behavior() {
        if (_operation && _operation.available()) {
            context.keybinding()
                .on(_operation.keys, keypress);
        }

        return behavior;
    }


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
