iD.ui.ImageView = function (context) {
    var selection, selectedImage;


    function imageView(sel) {
        selection = sel;
    }

    imageView.selectedImage = function (_) {
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
        imageView.show(hoverImage);
    };

    imageView.show = function (imageToShow) {
        var key = imageToShow.properties.key;
        selection.html('<a href="http://mapillary.com/map/im/' + key+'"><img src="https://d1cuyjsrcm0gby.cloudfront.net/'+key+'/thumb-320.jpg"></img></a>');
    };



    return imageView;

};