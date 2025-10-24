# For image uplaod and CDN

Great! Now the product images upload modify delete endpoints are ready. Now I need some steps to upload images in real life in s3. Suggest me the best way to do that. We can use cloudfront also for the CDN
Follow the below steps. You can modify according to my code structure.
Client: requests presigned POST with filename + contentType + size
Backend:
Authenticates user
Validates contentType is allowed and size within limit
Creates presigned POST to incoming/<uid>/random-key
Creates DB record images with { key, userId, productId?, status: 'PENDING_SCAN' } and returns upload fields
Client: uploads directly to S3 using the presigned POST; shows client-side progress with onUploadProgress.
S3 triggers Lambda:
Lambda downloads first bytes → checks magic bytes
Runs gudduty for s3 and checks for the files
If clean: process image, copy to approved/<uid>/..., update DB status: 'APPROVED', add url
If malicious: move to quarantine/, update DB status: 'REJECTED', notify admins
Frontend polls or receives subscription when image status changes to APPROVED, then product add uses approved URL.

Also, one thing that we can also add is to use redis while mangaing the image state like PENDING_UPLOAD
PENDING_SCAN
APPROVED
REJECTED
DELETED

And when it's final and approved just update the url in ProductImage. In that way we don't have to add anything in prisma schema or DB.

According to my guess it will be easier to implement with the express rather than graphql cause. Image upload can be done from admin panel as well as seller panels. Also, uploading and all will be easier through this.
