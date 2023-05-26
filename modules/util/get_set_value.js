// Like selection.property('value', ...), but avoids no-op value sets,
// which can result in layout/repaint thrashing in some situations.
/** @returns {string} */
export function utilGetSetValue(selection, value) {
    function setValue(value) {
        function valueNull() {
            delete this.value;
        }

        function valueConstant() {
            if (this.value !== value) {
                this.value = value;
            }
        }

        function valueFunction() {
            var x = value.apply(this, arguments);
            if (x === null || x === undefined) {
                delete this.value;
            } else if (this.value !== x) {
                this.value = x;
            }
        }

        return (value === null || value === undefined)
            ? valueNull : (typeof value === 'function'
            ? valueFunction : valueConstant);
    }

    function stickyCursor(func) {
        return function() {
            const cursor = { start: this.selectionStart, end: this.selectionEnd };
            func.apply(this, arguments);
            this.setSelectionRange(cursor.start, cursor.end);
        };
    }

    if (arguments.length === 1) {
        return selection.property('value');
    }

    return selection.each(stickyCursor(setValue(value)));
}
