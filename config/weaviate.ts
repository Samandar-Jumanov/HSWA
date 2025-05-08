import weaviate from 'weaviate-ts-client';

export const client = weaviate.client({
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
        image: imageBuffer.toString('base64'), // Convert buffer to base64 string
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

      const result : any = resImage.data.Get.Images[0];
      return result
    
  } catch (error) {
    console.error('Error querying image:', error);
    throw error;
  }
}



export const getAllImages = async  () => {

    try {
      const allImages  = await client.graphql.get()
      .withClassName("Images")
      .withFields("image text")
      .withLimit(1000)
      .do();


    return allImages.data.Get.Images;

      
    } catch (error) {
      console.log(error);
      throw error;      
    }
}