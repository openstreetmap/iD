import _debounce from 'lodash-es/debounce';
import {
    select as d3_select
} from 'd3-selection';
import { svgIcon } from '../svg/icon';
import { t } from '../util/locale';
import { services } from '../services';
import { utilDisplayLabel } from '../util';
import { uiIntro } from './intro';
import { uiSuccess } from './success';
import { uiPresetIcon } from './preset_icon';
import { uiEntityEditor } from './entity_editor';
import { uiFeatureList } from './feature_list';
import { uiSelectionList } from './selection_list';
import { geoRawMercator } from '../geo/raw_mercator';
import { decimalCoordinatePair, formattedRoundedDuration } from '../util/units';

function utilTimeOfDayGreeting() {
    return t('assistant.greetings.' + utilTimeframe());
}

function utilTimeframe() {
    var now = new Date();
    var hours = now.getHours();
    if (hours >= 20 || hours <= 2) return 'night';
    if (hours >= 18) return 'evening';
    if (hours >= 12) return 'afternoon';
    return 'morning';
}

function utilGreetingIcon() {
    var now = new Date();
    var hours = now.getHours();
    if (hours >= 6 && hours < 18) return 'fas-sun';
    return 'fas-moon';
}

export function uiAssistant(context) {

    var defaultLoc = t('assistant.global_location');
    var currLocation = defaultLoc;

    var container = d3_select(null),
        header = d3_select(null),
        body = d3_select(null);

    var entityEditor = uiEntityEditor(context);
    var featureSearch = uiFeatureList(context);

    var savedChangeset = null;
    var savedChangeCount = null;
    var didEditAnythingYet = false;
    var isFirstSession = !context.storage('sawSplash');
    context.storage('sawSplash', true);

    var assistant = function(selection) {

        container = selection.append('div')
            .attr('class', 'assistant');
        header = container.append('div')
            .attr('class', 'assistant-header assistant-row');
        body = container.append('div')
            .attr('class', 'assistant-body');

        scheduleCurrentLocationUpdate();

        context
            .on('enter.assistant', redraw);

        context.map()
            .on('move.assistant', scheduleCurrentLocationUpdate);

        redraw();
    };

    function updateDidEditStatus() {
        savedChangeset = null;
        savedChangeCount = null;
        didEditAnythingYet = true;
    }

    var isBodyOpen = true;

    function toggleBody() {
        isBodyOpen = !isBodyOpen;
        container.classed('body-collapsed', !isBodyOpen);
        container.selectAll('.assistant-header .control-col .icon use')
            .attr('href', '#iD-icon-' + (isBodyOpen ? 'up' : 'down'));
    }

    function drawPanel(panel) {

        var isCollapsible = !panel.prominent && (panel.renderBody || panel.message);

        container.attr('class',
            'assistant ' +
            (panel.theme || 'dark') +
            ' ' +
            (panel.prominent ? 'prominent' : '') +
            ' ' +
            (isCollapsible && !isBodyOpen ? 'body-collapsed' : '')
        );

        var iconCol = header.selectAll('.icon-col')
            .data([0]);
        iconCol = iconCol.enter()
            .append('div')
            .attr('class', 'icon-col')
            .merge(iconCol);

        var headerMainCol = header.selectAll('.main-col')
            .data([0]);

        var headerMainColEnter = headerMainCol.enter()
            .append('div')
            .attr('class', 'main-col');

        headerMainColEnter.append('div')
            .attr('class', 'mode-label');

        headerMainColEnter.append('div')
            .attr('class', 'subject-title');

        headerMainColEnter.append('div')
            .attr('class', 'header-body');

        headerMainCol = headerMainColEnter.merge(headerMainCol);

        var controlCol = header.selectAll('.control-col')
            .data(isCollapsible ? [0] : []);

        controlCol.exit()
            .remove();

        controlCol.enter()
            .append('div')
            .attr('class', 'control-col')
            .append('button')
            .call(svgIcon('#iD-icon-' + (isBodyOpen ? 'up' : 'down')))
            .on('click', function() {
                toggleBody();
            });

        var modeLabel = headerMainCol.selectAll('.mode-label');
        modeLabel.text(panel.modeLabel || '');

        var subjectTitle = headerMainCol.selectAll('.subject-title');

        subjectTitle.attr('class', 'subject-title ' + panel.titleClass || '');
        subjectTitle.text(panel.title);

        iconCol.html('');
        if (panel.headerIcon) {
            iconCol.call(svgIcon('#' + panel.headerIcon));
        } else {
            iconCol.call(panel.renderHeaderIcon);
        }

        body.html('');
        if (panel.renderBody) {
            body.call(panel.renderBody);
        }

        var headerBody = headerMainCol.selectAll('.header-body');
        if (panel.renderHeaderBody) {
            headerBody.call(panel.renderHeaderBody);
        } else {
            headerBody.text('');
        }

        if (panel.message) {
            var bodyTextRow = body.append('div')
                .attr('class', 'assistant-row');

            bodyTextRow.append('div')
                .attr('class', 'icon-col');

            var bodyBodyCol = bodyTextRow
                .append('div')
                .attr('class', 'main-col sep-top');

            var bodyTextArea = bodyBodyCol
                .append('div')
                .attr('class', 'body-text');

            bodyTextArea.text(panel.message);
        }
    }

    function panelToDraw() {

        var mode = context.mode();

        if (mode.id === 'save') {

            return panelSave(context);

        } else if (mode.id === 'add-point' || mode.id === 'add-line' ||
            mode.id === 'add-area' || mode.id === 'draw-line' ||
            mode.id === 'draw-area') {

            return panelAddDrawGeometry(context, mode);

        } else if (mode.id === 'select') {

            var selectedIDs = mode.selectedIDs();
            if (selectedIDs.length === 1) {
                return panelSelectSingle(context, selectedIDs[0]);
            }
            return panelSelectMultiple(context, selectedIDs);

        } else if (!didEditAnythingYet) {

            if (savedChangeset) {
                return panelSuccess(context);
            }
            if (context.history().hasRestorableChanges()) {
                return panelRestore(context);
            }
            return panelWelcome(context);
        }

        scheduleCurrentLocationUpdate();
        return panelMapping(context);
    }

    function redraw() {
        if (container.empty()) return;

        var mode = context.mode();
        if (!mode || !mode.id) return;

        if (mode.id !== 'browse') {
            updateDidEditStatus();
        }

        drawPanel(panelToDraw());
    }

    function scheduleCurrentLocationUpdate() {
        debouncedGetLocation(context.map().center(), context.map().zoom(), function(placeName) {
            currLocation = placeName ? placeName : defaultLoc;
            container.selectAll('.map-center-location')
                .text(currLocation);
        });
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

    assistant.didSaveChangset = function(changeset, count) {
        savedChangeset = changeset;
        savedChangeCount = count;
        didEditAnythingYet = false;
        redraw();
    };

    return assistant;

    function panelWelcome(context) {

        var panel = {
            prominent: true,
            theme: 'light',
            headerIcon: utilGreetingIcon(),
            title: utilTimeOfDayGreeting()
        };

        panel.renderHeaderBody = function(selection) {

            var bodyTextArea = selection
                .append('div')
                .attr('class', 'body-text');

            var mainFooter = selection.append('div')
                .attr('class', 'main-footer');

            bodyTextArea.html(t('assistant.welcome.' + (isFirstSession ? 'first_time' : 'return')));
            bodyTextArea.selectAll('a')
                .attr('href', '#')
                .on('click', function() {
                    isFirstSession = false;
                    updateDidEditStatus();
                    context.container().call(uiIntro(context));
                    redraw();
                });

            mainFooter.append('button')
                .attr('class', 'primary')
                .on('click', function() {
                    updateDidEditStatus();
                    redraw();
                })
                .append('span')
                .text(t('assistant.welcome.start_mapping'));
        };

        return panel;
    }

    function panelRestore(context) {

        var panel = {
            prominent: true,
            theme: 'light',
            headerIcon: utilGreetingIcon(),
            title: utilTimeOfDayGreeting()
        };

        panel.renderHeaderBody = function(selection) {

            var bodyTextArea = selection
                .append('div')
                .attr('class', 'body-text');

            var mainFooter = selection
                .append('div')
                .attr('class', 'main-footer');

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
                    selection.selectAll('.restore-location')
                        .text(placeName);
                }
            });

            mainFooter.append('button')
                .attr('class', 'primary')
                .on('click', function() {
                    updateDidEditStatus();
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
        };

        return panel;
    }

    function panelMapping() {

        var panel = {
            headerIcon: 'fas-map-marked-alt',
            modeLabel: t('assistant.mode.mapping'),
            title: currLocation,
            titleClass: 'map-center-location'
        };

        panel.renderBody = function(selection) {
            selection
                .append('div')
                .attr('class', 'feature-list-pane')
                .call(featureSearch);
        };

        return panel;
    }

    function panelAddDrawGeometry(context, mode) {

        var icon;
        if (mode.id.indexOf('point') !== -1) {
            icon = 'iD-icon-point';
        } else if (mode.id.indexOf('line') !== -1) {
            icon = 'iD-icon-line';
        } else {
            icon = 'iD-icon-area';
        }

        var modeLabelID;
        if (mode.id.indexOf('add') !== -1) {
            modeLabelID = 'adding';
        } else {
            modeLabelID = 'drawing';
        }

        var panel = {
            headerIcon: icon,
            modeLabel: t('assistant.mode.' + modeLabelID),
            title: mode.title,
            message: t('assistant.instructions.' + mode.id.replace('-', '_'))
        };

        return panel;
    }

    function panelSelectSingle(context, id) {

        var entity = context.entity(id);
        var geometry = entity.geometry(context.graph());
        var preset = context.presets().match(entity, context.graph());

        var panel = {
            theme: 'light',
            modeLabel: t('assistant.mode.editing'),
            title: utilDisplayLabel(entity, context)
        };

        panel.renderHeaderIcon = function(selection) {
            selection.call(uiPresetIcon(context)
                .geometry(geometry)
                .preset(preset)
                .sizeClass('small')
                .pointMarker(false));
        };

        panel.renderBody = function(selection) {
            entityEditor
                .state('select')
                .entityID(id);
            selection.call(entityEditor);
        };

        return panel;
    }

    function panelSelectMultiple(context, selectedIDs) {

        var panel = {
            headerIcon: 'fas-edit',
            modeLabel: t('assistant.mode.editing'),
            title: t('assistant.feature_count.multiple', { count: selectedIDs.length.toString() })
        };

        panel.renderBody = function() {
            var selectionList = uiSelectionList(context, selectedIDs);
            body
                .call(selectionList);
        };

        return panel;
    }

    function panelSave(context) {

        var summary = context.history().difference().summary();
        var titleID = summary.length === 1 ? 'change' : 'changes';

        var panel = {
            theme: 'light',
            headerIcon: 'iD-icon-save',
            modeLabel: t('assistant.mode.saving'),
            title: t('commit.' + titleID, { count: summary.length })
        };

        return panel;
    }

    function panelSuccess(context) {

        var savedIcon;
        if (savedChangeCount <= 25) {
            savedIcon = 'fas-smile-beam';
        } else if (savedChangeCount <= 50) {
            savedIcon = 'fas-grin-beam';
        } else {
            savedIcon = 'fas-laugh-beam';
        }

        var panel = {
            prominent: true,
            theme: 'light',
            headerIcon: savedIcon,
            title: t('assistant.commit.success.thank_you')
        };

        panel.renderHeaderBody = function(selection) {

            var bodyTextArea = selection
                .append('div')
                .attr('class', 'body-text');

            var mainFooter = selection.append('div')
                .attr('class', 'main-footer');

            bodyTextArea.html(
                '<b>' + t('assistant.commit.success.just_improved', { location: currLocation }) + '</b>' +
                '<br/>'
            );

            var link = bodyTextArea
                .append('span')
                .text(t('assistant.commit.success.propagation_help'))
                .append('a')
                .attr('class', 'link-out')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .attr('href', t('success.help_link_url'));

            link.append('span')
                .text(' ' + t('success.help_link_text'));

            link
                .call(svgIcon('#iD-icon-out-link', 'inline'));

            mainFooter.append('button')
                .attr('class', 'primary')
                .on('click', function() {
                    updateDidEditStatus();
                    redraw();
                })
                .append('span')
                .text(t('assistant.commit.keep_mapping'));
        };

        panel.renderBody = function(selection) {

            var success = uiSuccess(context).changeset(savedChangeset);
            selection.call(success);
        };

        return panel;
    }
}
