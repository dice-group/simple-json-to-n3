// npm packages
const fs = require('fs');
const path = require('path');
const _ = require('highland');
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const dateFns = require('date-fns');
const stopwords = require('./stopwords');
const {
  Writer,
  DataFactory: {namedNode, literal, quad},
} = require('n3');

// simple MD5 hashing function
const hash = str =>
  crypto
    .createHash('md5')
    .update(str)
    .digest('hex');

// writes quad to writer with language if given
const writeQuad = (writer, s, p, o, lang) => {
  if (!o) {
    return;
  }

  let obj = literal(o);
  if (lang) {
    obj = literal(o, lang);
  }
  writer.addQuad(quad(namedNode(s), namedNode(p), obj));
};

// converts year string to ISO format
const parseYear = yearStr => dateFns.parse(yearStr).toISOString();

// detects string language
const detectLang = (str, defaultLang) => {
  // for now just returns default language and assumes all
  // strings without language are in default language
  return defaultLang;
};

// Appends resulting string to file
const saveToFile = (writer, resultFilename) =>
  new Promise((resolve, reject) => {
    writer.end((error, result) => {
      if (error) {
        reject(error);
      }
      // remove prefixes
      const toWrite = result.replace(/@prefix(.+?)\n/g, '');
      fs.appendFileSync(resultFilename, toWrite);
      resolve();
    });
  });

const util = {quad, namedNode, writeQuad, parseYear, detectLang, hash, uuidv4, stopwords};

module.exports = config => {
  // counter for processed items
  let processedItems = 0;

  // Load list of files from given source path
  const folder = path.join(process.cwd(), config.sourcePath);
  console.log('\nUsing source folder:', folder);
  const files = fs.readdirSync(folder);
  console.log('\nProcessing files:', files);

  // Create result file path
  const resultFilename = path.join(process.cwd(), config.resultPath);
  console.log('\nResult will be saved to:', resultFilename);

  const writerConfig = {
    format: config.format || 'N-Triples',
    prefixes: {
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      foaf: 'http://xmlns.com/foaf/0.1/',
      ...config.prefixes,
    },
  };
  console.log('\nUsing config:', writerConfig);

  // create new result file and write prefixes (if using fitting format)
  const prefixWriter = new Writer(writerConfig);
  prefixWriter.end((err, result) => {
    // re-throw error and crash if present
    if (err) {
      console.error('\nError saving prefixes:', err);
      process.exit(1);
    }
    // write prefixes to file
    fs.writeFileSync(resultFilename, result);
    console.log('\nPrefixes saved, starting work..');
  });

  _(files)
    .map(filename => path.join(folder, filename))
    .flatMap(filepath =>
      _(fs.createReadStream(filepath))
        .splitBy('\n')
        .filter(line => line && line.length > 0)
        .map(line => JSON.parse(line))
    )
    .flatMap(item => {
      const writer = new Writer(writerConfig);
      const lang = item.lang ? item.lang.split('@')[0] : undefined;
      // use config processing function to parse the data
      config.processItem({...util, item, writer, lang});
      return _(saveToFile(writer, resultFilename));
    })
    .each(data => {
      processedItems++;
      console.log(`Item processed. Processed ${processedItems} items so far..`);
    })
    .on('error', err => {
      console.error('Error processing item:', err);
    })
    .done(() => {
      console.log(`Done processing! Processed ${processedItems} items in total!`);
    });
};
