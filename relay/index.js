const {exec} = require('child_process');
const os = require('os');

/*
    JAR

    The command to be run to access the relay.

    The first part runs java expecting a jar. (assumes java location)
    The second part is the name of the jar. (assumes the name of the jar)

    note: ./ assumes that the jar is in the same directory as the node app

    // The second part can be rewritten to be passed as a parameter
*/
let JAVA = '/usr/bin/java -jar ';
if (os.platform() === 'win32') {
  JAVA = '"C:\\Program Files (x86)\\Common Files\\Oracle\\Java\\javapath\\java" -jar ';
}
const JAR = './lib/denkovi/DenkoviRelayCommandLineTool_27.jar ';
const FTDI_ID = 'DAE002N9 ';
const RELAY = JAVA + JAR + FTDI_ID;

/*
    Command List:
    These commands are appended to the call to the relay jar (JAR).

    0. FAIL => a command that should fail deliberatly - for testing

    1. LIST => triggers the list command
    2. HELP => triggers the help command
    .....
    (more commands to come)
*/
const FAIL = 'info';
const LIST = 'list';
const HELP = 'help';
const ON1 = '4 1 1';

function success(command, result) {
  console.log(`success: ${result}\n\n`);
}

function fail(command, result) {
  console.log(`ERROR: ${result}\n\n`);
}

/*
    runCommand:
        Runs a console command in a child process

    input:
        command - the required command.
        success - the function to call in case of success.
        fail - the function to call in case of failure.

    Output:
        stderr => redirected to console.   // Can be changed if needed
        stdout => redirected to success function.
        error => redirected to fail function.
*/
let runningPromise = undefined;

function runCommandGetPromise(command) {
  runningPromise = new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr !== '') console.log(`stderr: ${stderr}`);

      if (error !== null) {
        fail(command, error);
        reject(error);
      } else {
        success(command, stdout);
        resolve(stdout);
      }
    });
  })
  return runningPromise;
}

class RunCommandInQueue {
  constructor() {
    this.isQueueHandled = false;
    this.promiseQueue = [];
  }

  startHandlingQueue() {
    if (this.isQueueHandled) {
      return;
    }

    this.isQueueHandled = true;

    this.handleQueue();
  };

  handleQueue() {
    if (this.promiseQueue.length <= 0) {
      this.isQueueHandled = false;
      return;
    }

    const {command, resolve, reject} = this.promiseQueue.pop();
    // console.log('xxxxxxxxxx', command)

    this.runCommand(command, resolve, reject);
  }

  runCommand(command, resolve, reject) {
    exec(RELAY + command, (error, stdout, stderr) => {
      if (stderr !== '') console.log(`stderr: ${stderr}`);

      if (error !== null) {
        // fail(command, error);
        reject(error);
        this.handleQueue();
      } else {
        // success(command, stdout);
        resolve(stdout);
        this.handleQueue();
      }
    });
  }

  run(command) {
    runningPromise = new Promise((resolve, reject) => {
      this.promiseQueue.unshift({command, resolve, reject});
    });
    this.startHandlingQueue();
    return runningPromise;
  }
}

function runCommand(command) {
  if (runningPromise) {
    runningPromise.then(() => {
      return runCommandGetPromise(command);
    });
  }
  return runCommandGetPromise(command);
}

/*
    relay
    A wrapper command used for readability
*/
function relay(command) {
  return runCommand(RELAY + command);
}

// Exports: Once every thing works - needs to be turned into a module

/* ===============================================================
                    Nodejs Access section
   =============================================================== */

/*
    success:
    Demo function that is triggered in the case of a successful call
    Outputs the result to the console.
*/

/*
    fail:
    Demo function that is triggered in the case of a failed call
    Outputs the result to the console.
*/


/*
    Test calls
*/
// relay(FAIL, success, fail); // Should display an error
// relay(LIST, success, fail); // Should display a list of devices
// relay(HELP, success, fail); // Should display Help
// relay(ON1, success, fail); // Should display Help

const commandQueue = new RunCommandInQueue();

module.exports = class RelaysModule {

  getRelayStatus(relayNo) {
    const getStatusCommand = `4 ${relayNo} status`;
    const returnedStatus = commandQueue.run(getStatusCommand);
    return returnedStatus;
  }

  toggleRelay(relayNo) {
    const currentStatus = this.getRelayStatus(relayNo);
    currentStatus.then((retData) => {
      const newCurrentStatus = !retData || retData.indexOf('0') >= 0 ? 1 : 0;
      const setStatusCommand = `4 ${relayNo} ${newCurrentStatus}`;
      return commandQueue.run(setStatusCommand);
    }).catch((error) => console.error(error));
  }

  setRelayAll(newRelLyValue) {
    const newCurrentStatus = newRelLyValue ? 1 : 0;
    const setRellayCommand = `4 all ${newCurrentStatus}`;
    return commandQueue.run(setRellayCommand);
  }
};
