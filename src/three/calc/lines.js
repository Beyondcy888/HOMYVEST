// Screen-space lines (constant pixel width at any zoom) for boundaries, dimension lines, parking bays,
// ghost-floor edges and the rule highlights. One LineSegments2 per style = one draw call, however many
// segments it holds. The buffers are written in place: nothing is allocated while the scene animates.
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

export class LineSet {
  constructor({ capacity = 256, color = '#000', width = 1.25, opacity = 1, dashed = false, depthTest = true, renderOrder = 2 } = {}) {
    this.capacity = capacity;
    this.positions = new Float32Array(capacity * 6);
    this.n = 0;
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(this.positions);
    this.buffer = geometry.attributes.instanceStart.data;
    this.buffer.setUsage(THREE.DynamicDrawUsage);
    this.material = new LineMaterial({ color, linewidth: width, transparent: true, opacity, dashed, depthTest, depthWrite: false });
    this.object = new LineSegments2(geometry, this.material);
    this.object.frustumCulled = false;
    this.object.renderOrder = renderOrder;
    this.dashed = dashed;
    if (dashed) {
      this.object.computeLineDistances();
      this.distances = geometry.attributes.instanceDistanceStart.data;
      this.distances.setUsage(THREE.DynamicDrawUsage);
    }
    geometry.instanceCount = 0;
  }

  begin() { this.n = 0; }

  seg(x0, y0, z0, x1, y1, z1) {
    if (this.n >= this.capacity) return;
    const i = this.n * 6;
    const p = this.positions;
    p[i] = x0; p[i + 1] = y0; p[i + 2] = z0; p[i + 3] = x1; p[i + 4] = y1; p[i + 5] = z1;
    if (this.dashed) {
      const d = this.distances.array;
      d[this.n * 2] = 0;
      d[this.n * 2 + 1] = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
    }
    this.n += 1;
  }

  /** Flat rectangle outline at height y: centre (x, z), size (w, d). */
  rect(x, y, z, w, d) {
    const a = x - w / 2, b = x + w / 2, c = z - d / 2, e = z + d / 2;
    this.seg(a, y, c, b, y, c); this.seg(b, y, c, b, y, e); this.seg(b, y, e, a, y, e); this.seg(a, y, e, a, y, c);
  }

  /** The 12 edges of a box: centre (x, y, z), size (w, h, d). */
  box(x, y, z, w, h, d) {
    const y0 = y - h / 2, y1 = y + h / 2;
    this.rect(x, y0, z, w, d);
    this.rect(x, y1, z, w, d);
    const a = x - w / 2, b = x + w / 2, c = z - d / 2, e = z + d / 2;
    this.seg(a, y0, c, a, y1, c); this.seg(b, y0, c, b, y1, c); this.seg(b, y0, e, b, y1, e); this.seg(a, y0, e, a, y1, e);
  }

  end() {
    const geometry = this.object.geometry;
    geometry.instanceCount = this.n;
    this.buffer.needsUpdate = true;
    if (this.dashed) this.distances.needsUpdate = true;
    this.object.visible = this.n > 0;
  }

  dispose() {
    this.object.geometry.dispose();
    this.material.dispose();
  }
}
