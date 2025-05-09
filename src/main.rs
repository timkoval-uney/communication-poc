use std::io::{Read, Write};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::Path;

fn handle_client(mut stream: UnixStream) {
    let mut buffer = [0; 1024];
    loop {
        match stream.read(&mut buffer) {
            Ok(0) => break, // Connection closed
            Ok(n) => {
                // Echo back the received message
                if let Err(e) = stream.write_all(&buffer[..n]) {
                    eprintln!("Failed to write to socket: {}", e);
                    break;
                }
                if let Err(e) = stream.flush() {
                    eprintln!("Failed to flush socket: {}", e);
                    break;
                }
            }
            Err(e) => {
                eprintln!("Failed to read from socket: {}", e);
                break;
            }
        }
    }
}

fn main() {
    let socket_path = "./socket/demo.sock";

    // Remove existing socket file if it exists
    if Path::new(socket_path).exists() {
        std::fs::remove_file(socket_path).expect("Failed to remove existing socket");
    }

    let listener = UnixListener::bind(socket_path).expect("Failed to bind to socket");
    println!("Server listening on {}", socket_path);

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                std::thread::spawn(|| handle_client(stream));
            }
            Err(e) => {
                eprintln!("Error accepting connection: {}", e);
            }
        }
    }
}
