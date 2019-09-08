import React from "react";
import Triumph from "./Triumph.js"

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
          return;
        }
        this.setState({ roles: data.roles })
      });
  }

  render() {
    if (this.state.roles) {
      return (
        <div>
          <p>{this.state.roles[0].name}</p>
          {this.state.roles[0].triumphs.map((triumph, index) => (
            <Triumph
              name={triumph.name}
              iconPath={triumph.icon}
              description={triumph.description}
              objectives={[
                { hint: triumph.objectives[0].hint, curValue: triumph.objectives[0].curValue, reqValue: triumph.objectives[0].reqValue },
              ]}
            />
          ))}
        </div>
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
