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
        <button className='button'>
          Get Started
        </button>
      </Link>
      <a className='button-outlined' href='https://github.com/rndrmu/discord.tsx'>
          Github
        </a>
      </header>
    </div>
    </Route>
      <Route path="/bot" component={BotPage} />
    </>
  );
}

export default App;


