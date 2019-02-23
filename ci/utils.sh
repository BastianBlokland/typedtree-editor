#!/bin/bash
set -e

info ()
{
    echo "INFO: $1"
}

warn ()
{
    echo "WARN: $1"
}

fail ()
{
    echo $1 >&2
    exit 1
}

hasCommand ()
{
    if [ -x "$(command -v $1)" ]
    then
        return 1
    fi
    return 0
}

doesntHaveCommand ()
{
    if hasCommand $1
    then
        return 0
    fi
    return 1
}

verifyCommand ()
{
    if doesntHaveCommand $1
    then
        fail "Dependency '$1' is missing, we cannot continue without it"
    fi
}