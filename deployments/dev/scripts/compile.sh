#! /bin/sh

npm install > "/dev/null" 2>&1 &&
    truffle compile --contracts_build_directory /build --network development
