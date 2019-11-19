import React from 'react';
import './Triumph.css';

import Objective from './Objective.js'

class Triumph extends React.Component {
  render() {
    return (
      <div className='Triumph'>
        <div className='InfoContainer'>
          <div className='Icon'><img src={this.props.iconPath} alt='' /></div>
          <div className='Name'><b>{this.props.name}</b></div>
          <div className='Description'>{this.props.description}</div>
        </div>
        <ul className='ObjectiveContainer'>
          {this.props.objectives.map((obj, index) => (
            <li key={obj.hint + index.toString()} className='ObjectiveListItem'>
              <Objective
                curValue={obj.curValue}
                reqValue={obj.reqValue}
                hint={obj.hint}
                color={this.props.color}
                collectionProgress={obj.collectionProgress}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Triumph;
