const net = require("net");

const defaultConfig = {
  // Attempt to connect to the Rooibos server for 30 seconds only
  timeout: 30000,
  // Retry connection to Rooibos server every 3 seconds. Configurable?
  retryInterval: 3000,
  // When true, print each individual test result as receieved else only print the final result
  verbose: true,
  host: null,
  port: null,
};

module.exports = class RooibosCI {
  constructor(config) {
    this.options = { ...defaultConfig, ...config };

    if (!this.options.host || !this.options.port) {
      throw new Error("host and Port are required.");
    }

    // Set to true if Rooibos socket connection wasn't achieved within timeout period
    this._timedOut = false;
    // Set true when connection is made with Rooibos server
    this._connected = false;

    this._client = new net.Socket();
    this._client.once("connect", () => {
      console.info(
        `Rooibos-ci connected to Rooibos server ${this.options.host}:${this.options.port}`
      );
      clearTimeout(this._retryTimer);
      this._connected = true;
    });

    this._client.on("error", (e) => {
      console.warn("Rooibos-ci unable to connect to Rooibos server.");
      // Don't re-attempt connection if we were already connected - something bad probably happened
      if (e.code === "ECONNREFUSED" && !this._connected) {
        setTimeout(() => {
          this._connect()
        }, this.options.retryInterval);
      }
    });

    this._client.on("data", (data) => {
      if (this.options.verbose) {
        console.info("data: " + data);
      }
    });

    this._client.on("close", () => {
      console.warn("Connection closed");
    });
  }

  // Start watching
  watch() {
    this._startConnectionRetryTimer();
    this._connect();
  }

  // Limit how long the module should attempt to connect with the Rooibos server
  _startConnectionRetryTimer() {
    this._retryTimer = setTimeout(() => {
      this._timedOut = true;
      clearTimeout(this._retryTimer);
      throw new Error(
        "Rooibos-CI timed out. Unable to connect to the Rooibos server."
      );
    }, this.options.timeout);
  }

  _connect() {
    // If we weren't previously connected...
    console.info(`Rooibos-ci attempting to connect to ${this.options.host}:${this.options.port}`);
    !this._connected
      ? this._client.connect(this.options.port, this.options.host)
      : this._client.destroy()
  }
};