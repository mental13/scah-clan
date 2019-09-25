import React from 'react';
import './Title.css';

import Triumph from './Triumph.js'

class Title extends React.Component {
  render() {
    return (
      <div>
        <div className='TitleName'>{this.props.title.name}</div>
        <ul className='TriumphContainer'>
          {this.props.title.triumphs.map((triumph, index) => (
            <li key={triumph.name + index.toString()} className='TriumphListItem'>
            <Triumph
              name={triumph.name}
              iconPath={triumph.icon}
              description={triumph.description}
              objectives={triumph.objectives}
            />
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Title;
