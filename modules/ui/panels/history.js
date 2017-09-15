import _ from 'lodash';
import { t } from '../../util/locale';
import { svgIcon } from '../../svg';


export function uiPanelHistory(context) {
    var osm;

    function displayTimestamp(entity) {
        if (!entity.timestamp) return t('info_panels.history.unknown');

        var d = new Date(entity.timestamp);
        if (isNaN(d.getTime())) return t('info_panels.history.unknown');

        return d.toLocaleString();
    }


    function displayUser(selection, entity) {
        if (!entity.user) {
            selection
                .append('span')
                .text(t('info_panels.history.unknown'));
            return;
        }

        selection
            .append('span')
            .attr('class', 'user-name')
            .text(entity.user);

        var links = selection
            .append('div')
            .attr('class', 'links');

        if (osm) {
            links
                .append('a')
                .attr('class', 'user-osm-link')
                .attr('href', osm.userURL(entity.user))
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .text('OSM');
        }

        links
            .append('a')
            .attr('class', 'user-hdyc-link')
            .attr('href', 'https://hdyc.neis-one.org/?' + entity.user)
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .text('HDYC');
    }


    function displayChangeset(selection, entity) {
        if (!entity.changeset) {
            selection
                .append('span')
                .text(t('info_panels.history.unknown'));
            return;
        }

        selection
            .append('span')
            .attr('class', 'changeset-id')
            .text(entity.changeset);

        var links = selection
            .append('div')
            .attr('class', 'links');

        if (osm) {
            links
                .append('a')
                .attr('class', 'changeset-osm-link')
                .attr('href', osm.changesetURL(entity.changeset))
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .text('OSM');
        }

        links
            .append('a')
            .attr('class', 'changeset-osmcha-link')
            .attr('href', 'https://osmcha.mapbox.com/changesets/' + entity.changeset)
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .text('OSMCha');
    }


    function redraw(selection) {
        var selected = _.filter(context.selectedIDs(), function(e) { return context.hasEntity(e); }),
            singular = selected.length === 1 ? selected[0] : null;

        osm = context.connection();

        selection.html('');

        selection
            .append('h4')
            .attr('class', 'history-heading')
            .text(singular || t('info_panels.history.selected', { n: selected.length }));

        if (!singular) return;

        var entity = context.entity(singular);

        var list = selection
            .append('ul');

        list
            .append('li')
            .text(t('info_panels.history.version') + ': ' + entity.version);

        list
            .append('li')
            .text(t('info_panels.history.last_edit') + ': ' + displayTimestamp(entity));

        list
            .append('li')
            .text(t('info_panels.history.edited_by') + ': ')
            .call(displayUser, entity);

        list
            .append('li')
            .text(t('info_panels.history.changeset') + ': ')
            .call(displayChangeset, entity);

        if (osm) {
            selection
                .append('a')
                .attr('class', 'view-history-on-osm')
                .attr('target', '_blank')
                .attr('tabindex', -1)
                .attr('href', osm.historyURL(entity))
                .call(svgIcon('#icon-out-link', 'inline'))
                .append('span')
                .text(t('info_panels.history.link_text'));
        }
    }


    var panel = function(selection) {
        selection.call(redraw);

        context.map()
            .on('drawn.info-history', function() {
                selection.call(redraw);
            });
    };

    panel.off = function() {
        context.map()
            .on('drawn.info-history', null);
    };

    panel.id = 'history';
    panel.title = t('info_panels.history.title');
    panel.key = t('info_panels.history.key');


    return panel;
}
