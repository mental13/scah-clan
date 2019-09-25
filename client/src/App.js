import React from 'react';
import './index.css';

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
      <div className='Button Centered'>
        <a href={this.state.oauthUrl}>Authorize</a>
      </div>
    );
  }
}

export default App;
