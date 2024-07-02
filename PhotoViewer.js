// **DO THIS**:
//   Replace BUCKET_NAME with the bucket name.
//
var albumBucketName = "devday-30-jun-photos";

// **DO THIS**:
//   Replace this block of code with the sample code located at:
//   Cognito -- Manage Identity Pools -- [identity_pool_name] -- Sample Code -- JavaScript
//
// Initialize the Amazon Cognito credentials provider
AWS.config.region = "ap-south-1"; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: "ap-south-1:942da8e0-5eea-4e64-beb7-7d660697d3fb",
});
var s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: albumBucketName },
  });
// Create a new service object

function setAlbumBucketName() {
    var userBucketName = document.getElementById("bucketNameInput").value;
    if (userBucketName) {
      albumBucketName = userBucketName;
      alert("Bucket name set to: " + albumBucketName);
      
      // Update the s3 object with the new bucket name
      s3 = new AWS.S3({
        apiVersion: "2006-03-01",
        params: { Bucket: albumBucketName },
      });
  
      listAlbums(); // Call listAlbums after setting the bucket name
    } else {
      alert("Please enter a valid bucket name.");
    }
  }


// A utility function to create HTML.
function getHtml(template) {
  return template.join("\n");
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
      alert('Copied to clipboard!');
    }, function(err) {
      alert('Failed to copy text: ' + err);
    });
  }

// List the photo albums that exist in the bucket.
function listAlbums() {
    
    s3.listObjects({ Delimiter: "/" }, function (err, data) {
      if (err) {
        return alert("There was an error listing your albums: " + err.message);
      } else {
        var albums = data.CommonPrefixes.map(function (commonPrefix) {
          var prefix = commonPrefix.Prefix;
          var albumName = decodeURIComponent(prefix.replace("/", ""));
          return getHtml([
            "<li>",
            '<button style="margin:5px;" onclick="viewAlbum(\'' +
              albumName +
              "')\">",
            albumName,
            "</button>",
            "</li>",
          ]);
        });
        var message = albums.length
          ? getHtml(["<p>Click on an album name to view it.</p>"])
          : "<p>You do not have any albums. Please Create album.";
        var htmlTemplate = [
          "<h2>Albums</h2>",
          "<h3>Bucket : "+albumBucketName+"</h3>",
          message,
          "<ul>",
          getHtml(albums),
          "</ul>",
        ];
        document.getElementById("viewer").innerHTML = getHtml(htmlTemplate);
      }
    });
  }

// Show the photos that exist in an album.
function viewAlbum(albumName) {
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
    s3.listObjects({ Prefix: albumPhotosKey }, function (err, data) {
      if (err) {
        return alert("There was an error viewing your album: " + err.message);
      }
      // 'this' references the AWS.Request instance that represents the response
      var href = this.request.httpRequest.endpoint.href;
      var bucketUrl = href + albumBucketName + "/";

      var photos = data.Contents.map(function (photo) {
        var photoKey = photo.Key;
        var photoUrl = bucketUrl + encodeURIComponent(photoKey);
        var isVideo = photoKey.toLowerCase().endsWith(".mp4");
        return getHtml([
          "<div style='display:inline-block; margin:10px;'>",
          isVideo
            ? '<video width="256" height="256" controls><source src="' + photoUrl + '" type="video/mp4">Your browser does not support the video tag.</video>'
            : '<img style="width:256px;height:256px;" src="' + photoUrl + '"/>',
          "<div>",
          '<button style="margin:5px;" onclick="copyToClipboard(\'' + photoUrl + '\')">',
          "Copy " + (isVideo ? "Video" : "Photo") + " URL",
          "</button>",
          "</div>",
          "</div>",
        ]);
      });
      var message = photos.length
        ? "<p>The following photos and videos are present.</p>"
        : "<p>There are no photos or videos in this album.</p>";
      var htmlTemplate = [
        "<div>",
        '<button onclick="listAlbums()">',
        "Back To Albums",
        "</button>",
        "</div>",
        "<h2>",
        "Album: " + albumName,
        "</h2>",
        message,
        "<div>",
        getHtml(photos),
        "</div>",
        "<h2>",
        "End of Album: " + albumName,
        "</h2>",
        "<div>",
        '<button onclick="listAlbums()">',
        "Back To Albums",
        "</button>",
        "</div>",
      ];
      document.getElementById("viewer").innerHTML = getHtml(htmlTemplate);
    });
  }
  