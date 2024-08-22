import manifest from './07-22-manifest.json';

const awsbasepath = 'https://overturemaps-us-west-2.s3.amazonaws.com/release/';

/**
 * 
 * @param {*} bbox 
 * @param {*} visibleThemes 
 * @returns an object with the 'basepath' and array of filespecs 'files' */
export function getDownloadCatalog(bbox, visibleThemes){
   let fileCatalog = {};
   let filenames = [];

   const versionPath = awsbasepath + manifest.version;

   fileCatalog.basePath = versionPath;
   manifest.themes.forEach( theme => {
      // If the theme isn't visible, don't download it. 
         if (!visibleThemes.includes(theme.name)){
            return;
         }

         theme.types.forEach(type => {
            type.files.forEach(file => {
               let newName = `${theme.relative_path}${type.relative_path}/${file.name}`
               if (intersects(bbox, file.bbox)) {
                  filenames.push( newName )
               }
            })
         })
      }
   )

   fileCatalog.files = filenames;
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
