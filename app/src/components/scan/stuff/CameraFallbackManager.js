// var CameraFallbackManager = function(element) {
//     var uploadForm = element.querySelector('.CameraFallback-form');
//     var inputElement = element.querySelector('.CameraFallback-input');
//     var image = new Image();

//     // these methods can be overwritten from outside
//     this.onframeready = function() {};
//     this.onDimensionsChanged = function() {};

//     // these methods are noop for the fallback
//     this.resize = function() {};

//     // We don't need to upload anything.
//     uploadForm.addEventListener('submit', function(e) {
//       e.preventDefault();
//       return false;
//     });

//     inputElement.addEventListener(
//       'change',
//       function(e) {
//         var objectURL = URL.createObjectURL(e.target.files[0]);
//         image.onload = function() {
//           this.onDimensionsChanged();
//           this.onframeready(image);
//           URL.revokeObjectURL(objectURL);
//         }.bind(this);

//         image.src = objectURL;
//       }.bind(this)
//     );

//     this.getDimensions = function() {
//       return {
//         width: image.naturalWidth,
//         height: image.naturalHeight,
//         scaleFactor: 1
//       };
//     };
//   };