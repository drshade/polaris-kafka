import React, { Component } from 'react';

import { TextField, InputAdornment } from '@material-ui/core';

import ContactPhoneIcon from '@material-ui/icons/ContactPhoneOutlined';

import './Scan.css';
import store from '../../store';
import { push } from 'connected-react-router';
import BottomBar from '../bottom-bar/BottomBar';

import { CameraManager } from './stuff/CameraManager';
import { decode } from './qrClient';

class Scan extends Component {
  state = {};

  componentDidMount() {
    let cameraManager = new CameraManager('camera');

    let processingFrame = false;

    cameraManager.onframe = async (context) => {
      if (this.state.url) return;

      // There is a frame in the camera, what should we do with it?
      if (!processingFrame) {
        processingFrame = true;
        //   let url = await qrCodeManager.detectQRCode(context);
        let url = await decode(context);

        processingFrame = false;
        if (url === undefined) return;

        console.log(url);

        this.setState({ url });
        window.location = url;
      }
    };
  }
  scan() {
    store.dispatch(push('/scan'));
  }

  render() {
    return (
      <div class="fullscreen">
        <div className="pay-with-mobile">
          <TextField
            id="standard-full-width"
            placeholder="Pay with Mobile Number"
            fullWidth
            margin="none"
            InputLabelProps={{
              shrink: true
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <ContactPhoneIcon />
                </InputAdornment>
              )
            }}
          />
          <span class="or">
            <img src="./assets/images/qr-or.svg" alt="Pay with QR code or Mobile Number" />
          </span>
          <span>Scan the QR code to pay</span>
        </div>

        <div id="camera" className="Camera">
          <canvas className="Camera-display" />
          <div className="CameraRealtime hidden">
            <video className="Camera-video" muted autoPlay playsInline />
          </div>
          <div className="Camera-overlay">
              <div className="Camera-QR-Indicator">
                  <img src="./assets/images/qr-code.svg" alt="QR Code"/>
              </div>
          </div>
        </div>

        <p>{this.state.url}</p>
        <BottomBar />
      </div>
    );
  }
}

export default Scan;
