import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { config } from './config';
import { BufferedFile } from './file.model';
import * as crypto from 'crypto';

@Injectable()
export class MinioClientService {
  private readonly logger: Logger;
  private readonly baseBucket = config.MINIO_BUCKET;

  public get client() {
    return this.minio.client;
  }

  constructor(private readonly minio: MinioService) {
    this.logger = new Logger('MinioStorageService');
  }

  public async upload(
    file: BufferedFile,
    baseBucket: string = this.baseBucket,
  ) {
    if (!(file.mimetype.includes('jpeg') || file.mimetype.includes('png'))) {
      throw new HttpException('Error uploading file1', HttpStatus.BAD_REQUEST);
    }
    const temp_filename = Date.now().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(temp_filename)
      .digest('hex');
    const ext = file.originalname.substring(
      file.originalname.lastIndexOf('.'),
      file.originalname.length,
    );
    const metaData = {
      'Content-Type': file.mimetype,
      'X-Amz-Meta-Testing': '1234',
    };
    const filename = hashedFileName + ext;
    const fileName: string = `${filename}`;
    const fileBuffer = file.buffer;

    // Added console log statement
    console.log('Uploading file:', fileName);

    try {
      const size = fileBuffer.length; // Get the size of the file buffer
      await this.client.putObject(
        baseBucket,
        fileName,
        fileBuffer,
        size,
        metaData,
      );
      return {
        url: `${config.MINIO_ENDPOINT}:${config.MINIO_PORT}/${config.MINIO_BUCKET}/${filename}`, // Update port to MINIO_API_PORT
      };
    } catch (err) {
      this.logger.error('Error uploading file2', err);
      throw new HttpException('Error uploading file2', HttpStatus.BAD_REQUEST);
    }
  }

  public async delete(
    objectName: string,
    baseBucket: string = this.baseBucket,
  ) {
    try {
      await this.client.removeObject(baseBucket, objectName);
    } catch (err) {
      this.logger.error('Error deleting file', err);
      throw new HttpException(
        'Oops Something wrong happened',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
