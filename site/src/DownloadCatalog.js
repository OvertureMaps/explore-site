import manifest from './manifests/2025-04-23.json';

const awsbasepath = 'https://overturemaps-us-west-2.s3.amazonaws.com/release/';

/**
 * 
 * @param {*} bbox 
 * @param {*} visibleTypes an array of type names that are currently visible on the map
 * @returns an object with the 'basepath' and array of filespecs 'files' */
export function getDownloadCatalog(bbox, visibleTypes){
   let fileCatalog = {};
   let types = [];

   const versionPath = awsbasepath + manifest.release_version;

   fileCatalog.basePath = versionPath;
   manifest.themes.forEach( theme => {
      // If the theme isn't visible, don't download it. 
         theme.types.forEach(type => {
            if (!visibleTypes.includes(type.name)){
               return;
            }
            let typeEntry = {};
         typeEntry.files = [];
           
            type.files.forEach(file => {
               typeEntry.name = type.name;

                  let newName = `${theme.relative_path}${type.relative_path}/${file.name}`
               if (intersects(bbox, file.bbox)) {
                  typeEntry.files.push( newName )
               }
            })
            if (typeEntry.files.length > 0) {
               types.push(typeEntry);
            }
         })
      }
   )

   fileCatalog.types = types;
   return fileCatalog;
}


// Calculate intersection given 4-item bbox list of [minx, miny, maxx, maxy]
function intersects(bb1, bb2) {
   return (
      bb1[0] < bb2[2] && 
      bb1[2] > bb2[0] && 
      bb1[1] < bb2[3] && 
      bb1[3] > bb2[1]
   );
}
