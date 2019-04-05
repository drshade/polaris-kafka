export const CameraSource = function(videoElement) {
  var stream;
  var animationFrameId;
  var cameras = null;
  var self = this;
  var useMediaDevices =
    'mediaDevices' in navigator &&
    'enumerateDevices' in navigator.mediaDevices &&
    'getUserMedia' in navigator.mediaDevices;
  var gUM =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia ||
    null;
  var currentCamera = -1;

  this.stop = function() {
    currentCamera = -1;
    if (stream) {
      stream.getTracks().forEach(function(t) {
        t.stop();
      });
    }
  };

  this.getDimensions = function() {
    return {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight
    };
  };

  // this method can be overwritten from outside
  this.onDimensionsChanged = function() {};

  this.getCameras = function(cb) {
    cb = cb || function() {};

    if ('enumerateDevices' in navigator.mediaDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then(function(sources) {
          return sources.filter(function(source) {
            return source.kind === 'videoinput';
          });
        })
        .then(function(sources) {
          cameras = [];
          sources.forEach(function(source) {
            if (source.label.indexOf('facing back') >= 0) {
              // move front facing to the front.
              cameras.unshift(source);
            } else {
              cameras.push(source);
            }
          });

          cb(cameras);
        })
        .catch((error) => {
          console.error('Enumeration Error', error);
        });
    } else if ('getSources' in MediaStreamTrack) {
      MediaStreamTrack.getSources(function(sources) {
        cameras = [];
        for (var i = 0; i < sources.length; i++) {
          var source = sources[i];
          if (source.kind === 'video') {
            if (source.facing === 'environment') {
              // cameras facing the environment are pushed to the front of the page
              cameras.unshift(source);
            } else {
              cameras.push(source);
            }
          }
        }
        cb(cameras);
      });
    } else {
      // We can't pick the correct camera because the API doesn't support it.
      cameras = [];
      cb(cameras);
    }
  };

  this.setCamera = function(idx) {
    if (currentCamera === idx || cameras === null) {
      return;
    }
    currentCamera = idx;
    var params;
    var videoSource = cameras[idx];
    
    console.log('Video source: ', videoSource);

    //Cancel any pending frame analysis
    cancelAnimationFrame(animationFrameId);

    if (videoSource === undefined && cameras.length === 0) {
      // Because we have no source information, have to assume it user facing.
      params = { video: true, audio: false };
    } else {
      params = {
        video: {
          deviceId: { exact: videoSource.deviceId || videoSource.id }
        },
        audio: false
      };
    }

    let selectStream = function(cameraStream) {
      stream = cameraStream;

      videoElement.addEventListener('loadeddata', function(e) {
        var onframe = function() {
          if (videoElement.videoWidth > 0) self.onframeready(videoElement);
          if (currentCamera !== -1) {
            // if the camera is still running
            animationFrameId = requestAnimationFrame(onframe);
          }
        };

        self.onDimensionsChanged();

        animationFrameId = requestAnimationFrame(onframe);
      });

      videoElement.srcObject = stream;
      videoElement.load();
      videoElement.play().catch((error) => {
        console.error('Auto Play Error', error);
      });
    };

    console.log(params);

    if (useMediaDevices) {
      navigator.mediaDevices
        .getUserMedia(params)
        .then(selectStream)
        .catch(console.error);
    } else {
      gUM.call(navigator, params, selectStream, console.error);
    }
  };
};
