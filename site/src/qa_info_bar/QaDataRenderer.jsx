import PropTypes from "prop-types";

export default function QaDataRenderer({fileParsed, jsonContents}) {
  // const header = jsonContents[0];
  // const data = jsonContents.slice(1);

    if (fileParsed ) {
      const headers = jsonContents[0];
      const rowData = jsonContents.slice(1);
      return (    
        <div className="qadata-container">
          <div className="qadata-headers">
            {headers.map(header => 
              <div key={header} className="qadata-header"> 
                {header}
              </div>
            )}
          </div>
          <div className="qadata-item">
          </div>
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
