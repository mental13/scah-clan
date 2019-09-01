import React from "react";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hello: "" }
  }

  componentDidMount() {
    fetch("http://localhost:8000/")
      .then(res => res.text())
      .then(res => this.setState({ hello: res }));
  }

  render() {
    return (
      <div>
        <h1>{this.state.hello}</h1>
      </div>
    );
  }
}

export default App;
