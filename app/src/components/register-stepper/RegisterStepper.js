import React, { Component } from "react";
import { Stepper, Step, StepLabel } from "@material-ui/core";

import "./RegisterStepper.css";

function getSteps() {
  return ["Step 1", "Step 2", "Step 3"];
}

export default class RegisterStepper extends Component {
  state = { };

  render() {
    const steps = getSteps();
    const activeStep = this.props.step;

    return (
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    );
  }
}
