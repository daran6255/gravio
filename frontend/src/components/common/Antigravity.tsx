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

    // Distribute particles across concentric rings (polar grid)
    const numRings = Math.max(5, Math.min(20, Math.round(fieldStrength)));
    const rStart = ringRadius * 0.15;
    const rEnd = ringRadius * 1.7;

    // Calculate total weight to distribute particles based on ring radius
    let totalWeight = 0;
    for (let ring = 0; ring < numRings; ring++) {
      const t = ring / (numRings - 1);
      const r = rStart + t * (rEnd - rStart);
      totalWeight += r;
    }

    let allocated = 0;
    for (let ring = 0; ring < numRings; ring++) {
      const t = ring / (numRings - 1);
      const r = rStart + t * (rEnd - rStart);

      // Determine number of particles for this ring (proportional to radius)
      let ringCount = Math.round((r / totalWeight) * count);
      if (ring === numRings - 1) {
        ringCount = count - allocated;
      }
      allocated += ringCount;

      for (let p = 0; p < ringCount; p++) {
        const phi = (p / ringCount) * Math.PI * 2; // Evenly spaced angle

        const x = r * Math.cos(phi);
        const y = r * Math.sin(phi);
        const z = (Math.random() - 0.5) * 4; // Slight 3D depth

        const speed = 0.003 + Math.random() * 0.004;
        const timeOffset = Math.random() * 1000;

        temp.push({
          t: timeOffset,
          speed,
          baseRadius: r,
          ringAngle: phi,
          ringIndex: ring,
          mx: x,
          my: y,
          mz: z,
          cx: x,
          cy: y,
          cz: z,
          vx: 0,
          vy: 0,
          vz: 0,
          randomRadiusOffset: (Math.random() - 0.5) * 2
        });
      }
    }
    return temp;
  }, [count, magnetRadius, ringRadius, fieldStrength]);

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
      // Increment time
      particle.t += particle.speed;
      const { t, baseRadius, ringAngle, mz } = particle;

      const projectionFactor = 1 - particle.cz / 50;
      // Scale target tracking with magnetRadius
      const targetScale = magnetRadius / 13;
      const projectedTargetX = targetX * projectionFactor * targetScale;
      const projectedTargetY = targetY * projectionFactor * targetScale;

      // Base angle with rotation
      const currentAngle = ringAngle + globalRotation;

      // Add gentle wave radial expansion/contraction to make it dynamic
      const wave = Math.sin(t * waveSpeed * 5 + currentAngle * 3) * (0.05 * waveAmplitude * baseRadius);
      const currentRadius = baseRadius + wave;

      // Target position centered at targetX, targetY
      const targetPos = {
        x: projectedTargetX + currentRadius * Math.cos(currentAngle),
        y: projectedTargetY + currentRadius * Math.sin(currentAngle),
        z: mz * depthFactor + Math.sin(t) * (0.2 * waveAmplitude * depthFactor)
      };

      // Interpolate current position
      particle.cx += (targetPos.x - particle.cx) * lerpSpeed;
      particle.cy += (targetPos.y - particle.cy) * lerpSpeed;
      particle.cz += (targetPos.z - particle.cz) * lerpSpeed;

      dummy.position.set(particle.cx, particle.cy, particle.cz);

      // Rotate to point radially from the projected target
      const radialAngle = Math.atan2(particle.cy - projectedTargetY, particle.cx - projectedTargetX);
      dummy.rotation.set(0, 0, radialAngle - Math.PI / 2);

      // Scale: even radial sizing (smaller in center, larger at edges) + pulse with variance
      const maxRadius = ringRadius * 1.7;
      const baseScaleFactor = 0.25 + 0.75 * (baseRadius / maxRadius);
      const pulse = 0.85 + Math.sin(t * pulseSpeed) * 0.15 * particleVariance;
      const finalScale = baseScaleFactor * pulse * particleSize;
      
      dummy.scale.set(finalScale, finalScale, finalScale);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);

      // Color mapping from deep blue at bottom to light blue at top
      const height = v.height || 20;
      const yRatio = Math.max(0, Math.min(1, (particle.cy + height / 2) / height));
      tempColor.lerpColors(cEnd, cStart, yRatio);
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
