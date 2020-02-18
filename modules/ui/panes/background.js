import _debounce from 'lodash-es/debounce';

import { event as d3_event, select as d3_select } from 'd3-selection';

import { t } from '../../util/locale';
import { uiCmd } from '../cmd';
import { uiPane } from '../pane';

import { uiBackgroundDisplayOptions } from '../sections/background_display_options';
import { uiBackgroundList } from '../sections/background_list';
import { uiBackgroundOffset } from '../sections/background_offset';
import { uiOverlayList } from '../sections/overlay_list';

export function uiPaneBackground(context) {

    var _key = t('background.key');

    var _backgroundListContainer = d3_select(null);
    var _overlayListContainer = d3_select(null);
    var _displayOptionsContainer = d3_select(null);
    var _offsetContainer = d3_select(null);

    var backgroundList = uiBackgroundList(context);
    var backgroundDisplayOptions = uiBackgroundDisplayOptions(context);
    var backgroundOffset = uiBackgroundOffset(context);
    var overlayList = uiOverlayList(context);

    function update() {
        _backgroundListContainer
            .call(backgroundList);

        _overlayListContainer
            .call(overlayList);

        _displayOptionsContainer
            .call(backgroundDisplayOptions);

        _offsetContainer
            .call(backgroundOffset);
    }

    function quickSwitch() {
        if (d3_event) {
            d3_event.stopImmediatePropagation();
            d3_event.preventDefault();
        }
        var previousBackground = context.background().findSource(context.storage('background-last-used-toggle'));
        if (previousBackground) {
            var newPreviousBackground = context.background().baseLayerSource();
            context.storage('background-last-used-toggle', newPreviousBackground.id);
            context.storage('background-last-used', previousBackground.id);
            context.background().baseLayerSource(previousBackground);
            document.activeElement.blur();
        }
    }

    var backgroundPane = uiPane('background', context)
        .key(_key)
        .title(t('background.title'))
        .description(t('background.description'))
        .iconName('iD-icon-layers');

    backgroundPane.renderContent = function(content) {

        // background list
        _backgroundListContainer = content
            .append('div')
            .attr('class', 'background-background-list-container');

        // overlay list
        _overlayListContainer = content
            .append('div')
            .attr('class', 'background-overlay-list-container');

        // display options
        _displayOptionsContainer = content
            .append('div')
            .attr('class', 'background-display-options');

        // offset controls
        _offsetContainer = content
            .append('div')
            .attr('class', 'background-offset');

        update();


        // add listeners
        context.map()
            .on('move.background-update',
                _debounce(function() { window.requestIdleCallback(update); }, 1000)
            );

        context.background()
            .on('change.background-update', update);

        context.keybinding()
            .on(uiCmd('⌘' + _key), quickSwitch);
    };

    return backgroundPane;
}
