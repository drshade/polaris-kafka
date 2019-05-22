import React, { Component } from "react";
import store from "../../store";
import { Link } from "react-router-dom";

import "./Home.css";

import { toggleHome } from "../../actions/navigation.toggleHome.action";
import { connect } from "react-redux";

import { Button } from "@material-ui/core";
import GoogleLogin from 'react-google-login';
import { login } from '../../actions/session.login.action';
import { logout } from '../../actions/session.logout.action';
import { ping } from '../../actions/test.ping.action';

import Wallet from "../wallet/Wallet";

class Home extends Component {
  state = {};

  componentDidMount() {
    store.dispatch(toggleHome());
  }

  componentWillUnmount() {
    store.dispatch(toggleHome());
  }

  onSuccess(response) {
    const token = response.getAuthResponse().id_token;

    this.setState({ openMenu: false });
    store.dispatch(login(token));
  }

  ping() {
    store.dispatch(ping());
  }

  logout() {
    this.setState({ openMenu: false });
    store.dispatch(logout());
  }

  onFailure(error) {
    console.log(error);
  }  

  render() {
    return (
      <div className="home">
        <div className="rocket-wrapper">
          {this.props.profile && <Wallet />}

          {!this.props.profile && (
            <div className="rocket">
              <div className="synthesis-logo">
                <img
                  src="/assets/images/logo/synthesis-logo-wide-white.png"
                  alt="Synthesis"
                />
                <img
                  className="kafka-logo"
                  src="/assets/images/kafka-white.png"
                  alt="Streaming"
                />
              </div>
            </div>
          )}
        </div>

        {!this.props.profile && (<div className="stream-big">
          <p>
            <h4>A streaming approach to mobile wallets</h4>

            <GoogleLogin
              clientId="836096720-e1grbfftjd7tq6kou7k7i5s472k7j9kc.apps.googleusercontent.com"
              render={renderProps => (
                <Button variant="outlined" color="primary" size="large" onClick={renderProps.onClick}>
                  STREAM BIG!
                </Button>
              )}
              buttonText="Login"
              onSuccess={(e) => this.onSuccess(e)}
              onFailure={(e) => this.onFailure(e)}
              cookiePolicy={"single_host_origin"}
            />
          </p>
        </div>
        )}

        <div className="shopping-options-container">
          {this.props.profile && (
            <div className="wallet-menu">
              <Link to="/add-money">
                <img src="/assets/images/money-bag.svg" alt="add-money" />
                <span>Add Money</span>
              </Link>
              <hr className="wallet-hr" />
              <Link to="/receive">
                <img src="/assets/images/receive.svg" alt="receive" />
                <span>Receive Money</span>
              </Link>
              <hr className="wallet-hr" />
              <Link to="/scan">
                <img src="/assets/images/mobile-pay.svg" alt="mobile-pay" />
                <span>Pay Someone</span>
              </Link>
            </div>
          )}
        </div>

        <div className="testcode">
          <button type="button" onClick={() => this.ping()}>
            PING!
          </button>
          <div>Pinged: {this.props.pinged} </div>
          <div>Ponged: {this.props.ponged} </div>
          <div>Balance: {this.props.balance} </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    ...state.ping,
    profile: state.user.profile
  };
}

export default connect(mapStateToProps)(Home);
