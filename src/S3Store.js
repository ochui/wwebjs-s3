const fs = require('fs');

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
            await this.s3.headObject({ Bucket: this.bucketName, Key: `${options.session}.zip` }).promise();
            return true;
        } catch (error) {
            if (error.code === 'NotFound') {
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
        await this.s3.upload(params).promise();
        await this.#deletePrevious(options);
    }

    async extract(options) {
        const params = {
            Bucket: this.bucketName,
            Key: `${options.session}.zip`,
        };
        const stream = this.s3.getObject(params).createReadStream();
        return new Promise((resolve, reject) => {
            stream
                .pipe(fs.createWriteStream(options.path))
                .on('error', err => reject(err))
                .on('close', () => resolve());
        });
    }

    async delete(options) {
        await this.s3.deleteObject({ Bucket: this.bucketName, Key: `${options.session}.zip` }).promise();
    }

    async #deletePrevious(options) {
        const listParams = { Bucket: this.bucketName, Prefix: `${options.session}.zip` };
        const response = await this.s3.listObjectsV2(listParams).promise();

        if (response.Contents.length > 1) {
            const oldSession = response.Contents.reduce((a, b) => (a.LastModified < b.LastModified ? a : b));
            await this.s3.deleteObject({ Bucket: this.bucketName, Key: oldSession.Key }).promise();
        }
    }
}

module.exports = S3Store;