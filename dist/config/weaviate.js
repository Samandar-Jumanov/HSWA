"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUpVectorDBschema = void 0;
const weaviate_client_1 = __importDefault(require("weaviate-client"));
const weaviateURL = process.env.WEAVIATE_URL;
const weaviateKey = process.env.WEAVIATE_API_KEY;
async function createClient() {
    const client = await weaviate_client_1.default.connectToWeaviateCloud(weaviateURL, {
        authCredentials: new weaviate_client_1.default.ApiKey(weaviateKey),
    });
    return client;
}
const setUpVectorDBschema = async () => {
    const client = await createClient();
    try {
        const schemaConfig = {
            class: 'Image',
            description: 'A collection of images',
            vectorizer: 'img2vec-neural',
            moduleConfig: {
                'img2vec-neural': {
                    imageFields: ['image'],
                },
            },
            properties: [
                {
                    name: 'image',
                    dataType: ['blob'],
                    description: 'The image file stored as a blob',
                },
                {
                    name: 'title',
                    dataType: ['string'],
                    description: 'Title of the image',
                },
                {
                    name: 'description',
                    dataType: ['text'],
                    description: 'Description of what the image contains',
                },
                {
                    name: 'filename',
                    dataType: ['string'],
                    description: 'Original filename of the image',
                },
            ],
        };
        // Check if schema exists
        try {
            const schema = await client.collections.get("Image");
            if (!schema) {
                await client.collections.createFromSchema(schemaConfig);
                console.log('Schema created successfully');
            }
        }
        catch (error) {
            console.log('Error checking existing schema, will attempt to create new one:', error.message);
        }
        console.log('Schema setup complete');
    }
    catch (error) {
        console.error('Error setting up schema:', error);
    }
};
exports.setUpVectorDBschema = setUpVectorDBschema;
