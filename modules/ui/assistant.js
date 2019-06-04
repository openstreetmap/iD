import _debounce from 'lodash-es/debounce';
import {
    select as d3_select
} from 'd3-selection';
import { svgIcon } from '../svg/icon';
import { t } from '../util/locale';
import { services } from '../services';
import { utilDisplayLabel } from '../util';

export function uiAssistant(context) {

    var container = d3_select(null);

    var assistant = function(selection) {

        container = selection.append('div')
            .attr('class', 'assistant');

        redraw();

        context
            .on('enter.assistant', redraw);

        context.map()
            .on('move.assistant', debouncedGetLocation);
    };

    function redraw() {
        if (container.empty()) return;

        var mode = context.mode();
        if (!mode) return;

        var iconCol = container.selectAll('.icon-col')
            .data([0]);
        iconCol = iconCol.enter()
            .append('div')
            .attr('class', 'icon-col')
            .call(svgIcon('#'))
            .merge(iconCol);

        var bodyCol = container.selectAll('.body-col')
            .data([0]);

        var bodyColEnter = bodyCol.enter()
            .append('div')
            .attr('class', 'body-col');

        bodyColEnter.append('div')
            .attr('class', 'mode-label');

        bodyColEnter.append('div')
            .attr('class', 'subject-title');

        bodyCol = bodyColEnter.merge(bodyCol);

        var iconUse = iconCol.selectAll('svg.icon use'),
            modeLabel = bodyCol.selectAll('.mode-label'),
            subjectTitle = bodyCol.selectAll('.subject-title');

        if (mode.id.indexOf('point') !== -1) {
            iconUse.attr('href','#iD-icon-point');
        } else if (mode.id.indexOf('line') !== -1) {
            iconUse.attr('href','#iD-icon-line');
        } else if (mode.id.indexOf('area') !== -1) {
            iconUse.attr('href','#iD-icon-area');
        }

        subjectTitle.classed('location', false);

        if (mode.id === 'add-point' || mode.id === 'add-line' || mode.id === 'add-area') {

            modeLabel.text(t('assistant.mode.adding'));

            subjectTitle.text(mode.title);

        } else if (mode.id === 'draw-line' || mode.id === 'draw-area') {

            modeLabel.text(t('assistant.mode.drawing'));

            subjectTitle.text(mode.title);

        } else if (mode.id === 'select' && mode.selectedIDs().length === 1) {

            iconUse.attr('href','#fas-edit');

            var id = mode.selectedIDs()[0];
            var entity = context.entity(id);

            modeLabel.text(t('assistant.mode.editing'));

            subjectTitle.text(utilDisplayLabel(entity, context));

        } else {
            iconUse.attr('href','#fas-map-marked-alt');

            modeLabel.text(t('assistant.mode.mapping'));

            subjectTitle.classed('location', true);
            subjectTitle.text(currLocation);
            debouncedGetLocation();
        }

    }

    var defaultLoc = t('assistant.global_location');
    var currLocation = defaultLoc;

    var debouncedGetLocation = _debounce(getLocation, 250);
    function getLocation() {
        if (!services.geocoder || context.map().zoom() < 11) {
            currLocation = defaultLoc;
            container.selectAll('.subject-title.location')
                .text(currLocation);
        } else {
            services.geocoder.reverse(context.map().center(), function(err, result) {
                if (err || !result || !result.address) {
                    currLocation = defaultLoc;
                } else {
                    var addr = result.address;
                    var place = (addr && (addr.town || addr.city || addr.county)) || '';
                    var region = (addr && (addr.state || addr.country)) || '';
                    var separator = (place && region) ? t('success.thank_you_where.separator') : '';

                    currLocation = t('success.thank_you_where.format',
                        { place: place, separator: separator, region: region }
                    );
                }
                container.selectAll('.subject-title.location')
                    .text(currLocation);
            });
        }
    }

    return assistant;
}
