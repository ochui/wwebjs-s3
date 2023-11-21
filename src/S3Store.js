const fs = require('fs');
const { Readable } = require('stream');
const { HeadObjectCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

class S3Store {
    constructor({ s3, bucketName } = {}) {
        if (!s3 || !bucketName) {
            throw new Error('A valid S3 instance and bucket name are required for S3Store.');
        }
        this.s3 = s3;
        this.bucketName = bucketName;
    }

    async sessionExists(options) {
        try {
            await this.s3.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: `${options.session}.zip` }));
            return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    async save(options) {
        const params = {
            Bucket: this.bucketName,
            Key: `${options.session}.zip`,
            Body: fs.createReadStream(`${options.session}.zip`),
        };
        await this.s3.send(new PutObjectCommand(params));
        await this.#deletePrevious(options);
    }

    async extract(options) {
        const params = {
            Bucket: this.bucketName,
            Key: `${options.session}.zip`,
        };
        const response = await this.s3.send(new GetObjectCommand(params));
        const stream = Readable.from(response.Body);

        return new Promise((resolve, reject) => {
            stream
                .pipe(fs.createWriteStream(options.path))
                .on('error', err => reject(err))
                .on('close', () => {
                    resolve();
                });
        });
    }

    async delete(options) {
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: `${options.session}.zip` }));
    }

    async #deletePrevious(options) {
        const listParams = { Bucket: this.bucketName, Prefix: `${options.session}.zip` };
        const response = await this.s3.send(new ListObjectsV2Command(listParams));
        if (response.Contents.length > 1) {
            const oldSession = response.Contents.reduce((a, b) => (a.LastModified < b.LastModified ? a : b));
            await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: oldSession.Key }));
        }
    }
}

module.exports = S3Store;
