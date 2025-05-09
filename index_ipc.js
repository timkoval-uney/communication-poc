const addon = require("./target/debug/libcommunication_poc.node");
const net = require("net");
const readline = require("readline");

const numOfMessages = 1000;
const largeString = "x".repeat(1 * 1024 * 1024); // 1MB
const samples = new Array(numOfMessages).fill(largeString);
let results = [];

const SOCKET_PATH = "./socket/demo.sock";

const client = net.createConnection(SOCKET_PATH, () => {
  console.log("Connected to server");
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let startTime; // To store the start time
let sentMessages = 0;
let receivedMessages = 0;

client.on("data", (data) => {
  results.push(data.toString());
  // console.log(`Server response: ${data.toString()}`);
  receivedMessages++;
  if (receivedMessages === numOfMessages) {
    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationMs = durationNs / 1_000_000;
    console.log(
      `Time to send ${numOfMessages} messages and receive last response: ${durationMs.toFixed(2)} ms`,
    );
  }
  delete data;
});

client.on("end", () => {
  console.log("Disconnected from server");
  const endTime = process.hrtime.bigint();
  const durationNs = Number(endTime - startTime);
  const durationMs = durationNs / 1_000_000;
  // console.log(`Results: ${results}`);
  console.log(
    `Time to send ${numOfMessages} messages and receive last response: ${durationMs.toFixed(2)} ms`,
  );
  rl.close();
});

client.on("error", (err) => {
  console.error(`Error: ${err.message}`);
  rl.close();
});

rl.on("line", (line) => {
  if (line.trim().toLowerCase() === "quit") {
    client.end();
    rl.close();
  } else {
    client.write(line);
  }
});

rl.on("close", () => {
  process.exit(0);
});

let count_ipc = 0;
const interval_ipc = setInterval(() => {
  if (count_ipc++ < numOfMessages) {
    if (count_ipc === 1) {
      startTime = process.hrtime.bigint(); // Start timing on first message
    }
    client.write(`Message through ipc ${samples[count_ipc - 1]}`);
    sentMessages++;
  } else {
    clearInterval(interval_ipc);
    client.end();
  }
}, 1);
