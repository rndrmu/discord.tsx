import styles from './BotPage.module.css';
import {connectToGateway} from './socket/discordGateway';

function BotPage() {
    return (
      <div className={styles.Main}>
        <section className={styles.header}>
          <h1>Configure your Bot</h1>
        </section>
        <section className={styles.botConfig}>
          <input className={styles.input} type="password" placeholder='Bot Token' id='tokenInput' />
          <input className={styles.input} type="text" placeholder='Bot Id' id='botId' />
          <input className={styles.input} type="text" placeholder='Response WebHook URL' id='webhookLink' />
          <button onClick={() => connectToGateway()}>Connect</button>
        </section>
       <section className={styles.consoleConfig}>
        <div className={styles.consoleConfigItem}>
          <p>Debug Mode? &nbsp;</p>
          <label className={styles.switch}>
            <input type="checkbox" id='debugToggle'/>
            <span className={styles.slider}></span>
          </label>
        </div>
{/*         <div className={styles.consoleConfigItem}>
          <p>Enable Voice? &nbsp;</p>
          <label className={styles.switch}>
            <input type="checkbox" id='debugToggle'/>
            <span className={styles.slider}></span>
          </label>
        </div> */}
       </section>
        <section id='cmds' className={styles.commandsList}>
            <h1>Set up Commands</h1>
            <div className={styles.commandGroup}>
            <input type="text" name="command1" id=""  placeholder='Command' />
            <input type="text" name="response1" id="" placeholder='Response' />
            <button id='newCommandsGroup'>+</button>
            </div>
        </section>
        <div id='console' className={styles.botConsole}>
                <span className={styles.WelcomeMsg}>
                <p>WELCOME TO</p>
                <p className={styles.spacedText}>DISCORD.TSX</p>
                </span>
        </div>
      </div> 
    )
}

export default BotPage;