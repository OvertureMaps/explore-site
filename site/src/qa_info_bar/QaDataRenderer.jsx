import PropTypes from "prop-types";
import { useState } from "react"
export default function QaDataRenderer({fileParsed, jsonContents, viewState, setViewState,  activeOsmFeature, setActiveOsmFeature}) {
  // const header = jsonContents[0];
  // const data = jsonContents.slice(1);

  const [selRow, setSelRow] = useState(-1);

    if (fileParsed ) {
      const headers = jsonContents[0];
      const rowData = jsonContents.slice(1);
      return (    
        <>
          <tr className="qadata-container ">
            <tr className="qadata-header">
              {headers.map(header => 
                <th key={header} className="qadata-header-item"> 
                  {header}
                </th>
              )}
            </tr>
            { rowData ? 
              <QaRowRenderer headers={headers} rows={rowData} viewState={viewState} setViewState={setViewState} selectedRow={selRow} setSelectedRow={setSelRow}activeOsmFeature={activeOsmFeature} setActiveOsmFeature={setActiveOsmFeature} /> : 
              <></>
            }
          </tr>
        </>
      );
    } else {
      return <></>
    }
  
}

QaDataRenderer.propTypes = {  
  jsonContents: PropTypes.array,
  fileParsed: PropTypes.bool.isRequired,
  viewState: PropTypes.object.isRequired,
  setViewState: PropTypes.func.isRequired,
};


function QaRowRenderer({headers, rows, viewState, setViewState, selectedRow, setSelectedRow, activeOsmFeature, setActiveOsmFeature}){
  
  let locIndex, osmIndex;
  if (headers.includes('map_loc')){
    locIndex = headers.indexOf('map_loc');
  }

  if (headers.includes('id')){
    osmIndex = headers.indexOf('id');
  }


  const selectRow = (i) => {
    setSelectedRow(i);

    if (osmIndex){
      setActiveOsmFeature(rows[i][osmIndex])
    }
  }

  const setLocation = (locHashString, index) => {
    const locItems = locHashString.split('/');
    const zoom = locItems[0];
    const lat = locItems[1];
    const lng = locItems[2];
    setViewState({zoom: zoom, latitude: lat, longitude: lng});
    setSelectedRow(index);
  }
  
  
  return (

    rows.map((row, i) => {
      return(
        <tr key={i + row[2]} className={ "qadata-rows"  + ((selectedRow === i) ? " highlight" : "")} onClick={() => selectRow(i)}>
        {
          row.map((rowItem, j) => {
            if (j === locIndex) {
              return (
                <td 
                  key={rowItem} 
                  className="qadata-row-item" 
                >
                  <a onClick={() => setLocation(rowItem, i)}>jump to location</a>
                </td>
              )
            }else {
              return (
                <td 
                  key={rowItem} 
                  className="qadata-row-item" 
                >
                  {rowItem}
                </td>
              )
            }
          }
          )
        }
        </tr>  
      )
    })
  )

}

