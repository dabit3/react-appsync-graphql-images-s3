## Image uploads and downloads with React, AWS Amplify, AWS AppSync, and Amazon S3

This is an example project showing how to upload and download images from S3 using AWS Amplify, AWS AppSync, and Amazon S3

### The question

How do I securely upload images using GraphQL with AWS AppSync?

### The solution

There are a few parts to this solution:

* You must both upload the image to a storage solution (Amazon S3)
* Once you have finished uploading the image, you will then be given a key reference for this image. This reference is stored using GraphQL in a database.
* When you want to view this image, you need to do two things:
  * First, query the image reference from your DB using GraphQL
  * Get a signed URL for the image from S3

## To deploy this app

1. Clone the project and change into the directory

```sh
git clone https://github.com/dabit3/react-amplify-appsync-s3.git

cd react-amplify-appsync-s3
```

2. Install the dependencies

```sh
npm install

# or

yarn
```

3. Initialize and deploy the amplify project

```sh
amplify init

amplify push
```

4. Run the app

```sh
npm start
```