import React, { useState } from 'react';

var setErrorFunc;

function ErrorLog() {
  const [error, setError] = useState(null);
  setErrorFunc = setError;

  if (!error) {
    return <div></div>;
  }

  return (
    <div className='ErrorPopup'>
      <div className='ErrorContainer'>
        <div className='ErrorMessage'>{error.message}</div>
        <div className='ErrorClose' onClick={() => { setError(null) }}>X</div>
      </div>
    </div>
  );
}

function RaiseError(errorMessage) {
  console.error(errorMessage);
  if (setErrorFunc) {
    setErrorFunc({ message: errorMessage });
  }
}

export { ErrorLog, RaiseError }
