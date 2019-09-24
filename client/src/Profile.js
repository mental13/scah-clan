import React from "react";
import './index.css';
import './Profile.css';

import Title from "./Title.js"

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      titleDefinitions: null,
      titlesRedeemed: null
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
          titleDefinitions: data.titleDefinitions,
          titlesRedeemed: data.titlesRedeemed
        })
      });
  }

  render() {
    if (this.state.titleDefinitions && this.state.titlesRedeemed) {
      return (
        <ul className="TitleContainer">
          {this.state.titleDefinitions.map((title, index) => (
            <li key={title.name + index.toString()} className="TitleListItem"
              redeemed={this.state.titlesRedeemed.includes(title.name).toString()}
              redeemable={title.isRedeemable.toString()}
              onClick={() => {
                if (this.state.titlesRedeemed.includes(title.name) || !title.isRedeemable) return;
                fetch(`/db/${this.props.match.params.profileId}/${title.name}`, { method: 'POST' })
                  .then(response => {
                    if (response.status === 200) {
                      const titlesRedeemedUpdated = this.state.titlesRedeemed;
                      titlesRedeemedUpdated.push(title.name);
                      this.setState({ titlesRedeemed: titlesRedeemedUpdated });
                    }
                  });
              }}>
              <Title
                title={title}
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
