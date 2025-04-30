use std::{
    sync::{Arc, Mutex},
    thread::{self, sleep},
    time::Duration,
};

use napi::{
    AsyncWorkPromise, Env, JsFunction, JsObject, JsString, JsUnknown, Result, Status,
    bindgen_prelude::AsyncTask,
    sys::{napi_callback_info__, napi_env__, napi_get_undefined, napi_value__},
    threadsafe_function::{
        ErrorStrategy, ThreadSafeCallContext, ThreadsafeFunction, ThreadsafeFunctionCallMode,
    },
};
use napi_derive::napi;

#[napi]
fn call_js_callback(callback: JsFunction) -> Result<()> {
    callback.call::<JsString>(None, &[])?;
    Ok(())
}

#[napi]
fn call_js_callback_with_args(env: Env, callback: JsFunction) -> Result<()> {
    // Create JavaScript arguments
    let arg1 = env.create_string("Hello from Rust")?;
    let arg2 = env.create_int32(42)?;

    // Call the JavaScript function with arguments
    callback.call(None, &[arg1.into_unknown(), arg2.into_unknown()])?;

    Ok(())
}

#[napi]
fn call_js_callback_with_return(env: Env, callback: JsFunction) -> Result<String> {
    // Call the JavaScript function
    let result = callback.call::<JsString>(None, &[])?;

    // Convert the result to a string (assuming it returns a string)
    let result_str = result.coerce_to_string()?.into_utf8()?.into_owned()?;

    Ok(result_str)
}

#[napi]
pub fn call_threadsafe_function(
    env: Env,
    callback: JsFunction,
    resolve: JsFunction,
    reject: JsFunction,
) -> Result<JsUnknown> {
    // Create a shared counter to track completed threads
    let counter = Arc::new(Mutex::new(0));
    let total_threads = 10;

    // Create a thread-safe function for the callback
    let tsfn: ThreadsafeFunction<u32, ErrorStrategy::CalleeHandled> = callback
        .create_threadsafe_function(0, |ctx| {
            sleep(Duration::from_millis(500));
            ctx.env.create_uint32(ctx.value + 1).map(|v| vec![v])
        })?;

    // Create thread-safe functions for resolve and reject
    let resolve_tsfn: ThreadsafeFunction<(), ErrorStrategy::CalleeHandled> = resolve
        .create_threadsafe_function(0, |ctx: ThreadSafeCallContext<()>| {
            let result = ctx.env.create_string("All threads completed")?;
            Ok(vec![result.into_unknown()])
        })?;

    let reject_tsfn: ThreadsafeFunction<(), ErrorStrategy::CalleeHandled> = reject
        .create_threadsafe_function(0, |ctx: ThreadSafeCallContext<()>| {
            let error = ctx.env.create_string("Thread execution failed")?;
            Ok(vec![error.into_unknown()])
        })?;

    // Spawn worker threads
    for n in 0..total_threads {
        let tsfn = tsfn.clone();
        let counter_clone = Arc::clone(&counter);
        thread::spawn(move || {
            // Simulate some work (e.g., sleep for 100ms)
            thread::sleep(Duration::from_secs(5));
            // Call the JavaScript callback
            tsfn.call(Ok(n), ThreadsafeFunctionCallMode::NonBlocking);
            // Increment the counter
            let mut count = counter_clone.lock().unwrap();
            *count += 1;
        });
    }

    // Spawn a monitoring thread to check when all threads are done
    let counter_clone = Arc::clone(&counter);
    thread::spawn(move || {
        loop {
            let count = *counter_clone.lock().unwrap();
            if count == total_threads {
                // All threads are done, call resolve
                resolve_tsfn.call(Ok(()), ThreadsafeFunctionCallMode::NonBlocking);
                break;
            }
            thread::sleep(Duration::from_millis(50)); // Check every 50ms
        }
    });

    // Create a JavaScript Promise
    let global = env.get_global()?;
    let promise_constructor = global.get_named_property::<JsFunction>("Promise")?;

    // Define the executor function as a C-style callback
    extern "C" fn executor_callback(
        raw_env: *mut napi_env__,
        _cb_info: *mut napi_callback_info__,
    ) -> *mut napi_value__ {
        unsafe {
            let mut undefined: *mut napi_value__ = std::ptr::null_mut();
            napi_get_undefined(raw_env, &mut undefined);
            undefined
        }
    }
    let executor = env.create_function("executor", executor_callback)?;
    let promise = promise_constructor.new_instance(&[executor.into_unknown()])?;

    Ok(promise.into_unknown())
}

#[napi]
pub async fn create_promise() -> Result<String> {
    // Create a task that will run asynchronously
    // Simulate some work with a sleep
    std::thread::sleep(std::time::Duration::from_millis(1000));
    Ok(String::from("Hello from Rust Promise!"))
}
