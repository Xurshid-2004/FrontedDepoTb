"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * AFROSIYOB — haqiqiy 3D kirish sahnasi (Three.js / WebGL).
 *
 * Kadrlar ketma-ketligi (~4.4 s):
 *   0.00–0.28  poyezd old tomondan yaqinlashadi, tezlik chiziqlari
 *   0.28–0.52  kamera yon tomonga chiqadi, eshik oldiga keladi
 *   0.52–0.64  eshiklar sirgʻalib ochiladi, ichkaridan yorugʻlik uriladi
 *   0.64–0.88  kamera eshikdan ichkariga uchib kiradi — yorugʻlik tunneli
 *   0.88–1.00  oq portlash → dashboard
 */

const BASE_DURATION = 4400; // ms
// ?slow=3 → oʻtish 3 barobar sekin (koʻrib chiqish uchun qulay)
const getDuration = () => {
  if (typeof window === "undefined") return BASE_DURATION;
  const s = Number(new URLSearchParams(window.location.search).get("slow"));
  return BASE_DURATION * (Number.isFinite(s) && s > 0 ? s : 1);
};

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function TrainScene({ onFinish }: { onFinish: () => void }) {
  const host = useRef<HTMLDivElement | null>(null);
  const [flash, setFlash] = useState(0);
  const [caption, setCaption] = useState(true);
  const done = useRef(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      onFinish();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x03070d, 1);
    renderer.shadowMap.enabled = false;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03070d, 0.019);

    const camera = new THREE.PerspectiveCamera(
      58,
      el.clientWidth / el.clientHeight,
      0.1,
      400
    );

    /* ---------------- yorugʻlik ---------------- */
    scene.add(new THREE.HemisphereLight(0x88bbff, 0x0a1220, 0.65));
    const key = new THREE.DirectionalLight(0xbfe4ff, 1.15);
    key.position.set(-8, 14, -12);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rim.position.set(10, 5, 16);
    scene.add(rim);

    /* ---------------- glow sprite teksturasi ---------------- */
    const glowTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d")!;
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, "rgba(255,255,255,1)");
      grd.addColorStop(0.25, "rgba(190,235,255,0.75)");
      grd.addColorStop(1, "rgba(120,200,255,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();

    const makeGlow = (size: number, color: number, opacity = 1) => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      s.scale.setScalar(size);
      return s;
    };

    /* ---------------- POYEZD ---------------- */
    const train = new THREE.Group();
    scene.add(train);

    // korpus — aylanma profil (Talgo-250 «Afrosiyob» oqimli burun)
    const profile: THREE.Vector2[] = [
      new THREE.Vector2(0.02, 0),
      new THREE.Vector2(0.30, 0.30),
      new THREE.Vector2(0.62, 0.75),
      new THREE.Vector2(0.96, 1.45),
      new THREE.Vector2(1.24, 2.45),
      new THREE.Vector2(1.42, 3.7),
      new THREE.Vector2(1.51, 5.2),
      new THREE.Vector2(1.55, 8),
      new THREE.Vector2(1.55, 30),
      new THREE.Vector2(1.5, 31),
    ];
    const bodyGeo = new THREE.LatheGeometry(profile, 64);
    // transformni geometriyaga singdiramiz — shunda y haqiqiy balandlik boʻladi
    bodyGeo.rotateX(Math.PI / 2);
    bodyGeo.scale(1, 0.84, 1);
    bodyGeo.computeVertexNormals();

    // AFROSIYOB LIVREYASI: tepasi toʻq koʻk, pasti oq-kumush
    {
      const pos = bodyGeo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const blue = new THREE.Color(0x1a4f9c);
      const blueDark = new THREE.Color(0x123a75);
      const white = new THREE.Color(0xeef4fa);
      const silver = new THREE.Color(0xc3cedb);
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const split = 0.3 - Math.max(0, 3.2 - z) * 0.055;
        if (y > split + 0.06) {
          c.copy(blue).lerp(blueDark, Math.min(1, (y - split) / 1.4));
        } else if (y > split - 0.06) {
          c.set(0x0a1f3d);
        } else {
          c.copy(white).lerp(silver, Math.min(1, (split - y) / 1.6));
        }
        const edge = Math.min(1, Math.abs(x) / 1.55);
        c.offsetHSL(0, 0, edge * 0.05);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      bodyGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }

    const bodyMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.55,
      roughness: 0.26,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    train.add(body);

    // oyna kamari — faqat ikki yon tomonda
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x081726,
      metalness: 0.92,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    for (const th of [-0.42, Math.PI - 0.42]) {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(1.565, 1.565, 17, 40, 1, true, th, 0.84),
        bandMat
      );
      band.rotation.x = Math.PI / 2;
      band.scale.set(1, 1, 0.84);
      band.position.set(0, 0.3, 16.5);
      train.add(band);
    }

    // koʻk chiziq
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x1b6fe0,
      emissive: 0x1b6fe0,
      emissiveIntensity: 0.55,
      metalness: 0.4,
      roughness: 0.35,
    });
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(1.572, 1.572, 24, 48, 1, true, -0.5, 1.0),
      stripeMat
    );
    stripe.rotation.x = Math.PI / 2;
    stripe.scale.set(1, 1, 0.84);
    stripe.position.set(0, -0.55, 16);
    const stripe2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.572, 1.572, 24, 48, 1, true, Math.PI - 0.5, 1.0),
      stripeMat
    );
    stripe2.rotation.x = Math.PI / 2;
    stripe2.scale.set(1, 1, 0.84);
    stripe2.position.set(0, -0.55, 16);
    train.add(stripe, stripe2);

    // burun oynasi
    const wsMat = new THREE.MeshStandardMaterial({
      color: 0x061320,
      metalness: 0.95,
      roughness: 0.06,
    });
    const windshield = new THREE.Mesh(new THREE.SphereGeometry(1.2, 40, 28), wsMat);
    windshield.scale.set(1, 0.44, 1.35);
    windshield.position.set(0, 0.62, 2.55);
    train.add(windshield);

    // marshrut tablosi (oyna ustidagi yorugʻ yoʻlak)
    const tabloMat = new THREE.MeshStandardMaterial({
      color: 0x0b1c33,
      emissive: 0x5fd0ff,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.3,
    });
    const tablo = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.2, 0.1), tabloMat);
    tablo.position.set(0, 1.16, 2.62);
    tablo.rotation.x = -0.28;
    train.add(tablo);

    // faralar
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xd7f2ff });
    const lampGeo = new THREE.SphereGeometry(0.18, 20, 14);
    const lampL = new THREE.Mesh(lampGeo, lampMat);
    lampL.scale.set(1.9, 0.75, 1);
    lampL.position.set(-0.6, -0.62, 1.44);
    const lampR = lampL.clone();
    lampR.position.x = 0.6;
    train.add(lampL, lampR);

    // qizil signal chiroqlari
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff4d4d });
    const redL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), redMat);
    redL.scale.set(1.5, 0.8, 1);
    redL.position.set(-1.02, -0.5, 1.2);
    const redR = redL.clone();
    redR.position.x = 1.02;
    train.add(redL, redR);
    const rg1 = makeGlow(1.5, 0xff4d4d, 0.8);
    rg1.position.copy(redL.position);
    const rg2 = makeGlow(1.5, 0xff4d4d, 0.8);
    rg2.position.copy(redR.position);
    train.add(rg1, rg2);

    // markazdagi qora panjara
    const grillMat = new THREE.MeshStandardMaterial({ color: 0x1a2634, metalness: 0.7, roughness: 0.45 });
    const grill = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.34, 0.12), grillMat);
    grill.position.set(0, -0.36, 1.5);
    train.add(grill);

    const gl1 = makeGlow(3.2, 0xbfe9ff, 0.95);
    gl1.position.copy(lampL.position);
    const gl2 = makeGlow(3.2, 0xbfe9ff, 0.95);
    gl2.position.copy(lampR.position);
    train.add(gl1, gl2);

    const beamL = new THREE.SpotLight(0xcfeeff, 60, 60, 0.42, 0.7, 1.4);
    beamL.position.set(-0.6, -0.55, 1.5);
    beamL.target.position.set(-1.4, -1.2, -22);
    train.add(beamL, beamL.target);
    const beamR = new THREE.SpotLight(0xcfeeff, 60, 60, 0.42, 0.7, 1.4);
    beamR.position.set(0.6, -0.55, 1.5);
    beamR.target.position.set(1.4, -1.2, -22);
    train.add(beamR, beamR.target);

    // etak / bogilar
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x121b28, metalness: 0.5, roughness: 0.7 });
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.85, 3.2), skirtMat);
      b.position.set(0, -1.42, 4.5 + i * 7.5);
      train.add(b);
    }

    // tomdagi pantograf
    const panMat = new THREE.MeshStandardMaterial({ color: 0x9db2c7, metalness: 0.85, roughness: 0.3 });
    const panBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 1.1), panMat);
    panBase.position.set(0, 1.3, 12);
    train.add(panBase);
    const armA = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.5, 0.09), panMat);
    armA.position.set(0, 2.0, 11.6);
    armA.rotation.x = 0.5;
    const armB = armA.clone();
    armB.rotation.x = -0.5;
    armB.position.z = 12.4;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.12), panMat);
    bar.position.set(0, 2.72, 12);
    train.add(armA, armB, bar);

    /* ---------------- ESHIK ---------------- */
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, -0.15, 8.6);
    train.add(doorGroup);

    const doorW = 0.74;
    const doorH = 2.35;

    // 1) eshik ortidagi yorugʻ ichki panel (eshik ochilganda koʻrinadi)
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xeafaff });
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(doorW * 2, doorH), innerMat);
    inner.rotation.y = Math.PI / 2;
    inner.position.set(1.46, 0, 0);
    doorGroup.add(inner);

    // 2) eshik tavaqalari
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x18344d,
      metalness: 0.92,
      roughness: 0.08,
    });
    const dl = new THREE.Mesh(new THREE.BoxGeometry(0.09, doorH, doorW), doorMat);
    dl.position.set(1.545, 0, -doorW / 2);
    const dr = new THREE.Mesh(new THREE.BoxGeometry(0.09, doorH, doorW), doorMat);
    dr.position.set(1.545, 0, doorW / 2);
    doorGroup.add(dl, dr);

    // 3) ramka — toʻrtta ingichka planka (toʻliq plita emas)
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
      metalness: 0.4,
      roughness: 0.4,
    });
    const fW = doorW * 2 + 0.16;
    const bars: THREE.Mesh[] = [
      new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, fW), frameMat), // tepa
      new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, fW), frameMat), // past
      new THREE.Mesh(new THREE.BoxGeometry(0.05, doorH + 0.14, 0.07), frameMat),
      new THREE.Mesh(new THREE.BoxGeometry(0.05, doorH + 0.14, 0.07), frameMat),
    ];
    bars[0].position.set(1.6, doorH / 2 + 0.035, 0);
    bars[1].position.set(1.6, -doorH / 2 - 0.035, 0);
    bars[2].position.set(1.6, 0, -fW / 2);
    bars[3].position.set(1.6, 0, fW / 2);
    doorGroup.add(...bars);

    // 4) ichkaridan urayotgan yorugʻlik
    const insideGlow = makeGlow(5.5, 0xdff4ff, 0);
    insideGlow.position.set(1.75, 0, 0);
    doorGroup.add(insideGlow);
    const insideLight = new THREE.PointLight(0xdff4ff, 0, 26, 1.6);
    insideLight.position.set(2.4, 0.2, 0);
    doorGroup.add(insideLight);

    /* ---------------- ICHKI TUNNEL ---------------- */
    const tunnel = new THREE.Group();
    tunnel.position.set(0, 0, 9);
    tunnel.visible = false;
    scene.add(tunnel);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x9be3ff,
      transparent: true,
      opacity: 0.5,
      fog: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.035, 6, 44), ringMat.clone());
      r.position.z = i * 2.1;
      r.scale.y = 0.82;
      tunnel.add(r);
      rings.push(r);
    }
    // tunnel devoridagi yorugʻ chiziqlar
    const stripLineMat = new THREE.LineBasicMaterial({
      color: 0xdff6ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    for (const a of [0.5, 2.2, 3.9, 5.5]) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a) * 1.95, Math.sin(a) * 1.6, -4),
        new THREE.Vector3(Math.cos(a) * 1.95, Math.sin(a) * 1.6, 62),
      ]);
      tunnel.add(new THREE.Line(g, stripLineMat));
    }
    // tunnel oxiridagi yorugʻ nuqta
    const vanish = makeGlow(9, 0xffffff, 0);
    vanish.position.set(0, 0, 46);
    tunnel.add(vanish);

    /* ---------------- YOʻL: rels, shpal, ustunlar ---------------- */
    const world = new THREE.Group();
    scene.add(world);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x8fa3b8, metalness: 0.95, roughness: 0.3 });
    for (const x of [-0.72, 0.72]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 300), railMat);
      rail.position.set(x, -1.92, 40);
      world.add(rail);
    }

    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x1a2433, roughness: 0.95 });
    const SLEEPERS = 120;
    const sleepers = new THREE.InstancedMesh(
      new THREE.BoxGeometry(2.6, 0.13, 0.3),
      sleeperMat,
      SLEEPERS
    );
    world.add(sleepers);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x243347, metalness: 0.6, roughness: 0.6 });
    const POLES = 20;
    const poles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 7, 0.18), poleMat, POLES);
    world.add(poles);

    const groundMat = new THREE.MeshStandardMaterial({ color: 0x070d17, roughness: 1 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 400), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -2, 40);
    world.add(ground);

    /* ---------------- TEZLIK CHIZIQLARI (3D) ---------------- */
    const STREAKS = 260;
    const sPos = new Float32Array(STREAKS * 6);
    const sVel = new Float32Array(STREAKS);
    const sBase = new Float32Array(STREAKS * 2);
    for (let i = 0; i < STREAKS; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 4 + Math.random() * 26;
      sBase[i * 2] = Math.cos(a) * rad;
      sBase[i * 2 + 1] = Math.sin(a) * rad * 0.55 + 2;
      sVel[i] = 1.4 + Math.random() * 2.6;
    }
    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    const streakMat = new THREE.LineBasicMaterial({
      color: 0x9fdcff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const streaks = new THREE.LineSegments(streakGeo, streakMat);
    world.add(streaks);
    const sZ = new Float32Array(STREAKS);
    for (let i = 0; i < STREAKS; i++) sZ[i] = Math.random() * 160 - 40;

    /* ---------------- animatsiya ---------------- */
    const dummy = new THREE.Object3D();
    const DURATION = getDuration();
    const start = performance.now();
    let raf = 0;
    let scroll = 0;

    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const tmp = new THREE.Vector3();

    const frame_ = (now: number) => {
      const t = clamp01((now - start) / DURATION);
      const dt = 1 / 60;

      /* --- yoʻl harakati (tezlik hissi) --- */
      const speed = lerp(46, 8, easeOut(seg(t, 0.3, 0.75)));
      scroll = (scroll + speed * dt) % 2.4;

      for (let i = 0; i < SLEEPERS; i++) {
        dummy.position.set(0, -1.98, ((i * 2.4 - scroll + 260) % 260) - 60);
        dummy.updateMatrix();
        sleepers.setMatrixAt(i, dummy.matrix);
      }
      sleepers.instanceMatrix.needsUpdate = true;

      for (let i = 0; i < POLES; i++) {
        dummy.position.set(6.4, 1.4, ((i * 16 - scroll * 1.0 + 320) % 320) - 60);
        dummy.updateMatrix();
        poles.setMatrixAt(i, dummy.matrix);
      }
      poles.instanceMatrix.needsUpdate = true;

      /* --- tezlik chiziqlari --- */
      const streakLen = lerp(9, 1.5, easeOut(seg(t, 0.25, 0.7)));
      for (let i = 0; i < STREAKS; i++) {
        sZ[i] -= sVel[i] * speed * dt * 1.6;
        if (sZ[i] < -50) sZ[i] += 190;
        const x = sBase[i * 2];
        const y = sBase[i * 2 + 1];
        sPos[i * 6] = x;
        sPos[i * 6 + 1] = y;
        sPos[i * 6 + 2] = sZ[i];
        sPos[i * 6 + 3] = x;
        sPos[i * 6 + 4] = y;
        sPos[i * 6 + 5] = sZ[i] + streakLen;
      }
      streakGeo.attributes.position.needsUpdate = true;
      streakMat.opacity = lerp(0.65, 0.12, easeOut(seg(t, 0.3, 0.8)));

      /* --- eshik --- */
      const dOpen = ease(seg(t, 0.5, 0.66));
      dl.position.z = -doorW / 2 - dOpen * doorW * 0.99;
      dr.position.z = doorW / 2 + dOpen * doorW * 0.99;
      insideGlow.material.opacity = dOpen * 0.9;
      insideLight.intensity = dOpen * 45;
      frameMat.emissiveIntensity = 0.6 + dOpen * 1.8;
      innerMat.color.setScalar(0.25 + dOpen * 0.75);

      /* --- kamera --- */
      let cx: number, cy: number, cz: number;
      let lx: number, ly: number, lz: number;

      if (t < 0.3) {
        const k = ease(seg(t, 0, 0.3));
        cx = lerp(0.6, 0.2, k);
        cy = lerp(4.2, 1.4, k);
        cz = lerp(-42, -7.5, k);
        lx = 0;
        ly = 0.1;
        lz = 2;
      } else if (t < 0.5) {
        const k = ease(seg(t, 0.3, 0.5));
        cx = lerp(0.2, 9.6, k);
        cy = lerp(1.4, 1.1, k);
        cz = lerp(-7.5, 6.4, k);
        lx = lerp(0, 1.6, k);
        ly = lerp(0.1, 0, k);
        lz = lerp(2, 8.6, k);
      } else if (t < 0.66) {
        const k = ease(seg(t, 0.5, 0.66));
        cx = lerp(9.6, 5.4, k);
        cy = lerp(1.1, 0.1, k);
        cz = lerp(6.4, 8.6, k);
        lx = 1.6;
        ly = lerp(0, -0.05, k);
        lz = 8.6;
      } else {
        const k = ease(seg(t, 0.66, 0.94));
        cx = lerp(5.4, 0, k);
        cy = lerp(0.1, 0, k);
        cz = lerp(8.6, 9.6, k);
        lx = lerp(1.6, 0, k);
        ly = -0.05;
        lz = lerp(8.6, 34, k);
      }

      // yengil kamera tebranishi (tezlikdan)
      const shake = (1 - easeOut(seg(t, 0.25, 0.8))) * 0.05;
      camera.position.set(
        cx + Math.sin(now / 55) * shake,
        cy + Math.cos(now / 41) * shake,
        cz
      );
      camera.lookAt(tmp.set(lx, ly, lz));

      /* --- tunnel va ichkariga kirish --- */
      if (t > 0.62) {
        tunnel.visible = true;
        const k = seg(t, 0.62, 1);
        vanish.material.opacity = k;
        (scene.fog as THREE.FogExp2).density = lerp(0.019, 0.004, k);
        for (let i = 0; i < rings.length; i++) {
          const z = ((i * 2.4 - k * 52 + 120) % 62);
          rings[i].position.z = z;
          const d = Math.abs(z + 9 - camera.position.z);
          (rings[i].material as THREE.MeshBasicMaterial).opacity = Math.max(
            0,
            Math.min(0.95, 1.0 - d / 48)
          );
        }
      }

      // kamera eshikdan oʻtgach tashqi olamni yashiramiz
      const inside = t > 0.73;
      if (train.visible === inside) {
        train.visible = !inside;
        world.visible = !inside;
      }

      /* --- yakun --- */
      if (t > 0.9) setFlash((t - 0.9) / 0.1);
      if (t > 0.55) setCaption(false);

      renderer.render(scene, camera);

      if (t >= 1) {
        if (!done.current) {
          done.current = true;
          onFinish();
        }
        return;
      }
      raf = requestAnimationFrame(frame_);
    };
    raf = requestAnimationFrame(frame_);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      glowTex.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[70] bg-[#03070d]">
      <div ref={host} className="h-full w-full" />

      {/* vinyetka */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_45%,rgba(0,0,0,.75)_100%)]" />

      {/* sarlavha */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-16 text-center transition-all duration-500"
        style={{ opacity: caption ? 1 : 0, transform: `translateY(${caption ? 0 : -12}px)` }}
      >
        <p className="text-[12px] uppercase tracking-[0.45em] text-sky-300/80">
          TCH-6 · Buxoro lokomotiv deposi
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Tizimga kirilmoqda
        </p>
      </div>

      {/* oq portlash */}
      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ opacity: flash }}
      />
    </div>
  );
}
