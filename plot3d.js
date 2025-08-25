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

// Rotation state
let yaw = Math.PI/6; // left-right
let pitch = -Math.PI/8; // up-down
let isDragging = false;
let lastX = 0, lastY = 0;
let lastYaw = yaw, lastPitch = pitch;
let lastRgbPoints = null;

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
    lastRgbPoints = rgbPoints;
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
        // Apply user-controlled rotation
        // Yaw (around Y axis)
        let tx = x*Math.cos(yaw) - z*Math.sin(yaw);
        let tz = x*Math.sin(yaw) + z*Math.cos(yaw);
        let ty = y;
        // Pitch (around X axis)
        let ty2 = ty*Math.cos(pitch) - tz*Math.sin(pitch);
        let tz2 = ty*Math.sin(pitch) + tz*Math.cos(pitch);
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
// Mouse drag to rotate
canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    lastYaw = yaw;
    lastPitch = pitch;
});
canvas.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    yaw = lastYaw + dx * 0.01;
    pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, lastPitch + dy * 0.01));
    if (lastRgbPoints) plot3D(lastRgbPoints);
});
canvas.addEventListener('mouseup', function(e) {
    isDragging = false;
});
canvas.addEventListener('mouseleave', function(e) {
    isDragging = false;
});
// Touch support
canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        lastYaw = yaw;
        lastPitch = pitch;
    }
});
canvas.addEventListener('touchmove', function(e) {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;
    yaw = lastYaw + dx * 0.01;
    pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, lastPitch + dy * 0.01));
    if (lastRgbPoints) plot3D(lastRgbPoints);
    e.preventDefault();
}, {passive: false});
canvas.addEventListener('touchend', function(e) {
    isDragging = false;
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
