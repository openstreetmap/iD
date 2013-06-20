// Like selection.property('value', ...), but avoids no-op value sets,
// which can result in layout/repaint thrashing in some situations.
d3.selection.prototype.value = function(value) {
    function d3_selection_value(value) {
      function valueNull() {
        delete this.value;
      }

      function valueConstant() {
        if (this.value !== value) this.value = value;
      }

      function valueFunction() {
        var x = value.apply(this, arguments);
        if (x == null) delete this.value;
        else if (this.value !== x) this.value = x;
      }

      return value == null
          ? valueNull : (typeof value === "function"
          ? valueFunction : valueConstant);
    }

    if (!arguments.length) return this.property('value');
    return this.each(d3_selection_value(value));
};
