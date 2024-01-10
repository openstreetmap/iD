import { t } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { uiCmd } from '../cmd';
import { uiTooltip } from '../tooltip';

export function uiToolDiscard(context) {

    var button = null;
    var _numChanges = 0;
    var tooltipBehavior = null;
    var key = uiCmd('⌘⌦');

    var tool = {
        id: 'discard',
        label: t.append('discard.title')
    };

    function isSaving() {
        var mode = context.mode();
        return mode && mode.id === 'save';
    }

    function isDisabled() {
        return _numChanges === 0 || isSaving();
    }

    function discard() {
        // Discard changes
        context.history().discard();
    }

    function updateCount() {
        var val = context.history().difference().summary().length;
        if (val === _numChanges) return;

        _numChanges = val;

        if (tooltipBehavior) {
            tooltipBehavior
                .title(() => t.append(_numChanges > 0 ? 'discard.help' : 'discard.no_changes'))
                .keys([key]);
        }

        if (button) {
            button
                .classed('disabled', isDisabled());
            }
    }

    tool.render = function(selection) {
        tooltipBehavior = uiTooltip()
            .placement('bottom')
            .title(() => t.append('discard.no_changes'))
            .keys([uiCmd('⌘⌦')])
            .scrollContainer(context.container().select('.top-toolbar'));

        var lastPointerUpType;

        button = selection
            .append('button')
            .attr('class', 'discard disabled bar-button')
            .on('pointerup', function(d3_event) {
                lastPointerUpType = d3_event.pointerType;
            })
            .on('click', function() {
                if (context.history().hasChanges() &&
                !window.confirm("All your unsaved changes will be discarded. You can undo this action if you want ")) return;
                discard();
                if (_numChanges === 0 && (
                    lastPointerUpType === 'touch' || lastPointerUpType === 'pen')
                    ){
                        // there are no tooltips for touch interactions so flash feedback instead
                        context.ui().flash
                        .duration(2000)
                        .iconName('#iD-operation-delete')
                        .iconClass('disabled')
                        .label(t.append('discard.no_changes'))();
                    }
                    lastPointerUpType = null;
            })
            .classed('disabled', isDisabled())
            .call(tooltipBehavior);

        button
            .call(svgIcon('#iD-operation-delete'));

        updateCount();

        context.keybinding()
            .on(uiCmd('⌘⌦'), function(d3_event) {
                d3_event.preventDefault();
                if (!isDisabled()) {
                    discard();
                }
            });

        context.history()
            .on('change.discard',updateCount);
    };

    tool.uninstall = function() {
        context.keybinding().off(uiCmd('⌘⌦'));
        context.history().on('change.discard', null);
    };

    return tool;
}
