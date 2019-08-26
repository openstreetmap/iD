import { select as d3_select } from 'd3-selection';
import { timeout as d3_timeout } from 'd3-timer';

var _flashTimer;


export function uiFlash() {
    var _duration = 2000;
    var _iconName = '#iD-icon-no';
    var _iconClass = 'disabled';
    var _text = '';
    var _textClass;


    function flash() {
        if (_flashTimer) {
            _flashTimer.stop();
        }

        d3_select('#footer-wrap')
            .attr('class', 'footer-hide');
        d3_select('#flash-wrap')
            .attr('class', 'footer-show');

        var content = d3_select('#flash-wrap').selectAll('.flash-content')
            .data([0]);

        // Enter
        var contentEnter = content.enter()
            .append('div')
            .attr('class', 'flash-content');

        var iconEnter = contentEnter
            .append('svg')
            .attr('class', 'flash-icon')
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
            .attr('class', 'flash-icon ' + (_iconClass || ''));

        content
            .selectAll('.flash-icon use')
            .attr('xlink:href', _iconName);

        content
            .selectAll('.flash-text')
            .attr('class', 'flash-text ' + (_textClass || ''))
            .text(_text);


        _flashTimer = d3_timeout(function() {
            _flashTimer = null;
            d3_select('#footer-wrap')
                .attr('class', 'footer-show');
            d3_select('#flash-wrap')
                .attr('class', 'footer-hide');
        }, _duration);

        return content;
    }


    flash.duration = function(_) {
        if (!arguments.length) return _duration;
        _duration = _;
        return flash;
    };

    flash.text = function(_) {
        if (!arguments.length) return _text;
        _text = _;
        return flash;
    };

    flash.textClass = function(_) {
        if (!arguments.length) return _textClass;
        _textClass = _;
        return flash;
    };

    flash.iconName = function(_) {
        if (!arguments.length) return _iconName;
        _iconName = _;
        return flash;
    };

    flash.iconClass = function(_) {
        if (!arguments.length) return _iconClass;
        _iconClass = _;
        return flash;
    };

    return flash;
}
