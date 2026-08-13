import { timeout as d3_timeout, type Timer } from 'd3-timer';

export interface uiFlash {
    (): d3.Selection<HTMLDivElement>;
    duration: GetSet<uiFlash, number>;
    label: GetSet<uiFlash, string | d3.Selector>;
    iconName: GetSet<uiFlash, string>;
    iconClass: GetSet<uiFlash, string>;
}

export function uiFlash(context: iD.Context) {
    var _flashTimer: Timer | null;

    var _duration = 2000;
    var _iconName = '#iD-icon-no';
    var _iconClass = 'disabled';
    var _label = (s: d3.Selection<HTMLDivElement>) => s.text('');

    const flash: uiFlash = function() {
        if (_flashTimer) {
            _flashTimer.stop();
        }

        context.container().select('.main-footer-wrap')
            .classed('footer-hide', true)
            .classed('footer-show', false);
        context.container().select('.flash-wrap')
            .classed('footer-hide', false)
            .classed('footer-show', true);

        var content = context.container().select('.flash-wrap').selectAll<HTMLDivElement, 0>('.flash-content')
            .data([0]);

        // Enter
        var contentEnter = content.enter()
            .append('div')
            .attr('class', 'flash-content');

        var iconEnter = contentEnter
            .append('svg')
            .attr('class', 'flash-icon icon')
            .append('g')
            .attr('transform', 'translate(10,10)');

        iconEnter
            .append('circle')
            .attr('r', 9);

        iconEnter
            .append('use')
            .attr('transform', 'translate(-7,-7)')
            .attr('width', '14')
            .attr('height', '14');

        contentEnter
            .append('div')
            .attr('class', 'flash-text');


        // Update
        content = content
            .merge(contentEnter);

        content
            .selectAll('.flash-icon')
            .attr('class', 'icon flash-icon ' + (_iconClass || ''));

        content
            .selectAll('.flash-icon use')
            .attr('xlink:href', _iconName);

        content
            .selectAll<HTMLDivElement, void>('.flash-text')
            .attr('class', 'flash-text')
            .call(_label);


        _flashTimer = d3_timeout(function() {
            _flashTimer = null;
            context.container().select('.main-footer-wrap')
                .classed('footer-hide', false)
                .classed('footer-show', true);
            context.container().select('.flash-wrap')
                .classed('footer-hide', true)
                .classed('footer-show', false);
        }, _duration);

        return content;
    };


    flash.duration = function(_) {
        if (!arguments.length) return _duration;
        _duration = _;
        return flash;
    } as uiFlash['duration'];

    flash.label = function(_) {
        if (!arguments.length) return _label;
        if (typeof _ !== 'function') {
            _label = selection => selection.text(_);
        } else {
            _label = selection => selection.text('').call(_);
        }
        return flash;
    } as uiFlash['label'];

    flash.iconName = function(_) {
        if (!arguments.length) return _iconName;
        _iconName = _;
        return flash;
    } as uiFlash['iconName'];

    flash.iconClass = function(_) {
        if (!arguments.length) return _iconClass;
        _iconClass = _;
        return flash;
    } as uiFlash['iconClass'];

    return flash;
}
