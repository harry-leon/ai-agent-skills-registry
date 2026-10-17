import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { env } from '../env.js';

export class S3StorageDriver {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.bucket = config.bucket || env.S3_BUCKET;
    if (!this.bucket) {
      throw new Error('S3_BUCKET must be specified when using S3 storage driver');
    }

    const s3Config = {
      region: config.region || env.S3_REGION || 'us-east-1',
    };

    if (config.endpoint || env.S3_ENDPOINT) {
      s3Config.endpoint = config.endpoint || env.S3_ENDPOINT;
    }

    if (config.forcePathStyle !== undefined) {
      s3Config.forcePathStyle = config.forcePathStyle;
    } else if (env.S3_FORCE_PATH_STYLE !== undefined) {
      s3Config.forcePathStyle = env.S3_FORCE_PATH_STYLE;
    }

    if (
      (config.accessKeyId || env.S3_ACCESS_KEY_ID) &&
      (config.secretAccessKey || env.S3_SECRET_ACCESS_KEY)
    ) {
      s3Config.credentials = {
        accessKeyId: config.accessKeyId || env.S3_ACCESS_KEY_ID,
        secretAccessKey: config.secretAccessKey || env.S3_SECRET_ACCESS_KEY,
      };
    }

    this.client = new S3Client(s3Config);
  }

  /**
   * Resolves S3 key for a given sha256.
   * Content-addressed under blobs/<sha256>.
   * @param {string} sha256
   * @returns {string}
   */
  getBlobKey(sha256) {
    if (!/^[0-9a-f]{64}$/i.test(sha256)) {
      throw new Error(`Invalid sha256 hash: ${sha256}`);
    }
    return `blobs/${sha256}`;
  }

  /**
   * Checks if blob exists in S3 bucket.
   * @param {string} sha256
   * @returns {Promise<boolean>}
   */
  async hasBlob(sha256) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.getBlobKey(sha256),
      });
      await this.client.send(command);
      return true;
    } catch (err) {
      if (err?.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') {
        return false;
      }
      throw err;
    }
  }

  /**
   * Stores a blob under blobs/<sha256> if not already present.
   * @param {string} sha256
   * @param {Buffer|Uint8Array|Readable} content
   * @returns {Promise<{ sha256: string, size: number }>}
   */
  async putBlob(sha256, content) {
    const key = this.getBlobKey(sha256);

    try {
      const head = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return { sha256, size: head.ContentLength || 0 };
    } catch (err) {
      if (err?.$metadata?.httpStatusCode !== 404 && err.name !== 'NotFound') {
        throw err;
      }
    }

    let body = content;
    let size = 0;
    if (Buffer.isBuffer(content) || content instanceof Uint8Array) {
      size = content.length;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: 'application/octet-stream',
    });

    await this.client.send(command);
    return { sha256, size };
  }

  /**
   * Retrieves blob as a Readable stream.
   * @param {string} sha256
   * @returns {Promise<Readable|null>}
   */
  async getBlobStream(sha256) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.getBlobKey(sha256),
      });
      const response = await this.client.send(command);
      return response.Body;
    } catch (err) {
      if (err?.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') {
        return null;
      }
      throw err;
    }
  }

  /**
   * Retrieves blob as a Buffer.
   * @param {string} sha256
   * @returns {Promise<Buffer|null>}
   */
  async getBlobBuffer(sha256) {
    const stream = await this.getBlobStream(sha256);
    if (!stream) {
      return null;
    }
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Deletes a blob if present.
   * @param {string} sha256
   * @returns {Promise<boolean>}
   */
  async deleteBlob(sha256) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.getBlobKey(sha256),
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
