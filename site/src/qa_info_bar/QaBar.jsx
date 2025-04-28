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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Searching for the latest data file...");

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedTextFilter(textFilter);
    }, 300); // Adjust the delay as needed (e.g., 300ms)

    return () => clearTimeout(delay);
  }, [textFilter]);

    function readDone(results, _) {
      setJsonContents(results.data);
      setFileParsed(true);      
      setIsLoading(false);
      setLoadingStatus("");
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

  // Function to format date as YYYY-MM-DD
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  let retriedDownload = false;

  // Function to get a date N days ago
  function getDateNDaysAgo(n) {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date;
  }

    // Effect to load the CSV file automatically when component mounts
  useEffect(() => {
    async function tryFetchWithDate(daysAgo) {
      if (daysAgo > 7) {
        setLoadingStatus("Failed to find data for the past 7 days.");
        setIsLoading(false);
        return;
      }

      const dateToTry = getDateNDaysAgo(daysAgo);
      const formattedDate = formatDate(dateToTry);
      const csvUrl = `https://s3.us-west-2.amazonaws.com/overturemaps-qa-tiles/nightlies/ds=${formattedDate}/adjudicator_ops.csv`;

      setLoadingStatus(`Checking for data from ${formattedDate}...`);

      try {
        // Try to fetch the head of the file to see if it exists
        const response = await fetch(csvUrl, { method: 'HEAD' });

        if (response.ok) {
          // File exists, parse it
          setLoadingStatus(`Found data for ${formattedDate}, loading...`);
          Papa.parse(csvUrl, papaconfig);
        } else {
          // File doesn't exist, try the previous day
          tryFetchWithDate(daysAgo + 1);
        }
      } catch (error) {
        // Network error or CORS issue, try the previous day
        console.warn(`Error checking ${formattedDate}:`, error);
      }
    }

    // Start with today (0 days ago)
    tryFetchWithDate(0);
  }, []);


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
