#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const processWithConfig = require('../src');

const userConfigPath = path.join(process.cwd(), 'json-to-n3.config.js');

// make sure config exists
if (!fs.existsSync(userConfigPath)) {
  console.error('Error! Processing config not found! Make sure json-to-n3.config.js exists in current folder.');
  process.exit(1);
}

// load user config
const userConfig = require(userConfigPath);
// start processing
processWithConfig(userConfig);
