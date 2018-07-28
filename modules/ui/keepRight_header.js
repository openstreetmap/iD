import { t } from '../util/locale';
import { svgIcon } from '../svg';


export function uiKeepRightHeader() {
    var _error;


    function keepRightHeader(selection) {
        var header = selection.selectAll('.kr_error-header')
            .data(
                (_error ? [_error] : []),
                function(d) { return d.status + d.id; }
            );

        header.exit()
            .remove();

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'kr_error-header');

        var iconEnter = headerEnter
            .append('div')
            .attr('class', function(d) { return 'kr_error-header-icon ' + d.status; })
            .classed('new', function(d) { return d.id < 0; });

        iconEnter
            .append('div')
            .attr('class', 'preset-icon-28')
            .call(svgIcon('#iD-icon-note', 'note-fill')); // TODO: change classes

        headerEnter
            .append('div')
            .attr('class', 'kr_error-header-label')
            .text(function(d) {
                return t('keepRight.keepRight') + ' ' + d.object_type + ' ' + ' ' + d.error_id;
            });
    }


    keepRightHeader.error = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return keepRightHeader;
    };


    return keepRightHeader;
}
