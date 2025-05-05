import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
});

export async function createSchema() {
  try {
    const schemaConfig = {
      'class': 'Images',
      'vectorizer': 'img2vec-neural',
      'vectorIndexType': 'hnsw',
      'moduleConfig': {
          'img2vec-neural': {
              'imageFields': [
                  'image'
              ]
          }
      },
      'properties': [
          {
              'name': 'image',
              'dataType': ['blob']
          },
          {
              'name': 'text',
              'dataType': ['string']
          }
      ]
  }
  
  await client.schema
      .classCreator()
      .withClass(schemaConfig)
      .do();
  } catch (error) {
    console.log('Error creating schema:', error);
    throw error;
  }
}

export async function uploadFile(imageBuffer: Buffer, fileName: string) {
  try {
    // First check if the class exists
    const exists = await client.schema.exists('Images');
    if (!exists) {
      console.log('Class does not exist, creating schema first...');
      await createSchema();
    }
    
    console.log(`Uploading ${fileName}...`);
    const response = await client.data.creator()
      .withClassName('Images')
      .withProperties({
        image: imageBuffer.toString('base64'),
        text: fileName
      })
      .do();

    console.log(`Successfully uploaded ${fileName}`);
    return true ;
  } catch (error) {
    console.error(`Error uploading file ${fileName}:`, error);
    return false;
  }
}

export async function queryImage(imageBuffer: Buffer) {
  try {
 

    const resImage = await client.graphql.get()
    .withClassName('Images')
    .withFields("image")
    .withNearImage({ image: imageBuffer.toString('base64') })
    .withLimit(1)
    .do();

    console.log


    

      const result : any = resImage.data.Get.Images[0];
      return result
    
  } catch (error) {
    console.error('Error querying image:', error);
    throw error;
  }
}