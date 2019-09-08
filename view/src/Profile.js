import React from "react";
import './Profile.css';

import Title from "./Title.js"

import { SERVER_URL } from './constants.js';

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      roles: null
    };
  }

  componentDidMount() {
    fetch(`${SERVER_URL}/destiny/${this.props.match.params.profileId}`)
      .then(response => response.json())
      .then(data => {
        if (data.errorMessage) {
          // TODO indicate error to user
          console.log(data.errorMessage);
          this.props.history.push('/')
          return;
        }
        this.setState({ roles: data.roles })
      });
  }

  render() {
    if (this.state.roles) {
      return (
        <ul className="TitleContainer">
          {this.state.roles.map((role, index) => (
            <li key={role.name + index.toString()} className="TitleListItem">
              <Title
                role={role}
              />
            </li>
          ))}
        </ul>
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
