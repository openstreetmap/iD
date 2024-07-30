import { t, localizer } from '../../core/localizer';
import { svgIcon } from '../../svg';


export function uiPanelHistory(context) {
    var osm;

    function displayTimestamp(timestamp) {
        if (!timestamp) return t('info_panels.history.unknown');
        var options = {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric'
        };
        var d = new Date(timestamp);
        if (isNaN(d.getTime())) return t('info_panels.history.unknown');
        return d.toLocaleString(localizer.localeCode(), options);
    }


    function displayUser(selection, userName) {
        if (!userName) {
            selection
                .append('span')
                .call(t.append('info_panels.history.unknown'));
            return;
        }

        selection
            .append('span')
            .attr('class', 'user-name')
            .text(userName);

        var links = selection
            .append('div')
            .attr('class', 'links');

        if (osm) {
            links
                .append('a')
                .attr('class', 'user-osm-link')
                .attr('href', osm.userURL(userName))
                .attr('target', '_blank')
                .call(t.append('info_panels.history.profile_link'));
        }

        links
            .append('a')
            .attr('class', 'user-hdyc-link')
            .attr('href', 'https://hdyc.neis-one.org/?' + userName)
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .text('HDYC');
    }


    function displayChangeset(selection, changeset) {
        if (!changeset) {
            selection
                .append('span')
                .call(t.append('info_panels.history.unknown'));
            return;
        }

        selection
            .append('span')
            .attr('class', 'changeset-id')
            .text(changeset);

        var links = selection
            .append('div')
            .attr('class', 'links');

        if (osm) {
            links
                .append('a')
                .attr('class', 'changeset-osm-link')
                .attr('href', osm.changesetURL(changeset))
                .attr('target', '_blank')
                .call(t.append('info_panels.history.changeset_link'));
        }

        links
            .append('a')
            .attr('class', 'changeset-osmcha-link')
            .attr('href', 'https://osmcha.org/changesets/' + changeset)
            .attr('target', '_blank')
            .text('OSMCha');

        links
            .append('a')
            .attr('class', 'changeset-achavi-link')
            .attr('href', 'https://overpass-api.de/achavi/?changeset=' + changeset)
            .attr('target', '_blank')
            .text('Achavi');
    }


    function redraw(selection) {
        var selectedNoteID = context.selectedNoteID();
        osm = context.connection();
        var selected, note, entity;
        if (selectedNoteID && osm) {       // selected 1 note
            selected = [ t.html('note.note') + ' ' + selectedNoteID ];
            note = osm.getNote(selectedNoteID);
        } else {                           // selected 1..n entities
            selected = context.selectedIDs()
                .filter(function(e) { return context.hasEntity(e); });
            if (selected.length) {
                entity = context.entity(selected[0]);
            }
        }

        var singular = selected.length === 1 ? selected[0] : null;

        selection.html('');

        if (singular) {
            selection
                .append('h4')
                .attr('class', 'history-heading')
                .html(singular);
        } else {
            selection
                .append('h4')
                .attr('class', 'history-heading')
                .call(t.append('info_panels.selected', { n: selected.length }));
        }

        if (!singular) return;

        if (entity) {
            selection.call(redrawEntity, entity);
        } else if (note) {
            selection.call(redrawNote, note);
        }
    }


    function redrawNote(selection, note) {
        if (!note || note.isNew()) {
            selection
                .append('div')
                .call(t.append('info_panels.history.note_no_history'));
            return;
        }

        var list = selection
            .append('ul');

        list
            .append('li')
            .call(t.append('info_panels.history.note_comments', { suffix: ':' }))
            .append('span')
            .text(note.comments.length);

        if (note.comments.length) {
            list
                .append('li')
                .call(t.append('info_panels.history.note_created_date', { suffix: ':' }))
                .append('span')
                .text(displayTimestamp(note.comments[0].date));

            list
                .append('li')
                .call(t.append('info_panels.history.note_created_user', { suffix: ':' }))
                .call(displayUser, note.comments[0].user);
        }

        if (osm) {
            selection
                .append('a')
                .attr('class', 'view-history-on-osm')
                .attr('target', '_blank')
                .attr('href', osm.noteURL(note))
                .call(svgIcon('#iD-icon-out-link', 'inline'))
                .append('span')
                .call(t.append('info_panels.history.note_link_text'));
        }
    }


    function redrawEntity(selection, entity) {
        if (!entity || entity.isNew()) {
            selection
                .append('div')
                .call(t.append('info_panels.history.no_history'));
            return;
        }

        var links = selection
            .append('div')
            .attr('class', 'links');

        if (osm) {
            links
                .append('a')
                .attr('class', 'view-history-on-osm')
                .attr('href', osm.historyURL(entity))
                .attr('target', '_blank')
                .call(t.append('info_panels.history.history_link'));
        }
        links
            .append('a')
            .attr('class', 'pewu-history-viewer-link')
            .attr('href', 'https://pewu.github.io/osm-history/#/' + entity.type + '/' + entity.osmId())
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .text('PeWu');

        var list = selection
            .append('ul');

        list
            .append('li')
            .call(t.append('info_panels.history.version', { suffix: ':' }))
            .append('span')
            .text(entity.version);

        list
            .append('li')
            .call(t.append('info_panels.history.last_edit', { suffix: ':' }))
            .append('span')
            .text(displayTimestamp(entity.timestamp));

        list
            .append('li')
            .call(t.append('info_panels.history.edited_by', { suffix: ':' }))
            .call(displayUser, entity.user);

        list
            .append('li')
            .call(t.append('info_panels.history.changeset', { suffix: ':' }))
            .call(displayChangeset, entity.changeset);
    }


    var panel = function(selection) {
        selection.call(redraw);

        context.map()
            .on('drawn.info-history', function() {
                selection.call(redraw);
            });

        context
            .on('enter.info-history', function() {
                selection.call(redraw);
            });
    };

    panel.off = function() {
        context.map().on('drawn.info-history', null);
        context.on('enter.info-history', null);
    };

    panel.id = 'history';
    panel.label = t.append('info_panels.history.title');
    panel.key = t('info_panels.history.key');


    return panel;
}
