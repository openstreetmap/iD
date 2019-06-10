import _debounce from 'lodash-es/debounce';
import {
    select as d3_select
} from 'd3-selection';
import { svgIcon } from '../svg/icon';
import { t } from '../util/locale';
import { services } from '../services';
import { utilDisplayLabel } from '../util';
import { uiIntro } from './intro';
import { uiFeatureList } from './feature_list';
import { geoRawMercator } from '../geo/raw_mercator';
import { decimalCoordinatePair, formattedRoundedDuration } from '../util/units';

export function uiAssistant(context) {

    var defaultLoc = t('assistant.global_location');
    var currLocation = defaultLoc;

    var container = d3_select(null),
        header = d3_select(null),
        body = d3_select(null);

    var featureSearch = uiFeatureList(context);

    var didEditAnythingYet = false;
    var isFirstSession = !context.storage('sawSplash');
    context.storage('sawSplash', true);

    var assistant = function(selection) {

        container = selection.append('div')
            .attr('class', 'assistant');
        header = container.append('div')
            .attr('class', 'assistant-header');
        body = container.append('div')
            .attr('class', 'assistant-body');

        scheduleCurrentLocationUpdate();

        redraw();

        context
            .on('enter.assistant', redraw);

        context.map()
            .on('move.assistant', scheduleCurrentLocationUpdate);

        context.history()
            .on('change.assistant', updateDidEditStatus);
    };

    function updateDidEditStatus() {
        didEditAnythingYet = true;

        context.history()
            .on('change.assistant', null);

        redraw();
    }

    function redraw() {
        if (container.empty()) return;

        var mode = context.mode();
        if (!mode) return;

        var iconCol = header.selectAll('.icon-col')
            .data([0]);
        iconCol = iconCol.enter()
            .append('div')
            .attr('class', 'icon-col')
            .call(svgIcon('#'))
            .merge(iconCol);

        var mainCol = header.selectAll('.body-col')
            .data([0]);

        var mainColEnter = mainCol.enter()
            .append('div')
            .attr('class', 'body-col');

        mainColEnter.append('div')
            .attr('class', 'mode-label');

        mainColEnter.append('div')
            .attr('class', 'subject-title');

        mainColEnter.append('div')
            .attr('class', 'body-text');

        mainColEnter.append('div')
            .attr('class', 'main-footer');

        mainCol = mainColEnter.merge(mainCol);

        var iconUse = iconCol.selectAll('svg.icon use'),
            modeLabel = mainCol.selectAll('.mode-label'),
            subjectTitle = mainCol.selectAll('.subject-title'),
            bodyTextArea = mainCol.selectAll('.body-text'),
            mainFooter = mainCol.selectAll('.main-footer');

        if (mode.id.indexOf('point') !== -1) {
            iconUse.attr('href','#iD-icon-point');
        } else if (mode.id.indexOf('line') !== -1) {
            iconUse.attr('href','#iD-icon-line');
        } else if (mode.id.indexOf('area') !== -1) {
            iconUse.attr('href','#iD-icon-area');
        }

        body.html('');
        bodyTextArea.html('');
        mainFooter.html('');
        subjectTitle.classed('location', false);
        container.classed('prominent', false);

        if (mode.id === 'save') {

            var summary = context.history().difference().summary();

            modeLabel.text(t('assistant.mode.saving'));
            iconUse.attr('href','#iD-icon-save');

            var titleID = summary.length === 1 ? 'change' : 'changes';
            subjectTitle.text(t('commit.' + titleID, { count: summary.length }));

        } else if (mode.id === 'add-point' || mode.id === 'add-line' || mode.id === 'add-area') {

            modeLabel.text(t('assistant.mode.adding'));

            subjectTitle.text(mode.title);

            if (mode.id === 'add-point') {
                bodyTextArea.html(t('assistant.instructions.add_point'));
            } else if (mode.id === 'add-line') {
                bodyTextArea.html(t('assistant.instructions.add_line'));
            } else if (mode.id === 'add-area') {
                bodyTextArea.html(t('assistant.instructions.add_area'));
            }

        } else if (mode.id === 'draw-line' || mode.id === 'draw-area') {

            modeLabel.text(t('assistant.mode.drawing'));

            subjectTitle.text(mode.title);

            if (mode.id === 'draw-line') {
                bodyTextArea.html(t('assistant.instructions.draw_line'));
            } else if (mode.id === 'draw-area') {
                bodyTextArea.html(t('assistant.instructions.draw_area'));
            }

        } else if (mode.id === 'select' && mode.selectedIDs().length === 1) {

            iconUse.attr('href','#fas-edit');

            var id = mode.selectedIDs()[0];
            var entity = context.entity(id);

            modeLabel.text(t('assistant.mode.editing'));

            subjectTitle.text(utilDisplayLabel(entity, context));

        } else if (!didEditAnythingYet) {
            container.classed('prominent', true);

            iconUse.attr('href','#' + greetingIcon());
            subjectTitle.text(t('assistant.greetings.' + greetingTimeframe()));

            if (context.history().hasRestorableChanges()) {
                drawRestoreScreen();
            } else {
                bodyTextArea.html(t('assistant.welcome.' + (isFirstSession ? 'first_time' : 'return')));
                bodyTextArea.selectAll('a')
                    .attr('href', '#')
                    .on('click', function() {
                        isFirstSession = false;
                        updateDidEditStatus();
                        context.container().call(uiIntro(context));
                    });

                mainFooter.append('button')
                    .attr('class', 'primary')
                    .on('click', function() {
                        updateDidEditStatus();
                    })
                    .append('span')
                    .text(t('assistant.welcome.start_mapping'));
            }

        } else {
            iconUse.attr('href','#fas-map-marked-alt');

            modeLabel.text(t('assistant.mode.mapping'));

            subjectTitle.classed('location', true);
            subjectTitle.text(currLocation);
            scheduleCurrentLocationUpdate();

            body
                .append('div')
                .attr('class', 'feature-list-pane')
                .call(featureSearch);
        }

        function drawRestoreScreen() {
            var savedHistoryJSON = JSON.parse(context.history().savedHistoryJSON());

            var lastGraph = savedHistoryJSON.stack &&
                savedHistoryJSON.stack.length > 0 &&
                savedHistoryJSON.stack[savedHistoryJSON.stack.length - 1];
            if (!lastGraph) return;

            var changeCount = (lastGraph.modified ? lastGraph.modified.length : 0) +
                (lastGraph.deleted ? lastGraph.deleted.length : 0);
            if (changeCount === 0) return;

            var loc = lastGraph.transform &&
                geoRawMercator()
                .transform(lastGraph.transform)
                .invert([0, 0]);
            if (!loc) return;

            var restoreInfoDict = {
                count: '<b>' + changeCount.toString() + '</b>',
                location: '<b class="restore-location">' + decimalCoordinatePair(loc, 3) + '</b>'
            };
            var infoID = 'count_loc';

            if (savedHistoryJSON.timestamp) {
                infoID = 'count_loc_time';
                var milliseconds = (new Date()).getTime() - savedHistoryJSON.timestamp;
                restoreInfoDict.duration = '<b>' + formattedRoundedDuration(milliseconds) + '</b>';
            }

            bodyTextArea.html(t('assistant.restore.info.' + infoID, restoreInfoDict) +
                '<br/>' +
                t('assistant.restore.ask'));

            getLocation(loc, null, function(placeName) {
                if (placeName) {
                    container.selectAll('.restore-location')
                        .text(placeName);
                }
            });

            mainFooter.append('button')
                .attr('class', 'primary')
                .on('click', function() {
                    context.history().restore();
                    redraw();
                })
                .append('span')
                .text(t('assistant.restore.title'));

            mainFooter.append('button')
                .attr('class', 'destructive')
                .on('click', function() {
                    // don't show another welcome screen after discarding changes
                    updateDidEditStatus();
                    context.history().clearSaved();
                    redraw();
                })
                .append('span')
                .text(t('assistant.restore.discard'));
        }

    }

    function scheduleCurrentLocationUpdate() {
        debouncedGetLocation(context.map().center(), context.map().zoom(), function(placeName) {
            currLocation = placeName ? placeName : defaultLoc;
            container.selectAll('.subject-title.location')
                .text(currLocation);
        });
    }

    function greetingTimeframe() {
        var now = new Date();
        var hours = now.getHours();
        if (hours >= 20 || hours <= 2) return 'night';
        if (hours >= 18) return 'evening';
        if (hours >= 12) return 'afternoon';
        return 'morning';
    }

    function greetingIcon() {
        var now = new Date();
        var hours = now.getHours();
        if (hours >= 6 && hours < 18) return 'fas-sun';
        return 'fas-moon';
    }

    var debouncedGetLocation = _debounce(getLocation, 250);
    function getLocation(loc, zoom, completionHandler) {

        if (!services.geocoder || (zoom && zoom < 9)) {
            completionHandler(null);
            return;
        }

        services.geocoder.reverse(loc, function(err, result) {
            if (err || !result || !result.address) {
                completionHandler(null);
                return;
            }

            var addr = result.address;
            var place = ((!zoom || zoom > 14) && addr && (addr.town || addr.city || addr.county)) || '';
            var region = (addr && (addr.state || addr.country)) || '';
            var separator = (place && region) ? t('success.thank_you_where.separator') : '';

            var formattedName = t('success.thank_you_where.format',
                { place: place, separator: separator, region: region }
            );

            completionHandler(formattedName);
        });
    }

    return assistant;
}
