import React from "react";

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {

  }

  render() {
    return (
      <div>Profile: {this.props.match.params.profileId}</div>
    );
  }
}

export default Profile;
