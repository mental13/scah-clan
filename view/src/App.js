import React from "react";
import Triumph from './Triumph.js'

const ErrorCode = {
  NONE: 0,
  SUCCESS: 1,
  UNAVAILABLE: 5
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      triumphScore: 0,
      profileCollectibles: null,  // weapons and vanity items
      profileRecords: null,       // raid, crucible, gambit, destination triumphs etc
      charRecords: null,          // NF triumphs per character + other
    };
  }

  componentDidMount() {
    const apiKey = process.env.BUNGIE_API_KEY;
    fetch('https://www.bungie.net/Platform//Destiny2/4/Profile/4611686018475932772/?components=800,900',
      { method: 'GET', headers: { 'x-api-key': apiKey} })
      .then(response => response.json())
      .then(data => {
        if (data.ErrorCode != ErrorCode.SUCCESS) {
          console.log(data.Message);
          return;
        }

        this.setState({
          triumphScore: data.Response.profileRecords.data.score,
          profileCollectibles: data.Response.profileCollectibles.data.collectibles,
          profileRecords: data.Response.profileRecords.data.records,
          charRecords: data.Response.profileRecords.data,
        })
      });
  }

  getTriumphTest() {
    return this.state.profileRecords ? this.state.profileRecords[2602370549].state : "NO RECORD";
  }

  getCollectibleTest() {
    return this.state.profileCollectibles ? this.state.profileCollectibles[1660030044].state : "NO COLLECTIBLE";
  }

  render() {
    return (
      <div className="Playground">
        <Triumph
          name="NAME"
          iconPath="https://www.bungie.net/common/destiny2_content/icons/cef32825c1da6ed5db3ed84e69c4bb60.png"
          description="Description"
        />
      </div>
    );
  }
}

export default App;
