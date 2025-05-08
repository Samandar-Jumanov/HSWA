import axios from "axios";


export interface FilePathResponse {
    ok: boolean;
    result: {
      file_path: string;
    };
    description?: string;
  }
  

  
export async function downloadImage(fileId: string , token : string  ): Promise<Buffer> {
    try {

      const filePathResponse = await axios.get<FilePathResponse>(
        `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
      );
      
      if (!filePathResponse.data.ok) {
        throw new Error(`Failed to get file path: ${filePathResponse.data.description}`);
      }
      
      const filePath = filePathResponse.data.result.file_path;
      
      const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
      const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
  
      return Buffer.from(fileResponse.data);
    } catch (error : any ) {
      console.error('Error downloading image:', error.message);
      throw error
    }
  }
