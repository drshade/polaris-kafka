import { CameraFallbackManager } from './CameraFallbackManager';
import { WebCamManager } from './WebCamManager';

export const CameraManager = function(element) {
  // The camera gets a video stream, and adds it to a canvas.
  // The canvas is analysed but also displayed to the user.
  var self = this;
  var debug = false;
  var gUMPresent =
    (navigator.mediaDevices ||
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia) !== null;

  if (window.location.hash === '#nogum') gUMPresent = false;
  if (window.location.hash === '#canvasdebug') debug = true;

  var root = document.getElementById(element);
  var cameraRoot;
  var sourceManager;

  // Where are we getting the data from
  if (gUMPresent === false) {
    cameraRoot = root.querySelector('.CameraFallback');
    sourceManager = new CameraFallbackManager(cameraRoot);
  } else {
    cameraRoot = root.querySelector('.CameraRealtime');
    sourceManager = new WebCamManager(cameraRoot);
  }

  if (debug) {
    root.classList.add('debug');
  }

  cameraRoot.classList.remove('hidden');

  var cameraCanvas = root.querySelector('.Camera-display');
  var cameraOverlay = root.querySelector('.Camera-overlay');
  var context = cameraCanvas.getContext('2d');

  // destination position
  var dWidth;
  var dHeight;
  // source position
  var sx = 0;
  var sy = 0;
  var sHeight;
  var sWidth;

  // var cameras = [];
  // var prevCoordinates = 0;

  sourceManager.onframeready = function(frameData) {
    // Work out which part of the video to capture and apply to canvas.
    context.drawImage(frameData, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight);
    if (self.onframe) self.onframe(context);
  };

  var getOverlayDimensions = function(width, height) {
    var minLength = Math.min(width, height);
    var paddingHeight = (height + 64 - minLength) / 2;
    var paddingWidth = (width + 64 - minLength) / 2;

    return {
      minLength: minLength,
      width: minLength - 64,
      height: minLength - 64,
      paddingHeight: paddingHeight,
      paddingWidth: paddingWidth
    };
  };

  var drawOverlay = function(overlayDimensions) {
    var boxPaddingHeightSize = overlayDimensions.paddingHeight;
    var boxPaddingWidthSize = overlayDimensions.paddingWidth;
    var boxPaddingOffset = 224 - boxPaddingHeightSize;

    cameraOverlay.style.borderTopWidth = boxPaddingHeightSize + boxPaddingOffset + 'px';
    cameraOverlay.style.borderLeftWidth = boxPaddingWidthSize + 'px';
    cameraOverlay.style.borderRightWidth = boxPaddingWidthSize + 'px';
    cameraOverlay.style.borderBottomWidth = boxPaddingHeightSize - boxPaddingOffset + 'px';
  };

  this.resize = function(containerWidth, containerHeight) {
    if (!containerWidth || !containerHeight) {
      containerWidth = root.parentNode.offsetWidth;
      containerHeight = root.parentNode.offsetHeight;
    }
    sourceManager.resize(containerWidth, containerHeight);
    var sourceDimensions = sourceManager.getDimensions();

    // Video source size
    var sourceHeight = sourceDimensions.height;
    var sourceWidth = sourceDimensions.width;

    // Target size in device co-ordinats
    var overlaySize = getOverlayDimensions(containerWidth, containerHeight);

    // The canvas should be the same size as the video mapping 1:1
    dHeight = dWidth = overlaySize.width / sourceDimensions.scaleFactor;

    // The width of the canvas should be the size of the overlay in video size.
    if (dWidth === 0) debugger;
    cameraCanvas.width = dWidth;
    cameraCanvas.height = dWidth;

    // Trim the left / top
    sx = sourceWidth / 2 - dWidth / 2;
    sy = sourceHeight / 2 - dHeight / 2;

    // Trim the right / bottom
    sWidth = dWidth;
    sHeight = dHeight;

    drawOverlay(overlaySize);
  };

  window.addEventListener('resize', this.resize);
  sourceManager.onDimensionsChanged = this.resize;
  this.resize();
};
