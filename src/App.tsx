import React from 'react';
import logo from './logov2.svg';
import djsLogo from './discordjs-logo.svg';
import './App.css';
import { Link, Route } from "wouter";
import BotPage from './BotPage';

function App() {
  return (
    <>
    <Route path='/'>
    <div className="App">
      <header className="App-header">
      <h2 className='App-logo logo'>DISCORD.TSX</h2>
      <h4>A Discord API Wrapper written in ReactJS</h4>
        <img src={logo} className="App-logo spin tiny" alt="logo" />
        <Link href="/bot">
        <a className='button'>
          Get Started
        </a>
      </Link>
      </header>
    </div>
    </Route>
      <Route path="/bot" component={BotPage} />
    </>
  );
}

export default App;


