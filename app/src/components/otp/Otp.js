import React, { Component } from "react";

import { Button, TextField, InputAdornment, Snackbar, IconButton } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';

import "./Otp.css";
import { push } from "connected-react-router";
import store from "../../store";

import RegisterStepper from "../register-stepper/RegisterStepper";

const currentStep = 1;

export default class Otp extends Component {
  state = {
    open: false
  };

  validateOtp() {
    console.log("Validate OTP");
    store.dispatch(push("/created"));
  }

  resendOtp() {
    this.setState({ open: true });
  }

  handleClose(event, reason) {
    if (reason === "clickaway") {
      return;
    }

    this.setState({ open: false });
  }

  render() {
    return (
      <div>
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center"
          }}
          open={this.state.open}
          autoHideDuration={6000}
          onClose={(e, r) => this.handleClose(e, r)}
          ContentProps={{
            "aria-describedby": "message-id"
          }}
          message={<span id="message-id">OTP Sent</span>}
          action={[
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              onClick={(e, r) => this.handleClose(e, r)}
            >
              <CloseIcon />
            </IconButton>
          ]}
        />
        <form className="otp" onSubmit={() => this.validateOtp()}>
          <RegisterStepper step={currentStep} />
          <p className="description">
            A One Time Password (OTP) has been sent to your email address.
          </p>
          <br />
          <TextField
            required
            label="OTP"
            margin="normal"
            className="textFields"
            InputProps={{
              endAdornment: (
                <InputAdornment
                  className="otp-link"
                  position="end"
                  onClick={() => this.resendOtp()}
                >
                  Resend OTP
                </InputAdornment>
              ),
              inputProps: {
                pattern: "[0-9]{4}"
              }
            }}
          />
          <Button variant="contained" color="primary" type="submit">
            Confirm
          </Button>
        </form>
      </div>
    );
  }
}
