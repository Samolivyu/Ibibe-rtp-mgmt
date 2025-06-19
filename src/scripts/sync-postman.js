const fs = require('fs');
const { convert } = require('swagger2postman');

module.exports = async (swaggerPath, outputDir) => {
  const collection = await convert(swaggerPath, {
    folderStrategy: 'Tags',
    requestNameSource: 'url'
  });
  
  fs.writeFileSync(
    `${outputDir}/${path.basename(swaggerPath, '.yaml')}.json`,
    JSON.stringify(collection, null, 2)
  );
  
  console.log(`Updated ${swaggerPath} → ${outputDir}`);
};