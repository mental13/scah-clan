import React from "react";
import './index.css';
import './Profile.css';

import Title from "./Title.js"

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      roles: null,
      titles: null
    };
  }

  componentDidMount() {
    fetch(`/destiny/${this.props.match.params.profileId}`)
      .then(response => response.json())
      .then(data => {
        if (data.errorMessage) {
          // TODO indicate error to user
          console.log(data.errorMessage);
          this.props.history.push('/')
          return;
        }
        this.setState({
          roles: data.roles,
          titles: data.titles
        })
      });
  }

  render() {
    if (this.state.roles && this.state.titles) {
      return (
        <ul className="TitleContainer">
          {this.state.roles.map((role, index) => (
            <li key={role.name + index.toString()} className="TitleListItem"
              redeemed={this.state.titles.includes(role.name).toString()}
              redeemable={role.isRedeemable.toString()}
              onClick={() => {
                if (this.state.titles.includes(role.name) || !role.isRedeemable) return;
                fetch(`/db/${this.props.match.params.profileId}/${role.name}`, { method: 'POST' })
                  .then(response => {
                    if (response.status === 200) {
                      const newTitles = this.state.titles;
                      newTitles.push(role.name);
                      this.setState({ titles: newTitles });
                    }
                  });
              }}>
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
        <div className="InfoString Centered">Loading...</div>
      );
    }
  }
}

export default Profile;
