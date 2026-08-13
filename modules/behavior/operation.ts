import { t } from '../core';
import type { Behaviour, coreContext } from '../core/context';
import type { Operation } from '../core/history';

interface BehaviourOperation extends Behaviour {
    which: GetSet<BehaviourOperation, Operation>;
}

/* Creates a keybinding behavior for an operation */
export function behaviorOperation(context: coreContext) {
    var _operation: Operation;

    function keypress(d3_event: KeyboardEvent) {
        // prevent operations during low zoom selection
        if (!context.map().withinEditableZoom()) return;

        // ignore (temporarily) disabled operation keyboard shortcuts,
        // e.g. Ctrl+C while text is selected
        if (_operation.availableForKeypress?.() === false) return;

        d3_event.preventDefault();

        const disabled = _operation.disabled();

        if (!_operation.available()) {
            context.ui().flash
                .duration(4000)
                .iconName('#iD-operation-' + _operation.id)
                .iconClass('operation disabled')
                .label(t.append('operations._unavailable', {
                    operation: t.append(`operations.${_operation.id}.title`) || _operation.id
                }))();
        } else if (disabled) {
            const interrupt = _operation.interrupts?.[disabled];
            if (interrupt) {
                interrupt();
                return;
            }

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


    const behavior: BehaviourOperation = function() {
        if (_operation && _operation.available()) {
            behavior.on();
        }

        return behavior;
    };


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
    } as GetSet<BehaviourOperation, Operation>;


    return behavior;
}
