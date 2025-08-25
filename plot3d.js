// plot3d.js
// Simple 3D scatter plot of image pixels in RGB color space (normalized 0-1)

// List of images from the unzipped folder
const imageList = [
    "rgb_images_unzipped/rgb_images/solid_magenta.png",
    "rgb_images_unzipped/rgb_images/shades_red.png",
    "rgb_images_unzipped/rgb_images/solid_red.png",
    "rgb_images_unzipped/rgb_images/checkerboard_red_green.png",
    "rgb_images_unzipped/rgb_images/shades_gray.png",
    "rgb_images_unzipped/rgb_images/solid_white.png",
    "rgb_images_unzipped/rgb_images/checkerboard_blue_yellow.png",
    "rgb_images_unzipped/rgb_images/solid_blue.png",
    "rgb_images_unzipped/rgb_images/solid_cyan.png",
    "rgb_images_unzipped/rgb_images/gradient_black_to_white.png",
    "rgb_images_unzipped/rgb_images/shades_green.png",
    "rgb_images_unzipped/rgb_images/checkerboard_black_white.png",
    "rgb_images_unzipped/rgb_images/solid_yellow.png",
    "rgb_images_unzipped/rgb_images/solid_green.png",
    "rgb_images_unzipped/rgb_images/gradient_red_to_blue.png",
    "rgb_images_unzipped/rgb_images/solid_black.png",
    "rgb_images_unzipped/rgb_images/gradient_red_to_green.png",
    "rgb_images_unzipped/rgb_images/gradient_green_to_blue.png",
    "rgb_images_unzipped/rgb_images/shades_blue.png"
];

// Populate the select dropdown
const select = document.getElementById('imageSelect');
imageList.forEach(path => {
    const name = path.split('/').pop();
    const opt = document.createElement('option');
    opt.value = path;
    opt.textContent = name;
    select.appendChild(opt);
});

const fileInput = document.getElementById('fileInput');
const plotBtn = document.getElementById('plotBtn');
const canvas = document.getElementById('canvas3d');
const ctx = canvas.getContext('2d');
const chosenImg = document.getElementById('chosenImg');

let img = new window.Image();
let imgSrc = null;

function loadImage(src, callback) {
    img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => callback(img);
    img.onerror = () => alert("Failed to load image.");
    img.src = src;
    // Show the image at the top
    chosenImg.src = src;
    chosenImg.style.display = 'block';
}

function getImageData(image, cb) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(image, 0, 0);
    const data = tempCtx.getImageData(0, 0, image.width, image.height);
    cb(data);
}

function plot3D(rgbPoints) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 3D perspective projection parameters
    const w = canvas.width, h = canvas.height;
    const center = [w/2, h/2];
    const axisLen = 200;
    // Camera parameters
    const cam = {x: 1.5, y: 1.2, z: 2.2}; // camera position
    const look = {x: 0.5, y: 0.5, z: 0.5}; // look at center of cube
    const fov = 600; // focal length

    // 3D to 2D perspective projection
    function project3D([x, y, z]) {
        // Center cube at (0.5,0.5,0.5)
        x -= 0.5; y -= 0.5; z -= 0.5;
        // Simple rotation for better view
        const rotY = Math.PI/6, rotX = -Math.PI/8;
        // Rotate Y
        let tx = x*Math.cos(rotY) - z*Math.sin(rotY);
        let tz = x*Math.sin(rotY) + z*Math.cos(rotY);
        let ty = y;
        // Rotate X
        let ty2 = ty*Math.cos(rotX) - tz*Math.sin(rotX);
        let tz2 = ty*Math.sin(rotX) + tz*Math.cos(rotX);
        // Perspective
        let px = tx * axisLen;
        let py = ty2 * axisLen;
        let pz = tz2 * axisLen + fov;
        return [center[0] + px * fov / pz, center[1] - py * fov / pz];
    }

    // Draw axes
    ctx.save();
    ctx.lineWidth = 2;
    // X (Red)
    let [x0, y0] = project3D([0,0,0]);
    let [x1, y1] = project3D([1,0,0]);
    ctx.strokeStyle = 'red';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    // Y (Green)
    [x1, y1] = project3D([0,1,0]);
    ctx.strokeStyle = 'green';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    // Z (Blue)
    [x1, y1] = project3D([0,0,1]);
    ctx.strokeStyle = 'blue';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.restore();

    // Plot points
    rgbPoints.forEach(([r, g, b]) => {
        const [x, y] = project3D([r, g, b]);
        ctx.fillStyle = `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2*Math.PI);
        ctx.fill();
    });
}

function processAndPlot(image) {
    getImageData(image, (imgData) => {
        const arr = imgData.data;
        const rgbPoints = [];
        for (let i = 0; i < arr.length; i += 4) {
            const r = arr[i] / 255;
            const g = arr[i+1] / 255;
            const b = arr[i+2] / 255;
            rgbPoints.push([r, g, b]);
        }
        plot3D(rgbPoints);
    });
}

plotBtn.onclick = () => {
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            loadImage(e.target.result, processAndPlot);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else if (select.value) {
        loadImage(select.value, processAndPlot);
    } else {
        alert("Please select or upload an image.");
        chosenImg.style.display = 'none';
    }
};

// Show the image immediately when selected from dropdown
select.onchange = function() {
    if (select.value) {
        chosenImg.src = select.value;
        chosenImg.style.display = 'block';
    } else {
        chosenImg.style.display = 'none';
    }
};
// Show the image immediately when uploaded
fileInput.onchange = function() {
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            chosenImg.src = e.target.result;
            chosenImg.style.display = 'block';
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
};
