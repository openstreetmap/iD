iD.MapillarySequencesLayer = function (context) {
    var projection,
        gj = {},
        enable = false,
        dimension,
        svg_sequences;

    function render(selection) {
        svg_sequences = selection.selectAll('svg')
            .data([render]);

        if (!enable) {
            d3
                .select('#sidebar')
                .selectAll('#mapillary-inspector')
                .remove();
            selection
                .remove();
            return;
        }
        svg_sequences.enter()
            .append('svg').append('g');

        svg_sequences.style('display', enable ? 'block' : 'none');
        var extent = context.map().extent();
        d3.json('https://api.mapillary.com/v1/s/search?min-lat=' + extent[0][1] + '&max-lat=' + extent[1][1] + '&min-lon=' + extent[0][0] + '&max-lon=' + extent[1][0] + '&max-results=1&geojson=true', function (error, data) {
                gj = data.features;
                gj.forEach(function(seqJSON) {
                  var seq_class = 'sequence_'+seqJSON.properties.key;
                  var paths = svg_sequences
                      .selectAll("g")
                      .data([seqJSON], function(sequenceJSON) {
                        console.log("sequenceJSON");
                        return sequenceJSON;
                      });

                  paths
                      .enter()
                      .append('path')
                      .attr('class', 'mapillary-sequence '+seq_class);

                  var path = d3.geo.path()
                      .projection(projection);

                  paths
                      .attr('d', path);

                  for(i = 0; i<seqJSON.properties.keys.length; i++) {
                    render.dimensions(dimension);
                    var pointJSON = {
                        type: 'Feature',
                        geometry: {
                          type: 'Point',
                          coordinates: [seqJSON.geometry.coordinates[i]]
                        }
                      };
                    var points = svg_sequences
                        .selectAll('g')
                        .data([pointJSON], function(dt){return dt;});
                    var circlePath= "M 0, 0 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0";
                    var path = d3.geo.path().projection(projection);

                    //TODO: Don't know how to translate this circle into the right location
                    points
                        .enter()
                        .append('g')
                        .attr('class', 'mapillary-image-location')
                        .append('path')
                        .attr('class', 'mapillary-image-location')
                        .attr('transform', 'translate(100, 100)')
                        .attr('d', circlePath);

                  };
                });
              });
    };

    render.projection = function (_) {
        if (!arguments.length) return projection;
        projection = _;
        return render;
    };

    render.enable = function (_) {
        if (!arguments.length) return enable;
        enable = _;
        return render;
    };

    render.geojson = function (_) {
        if (!arguments.length) return gj;
        gj = _;
        return render;
    };

    render.dimensions = function (_) {
        if (!arguments.length) return svg_sequences.dimensions();
        dimension = _;
        svg_sequences.dimensions(_);
        return render;
    };


    render.click = function click() {
        d3.event.stopPropagation();
        d3.event.preventDefault();


    };


    render.id = 'layer-mapillary';


    return render;


};
