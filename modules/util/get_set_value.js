// Like selection.property('value', ...), but avoids no-op value sets,
// which can result in layout/repaint thrashing in some situations.
export function getSetValue (target, value) {
    function d3_selection_value(value) {
      function valueNull() {
        delete target.value;
      }

      function valueConstant() {
        if (target.value !== value) target.value = value;
      }

      function valueFunction() {
        var x = value.apply(target, arguments);
        if (x == null) delete target.value;
        else if (target.value !== x) target.value = x;
      }

      return value == null
          ? valueNull : (typeof value === "function"
          ? valueFunction : valueConstant);
    }

    if (!arguments.length) return target.property('value');
    return target.each(d3_selection_value(value));
}
