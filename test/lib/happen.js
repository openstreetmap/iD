!(function(context, $) {
    var h = {};

    // Make inheritance bearable: clone one level of properties
    function extend(child, parent) {
        for (var property in parent) {
            if (typeof child[property] == 'undefined') {
                child[property] = parent[property];
            }
        }
        return child;
    }

    h.once = function(x, o) {
        var evt;

        if (o.type.slice(0, 3) === 'key') {
            if (typeof Event === 'function') {
                evt = new Event(o.type);
                evt.keyCode = o.keyCode || 0;
                evt.charCode = o.charCode || 0;
                evt.shiftKey = o.shiftKey || false;
                evt.metaKey = o.metaKey || false;
                evt.ctrlKey = o.ctrlKey || false;
                evt.altKey = o.altKey || false;
            } else {
                evt = document.createEvent('KeyboardEvent');
                // https://developer.mozilla.org/en/DOM/event.initKeyEvent
                // https://developer.mozilla.org/en/DOM/KeyboardEvent
                evt[(evt.initKeyEvent) ? 'initKeyEvent'
                    : 'initKeyboardEvent'](
                    o.type, //  in DOMString typeArg,
                    true,   //  in boolean canBubbleArg,
                    true,   //  in boolean cancelableArg,
                    null,   //  in nsIDOMAbstractView viewArg,  Specifies UIEvent.view. This value may be null.
                    o.ctrlKey || false,  //  in boolean ctrlKeyArg,
                    o.altKey || false,  //  in boolean altKeyArg,
                    o.shiftKey || false,  //  in boolean shiftKeyArg,
                    o.metaKey || false,  //  in boolean metaKeyArg,
                    o.keyCode || 0,     //  in unsigned long keyCodeArg,
                    o.charCode || 0       //  in unsigned long charCodeArg);
                );

                // Workaround for https://bugs.webkit.org/show_bug.cgi?id=16735
                if (evt.ctrlKey != (o.ctrlKey || 0) ||
                  evt.altKey != (o.altKey || 0) ||
                  evt.shiftKey != (o.shiftKey || 0) ||
                  evt.metaKey != (o.metaKey || 0) ||
                  evt.keyCode != (o.keyCode || 0) ||
                  evt.charCode != (o.charCode || 0)) {
                    evt = document.createEvent('Event');
                    evt.initEvent(o.type, true, true);
                    evt.ctrlKey  = o.ctrlKey || false;
                    evt.altKey   = o.altKey || false;
                    evt.shiftKey = o.shiftKey || false;
                    evt.metaKey  = o.metaKey || false;
                    evt.keyCode  = o.keyCode || 0;
                    evt.charCode = o.charCode || 0;
                }
            }
        } else {
            evt = document.createEvent('MouseEvents');
            // https://developer.mozilla.org/en/DOM/event.initMouseEvent
            evt.initMouseEvent(o.type,
                true, // canBubble
                true, // cancelable
                window, // 'AbstractView'
                o.clicks || 0, // click count
                o.screenX || 0, // screenX
                o.screenY || 0, // screenY
                o.clientX || 0, // clientX
                o.clientY || 0, // clientY
                o.ctrlKey || 0, // ctrl
                o.altKey || false, // alt
                o.shiftKey || false, // shift
                o.metaKey || false, // meta
                o.button || false, // mouse button
                null // relatedTarget
            );
        }

        x.dispatchEvent(evt);
    };

    var shortcuts = ['click', 'mousedown', 'mouseup', 'mousemove',
        'mouseover', 'mouseout', 'keydown', 'keyup', 'keypress'],
        s, i = 0;

    while (s = shortcuts[i++]) {
        h[s] = (function(s) {
            return function(x, o) {
                h.once(x, extend(o || {}, { type: s }));
            };
        })(s);
    }

    h.dblclick = function(x, o) {
        h.once(x, extend(o || {}, {
            type: 'dblclick',
            clicks: 2
        }));
    };

    this.happen = h;

    // Export for nodejs
    if (typeof module !== 'undefined') {
        module.exports = this.happen;
    }

    // Provide jQuery plugin
    if ($ && $.fn) {
        $.fn.happen = function(o) {
            if (typeof o === 'string') {
                o = { type: o };
            }
            for (var i = 0; i < this.length; i++) {
                happen.once(this[i], o);
            }
            return this;
        };
    }
})(this, (typeof jQuery !== 'undefined') ? jQuery : null);
