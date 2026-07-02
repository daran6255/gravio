import { Canvas, useFrame } from '@react-three/fiber';
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

interface AntigravityProps {
  count?: number;
  magnetRadius?: number;
  ringRadius?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  particleSize?: number;
  lerpSpeed?: number;
  colorStart?: string;
  colorEnd?: string;
  autoAnimate?: boolean;
  particleVariance?: number;
  rotationSpeed?: number;
  depthFactor?: number;
  pulseSpeed?: number;
  particleShape?: 'capsule' | 'sphere' | 'box' | 'tetrahedron';
  fieldStrength?: number;
}

const AntigravityInner: React.FC<AntigravityProps> = ({
  count = 1250,
  magnetRadius = 12,
  ringRadius = 10,
  waveSpeed = 0.5,
  waveAmplitude = 0.8,
  particleSize = 0.10,
  lerpSpeed = 0.04,
  colorStart = '#7D8CF3', // Periwinkle blue
  colorEnd = '#537CDE',   // Deeper indigo blue
  autoAnimate = true,
  particleVariance = 1.2,
  rotationSpeed = 0.010,
  depthFactor = 1.2,
  pulseSpeed = 2.5,
  particleShape = 'capsule',
  fieldStrength = 8
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Memoized color structures to avoid GC allocation inside useFrame loop
  const tempColor = useMemo(() => new THREE.Color(), []);
  const cStart = useMemo(() => new THREE.Color(colorStart), [colorStart]);
  const cEnd = useMemo(() => new THREE.Color(colorEnd), [colorEnd]);

  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMouseMoveTime = useRef(0);
  const virtualMouse = useRef({ x: 0, y: 0 });
  const globalMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      globalMouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      globalMouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      lastMouseMoveTime.current = Date.now();
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const particles = useMemo(() => {
    const temp = [];

    for (let i = 0; i < count; i++) {
      const t = Math.random() * 1000;
      const speed = 0.01 + Math.random() / 150;

      // Radial/spherical placement so particles form a halo cloud around the
      // origin from the start, rather than being scattered across the whole viewport.
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const theta = Math.acos(costheta);
      const r = magnetRadius * (0.2 + Math.random() * 1.1);

      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);

      const randomRadiusOffset = (Math.random() - 0.5) * 2;

      temp.push({
        t,
        speed,
        mx: x,
        my: y,
        mz: z,
        cx: x,
        cy: y,
        cz: z,
        vx: 0,
        vy: 0,
        vz: 0,
        randomRadiusOffset
      });
    }
    return temp;
  }, [count, magnetRadius]);

  useFrame(state => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { viewport: v } = state;
    const m = globalMouse.current;

    const mouseDist = Math.sqrt(Math.pow(m.x - lastMousePos.current.x, 2) + Math.pow(m.y - lastMousePos.current.y, 2));

    if (mouseDist > 0.001) {
      lastMousePos.current = { x: m.x, y: m.y };
    }

    let destX = (m.x * v.width) / 2;
    let destY = (m.y * v.height) / 2;

    // Auto animate movement if the user hasn't moved the mouse recently
    // Slow, contained drift rather than a fast sweep across the whole viewport,
    // so the formation reads as a gently floating cloud instead of an orbiting ring.
    if (autoAnimate && Date.now() - lastMouseMoveTime.current > 2000) {
      const time = state.clock.getElapsedTime();
      destX = Math.sin(time * 0.08) * (v.width / 10);
      destY = Math.cos(time * 0.05) * (v.height / 10);
    }

    const smoothFactor = 0.05;
    virtualMouse.current.x += (destX - virtualMouse.current.x) * smoothFactor;
    virtualMouse.current.y += (destY - virtualMouse.current.y) * smoothFactor;

    const targetX = virtualMouse.current.x;
    const targetY = virtualMouse.current.y;

    const globalRotation = state.clock.getElapsedTime() * rotationSpeed;

    particles.forEach((particle, i) => {
      let { t, speed, mx, my, mz, cz, randomRadiusOffset } = particle;

      t = particle.t += speed / 2;

      const projectionFactor = 1 - cz / 50;
      const projectedTargetX = targetX * projectionFactor;
      const projectedTargetY = targetY * projectionFactor;

      const dx = mx - projectedTargetX;
      const dy = my - projectedTargetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const targetPos = { x: mx, y: my, z: mz * depthFactor };

      if (dist < magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation;

        const wave = Math.sin(t * waveSpeed + angle) * (0.5 * waveAmplitude);
        const deviation = randomRadiusOffset * (5 / (fieldStrength + 0.1));

        const currentRingRadius = ringRadius + wave + deviation;

        targetPos.x = projectedTargetX + currentRingRadius * Math.cos(angle);
        targetPos.y = projectedTargetY + currentRingRadius * Math.sin(angle);
        targetPos.z = mz * depthFactor + Math.sin(t) * (1 * waveAmplitude * depthFactor);
      }

      particle.cx += (targetPos.x - particle.cx) * lerpSpeed;
      particle.cy += (targetPos.y - particle.cy) * lerpSpeed;
      particle.cz += (targetPos.z - particle.cz) * lerpSpeed;

      dummy.position.set(particle.cx, particle.cy, particle.cz);

      const radialAngle = Math.atan2(particle.cy - projectedTargetY, particle.cx - projectedTargetX);
      dummy.rotation.set(0, 0, radialAngle - Math.PI / 2);

      const currentDistToMouse = Math.sqrt(
        Math.pow(particle.cx - projectedTargetX, 2) + Math.pow(particle.cy - projectedTargetY, 2)
      );

      const distFromRing = Math.abs(currentDistToMouse - ringRadius);
      let scaleFactor = 1 - distFromRing / 10;

      scaleFactor = Math.max(0, Math.min(1, scaleFactor));

      const finalScale = scaleFactor * (0.8 + Math.sin(t * pulseSpeed) * 0.2 * particleVariance) * particleSize;
      dummy.scale.set(finalScale, finalScale, finalScale);

      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);

      // Dynamically calculate color based on the current Y coordinate (cy)
      const height = v.height || 20;
      const yRatio = Math.max(0, Math.min(1, (particle.cy + height / 2) / height));
      tempColor.lerpColors(cEnd, cStart, yRatio); // cEnd (deep indigo) at bottom, cStart (periwinkle) at top
      mesh.setColorAt(i, tempColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {particleShape === 'capsule' && <capsuleGeometry args={[0.04, 0.18, 4, 8]} />}
      {particleShape === 'sphere' && <sphereGeometry args={[0.09, 16, 16]} />}
      {particleShape === 'box' && <boxGeometry args={[0.12, 0.12, 0.12]} />}
      {particleShape === 'tetrahedron' && <tetrahedronGeometry args={[0.12]} />}
      <meshBasicMaterial color="#ffffff" />
    </instancedMesh>
  );
};

const Antigravity: React.FC<AntigravityProps> = props => {
  return (
    <Canvas camera={{ position: [0, 0, 40], fov: 35 }}>
      <AntigravityInner {...props} />
    </Canvas>
  );
};

export default Antigravity;
