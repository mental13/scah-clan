import React from "react";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      oauthUrl: '',
    };
  }

  componentDidMount() {
    fetch('/oauth')
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
