import { CameraSource } from './CameraSource';

export const WebCamManager = function(cameraRoot) {
  var width, height;
  // var cameraToggleInput = cameraRoot.querySelector('.Camera-toggle-input');
  // var cameraToggle = cameraRoot.querySelector('.Camera-toggle');
  var cameraVideo = cameraRoot.querySelector('.Camera-video');

  this.resize = function(w, h) {
    if (w && h) {
      height = h;
      width = w;
    }

    var videoDimensions = this.getDimensions();
    cameraVideo.style.transform = 'translate(-50%, -50%) scale(' + videoDimensions.scaleFactor + ')';
  }.bind(this);

  var source = new CameraSource(cameraVideo);

  this.getDimensions = function() {
    var dimensions = source.getDimensions();
    var heightRatio = dimensions.height / height;
    var widthRatio = dimensions.width / width;
    var scaleFactor = 1 / Math.min(heightRatio, widthRatio);
    dimensions.scaleFactor = Number.isFinite(scaleFactor) ? scaleFactor : 1;
    return dimensions;
  };

  // this method can be overwritten from outside
  this.onDimensionsChanged = function() {};

  source.onDimensionsChanged = function() {
    this.onDimensionsChanged();
    this.resize();
  }.bind(this);

  source.getCameras(function(cameras) {
    //   if (cameras.length <= 1) {
    //     cameraToggle.style.display = 'none';
    //   }

    // Set the source

    
    console.log(`There are ${cameras.length} cameras available, using the first one.`);

    source.setCamera(0);
  });

  source.onframeready = function(imageData) {
    // The Source has some data, we need to push it the controller.
    this.onframeready(imageData);
  }.bind(this);

  // cameraToggleInput.addEventListener('change', function(e) {
  //   // this is the input element, not the control
  //   var cameraIdx = 0;

  //   if (e.target.checked === true) {
  //     cameraIdx = 1;
  //   }
  //   source.stop();
  //   source.setCamera(cameraIdx);
  // });

  this.stop = function() {
    source.stop();
  };

  this.start = function() {
    var cameraIdx = 0;
    // if (cameraToggleInput.checked === true) {
    //   cameraIdx = 1;
    // }
    source.setCamera(cameraIdx);
  };

  // When using the web cam, we need to turn it off when we aren't using it
  document.addEventListener(
    'visibilitychange',
    function() {
      if (document.visibilityState === 'hidden') {
        // Disconnect the camera.
        this.stop();
      } else {
        this.start();
      }
    }.bind(this)
  );
};
