#!/usr/bin/env bash

# SEO Analysis Script
# This script analyzes the SEO of a given URL using a Node.js script.
# Usage: ./SEO.sh <url>
# Example: ./SEO.sh https://example.com
# Make sure you have Node.js installed and the required packages by running:
# npm install
# The script will output the SEO analysis report to the console.

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <url> <action>"
    exit 1
fi
URL=$1
ACTION=$2
if [ -z "$URL" ]; then
    echo "Error: URL cannot be empty."
    exit 1
fi
if [ -z "$ACTION" ]; then
    echo "Error: Action cannot be empty."
    exit 1
fi
if ! [[ "$ACTION" =~ ^(crawl|analyze)$ ]]; then
    echo "Error: Action must be either 'crawl' or 'analyze'."
    exit 1
fi
if  [[ "$ACTION" =~ ^(crawl)$ ]]; then
    node crawler.js "$URL" "$ACTION"
    exit 1
else
    node cli.js "$URL" "$ACTION"
    exit 1
fi

