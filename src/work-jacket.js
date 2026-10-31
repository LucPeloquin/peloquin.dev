import {
  BoxGeometry, CatmullRomCurve3, CylinderGeometry, ExtrudeGeometry,
  Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Shape,
  TubeGeometry, Vector3,
} from "three";

// Original, texture-free motorcycle jacket: shaped leather panels and silver hardware.
export function createBikerJacket(theme = "light") {
  const group = new Group();
  const geometries = new Set();
  const materials = new Set();
  const leather = new MeshPhysicalMaterial({ color: 0x202327, roughness: 0.46, metalness: 0.08, clearcoat: 0.28, clearcoatRoughness: 0.4 });
  const lapel = new MeshPhysicalMaterial({ color: 0x30353a, roughness: 0.4, metalness: 0.1, clearcoat: 0.3 });
  const silver = new MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.92, roughness: 0.23 });
  const seam = new MeshStandardMaterial({ color: 0x515860, metalness: 0.1, roughness: 0.8 });
  [leather, lapel, silver, seam].forEach((material) => materials.add(material));

  function mesh(geometry, material, position = [0, 0, 0]) {
    geometries.add(geometry);
    const object = new Mesh(geometry, material);
    object.position.fromArray(position);
    group.add(object);
    return object;
  }

  function panel(outline, material, z = 0, depth = 0.32, bevel = 0.07) {
    const shape = new Shape();
    outline.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    return mesh(new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, steps: 1, curveSegments: 8 }), material, [0, 0, z]);
  }

  function pipe(points, radius, material) {
    const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)), false, "centripetal");
    return mesh(new TubeGeometry(curve, Math.max(12, points.length * 6), radius, 6, false), material);
  }

  function stud(x, y, z = 0.64, radius = 0.055) {
    const object = mesh(new CylinderGeometry(radius, radius, 0.035, 14), silver, [x, y, z]);
    object.rotation.x = Math.PI / 2;
    return object;
  }

  const sleeve = [[-1.12, 1.98], [-1.67, 1.77], [-1.96, 0.94], [-2.31, -1.45], [-1.72, -1.61], [-1.43, 0.29], [-0.99, 1.28]];
  panel(sleeve, leather, -0.14, 0.42, 0.09);
  panel(sleeve.map(([x, y]) => [-x, y]).reverse(), leather, -0.14, 0.42, 0.09);
  panel([[-0.55, 2.25], [-1.27, 1.96], [-1.16, 0.77], [-1.1, -1.86], [-0.84, -2.05], [0.86, -2.05], [1.1, -1.86], [1.18, 0.77], [1.27, 1.96], [0.55, 2.25], [0.36, 1.7], [-0.32, 1.7]], leather, 0, 0.38, 0.1);

  // Folded collar and asymmetric lapels define the classic biker silhouette.
  panel([[-0.55, 2.29], [-1.03, 1.83], [-0.32, 0.52], [0.18, 1.26]], lapel, 0.46, 0.075, 0.025);
  panel([[0.55, 2.29], [1.02, 1.84], [0.35, 0.79], [0.08, 1.53]], lapel, 0.46, 0.075, 0.025);
  pipe([[-0.55, 2.29, 0.59], [-1.03, 1.83, 0.59], [-0.32, 0.52, 0.59], [0.18, 1.26, 0.59]], 0.012, seam);
  pipe([[0.55, 2.29, 0.59], [1.02, 1.84, 0.59], [0.35, 0.79, 0.59]], 0.012, seam);
  stud(-0.65, 1.62); stud(0.67, 1.62);

  // Offset main zip, slanted pockets, cuffs, shoulder straps, and a waist belt.
  const zipStart = new Vector3(0.31, 1.1, 0.59);
  const zipEnd = new Vector3(-0.38, -1.85, 0.59);
  pipe([zipStart.toArray(), zipEnd.toArray()], 0.024, silver);
  for (let i = 0; i < 32; i += 1) {
    const point = zipStart.clone().lerp(zipEnd, i / 31);
    const tooth = mesh(new BoxGeometry(0.075, 0.022, 0.025), silver, point.toArray());
    tooth.rotation.z = -0.23;
  }
  mesh(new BoxGeometry(0.1, 0.19, 0.04), silver, [0.3, 1.03, 0.65]).rotation.z = -0.23;
  for (const ends of [
    [[-0.91, -0.05, 0.53], [-0.34, 0.18, 0.53]],
    [[0.34, -0.65, 0.53], [0.94, -0.32, 0.53]],
    [[0.43, 0.65, 0.53], [0.98, 0.81, 0.53]],
  ]) {
    pipe(ends, 0.022, silver);
    const end = ends[0];
    mesh(new BoxGeometry(0.045, 0.15, 0.035), silver, [end[0], end[1] - 0.05, end[2] + 0.03]);
  }
  panel([[-1.05, -1.58], [1.05, -1.58], [1.04, -1.8], [-1.04, -1.8]], lapel, 0.48, 0.065, 0.018);
  const buckle = [[0.4, -1.56, 0.62], [0.78, -1.56, 0.62], [0.78, -1.84, 0.62], [0.4, -1.84, 0.62], [0.4, -1.56, 0.62]];
  pipe(buckle, 0.027, silver);
  pipe([[0.58, -1.56, 0.63], [0.58, -1.83, 0.63]], 0.018, silver);
  for (const side of [-1, 1]) {
    panel([[side * 0.71, 2.14], [side * 1.22, 1.96], [side * 1.16, 1.82], [side * 0.67, 2.0]], lapel, 0.41, 0.065, 0.025);
    stud(side * 1.1, 1.94, 0.56, 0.04);
    pipe([[side * 1.76, -1.35, 0.37], [side * 2.25, -1.22, 0.37]], 0.02, silver);
    pipe([[side * 1.55, 0.6, 0.37], [side * 1.79, -0.4, 0.37], [side * 1.9, -1.17, 0.37]], 0.012, seam);
  }
  pipe([[-0.99, -1.92, 0.52], [0, -2.0, 0.52], [0.99, -1.92, 0.52]], 0.012, seam);

  function setTheme(nextTheme) {
    leather.color.set(nextTheme === "dark" ? 0x33383d : 0x1c2024);
    lapel.color.set(nextTheme === "dark" ? 0x41474d : 0x2e343a);
  }
  setTheme(theme);
  return {
    group,
    setTheme,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
