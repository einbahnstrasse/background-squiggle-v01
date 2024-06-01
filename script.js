function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}const simplex = new SimplexNoise();

var relaxationRando = 0.8;
var amplitudeRando = 0.05;
// var frequencyConstant = 0.1;

setInterval(function(){ 
  relaxationRando = (Math.random() * 0.25) + 0.75;    
}, 1000);

setInterval(function(){ 
  amplitudeRando = (Math.random() * 0.1) + 0.02;    
}, 5000);

// const SLICES = 20;
const SLICES = 160;
// window.DEBUG = true;
window.DEBUG = false;


const stats = new Stats();
if (window.DEBUG) {
  document.body.appendChild(stats.dom);
}

class VoronoiSlices {








  constructor(_image) {_defineProperty(this, "image", void 0);_defineProperty(this, "canvas", document.querySelector('canvas'));_defineProperty(this, "ctx", this.canvas.getContext('2d'));_defineProperty(this, "tStart", performance.now());_defineProperty(this, "voronoi", void 0);_defineProperty(this, "points", void 0);_defineProperty(this, "state", void 0);_defineProperty(this, "resize",






























    () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });_defineProperty(this, "xScale",

    n => {
      return n * this.canvas.width;
    });_defineProperty(this, "yScale",

    n => {
      return n * this.canvas.height;
    });_defineProperty(this, "scalePoint",

    point => {
      return [this.xScale(point[0]), this.yScale(point[1])];
    });_defineProperty(this, "scalePolygon",

    polygon => {
      return polygon.map(this.scalePoint);
    });_defineProperty(this, "drawPoint",

    (point, color) => {
      const RADIUS = 2.5;

      this.ctx.beginPath();
      this.ctx.moveTo(point[0] + RADIUS, point[1]);
      this.ctx.arc(point[0], point[1], RADIUS, 0, 2 * Math.PI, false);
      this.ctx.closePath();
      this.ctx.fillStyle = color;
      this.ctx.fill();
    });_defineProperty(this, "drawLine",

    (from, to, color) => {
      const STROKE_WIDTH = 1;

      this.ctx.beginPath();
      this.ctx.moveTo(from[0], from[1]);
      this.ctx.lineTo(to[0], to[1]);
      this.ctx.closePath();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = STROKE_WIDTH;
      this.ctx.stroke();
    });_defineProperty(this, "drawPolygon",

    (polygon, color) => {
      const STROKE_WIDTH = 1;

      this.ctx.beginPath();
      this.ctx.moveTo(polygon[0][0], polygon[0][1]);
      for (let i = 1; i < polygon.length; i++) {
        const point = polygon[i];
        this.ctx.lineTo(point[0], point[1]);
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = STROKE_WIDTH;
      this.ctx.stroke();
    });_defineProperty(this, "drawImageClipped",

    (image, polygon, offset) => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(polygon[0][0], polygon[0][1]);
      for (let i = 1; i < polygon.length; i++) {
        const point = polygon[i];
        this.ctx.lineTo(point[0], point[1]);
      }
      this.ctx.closePath();
      this.ctx.clip();

      const imageCoverSize = getCoverSize(
      image.naturalWidth,
      image.naturalHeight,
      this.canvas.width,
      this.canvas.height,
      0.5,
      0.5);


      this.ctx.drawImage(
      image,
      imageCoverSize.offsetLeft + offset[0],
      imageCoverSize.offsetTop + offset[1],
      imageCoverSize.width,
      imageCoverSize.height);


      this.ctx.restore();
    });_defineProperty(this, "update",

    ms => {
      const t = (ms - this.tStart) / 1000;
      stats.begin();

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const polygons = Array.from(this.voronoi.cellPolygons());
      const centroids = polygons.map(d3.polygonCentroid);

      // const EASING_FACTOR = this.state.relaxation;
      const EASING_FACTOR = relaxationRando;
      // const NOISE_AMPLITUDE = this.state.noise.amplitude;
      const NOISE_AMPLITUDE = amplitudeRando;
      const NOISE_FREQUENCY = this.state.noise.frequency;
      for (let i = 0; i < this.points.length; i += 2) {
        // this is done also with bitwise operation i >> 1, but why the fuck
        const normalizedIndex = Math.floor(i / 2);

        const point = [this.points[i], this.points[i + 1]];
        const polygon = polygons[normalizedIndex];
        const centroid = centroids[normalizedIndex];

        if (!centroid) continue;

        // apply LLoys's relaxation
        // https://observablehq.com/@mbostock/lloyds-algorithm
        // https://observablehq.com/@fil/spherical-lloyds-relaxation
        const target = _.cloneDeep(centroid);

        // give 'em a wobble
        if (this.state.noise.enabled) {
          target[0] += simplex.noise2D(i, t * NOISE_FREQUENCY) * NOISE_AMPLITUDE;
          target[1] += simplex.noise2D(i + 1000, t * NOISE_FREQUENCY) * NOISE_AMPLITUDE;
        }

        // ease the point to the target
        // https://aerotwist.com/tutorials/protip-stick-vs-ease/
        const x0 = point[0];
        const y0 = point[1];
        const [x1, y1] = target;
        this.points[i] = x0 + (x1 - x0) * EASING_FACTOR;
        this.points[i + 1] = y0 + (y1 - y0) * EASING_FACTOR;

        const distance = [target[0] - this.points[i], target[1] - this.points[i + 1]];

        // draw!
        if (polygon) {
          this.drawImageClipped(image, this.scalePolygon(polygon), this.scalePoint(distance));
          if (this.state.showCells) {
            this.ctx.globalAlpha = 0.5;
            this.drawPolygon(this.scalePolygon(polygon), '#000');
            this.ctx.globalAlpha = 1;
          }
        }

        if (window.DEBUG && this.state.showCenters) {
          this.drawPoint(this.scalePoint(point), '#000');
          this.drawLine(this.scalePoint(point), this.scalePoint(target), '#000');
          this.drawPoint(this.scalePoint(target), '#f00');
        }
      }

      this.voronoi.update();

      stats.end();
      requestAnimationFrame(this.update);
    });this.image = _image;const startingPoints = Array(SLICES).fill(0).map(() => [Math.random(), Math.random()]);this.voronoi = d3.Delaunay.from(startingPoints).voronoi([0, 0, 1, 1]);this.points = this.voronoi.delaunay.points;this.state = State({ relaxation: State.Slider(0.1, { min: 0, max: 1, step: 0.01 }), showCells: false, showCenters: false, noise: { enabled: true, amplitude: State.Slider(0.05, { min: 0, max: 0.5, step: 0.01 }), frequency: State.Slider(0.1, { min: 0, max: 10, step: 0.01 }) } });if (window.DEBUG) {this.state = wrapGUI(this.state);}this.resize();window.addEventListener('resize', this.resize);requestAnimationFrame(this.update);}}


const image = new Image();
image.addEventListener('load', () => new VoronoiSlices(image));
// image.src = 'https://res.cloudinary.com/marcofugaro/image/upload/v1570113726/simone-hutsch-skyscrapers_n7vgyi.jpg';
// image.src = "June 66 27.jpeg";
// image.src = "Untitled 1 29.jpeg";
image.src = "Untitled 6 1.jpeg";
