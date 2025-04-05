import PropTypes from "prop-types";

export default function QaDataRenderer({fileParsed, jsonContents, viewState, setViewState}) {
  // const header = jsonContents[0];
  // const data = jsonContents.slice(1);

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
              <QaRowRenderer headers={headers} rows={rowData} viewState={viewState} setViewState={setViewState}></QaRowRenderer> : 
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


function QaRowRenderer({headers, rows, viewState, setViewState}){
  
  let locIndex;
  if (headers.includes('map_loc')){
    locIndex = headers.indexOf('map_loc');
  }

  function setLocation(locHashString) {

    const locItems = locHashString.split('/');
    const zoom = locItems[0];
    const lat = locItems[1];
    const lng = locItems[2];
    setViewState({zoom: zoom, latitude: lat, longitude: lng});
  }
  
  
  return (

    rows.map((row, i) => {
      return(
        <tr key={i + row[2]} className="qadata-rows">
        {
          row.map((rowItem, j) => {
            if (j === locIndex) {
              return (
                <td 
                  key={rowItem} 
                  className="qadata-row-item" 
                >
                  <a onClick={() => setLocation(rowItem)}>jump to location</a>
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

