import { osmEntity, osmNote } from '../osm';
import { svgIcon } from '../svg/icon';

/** @param {Date} date @returns {string} */
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const s = n => Math.floor(seconds / n);

    if (s(60*60*24*365) > 1) return s(60*60*24*365) + ' years';
    if (s(60*60*24*30) > 1) return s(60*60*24*30) + ' months';
    if (s(60*60*24) > 1) return s(60*60*24) + ' days';
    if (s(60*60) > 1) return s(60*60) + ' hours';
    if (s(60) > 1) return s(60) + ' minutes';
    return s(1) + ' seconds';
}

export function uiViewOnOSM(context) {
    var _what;   // an osmEntity or osmNote


    function viewOnOSM(selection) {
        var url;
        if (_what instanceof osmEntity) {
            url = context.connection().entityURL(_what);
        } else if (_what instanceof osmNote) {
            url = context.connection().noteURL(_what);
        }

        var data = ((!_what || _what.isNew()) ? [] : [_what]);
        var link = selection.selectAll('.view-on-osm')
            .data(data, function(d) { return d.id; });

        // exit
        link.exit()
            .remove();

        // enter
        var linkEnter = link.enter()
            .append('a')
            .attr('class', 'view-on-osm')
            .attr('target', '_blank')
            .attr('href', url)
            .call(svgIcon('#iD-icon-out-link', 'inline'));

        linkEnter
            .append('span')
            .text(`Last modified ${timeSince(new Date(_what.timestamp))} ago by ${_what.user}`);
    }


    viewOnOSM.what = function(_) {
        if (!arguments.length) return _what;
        _what = _;
        return viewOnOSM;
    };

    return viewOnOSM;
}
