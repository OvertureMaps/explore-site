import { getStacData } from "./stacService";

// Cache the manifest to avoid repeated fetches
let cachedManifest = null;
let manifestFetchPromise = null;

/**
 * Fetches the manifest from the STAC catalog
 * @returns {Promise<Object>} The manifest object
 */
async function fetchManifest() {
  if (cachedManifest) {
    return cachedManifest;
  }

  if (!manifestFetchPromise) {
    manifestFetchPromise = getStacData()
      .then(stacData => {
        // Construct manifest URL from the release URL
        const manifestUrl = new URL("manifest.geojson", stacData.releaseUrl).href;
        return fetch(manifestUrl);
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        cachedManifest = data.features.map((f)=>{
         return {
            'type': f.properties.ovt_type,
            'bbox': f.bbox,
            'path': f.properties.rel_path
         }
        });
        return cachedManifest;
      })
      .catch(error => {
        console.error('Error fetching manifest:', error);
        manifestFetchPromise = null; // Allow retry on next call
        throw error;
      });
  }

  return manifestFetchPromise;
}

/**
 * Gets the download catalog based on the current bbox and visible types
 * @param {Array} bbox The bounding box [minx, miny, maxx, maxy]
 * @param {Array} visibleTypes An array of type names that are currently visible on the map
 * @returns {Promise<Object>} A promise that resolves to an object with the 'basePath' and array of 'types'
 */
export async function getDownloadCatalog(bbox, visibleTypes) {
  try {
    const manifest = await fetchManifest();

    let fileCatalog = {};
    let types = {};

   //  Create types mapping
    visibleTypes.forEach((type) => {
      types[type] = {
         'name' : type,
         'files': []
      }
    })

    fileCatalog.basePath = 'https://overturemaps-us-west-2.s3.amazonaws.com/'

    manifest.forEach(file => {
      // First, check if we want this type
      if (visibleTypes.includes(file.type)){
        //Now check if the file intersects the bbox
        if (intersects(bbox, file.bbox)) {
          types[file.type].files.push(file.path);
        }
      }
    });

    fileCatalog.types = Object.values(types);
    return fileCatalog;
  } catch (error) {
    console.error('Error getting download catalog:', error);
    throw error;
  }
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
