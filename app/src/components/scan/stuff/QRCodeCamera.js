import { CameraManager } from './CameraManager';
import { QRCodeManager } from './QRCodeManager';

export const QRCodeCamera = function(element) {
  // Controls the Camera and the QRCode Module

  var cameraManager = new CameraManager('camera');
  var qrCodeManager = new QRCodeManager('qrcode');

  var processingFrame = false;

  cameraManager.onframe = async function(context) {
    // There is a frame in the camera, what should we do with it?
    if (processingFrame == false) {
      processingFrame = true;
    //   let url = await qrCodeManager.detectQRCode(context);
      let url = await decode(context);

      processingFrame = false;
      if (url === undefined) return;

      console.log(url);
    }
  };
};
