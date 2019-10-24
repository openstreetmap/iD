import { utilFunctor } from './util';
import { popover } from './popover';

export function tooltip(klass) {

    var tooltip = popover((klass || '') + ' tooltip')
        .displayType('hover');

    var _title = function() {
        var title = this.getAttribute('data-original-title');
        if (title) {
            return title;
        } else {
            title = this.getAttribute('title');
            this.removeAttribute('title');
            this.setAttribute('data-original-title', title);
        }
        return title;
    };
    var _html = utilFunctor(false);


    tooltip.title = function(val) {
        if (arguments.length) {
            _title = utilFunctor(val);
            return tooltip;
        } else {
            return _title;
        }
    };


    tooltip.html = function(val) {
        if (arguments.length) {
            _html = utilFunctor(val);
            return tooltip;
        } else {
            return _html;
        }
    };

    tooltip.content(function() {
        var content = _title.apply(this, arguments);
        var markup = _html.apply(this, arguments);

        return function(selection) {
            selection[markup ? 'html' : 'text'](content);
        };
    });

    return tooltip;
}
