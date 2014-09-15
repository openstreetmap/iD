iD.ui.ImageView = function (context) {
    function imageView() { }

    imageView.showEmpty = function () {
        var imageWrapper = context.container()
            .select('#mapillary_image');

        imageWrapper.html('');

        var content = imageWrapper
            .append('div');

        content.append('div')
            .on('click', function(){
                imageWrapper.classed('hidden', true);
            });

        content.append('div')
            .html(marked(t('mapillary.no_image_found')));
    };

    imageView.show = function (imageToShow) {
        var key = imageToShow.properties.key;
        var imageWrapper = context.container().select('#mapillary_image');
        imageWrapper.classed('hidden', false);
        imageWrapper.html('');
        var content = imageWrapper
            .append('div');
        content.append('div')
            .attr('class', 'icon close')
            .on('click', function(){
                imageWrapper.classed('hidden', true);
            });
        var wrap = content.append('div');
        wrap.append('div')
            .append('img')
            .attr('src', 'https://d1cuyjsrcm0gby.cloudfront.net/KEY/thumb-320.jpg'.replace('KEY', key));
        wrap.append('a')
            .text(t('mapillary.view_on_mapillary'))
            .attr('class', 'link')
            .attr('target', '_blank')
            .attr('href', 'http://mapillary.com/map/im/KEY'.replace('KEY', key));
    };

    return imageView;
};
