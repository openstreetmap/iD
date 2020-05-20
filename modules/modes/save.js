import { event as d3_event, select as d3_select } from 'd3-selection';
import { t } from '../core/localizer';

import { modeBrowse } from './browse';
import { services } from '../services';
import { uiConflicts } from '../ui/conflicts';
import { uiConfirm } from '../ui/confirm';
import { uiCommit } from '../ui/commit';
import { uiSuccess } from '../ui/success';
import { utilKeybinding } from '../util';


export function modeSave(context) {
    var mode = { id: 'save' };
    var keybinding = utilKeybinding('modeSave');

    var commit = uiCommit(context)
        .on('cancel', cancel);
    var _conflictsUi; // uiConflicts

    var _location;
    var _success;

    var uploader = context.uploader()
        .on('saveStarted.modeSave', function() {
            keybindingOff();
        })
        // fire off some async work that we want to be ready later
        .on('willAttemptUpload.modeSave', prepareForSuccess)
        .on('progressChanged.modeSave', showProgress)
        .on('resultNoChanges.modeSave', function() {
            cancel();
        })
        .on('resultErrors.modeSave', showErrors)
        .on('resultConflicts.modeSave', showConflicts)
        .on('resultSuccess.modeSave', showSuccess);


    function cancel() {
        context.enter(modeBrowse(context));
    }


    function showProgress(num, total) {
        var modal = context.container().select('.loading-modal .modal-section');
        var progress = modal.selectAll('.progress')
            .data([0]);

        // enter/update
        progress.enter()
            .append('div')
            .attr('class', 'progress')
            .merge(progress)
            .text(t('save.conflict_progress', { num: num, total: total }));
    }


    function showConflicts(changeset, conflicts, origChanges) {

        var selection = context.container()
            .select('.sidebar')
            .append('div')
            .attr('class','sidebar-component');

        context.container().selectAll('.main-content')
            .classed('active', true)
            .classed('inactive', false);

        _conflictsUi = uiConflicts(context)
            .conflictList(conflicts)
            .origChanges(origChanges)
            .on('cancel', function() {
                context.container().selectAll('.main-content')
                    .classed('active', false)
                    .classed('inactive', true);
                selection.remove();
                keybindingOn();

                uploader.cancelConflictResolution();
            })
            .on('save', function() {
                context.container().selectAll('.main-content')
                    .classed('active', false)
                    .classed('inactive', true);
                selection.remove();

                uploader.processResolvedConflicts(changeset);
            });

        selection.call(_conflictsUi);
    }


    function showErrors(errors) {
        keybindingOn();

        var selection = uiConfirm(context.container());
        selection
            .select('.modal-section.header')
            .append('h3')
            .text(t('save.error'));

        addErrors(selection, errors);
        selection.okButton();
    }


    function addErrors(selection, data) {
        var message = selection
            .select('.modal-section.message-text');

        var items = message
            .selectAll('.error-container')
            .data(data);

        var enter = items.enter()
            .append('div')
            .attr('class', 'error-container');

        enter
            .append('a')
            .attr('class', 'error-description')
            .attr('href', '#')
            .classed('hide-toggle', true)
            .text(function(d) { return d.msg || t('save.unknown_error_details'); })
            .on('click', function() {
                d3_event.preventDefault();

                var error = d3_select(this);
                var detail = d3_select(this.nextElementSibling);
                var exp = error.classed('expanded');

                detail.style('display', exp ? 'none' : 'block');
                error.classed('expanded', !exp);
            });

        var details = enter
            .append('div')
            .attr('class', 'error-detail-container')
            .style('display', 'none');

        details
            .append('ul')
            .attr('class', 'error-detail-list')
            .selectAll('li')
            .data(function(d) { return d.details || []; })
            .enter()
            .append('li')
            .attr('class', 'error-detail-item')
            .text(function(d) { return d; });

        items.exit()
            .remove();
    }


    function showSuccess(changeset) {
        commit.reset();

        var ui = _success
            .changeset(changeset)
            .location(_location)
            .on('cancel', function() { context.ui().sidebar.hide(); });

        context.enter(modeBrowse(context).sidebar(ui));
    }


    function keybindingOn() {
        d3_select(document)
            .call(keybinding.on('⎋', cancel, true));
    }


    function keybindingOff() {
        d3_select(document)
            .call(keybinding.unbind);
    }


    // Reverse geocode current map location so we can display a message on
    // the success screen like "Thank you for editing around place, region."
    function prepareForSuccess() {
        _success = uiSuccess(context);
        _location = null;
        if (!services.geocoder) return;

        services.geocoder.reverse(context.map().center(), function(err, result) {
            if (err || !result || !result.address) return;

            var addr = result.address;
            var place = (addr && (addr.town || addr.city || addr.county)) || '';
            var region = (addr && (addr.state || addr.country)) || '';
            var separator = (place && region) ? t('success.thank_you_where.separator') : '';

            _location = t('success.thank_you_where.format',
                { place: place, separator: separator, region: region }
            );
        });
    }


    mode.selectedIDs = function() {
        return _conflictsUi ? _conflictsUi.shownEntityIds() : [];
    };


    mode.enter = function() {
        // Show sidebar
        context.ui().sidebar.expand();

        function done() {
            context.ui().sidebar.show(commit);
        }

        keybindingOn();

        context.container().selectAll('.main-content')
            .classed('active', false)
            .classed('inactive', true);

        var osm = context.connection();
        if (!osm) {
            cancel();
            return;
        }

        if (osm.authenticated()) {
            done();
        } else {
            osm.authenticate(function(err) {
                if (err) {
                    cancel();
                } else {
                    done();
                }
            });
        }
    };


    mode.exit = function() {

        keybindingOff();

        context.container().selectAll('.main-content')
            .classed('active', true)
            .classed('inactive', false);

        context.ui().sidebar.hide();
    };

    return mode;
}
