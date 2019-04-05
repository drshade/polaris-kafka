import React, { Component } from "react";

import { Button, TextField } from "@material-ui/core";

import "./Register.css";
import { push } from "connected-react-router";
import store from "../../store";
import { connect } from "react-redux";
import { register } from '../../actions/onboarding.register.action';

import RegisterStepper from "../register-stepper/RegisterStepper";

const currentStep = 0;

class Register extends Component {
  state = {
    name: "",
    lastName: "",
    fullname: "",
    email: "",
    picture: "",
    idNumber: "",
    mobileNumber: ""
  };

  componentWillReceiveProps(props) {
    this.setState({
      name: props.profile.name,
      lastName: props.profile.lastName,
      fullname: props.profile.fullname,
      email: props.profile.email,
      picture: props.profile.picture
    });
  }

  componentDidMount() {
    if (this.props.profile) {
      this.setState({
        name: this.props.profile.name,
        lastName: this.props.profile.lastName,
        fullname: this.props.profile.fullname,
        email: this.props.profile.email,
        picture: this.props.profile.picture
      });
    }
  }

  registerUser() {
    const fullname = `${this.state.name} ${this.state.lastName}`;
    store.dispatch(register({...this.state, fullname}));
    store.dispatch(push("/otp"));
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  render() {
    let { email, name, lastName, mobileNumber, idNumber } = this.state;

    return (
      <div>
        <RegisterStepper step={currentStep} />
        <form className="user-info" onSubmit={() => this.registerUser()}>
          <TextField
            disabled
            label="Email"
            margin="normal"
            className="textFields"
            name="email"
            value={email}
          />
          <TextField
            required
            label="First Name"
            margin="normal"
            className="textFields"
            name="name"
            value={name}
            onChange={e => this.handleChange(e)}
          />
          <TextField
            required
            label="Last Name"
            margin="normal"
            className="textFields"
            name="lastName"
            value={lastName}
            onChange={e => this.handleChange(e)}
          />
          <TextField
            label="Mobile Number"
            margin="normal"
            className="textFields"
            inputProps={{ pattern: "[0][0-9]{9}" }}
            name="mobileNumber"
            value={mobileNumber}
            onChange={e => this.handleChange(e)}
          />
          <TextField
            label="SA ID Number"
            margin="normal"
            className="textFields"
            inputProps={{ pattern: "[0-9]{13}" }}
            name="idNumber"
            value={idNumber}
            onChange={e => this.handleChange(e)}
          />
          <p className="terms">
            By registering, I agree to the Terms & Conditions and Privacy Policy
          </p>
          <Button variant="contained" color="primary" type="submit">
            Proceed
          </Button>
        </form>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    profile: state.user.profile
  };
}

export default connect(mapStateToProps)(Register);
