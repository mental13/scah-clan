import React from 'react';
import './Objective.css';

class Objective extends React.Component {
  isComplete() {
    return (parseInt(this.props.curValue, 10) >= parseInt(this.props.reqValue, 10)).toString();
  }

  getProgressPercent() {
    const progressValue = this.props.curValue * 100 / this.props.reqValue;
    return Math.min(Math.max(0, progressValue), 100);
  }

  render() {
    const styles = {
      checkbox: { "--color": this.props.color },
      fill: { width: this.getProgressPercent() + '%', "--color": this.props.color }
    };

    if (this.props.collectionProgress)
      return (
        <div className='Objective' type='collection'>
          <ul className='CollectibleContainer'>
            {this.props.collectionProgress.map((collectible, index) => (
              <li key={index} className='CollectibleListItem'>
                <div className='Collectible' aquired={collectible.isAquired.toString()}><img src={collectible.icon} alt='' /></div>
              </li>
            ))}
          </ul>
        </div>
      );
    else
      return (
        <div className='Objective' type='progress'>
          <div className='Checkbox' style={styles.checkbox} complete={this.isComplete()}></div>
          <div className='ProgressBar'>
            <div className='ProgressContainer'>
              <div className='Hint'>{this.props.hint}</div>
              <div className='Progress'>{this.props.curValue}/{this.props.reqValue}</div>
            </div>
            <div className='Fill' style={styles.fill}></div>
          </div>
        </div>
      );
  }
}

export default Objective;
