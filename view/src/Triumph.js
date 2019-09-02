import React from 'react';
import './Triumph.css';

import Objective from './Objective.js'

class Triumph extends React.Component {
  render() {
    return (
      <div className="Triumph">
        <div className="InfoContainer">
          <div className="Icon"><img src={this.props.iconPath} alt="" /></div>
          <div className="Name"><b>{this.props.name}</b></div>
          <div className="Description">{this.props.description}</div>
        </div>
        {/* TODO pass list of Objectives as props */}
        <ul className="ObjectiveContainer">
          <li className="ObjectiveListItem">
            <Objective
              curValue="42"
              reqValue="50"
              hint="Hint"
            />
          </li>
          <li className="ObjectiveListItem">
            <Objective
              curValue="42"
              reqValue="40"
              hint="Hint"
            />
          </li>
        </ul>
      </div>
    );
  }
}

export default Triumph;
