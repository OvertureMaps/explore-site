import PropTypes from "prop-types";
import "./QaBar.css";
import QaDataRenderer from "./QaDataRenderer";
import Papa from 'papaparse';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

// This component sits below the header navbar, but above the map. It contains pertinent information for the QA Table
export default function QaBar({viewState, setViewState}) {

  const [jsonContents, setJsonContents] = useState({});
  const [fileParsed, setFileParsed] = useState(false);

    function readDone(results, _) {
      setJsonContents(results.data);
      setFileParsed(true);
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
      },
      noClick: true
    });

    return (
      <nav aria-label="Qa Info" className="qa-bar qabar--fixed-top">
        <table className={"qa-bar__inner " + (fileParsed ? "drop" : "nodrop")}  {...getRootProps()}>
          <input {...getInputProps()} />
            <QaDataRenderer fileParsed={fileParsed} jsonContents={jsonContents} viewState={viewState} setViewState={setViewState} />
        </table>
      </nav>
    );

  }

  QaBar.propTypes = {
    viewState: PropTypes.object.isRequired,
    setViewState: PropTypes.func.isRequired,
  };
  