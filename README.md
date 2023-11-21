# wwebjs-s3
An S3 plugin for whatsapp-web.js! 

Use S3 bucket to save your WhatsApp MultiDevice session on a S3 Bucket.

## Quick Links

* [Guide / Getting Started](https://wwebjs.dev/guide/authentication.html)

## Pre-requisites


## Installation

`TODO`


## Example usage

```js
const { Client, RemoteAuth } = require('whatsapp-web.js');
const { S3Client } = require("@aws-sdk/client-s3");
const S3Store  = require('wwebjs-s3');



const s3 = new S3Client({
    region: 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
})
const store = new S3Store({ s3: s3, bucketName: 'YOUR_BUCKET_NAME' });

const client = new Client({
    authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000
    })
});

client.initialize();


```

## Delete Remote Session

How to force delete a specific remote session on the Database:

```js
await store.delete({session: 'yourSessionName'});
```