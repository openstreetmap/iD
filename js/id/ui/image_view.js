iD.ui.ImageView = function (context) {
    var sel, selectedImage;

    function imageView(sel) {
    }


    imageView.selectedImage = function (_) {
        console.log("imageView.selectedImage", _);
        if (!arguments.length) return selectedImage;
        selectedImage = _;
    };

    imageView.showEmpty = function () {
            d3.select('#mapillaryImage').html('no image selected');
    }
    imageView.hoverImage = function (hoverImage) {
        imageView.show(hoverImage);
    };

    imageView.show = function (imageToShow) {
        var key = imageToShow.properties.key;
        var imageWrapper = d3.select('#mapillaryImage');
        imageWrapper.classed('hidden', false);
        imageWrapper.html('');
        var content = imageWrapper
            .append('div');
        content.append('div')
            .attr('class', 'icon close')
            .on('click', function(){
                imageWrapper.classed('hidden', true);
            });
        content.append('div').html('<div><img src="https://d1cuyjsrcm0gby.cloudfront.net/'+key+'/thumb-320.jpg"></img></div>' +
            '<a class="link" href="http://mapillary.com/map/im/' + key+'">View on Mapillary</a>');

    };



    return imageView;

};