import React from "react";
import Triumph from './Triumph.js'

const ErrorCode = {
  NONE: 0,
  SUCCESS: 1,
  UNAVAILABLE: 5
}

const RecordStatus = {
  COMPLETED: 1,
  NOT_COMPLETED: 4
}

const CollectibleStatus = {
  ACQUIRED: 0,
  NOT_ACQUIRED: 1
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
      { method: 'GET', headers: { 'x-api-key': apiKey } })
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

  getRecordState(id) {
    return this.state.profileRecords ? this.state.profileRecords[id].state & RecordStatus.COMPLETED : RecordStatus.NOT_COMPLETED;
  }

  getCollectibleState(id) {
    return this.state.profileCollectibles ? this.state.profileCollectibles[id].state : CollectibleStatus.NOT_ACQUIRED;
  }

  getCompletedRecordCount(recordIds) {
    return recordIds.filter(recordId => this.getRecordState(recordId) == RecordStatus.COMPLETED).length;
  }

  render() {
    return (
      <div className="Playground">
        <Triumph
          name="Last Wish"
          iconPath="https://www.bungie.net/common/destiny2_content/icons/fc5791eb2406bf5e6b361f3d16596693.png"
          description="Complete the Last Wish raid with clanmates and overcome challenges."
          objectives={[
            { hint: "Raid Completed", curValue: this.getCompletedRecordCount([2195455623]), reqValue: 1 },
            { hint: "Raid with Clanmates", curValue: this.getCompletedRecordCount([613834558]), reqValue: 1 },
            { hint: "Challenges Completed", curValue: this.getCompletedRecordCount([2822000740, 3899933775, 2196415799, 1672792871, 149192209]), reqValue: 5 }
          ]}
        />
      </div>
    );
  }
}

export default App;
