import { t } from '../util/locale';
import { svgIcon } from '../svg';


export function uiKeepRightHeader(context) {
    var _error;


    function getEntityLink() {

        var url = context.connection().entityURL(context.entity(_error.object_id));
    }


    function keepRightHeader(selection) {
        var header = selection.selectAll('.kr_error-header')
            .data(
                (_error ? [_error] : []),
                function(d) { return d.id; }
            );

        header.exit()
            .remove();

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'kr_error-header');

        var iconEnter = headerEnter
            .append('div')
            .attr('class', function(d) { return 'kr_error-header-icon '; })
            .classed('new', function(d) { return d.id < 0; });

        iconEnter
            .append('div')
            .attr('class', function(d) {
                return 'preset-icon-28 kr_error kr_error-' + d.id + ' kr_error_type_' + d.error_type;
            })

            .call(svgIcon('#iD-icon-bolt', 'kr_error-fill'));

        headerEnter
            .append('div')
            .attr('class', 'kr_error-header-label')
            .text(function(d) {
                return t('keepRight.entities.' + d.object_type + ' ');
            })
            .append('span')
            // .attr('href', getEntityLink()) // TODO: add / remove link if entity is/isn't in the graph
            .text(function(d) { return d.object_id; });
    }


    keepRightHeader.error = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return keepRightHeader;
    };


    return keepRightHeader;
}
