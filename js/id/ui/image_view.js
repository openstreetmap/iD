iD.ui.ImageView = function (context) {
    var selection,
        state, show, selectedImage, hoverImage;


    function imageView(sel) {
        console.log('imageView', selection);
        selection = sel;
    }

    imageView.state = function (_) {
        console.log('imageView.state', _);
        if (!arguments.length) return state;
        state = _;
        return imageView;
    };

    imageView.selectedImage = function (_) {
        console.log('imageView.selectedImage', _);
        if (!arguments.length) return selectedImage;
        selectedImage = _;
    };

    imageView.showSelectedImage = function () {
        if(selectedImage) {
            imageView.show(selectedImage);
        } else {
            selection.html('no image selected');

        }
    }
    imageView.hoverImage = function (hoverImage) {
        console.log('imageView.hoverImage', hoverImage);
        imageView.show(hoverImage);
    };

    imageView.show = function (imageToShow) {
        console.log('imageView.show', imageToShow);
        var key = imageToShow.properties.key;
        selection.html('<a href="http://mapillary.com/map/im/' + key+'"><img src="https://d1cuyjsrcm0gby.cloudfront.net/'+key+'/thumb-320.jpg"></img></a>');
    };



    return imageView;

};