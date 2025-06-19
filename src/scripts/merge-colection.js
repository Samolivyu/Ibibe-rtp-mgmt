const fs = require('fs');
const path = require('path');

const mergeCollections = () => {
  const swaggerImport = JSON.parse(fs.readFileSync('postman/swagger-import.json'));
  const mainCollection = JSON.parse(fs.readFileSync('postman/RTP-Gaming-API.postman_collection.json'));
  
  // Merge endpoints
  swaggerImport.item.forEach(endpoint => {
    if (!mainCollection.item.some(e => e.name === endpoint.name)) {
      mainCollection.item.push(endpoint);
    }
  });
  
  // Save merged collection
  fs.writeFileSync(
    'postman/RTP-Gaming-API.postman_collection.json',
    JSON.stringify(mainCollection, null, 2)
  );
};

mergeCollections();