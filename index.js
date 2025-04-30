const addon = require("./target/debug/libcommunication_poc.node");

// function testCallback() {
//   console.log("Callback invoked from Rust!");
// }

// addon.callJsCallback(testCallback);

// addon.callJsCallbackWithArgs((str, num) => {
//   console.log(`Received: ${str}, ${num}`);
// });

// // Test callback with return value
// const result = addon.callJsCallbackWithReturn(() => {
//   return "Hello from JavaScript!";
// });
// console.log(`Callback returned: ${result}`);

// Function to demonstrate main thread is not blocked
function showMainThreadIsActive() {
  const interval = setInterval(() => {
    console.log("Main thread is still active...");
  }, 200); // Reduced to 200ms for more frequent logging
  return () => clearInterval(interval);
}

// Test the multithreaded function
function testMultithreading() {
  console.log("Starting test...");
  const stopInterval = showMainThreadIsActive();
  console.log("Interval started");

  return new Promise((resolve, reject) => {
    addon.callThreadsafeFunction(
      (ignore, num) => {
        console.log(`Callback received: ${num}`);
      },
      (result) => {
        console.log("Resolve called");
        resolve(result);
      },
      (error) => {
        console.log("Reject called");
        reject(error);
      },
    );
  })
    .then((result) => {
      console.log(`Promise resolved with: ${result}`);
    })
    .catch((error) => {
      console.error(`Promise rejected with: ${error}`);
    })
    .finally(() => {
      console.log("Stopping interval");
      stopInterval();
    });
}

testMultithreading().then(() => console.log("Test completed"));

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
