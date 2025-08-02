#!/usr/bin/env bash

export MODRINTH_CHANGELOG="$@"

# Publish to modrinth
./gradlew modrinth
