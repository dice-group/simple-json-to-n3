# Simple JSON to N3 converter

A simple conversion script that takes a folder of files that contain JSON as input, and produces a single N3 file as output.

## Requirements

Requires Node.js v10.16.0 or later.

## Usage

1. Create new `json-to-n3.config.js` next to a folder with data that needs to be processed
2. Edit `json-to-n3.config.js` and specify:

- `sourcePath` - path to the folder with input files
- `resultPath` - path to the resulting N3 file
- `format` - format to be used for serialization (defaults to N-Triples)
- `prefixes` - object of prefixes to be used
- `processItem()` - processing function that takes JSON structure and writes it as quads

3. Execute the script by running `npx simple-json-to-n3` in the folder with config

See [example folder](./example) for an example config that processes slice of an [OAG](https://www.openacademic.ai/oag/) dataset.

## Caveats

The script assumes input files have one JSON object per string.  
Originally made for parsing [Open Academic Graph](https://www.openacademic.ai/oag/).
