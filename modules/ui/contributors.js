import { debounce } from 'es-toolkit';

import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import { svgIcon } from '../svg/index';


export function uiContributors(context) {
    var osm = context.connection(),
        debouncedUpdate = debounce(function() { update(); }, 1000),
        limit = 4,
        hidden = false,
        wrap = d3_select(null);


    function update() {
        if (!osm) return;

        var users = {},
            entities = context.history().intersects(context.map().extent());

        entities.forEach(function(entity) {
            if (entity && entity.user) users[entity.user] = true;
        });

        var u = Object.keys(users),
            subset = u.slice(0, u.length > limit ? limit - 1 : limit);

        wrap.html('')
            .call(svgIcon('#iD-icon-nearby', 'pre-text light'));

        const userList = selection => selection.selectAll()
            .data(subset)
            .enter()
            .append('a')
            .attr('class', 'user-link')
            .attr('href', d => osm.userURL(d))
            .attr('target', '_blank')
            .text(String);

        if (u.length > limit) {
            var othersNum = u.length - limit + 1;

            const count = selection => selection
                .append('a')
                .attr('target', '_blank')
                .attr('href', () => osm.changesetsURL(context.map().center(), context.map().zoom()))
                .text(othersNum);

            wrap.append('span')
                .call(t.append('contributors.truncated_list', { n: othersNum, users: userList, count }));

        } else {
            wrap.append('span')
                .call(t.append('contributors.list', { users: userList }));
        }

        if (!u.length) {
            hidden = true;
            wrap
                .transition()
                .style('opacity', 0);

        } else if (hidden) {
            wrap
                .transition()
                .style('opacity', 1);
        }
    }


    return function(selection) {
        if (!osm) return;
        wrap = selection;
        update();

        osm.on('loaded.contributors', debouncedUpdate);
        context.map().on('move.contributors', debouncedUpdate);
    };
}
