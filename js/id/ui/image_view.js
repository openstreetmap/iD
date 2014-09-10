iD.ui.ImageView = function (context) {
    function imageView() {
    }

    imageView.showEmpty = function () {
        var imageWrapper = context.container().select('#mapillaryImage');
        imageWrapper.html('');
        var content = imageWrapper
            .append('div');
        content.append('div')
            .on('click', function(){
                imageWrapper.classed('hidden', true);
            });

        content.append('div').html(marked(t('mapillary.no_image_found')));
    };

    imageView.show = function (imageToShow) {
        var key = imageToShow.properties.key;
        var imageWrapper = context.container().select('#mapillaryImage');
        imageWrapper.classed('hidden', false);
        imageWrapper.html('');
        var content = imageWrapper
            .append('div');
        content.append('div')
            .attr('class', 'icon close')
            .on('click', function(){
                imageWrapper.classed('hidden', true);
            });
        content.append('div').html('<div><img src="https://d1cuyjsrcm0gby.cloudfront.net/KEY/thumb-320.jpg"></img></div><a class="link" target="_blank" href="http://mapillary.com/map/im/KEY">View on Mapillary</a>'
                .replace(/KEY/g, key));

    };

    return imageView;
};
