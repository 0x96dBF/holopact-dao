#! /bin/sh

npm install &&
    truffle compile --contracts_directory ./migration_contract --contracts_build_directory /build --network development
