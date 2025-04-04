import PropTypes from "prop-types";

export default function QaDataRenderer({fileParsed, jsonContents}) {
  // const header = jsonContents[0];
  // const data = jsonContents.slice(1);

    if (fileParsed ) {
      const headers = jsonContents[0];
      const rowData = jsonContents.slice(1);
      return (    
        <div className="qadata-container">
          <div className="qadata-header">
            {headers.map(header => 
              <div key={header} className="qadata-header-item"> 
                {header}
              </div>
            )}
          </div>
          { rowData ? 
            <QaRowRenderer rows={rowData}></QaRowRenderer> : 
            <></>
          }
        </div>
      );
    } else {
      return <></>
    }
  
}

QaDataRenderer.propTypes = {
  jsonContents: PropTypes.array,
  fileParsed: PropTypes.bool.isRequired,
};


function QaRowRenderer({rows}){
    return (

    rows.map(row => {
      return(
        <div key={row[0] + row[1]} className="qadata-rows">
        {
          row.map(rowItem => 
            <div key = {rowItem} className="qadata-row-item">
              {rowItem}
              </div>
          )
        }
        </div>  
      )
    })
  )

}