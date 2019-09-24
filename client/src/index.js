import React from "react";
import ReactDOM from "react-dom";
import { Route, BrowserRouter as Router } from 'react-router-dom'
import App from "./App";
import Profile from "./Profile.js"

import "./index.css"

const routing = (
  <Router>
    <div>
      <Route exact path="/" component={App} />
      <Route exact path="/profile/:profileId" component={Profile} />
    </div>
  </Router>
)

ReactDOM.render(routing, document.getElementById("root"));
