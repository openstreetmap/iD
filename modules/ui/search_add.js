import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { actionChangePreset } from '../actions/index';
import { operationDelete } from '../operations/index';
import { svgIcon } from '../svg/index';
import { tooltip } from '../util/tooltip';
import { uiPresetIcon } from './preset_icon';
import { uiTagReference } from './tag_reference';
import { utilKeybinding, utilNoAuto, utilRebind } from '../util';


export function uiSearchAdd(context) {
    var dispatch = d3_dispatch('choose');

    function searchAdd(selection) {

        var searchWrap = selection
            .append('div')
            .attr('class', 'search-wrap');

        var search = searchWrap
            .append('input')
            .attr('class', 'search-input')
            .attr('placeholder', t('modes.add_feature.title'))
            .attr('type', 'search')
            .call(utilNoAuto);
            //.on('keydown', initialKeydown)
            //.on('keypress', keypress)
            //.on('input', inputevent);

        searchWrap
            .call(svgIcon('#iD-icon-search', 'search-icon pre-text'));
    }

    return utilRebind(searchAdd, dispatch, 'on');
}
