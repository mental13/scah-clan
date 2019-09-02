import React from "react";
import Triumph from './Triumph.js'

class App extends React.Component {
  constructor(props) {
    super(props);
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
