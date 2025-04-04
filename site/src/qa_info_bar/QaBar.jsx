import PropTypes from "prop-types";
import "./QaBar.css";
import QaDataRenderer from "./QaDataRenderer";
import Papa from 'papaparse';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

// This component sits below the header navbar, but above the map. It contains pertinent information for the QA Table
export default function QaBar() {

  const [jsonContents, setJsonContents] = useState({});
  const [fileParsed, setFileParsed] = useState(false);

    function readDone(results, file) {
      setJsonContents(results.data);
      setFileParsed(true);
      console.log("Parsing complete:", results.data, file);
    }

    const papaconfig = {
    delimiter: "",	// auto-detect
    newline: "",	// auto-detect
    quoteChar: '"',
    escapeChar: '"',
    header: false,
    transformHeader: undefined,
    dynamicTyping: false,
    preview: 0,
    encoding: "",
    worker: false,
    comments: false,
    step: undefined,
    complete: readDone,
    error: undefined,
    download: false,
    downloadRequestHeaders: undefined,
    downloadRequestBody: undefined,
    skipEmptyLines: false,
    chunk: undefined,
    chunkSize: undefined,
    fastMode: undefined,
    beforeFirstChunk: undefined,
    withCredentials: undefined,
    transform: undefined,
    delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP],
    skipFirstNLines: 0
    };

    function parseCsv (fileResult) {
      Papa.parse(fileResult, papaconfig);
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: acceptedFiles => {
          // Handle the accepted files here
          parseCsv(acceptedFiles[0]);
      }
    });

    return (
      <nav aria-label="Qa Info" className="qa-bar qabar--fixed-top">
        <div className="qa-bar__inner nodrop" {...getRootProps()}>
          <input {...getInputProps()} />
            <QaDataRenderer fileParsed={fileParsed} jsonContents={jsonContents}/>
        </div>
      </nav>
    );

  }

  QaBar.propTypes = {
    mode: PropTypes.string.isRequired,
    setMode: PropTypes.func.isRequired,
  };
  