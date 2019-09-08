import React from 'react';
import './Title.css';

import Triumph from "./Triumph.js"

class Title extends React.Component {
  render() {
    return (
      <div>
        <div className='TitleName'>{this.props.role.name}</div>
        <ul className='TriumphContainer'>
          {this.props.role.triumphs.map((triumph, index) => (
            <li key={index} className="TriumphListItem">
            <Triumph
              name={triumph.name}
              iconPath={triumph.icon}
              description={triumph.description}
              objectives={[
                { hint: triumph.objectives[0].hint, curValue: triumph.objectives[0].curValue, reqValue: triumph.objectives[0].reqValue },
              ]}
            />
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Title;
