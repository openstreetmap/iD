import { event as d3_event } from 'd3-selection';
import { uiFlash } from '../ui';


/* Creates a keybinding behavior for an operation */
export function behaviorOperation(context) {
    var _operation;

    function keypress() {
        d3_event.preventDefault();
        var disabled = _operation.disabled();
        var flash;

        if (disabled) {
            flash = uiFlash()
                .duration(4000)
                .iconName('#iD-operation-' + _operation.id)
                .iconClass('operation disabled')
                .text(_operation.tooltip);

            flash();

        } else {
            flash = uiFlash()
                .duration(2000)
                .iconName('#iD-operation-' + _operation.id)
                .iconClass('operation')
                .text(_operation.annotation() || _operation.title);

            flash();
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
