import PropTypes from "prop-types";
import "./QaBar.css";
import QaDataRenderer from "./QaDataRenderer";
import Papa from 'papaparse';
import { useState, useEffect } from 'react';
import { useMap } from "react-map-gl/maplibre";
import { useDropzone } from 'react-dropzone';

// This component sits below the header navbar, but above the map. It contains pertinent information for the QA Table
export default function QaBar({viewState, setViewState, activeOsmFeature, setActiveOsmFeature}) {
  
  const { leftMap, rightMap } = useMap();

 
  const [jsonContents, setJsonContents] = useState({});
  const [fileParsed, setFileParsed] = useState(false);
  const [textFilter, setTextFilter] = useState('');
  const [debouncedTextFilter, setDebouncedTextFilter] = useState(textFilter);

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedTextFilter(textFilter);
    }, 300); // Adjust the delay as needed (e.g., 300ms)

    return () => clearTimeout(delay);
  }, [textFilter]);

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
    download: true,
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

      // Effect to load the CSV file automatically when component mounts
    // useEffect(() => {
    //   const csvUrl = "https://s3.us-west-2.amazonaws.com/overturemaps-qa-tiles/nightlies/ds=2025-04-25/adjudicator_ops.csv";
    //   Papa.parse(csvUrl, papaconfig);
    // }, []);  // Empty dependency array means this runs once on mount
    useEffect(() => {
      async function fetchLatestData() {
        try {
          // First fetch the latest datestamp
          const response = await fetch("https://s3.us-west-2.amazonaws.com/overturemaps-qa-tiles/nightlies/latest_ds.txt");
          if (!response.ok) {
            throw new Error(`Failed to fetch latest datestamp: ${response.status}`);
          }

          // Get the datestamp from the response
          const datestamp = await response.text();
          const trimmedDatestamp = datestamp.trim(); // Remove any whitespace

          // Construct the CSV URL using the datestamp
          const csvUrl = `https://s3.us-west-2.amazonaws.com/overturemaps-qa-tiles/nightlies/ds=${trimmedDatestamp}/adjudicator_ops.csv`;
          console.log("Getting csv from ", csvUrl)

          // Parse the CSV from the constructed URL
          Papa.parse(csvUrl, papaconfig);
        } catch (error) {
          console.error("Error fetching data:", error);
          setIsLoading(false);
        }
      }

      fetchLatestData();
    }, []);  // Empty dependency array means this runs once on mountko

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
      <>
        <input
          disabled={!fileParsed}
          type="text"
          placeholder="Type filter text here"
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
        />
        <nav aria-label="Qa Info" className="qa-bar qabar--fixed-top">
          <table className={"qa-bar__inner " + (fileParsed ? "drop" : "nodrop")}  {...getRootProps()}>
            <input {...getInputProps()} />
              <QaDataRenderer fileParsed={fileParsed} jsonContents={jsonContents} viewState={viewState} setViewState={setViewState} activeOsmFeature={activeOsmFeature} setActiveOsmFeature={setActiveOsmFeature} textFilter={debouncedTextFilter}/>
          </table>
        </nav>
        </>
          );

  }

  QaBar.propTypes = {
    viewState: PropTypes.object.isRequired,
    setViewState: PropTypes.func.isRequired,
  };
  