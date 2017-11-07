import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, hashHistory, Redirect } from 'react-router'

import Application from './components/Application';

console.log('ISOF-Snabbkarta running React.js version '+React.version);

// IE 11 backwards compatibility, Promise och Fetch
import 'whatwg-fetch';
import Promise from 'promise-polyfill';

if (!window.Promise) {
	window.Promise = Promise;
}


// Initalisera React.js Router
ReactDOM.render(
	<Application />,
	document.getElementById('app')
);