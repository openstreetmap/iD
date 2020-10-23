// Like selection.property('value', ...), but avoids no-op value sets,
// which can result in layout/repaint thrashing in some situations.
export function utilGetSetValue(selection, value) {
    function d3_selection_value(value) {
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

        if (value === null || value === undefined) return valueNull;
        if (typeof value === 'function') return valueFunction;
        return valueConstant;
    }

    if (arguments.length === 1) {
        return selection.property('value');
    }

    return selection.each(d3_selection_value(value));
}
