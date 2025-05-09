const addon = require("./target/debug/libcommunication_poc.node");
const net = require("net");
const readline = require("readline");

const numOfMessages = 1000;
const largeString = "x".repeat(1 * 1024 * 1024); // 1MB
const samples = new Array(numOfMessages).fill(largeString);

// function testCallback() {
//   console.log("Callback invoked from Rust!");
// }

// addon.callJsCallback(testCallback);

// addon.callJsCallbackWithArgs((str, num) => {
//   console.log(`Received: ${str}, ${num}`);
// });

// Test callback with return vallet
// let results = [];
// let count = 0;
// const interval = setInterval(() => {
//   if (count++ < numOfMessages) {
//     if (count === 1) {
//       startTime = process.hrtime.bigint(); // Start timing on first message
//     }
//     const result = addon.callJsCallbackWithReturn(() => {
//       return `Message through ffi ${samples[count - 1]}`;
//     });
//     results.push(result);
//     // console.log(`Callback returned: ${result}`);
//     if (count === numOfMessages) {
//       const endTime = process.hrtime.bigint();
//       const durationNs = Number(endTime - startTime);
//       const durationMs = durationNs / 1_000_000;
//       // console.log(`Results: ${results}`);
//       console.log(
//         `Time to send ${numOfMessages} messages and receive last response: ${durationMs.toFixed(2)} ms`,
//       );
//     }
//   } else {
//     clearInterval(interval);
//   }
// }, 1);

// Function to demonstrate main thread is not blocked
// function showMainThreadIsActive() {
//   const interval = setInterval(() => {
//     console.log("Main thread is still active...");
//   }, 200); // Reduced to 200ms for more frequent logging
//   return () => clearInterval(interval);
// }

// // Test the multithreaded function
// function testMultithreading() {
//   console.log("Starting test...");
//   const stopInterval = showMainThreadIsActive();
//   console.log("Interval started");

//   return new Promise((resolve, reject) => {
//     addon.callThreadsafeFunction(
//       (ignore, num) => {
//         console.log(`Callback received: ${num}`);
//       },
//       (result) => {
//         console.log("Resolve called");
//         resolve(result);
//       },
//       (error) => {
//         console.log("Reject called");
//         reject(error);
//       },
//     );
//   })
//     .then((result) => {
//       console.log(`Promise resolved with: ${result}`);
//     })
//     .catch((error) => {
//       console.error(`Promise rejected with: ${error}`);
//     })
//     .finally(() => {
//       console.log("Stopping interval");
//       stopInterval();
//     });
// }

// testMultithreading().then(() => console.log("Test completed"));

// async function test() {
//   try {
//     console.log("Waiting for promise...");
//     const result = await addon.createPromise();
//     console.log("Promise resolved with:", result);
//   } catch (error) {
//     console.error("Promise rejected with:", error);
//   }
// }

// test();

async function abc() {
  const fx = 20;
  const result = await addon.asyncPromise(
    new Promise((resolve) => {
      setTimeout(() => resolve(fx), 50);
    }),
  );
  console.log(result); // 120
}

abc();
