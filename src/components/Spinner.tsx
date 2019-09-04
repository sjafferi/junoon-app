import * as React from 'react';

interface ISpinnerProps { }

export default class Spinner extends React.Component<ISpinnerProps> {

  public render() {
    return (
      <div uk-spinner="" className="uk-spinner uk-icon">
        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" data-svg="spinner">
          <circle fill="none" stroke="#000" cx="15" cy="15" r="14"></circle>
        </svg>
      </div>
    )
  }
}

