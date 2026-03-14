import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial } from "@react-three/drei";
import { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function JarBody() {
  const points = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    // Bottom curve
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(0.8, 0));
    pts.push(new THREE.Vector2(0.95, 0.1));
    pts.push(new THREE.Vector2(1.05, 0.3));
    // Body
    pts.push(new THREE.Vector2(1.1, 0.6));
    pts.push(new THREE.Vector2(1.12, 1.2));
    pts.push(new THREE.Vector2(1.1, 1.8));
    // Shoulder
    pts.push(new THREE.Vector2(1.0, 2.1));
    pts.push(new THREE.Vector2(0.85, 2.3));
    // Neck
    pts.push(new THREE.Vector2(0.75, 2.4));
    pts.push(new THREE.Vector2(0.72, 2.5));
    // Lip
    pts.push(new THREE.Vector2(0.78, 2.55));
    pts.push(new THREE.Vector2(0.78, 2.6));
    pts.push(new THREE.Vector2(0.72, 2.6));
    return pts;
  }, []);

  return (
    <mesh position={[0, -1.3, 0]}>
      <latheGeometry args={[points, 64]} />
      <MeshTransmissionMaterial
        backside
        samples={6}
        thickness={0.4}
        chromaticAberration={0.1}
        anisotropy={0.2}
        distortion={0.1}
        distortionScale={0.2}
        temporalDistortion={0.1}
        color="#d4a053"
        transmission={0.7}
        roughness={0.15}
        metalness={0.3}
        ior={1.5}
      />
    </mesh>
  );
}

function JarContent() {
  return (
    <mesh position={[0, -0.3, 0]}>
      <cylinderGeometry args={[0.95, 0.95, 1.6, 64]} />
      <meshStandardMaterial
        color="#1a0f05"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function JarLabel() {
  return (
    <mesh position={[0, 0.1, 1.13]} rotation={[0, 0, 0]}>
      <planeGeometry args={[1.4, 0.9]} />
      <meshStandardMaterial
        color="#c9961a"
        roughness={0.4}
        metalness={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Cap({ scrollProgress }: { scrollProgress: number }) {
  const capRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);
  const currentY = useRef(0);
  const currentZ = useRef(0);

  useFrame(() => {
    if (!capRef.current) return;

    // Cap opens: rotates backward and lifts up
    const targetRotation = scrollProgress * -2.2; // ~126 degrees back
    const targetY = scrollProgress * 2.5;
    const targetZ = scrollProgress * -0.8;

    currentRotation.current = lerp(currentRotation.current, targetRotation, 0.08);
    currentY.current = lerp(currentY.current, targetY, 0.08);
    currentZ.current = lerp(currentZ.current, targetZ, 0.08);

    capRef.current.rotation.x = currentRotation.current;
    capRef.current.position.y = 1.3 + currentY.current;
    capRef.current.position.z = currentZ.current;
  });

  return (
    <group ref={capRef} position={[0, 1.3, 0]}>
      {/* Cap outer */}
      <mesh>
        <cylinderGeometry args={[0.85, 0.82, 0.35, 64]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      {/* Cap top detail */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.78, 0.85, 0.02, 64]} />
        <meshStandardMaterial
          color="#c9961a"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      {/* Cap grip ridges */}
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.84,
              0,
              Math.sin(angle) * 0.84,
            ]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.02, 0.3, 0.04]} />
            <meshStandardMaterial
              color="#222222"
              roughness={0.4}
              metalness={0.7}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function GoldenParticles({ scrollProgress }: { scrollProgress: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 60;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.7;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = 1.5 + Math.random() * 2;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      spd[i] = 0.3 + Math.random() * 0.7;
    }
    return [pos, spd];
  }, []);

  useFrame((state) => {
    if (!particlesRef.current || scrollProgress < 0.15) {
      if (particlesRef.current) particlesRef.current.visible = false;
      return;
    }
    particlesRef.current.visible = true;
    const geo = particlesRef.current.geometry;
    const posArray = geo.attributes.position.array as Float32Array;
    const t = state.clock.getElapsedTime();
    const intensity = Math.min(1, (scrollProgress - 0.15) / 0.3);

    for (let i = 0; i < count; i++) {
      const baseY = positions[i * 3 + 1];
      posArray[i * 3] = positions[i * 3] + Math.sin(t * speeds[i] + i) * 0.15;
      posArray[i * 3 + 1] = baseY + Math.sin(t * speeds[i] * 0.5 + i * 0.5) * 0.5 * intensity;
      posArray[i * 3 + 2] = positions[i * 3 + 2] + Math.cos(t * speeds[i] + i) * 0.15;
    }
    geo.attributes.position.needsUpdate = true;
    (particlesRef.current.material as THREE.PointsMaterial).opacity = intensity * 0.8;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#d4a053"
        transparent
        opacity={0}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Scene({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1 + scrollProgress * 0.5;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#fff5e0" />
      <directionalLight position={[-3, 4, -5]} intensity={0.5} color="#d4a053" />
      <pointLight position={[0, 3, 0]} intensity={scrollProgress * 2} color="#d4a053" distance={5} />
      <spotLight
        position={[0, 6, 3]}
        angle={0.4}
        penumbra={0.5}
        intensity={1.5}
        color="#fff8e7"
        castShadow
      />

      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <group ref={groupRef} scale={1}>
          <JarBody />
          <JarContent />
          <JarLabel />
          <Cap scrollProgress={scrollProgress} />
          <GoldenParticles scrollProgress={scrollProgress} />
        </group>
      </Float>

      <Environment preset="studio" />
    </>
  );
}

export default function JarScene() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      // Animate over the first 2 viewport heights of scroll
      const progress = Math.min(1, Math.max(0, scrollY / (viewportHeight * 1.5)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[1] pointer-events-none"
      style={{ opacity: 1 }}
    >
      <Canvas
        camera={{ position: [0, 1, 5], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
