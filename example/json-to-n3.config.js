module.exports = {
  // define path to source data
  sourcePath: './data',
  // define path and name of the result file
  resultPath: './results.n3',
  // define output format (see N3.js for more formats)
  format: 'N-Triples',
  // define prefixes used during transformation
  prefixes: {
    exy: 'https://mag.exynize.org/',
    exyArticle: 'https://mag.exynize.org/article/',
    exyAuthor: 'https://mag.exynize.org/author/',
    exyOrg: 'https://mag.exynize.org/organization/',
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    foaf: 'http://xmlns.com/foaf/0.1/',
  },
  // define processing function that converts JSON to N3
  processItem({item, writer, quad, namedNode, writeQuad, parseYear, detectLang, lang, hash, uuidv4, stopwords}) {
    writer.addQuad(quad(namedNode(`exyArticle:${item.id}`), namedNode('rdf:type'), namedNode('exy:Publication')));

    writeQuad(writer, `exyArticle:${item.id}`, 'exy:docType', item.doc_type);
    writeQuad(writer, `exyArticle:${item.id}`, 'rdfs:label', item.title, lang);
    writeQuad(writer, `exyArticle:${item.id}`, 'rdfs:comment', item.abstract, lang);

    writeQuad(writer, `exyArticle:${item.id}`, 'exy:year', parseYear(`${item.year}Z`), {
      value: 'http://www.w3.org/2001/XMLSchema#dateTime',
    });
    writeQuad(writer, `exyArticle:${item.id}`, 'exy:citationNumber', parseInt(item.n_citation));
    writeQuad(writer, `exyArticle:${item.id}`, 'exy:pageStart', parseInt(item.page_start));
    writeQuad(writer, `exyArticle:${item.id}`, 'exy:pageEnd', parseInt(item.page_end));

    writeQuad(writer, `exyArticle:${item.id}`, 'exy:publisher', item.publisher, lang);
    writeQuad(writer, `exyArticle:${item.id}`, 'exy:volume', parseInt(item.volume));
    writeQuad(writer, `exyArticle:${item.id}`, 'exy:issue', parseInt(item.issue));

    writeQuad(writer, `exyArticle:${item.id}`, 'exy:issn', item.issn);
    writeQuad(writer, `exyArticle:${item.id}`, 'exy:isbn', item.isbn);
    writeQuad(writer, `exyArticle:${item.id}`, 'exy:doi', encodeURI(item.doi));
    writeQuad(writer, `exyArticle:${item.id}`, 'exy:pdf', encodeURI(item.pdf));

    if (item.keywords && item.keywords.length) {
      item.keywords.forEach(keyword => {
        // skip words from stopwords
        if (stopwords.includes(keyword.toLowerCase())) {
          return;
        }
        writeQuad(writer, `exyArticle:${item.id}`, 'exy:keyword', keyword, detectLang(keyword, lang));
      });
    }
    if (item.url && item.url.length) {
      item.url.forEach(url => {
        writer.addQuad(quad(namedNode(`exyArticle:${item.id}`), namedNode('exy:url'), namedNode(encodeURI(url))));
      });
    }
    if (item.fos && item.fos.length) {
      item.fos.forEach(field => {
        writeQuad(writer, `exyArticle:${item.id}`, 'exy:fieldOfStudy', field);
      });
    }
    if (item.authors && item.authors.length) {
      item.authors.forEach(author => {
        const authorUrl = uuidv4();
        writer.addQuad(
          quad(namedNode(`exyArticle:${item.id}`), namedNode('exy:author'), namedNode(`exyAuthor:${authorUrl}`))
        );
        writer.addQuad(quad(namedNode(`exyAuthor:${authorUrl}`), namedNode('rdf:type'), namedNode('foaf:Person')));
        writer.addQuad(quad(namedNode(`exyAuthor:${authorUrl}`), namedNode('rdf:type'), namedNode('exy:Author')));
        writeQuad(writer, `exyAuthor:${authorUrl}`, 'foaf:name', author.name);
        if (author.org) {
          const orgHash = hash(author.org);
          writer.addQuad(quad(namedNode(`exyOrg:${orgHash}`), namedNode('rdf:type'), namedNode('foaf:Organization')));
          writer.addQuad(quad(namedNode(`exyOrg:${orgHash}`), namedNode('rdf:type'), namedNode('exy:Organization')));
          writeQuad(writer, `exyOrg:${orgHash}`, 'rdfs:label', author.org);
          writer.addQuad(
            quad(namedNode(`exyAuthor:${authorUrl}`), namedNode('foaf:member'), namedNode(`exyOrg:${orgHash}`))
          );
        }
      });
    }
  },
};
