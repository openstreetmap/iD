export function svgNotes(projection, context, dispatch) {
  var enabled = false;


  function drawNotes() {
  }

  function showLayer() {
  }


  function hideLayer() {
  }

  drawNotes.enabled = function(_) {
    if (!arguments.length) return enabled;
    enabled = _;

    if (enabled) {
      showLayer();
    } else {
      hideLayer();
    }

    dispatch.call('change');
    return this;
  };

  return drawNotes;
}
