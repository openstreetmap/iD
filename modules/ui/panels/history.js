import * as d3 from 'd3';
import _ from 'lodash';
import { t } from '../../util/locale';
import { svgIcon } from '../../svg';


export function uiPanelHistory(context) {


    function displayTimestamp(entity) {
        if (!entity.timestamp) return t('infobox.history.unknown');

        var d = new Date(entity.timestamp);
        if (isNaN(d.getTime())) return t('infobox.history.unknown');

        return d.toLocaleString();
    }


    function displayUser(selection, entity) {
        if (!entity.user) {
            selection
                .append('span')
                .text(t('infobox.history.unknown'));
            return;
        }

        selection
            .append('span')
            .attr('class', 'user-name')
            .text(entity.user);

        var links = selection
            .append('div')
            .attr('class', 'links');

        links
            .append('a')
            .attr('class', 'user-osm-link')
            .attr('href', context.connection().userURL(entity.user))
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .text('OSM');

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
                .text(t('infobox.history.unknown'));
            return;
        }

        selection
            .append('span')
            .attr('class', 'changeset-id')
            .text(entity.changeset);

        var links = selection
            .append('div')
            .attr('class', 'links');

        links
            .append('a')
            .attr('class', 'changeset-osm-link')
            .attr('href', context.connection().changesetURL(entity.changeset))
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .text('OSM');

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

        selection.html('');

        selection
            .append('h4')
            .attr('class', 'history-heading')
            .text(singular || t('infobox.history.selected', { n: selected.length }));

        if (!singular) return;

        var entity = context.entity(singular);

        var list = selection
            .append('ul');

        list
            .append('li')
            .text(t('infobox.history.version') + ': ' + entity.version);

        list
            .append('li')
            .text(t('infobox.history.last_edit') + ': ' + displayTimestamp(entity));

        list
            .append('li')
            .text(t('infobox.history.edited_by') + ': ')
            .call(displayUser, entity);

        list
            .append('li')
            .text(t('infobox.history.changeset') + ': ')
            .call(displayChangeset, entity);

        selection
            .append('a')
            .attr('class', 'view-history-on-osm')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .attr('href', context.connection().historyURL(entity))
            .call(svgIcon('#icon-out-link', 'inline'))
            .append('span')
            .text(t('infobox.history.link_text'));
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
    panel.title = t('infobox.history.title');
    panel.key = t('infobox.history.key');


    return panel;
}
