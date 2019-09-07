import React from "react";

import { SERVER_URL } from './constants.js';

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      destinyData: null
    };
  }

  componentDidMount() {
    fetch(`${SERVER_URL}/destiny/${this.props.match.params.profileId}`)
      .then(response => response.json())
      .then(data => {
        if (data.errorMessage) {
          // TODO indicate error to user
          console.log(data.errorMessage);
          return;
        }
        this.setState({ destinyData: data })
      });
  }

  render() {
    if (this.state.destinyData) {
      return (
        <div>Profile: {this.props.match.params.profileId}</div>
      );
    }
    else {
      return (
        <div>Loading...</div>
      );
    }
  }
}

export default Profile;
