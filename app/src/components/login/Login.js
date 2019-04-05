import React, { Component } from 'react';

import { ClickAwayListener, Grow, Paper, Popper, IconButton, MenuList, MenuItem, Button } from '@material-ui/core';

import { push } from 'connected-react-router';

import PersonIcon from '@material-ui/icons/Person';

import { connect } from 'react-redux';

import './Login.css';
import store from '../../store';

import GoogleLogin from 'react-google-login';
import { login } from '../../actions/session.login.action';
import { validateToken } from '../../actions/session.validateToken.action';
import { logout } from '../../actions/session.logout.action';

class Login extends Component {
  state = {
    openMenu: false
  };

  componentDidMount() {
    store.dispatch(validateToken());
  }

  toggleMenu() {
    this.setState({ openMenu: !this.state.openMenu });
  }

  handleClose(event) {
    if (this.anchorEl.contains(event.target)) {
      return;
    }

    this.setState({ openMenu: false });
  }

  onSuccess(response) {
    const token = response.getAuthResponse().id_token;

    this.setState({ openMenu: false });
    store.dispatch(login(token));
  }

  loginOkta() {
    this.setState({ openMenu: false });
    store.dispatch(push('/login'));
  }

  logout() {
    this.setState({ openMenu: false });
    store.dispatch(logout());
  }

  onFailure(error) {
    console.log(error);
  }

  render() {
    const { openMenu } = this.state;
    const profilePictureStyle = `url('${this.props.picture}')`;
    return (
      <div>
        <IconButton
          className="login"
          color="inherit"
          aria-label="Login"
          buttonRef={(node) => {
            this.anchorEl = node;
          }}
          aria-owns={openMenu ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={() => this.toggleMenu()}
        >
          {this.props.picture ? (
            <div className="profile-picture" style={{ backgroundImage: profilePictureStyle }}>
              &nbsp;
            </div>
          ) : (
            <PersonIcon />
          )}
        </IconButton>
        <Popper open={openMenu} anchorEl={this.anchorEl} transition disablePortal placement="bottom-end">
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              id="menu-list-grow"
              style={{
                transformOrigin: 'left bottom'
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={(e) => this.handleClose(e)}>
                  <MenuList>
                    <MenuItem>
                      {this.props.isLoggedIn ? (
                        <Button
                          onClick={(e) => this.logout()}
                        >Logout</Button>
                      ) : (
                        <GoogleLogin
                          clientId="749792317072-n209q4q72hcbdg1div5aboruvrtnfhu5.apps.googleusercontent.com"
                          onSuccess={(e) => this.onSuccess(e)}
                          onFailure={(e) => this.onFailure(e)}
                        />
                        )}
                    </MenuItem>
                    <MenuItem>
                      <Button onClick={(e) => this.loginOkta()}>Sign in (Okta)</Button>
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    );
  }
}

function mapStateToProps(state) {
  let picture,
    isLoggedIn = false;
  if (state.user && state.user.profile) {
    isLoggedIn = state.user.isLoggedIn;
    picture = state.user.profile.picture;
  }

  return {
    isLoggedIn,
    picture
  };
}

export default connect(mapStateToProps)(Login);
