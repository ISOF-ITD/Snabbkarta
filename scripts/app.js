import React from 'react';
import ReactDOM from 'react-dom';

import Application from './components/Application';

console.log('ISOF-Snabbkarta running React.js version '+React.version);

// IE 11 backwards compatibility, Promise och Fetch
import 'whatwg-fetch';
import Promise from 'promise-polyfill';

if (!window.Promise) {
	window.Promise = Promise;
}

// Initalisera stöd för flerspråkighet
import Lang from './../ISOF-React-modules/lang/Lang';
// Språk: svenska
Lang.setCurrentLang('sv');
window.Lang = Lang;
window.l = Lang.get;

// Initalisera React.js
ReactDOM.render(
	<Application />,
	document.getElementById('app')
);