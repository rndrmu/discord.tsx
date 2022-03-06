use wasm_bindgen::prelude::*;
use std::net::UdpSocket;




#[wasm_bindgen]
pub fn start_server(ip: String, port: u16) -> Option<String> {
    let socket = UdpSocket::bind(format!("{}:{}", ip, port)).unwrap();
    let mut buf = [0u8; 1024];

    Some("no".to_string())
}

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

