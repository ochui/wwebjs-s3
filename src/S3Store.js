const fs = require('fs');
const { Readable } = require('stream');
const { HeadObjectCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

class S3Store {
    constructor({ s3, bucketName, sessionPath = 'session' } = {}) {
        if (!s3 || !bucketName) {
            throw new Error('A valid S3 instance and bucket name are required for S3Store.');
        }
        this.s3 = s3;
        this.bucketName = bucketName;
        this.sessionPath = sessionPath;
    }

    async sessionExists(options) {
        let sessionDir = `instance-${this.sessionPath}`
        try {
            await this.s3.send(new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: `${sessionDir}/${options.session}.zip`,
            }));
            return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    async save(options) {
        let sessionDir = `instance-${this.sessionPath}`;

        try {
            const params = {
                Bucket: this.bucketName,
                Key: `${sessionDir}/${options.session}.zip`,
                Body: fs.createReadStream(`${options.session}.zip`),
            };

            console.log('Syncing session to S3');
            await this.s3.send(new PutObjectCommand(params));
            console.log('Session synced to S3');

        } catch (error) {
            throw new Error(`Error saving session to S3: ${error.message}`);
        }
    }

    async extract(options) {
        let sessionDir = `instance-${this.sessionPath}`;

        try {
            const params = {
                Bucket: this.bucketName,
                Key: `${sessionDir}/${options.session}.zip`,
            };
            const response = await this.s3.send(new GetObjectCommand(params));

            console.log('Extracting session');

            const stream = Readable.from(response.Body);

            return new Promise((resolve, reject) => {
                stream
                    .pipe(fs.createWriteStream(options.path))
                    .on('error', err => reject(err))
                    .on('close', () => {
                        console.log('Session extracted');
                        resolve();
                    });
            });
        } catch (error) {
            throw new Error(`Error extracting session from S3: ${error.message}`);
        }
    }

    async delete(options) {
        let sessionDir = `instance-${this.sessionPath}`;
        try {
            await this.s3.send(new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: `${sessionDir}/${options.session}.zip`
            }));
        } catch (error) {
            throw new Error(`Error deleting session from S3: ${error.message}`);
        }
    }

}

module.exports = S3Store;
