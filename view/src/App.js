import React from "react";

import { SERVER_URL } from './constants.js';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      oauthUrl: '',
    };
  }

  componentDidMount() {
    const apiKey = process.env.BUNGIE_API_KEY;
    fetch(`${SERVER_URL}/oauth`)
      .then(response => response.text())
      .then(data => this.setState({ oauthUrl: data }));
  }

  render() {
    return (
      <a href={this.state.oauthUrl}>Authorize</a>
    );
  }
}

export default App;
