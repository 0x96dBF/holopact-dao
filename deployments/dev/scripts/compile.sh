#! /bin/sh

npm install > "/dev/null" 2>&1 &&
    rm -rf /build/* &&
    truffle compile --all --contracts_build_directory /build --network development
