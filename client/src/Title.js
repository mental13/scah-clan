import React from 'react';
import './Title.css';

import Triumph from './Triumph.js'

class Title extends React.Component {
  render() {
    const styles = {
      title: { "--color": this.props.title.color },
    };

    return (
      <div>
        <div className='TitleName' style={styles.title}>{this.props.title.name}</div>
        <ul className='TriumphContainer'>
          {this.props.title.triumphs.map((triumph, index) => (
            <li key={triumph.name + index.toString()} className='TriumphListItem'>
            <Triumph
              name={triumph.name}
              isComplete={triumph.isComplete}
              iconPath={triumph.icon}
              description={triumph.description}
              objectives={triumph.objectives}
              color={this.props.title.color}
            />
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Title;
