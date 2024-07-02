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

  var photoVideoTabs = `
  <div style="margin-bottom: 50px;">
    <button onclick="showTab('photos')">Show Photos</button>
    <button onclick="showTab('videos')">Show Videos</button>
  </div>
  <div id="photosTab" class="tabContent"></div>
  <div id="videosTab" class="tabContent" style="display:none;"></div>`

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

    var validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'];

    var photos = [];
    var videos = [];

    data.Contents.forEach(function (photo) {
      var extension = photo.Key.substring(photo.Key.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(extension)) return;

      var photoKey = photo.Key;
      var photoUrl = bucketUrl + encodeURIComponent(photoKey);
      var isVideo = photoKey.toLowerCase().endsWith(".mp4");

      var htmlContent = getHtml([
        "<div style='display:inline-block; margin:10px;'>",
        isVideo
          ? '<button style="margin:5px;" onclick="loadVideo(\'' + photoUrl + '\', this)">Load Video</button>'
          : '<img class="lazy" data-src="' + photoUrl + '" style="width:256px;height:256px;" />',
        "<div>",
        '<button style="margin:5px;" onclick="copyToClipboard(\'' + photoUrl + '\')">',
        "Copy " + (isVideo ? "Video" : "Photo") + " URL",
        "</button>",
        "</div>",
        "</div>",
      ]);

      if (isVideo) {
        videos.push(htmlContent);
      } else {
        photos.push(htmlContent);
      }
    });

    var photosMessage = photos.length
      ? "<p>The following photos are present.</p>"
      : "<p>There are no photos in this album.</p>";
    var videosMessage = videos.length
      ? "<p>The following videos are present.</p>"
      : "<p>There are no videos in this album.</p>";

    var photosHtmlTemplate = [
      "<div>",
      "</div>",
      "<h2>",
      "Album: " + albumName,
      "</h2>",
      photosMessage,
      "<div>",
      getHtml(photos),
      "</div>",
      "<h2>",
      "End of Album: " + albumName,
      "</h2>",
      "<div>",
      "</div>",
    ];

    var videosHtmlTemplate = [
      "<div>",
      "</div>",
      "<h2>",
      "Album: " + albumName,
      "</h2>",
      videosMessage,
      "<div>",
      getHtml(videos),
      "</div>",
      "<h2>",
      "End of Album: " + albumName,
      "</h2>",
      "<div>",
      "</div>",
    ];
    document.getElementById("viewer").innerHTML = photoVideoTabs;
    document.getElementById("photosTab").innerHTML = getHtml(photosHtmlTemplate);
    document.getElementById("videosTab").innerHTML = getHtml(videosHtmlTemplate);

    // Initialize lazy loading
    lazyLoadImages();
  });
}

// Function to load video when the button is clicked
function loadVideo(videoUrl, buttonElement) {
  var videoElement = document.createElement('video');
  videoElement.width = 256;
  videoElement.height = 256;
  videoElement.controls = true;
  var sourceElement = document.createElement('source');
  sourceElement.src = videoUrl;
  sourceElement.type = 'video/mp4';
  videoElement.appendChild(sourceElement);

  // Replace the button with the video element
  buttonElement.parentNode.replaceChild(videoElement, buttonElement);
}

// Function to lazy load images
function lazyLoadImages() {
  var lazyImages = document.querySelectorAll('img.lazy');
  var observer = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var img = entry.target;
        img.src = img.getAttribute('data-src');
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  lazyImages.forEach(function(img) {
    observer.observe(img);
  });
}

// Function to show the selected tab
function showTab(tabName) {
  var photosTab = document.getElementById("photosTab");
  var videosTab = document.getElementById("videosTab");

  if (tabName === "photos") {
    photosTab.style.display = "block";
    videosTab.style.display = "none";
  } else if (tabName === "videos") {
    photosTab.style.display = "none";
    videosTab.style.display = "block";
  }
}