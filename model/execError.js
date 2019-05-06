module.exports = class ExecError {
  constructor(aError, aStderr) {
    this.error = aError;
    this.stderr = aStderr;
  }
};
