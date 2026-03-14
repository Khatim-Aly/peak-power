import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, ContactShadows } from "@react-three/drei";
import { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Realistic dark resin jar body */
function JarBody() {
  const points = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(0.75, 0));
    pts.push(new THREE.Vector2(0.9, 0.08));
    pts.push(new THREE.Vector2(1.0, 0.25));
    pts.push(new THREE.Vector2(1.08, 0.5));
    pts.push(new THREE.Vector2(1.12, 0.9));
    pts.push(new THREE.Vector2(1.12, 1.4));
    pts.push(new THREE.Vector2(1.1, 1.7));
    pts.push(new THREE.Vector2(1.02, 1.9));
    pts.push(new THREE.Vector2(0.9, 2.05));
    pts.push(new THREE.Vector2(0.78, 2.15));
    pts.push(new THREE.Vector2(0.72, 2.22));
    pts.push(new THREE.Vector2(0.7, 2.3));
    pts.push(new THREE.Vector2(0.74, 2.35));
    pts.push(new THREE.Vector2(0.74, 2.4));
    pts.push(new THREE.Vector2(0.7, 2.4));
    return pts;
  }, []);

  return (
    <mesh position={[0, -1.2, 0]} castShadow receiveShadow>
      <latheGeometry args={[points, 64]} />
      <meshPhysicalMaterial
        color="#1a0d00"
        roughness={0.15}
        metalness={0.05}
        clearcoat={0.8}
        clearcoatRoughness={0.1}
        transmission={0.15}
        thickness={0.5}
        ior={1.45}
      />
    </mesh>
  );
}

/* Dark shilajit resin inside */
function JarContent() {
  return (
    <mesh position={[0, -0.1, 0]}>
      <cylinderGeometry args={[0.9, 0.9, 1.3, 64]} />
      <meshStandardMaterial color="#0d0702" roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

/* Gold label band around jar */
function JarLabel() {
  return (
    <mesh position={[0, 0.15, 0]}>
      <cylinderGeometry args={[1.13, 1.13, 0.7, 64, 1, true]} />
      <meshStandardMaterial
        color="#b8860b"
        roughness={0.3}
        metalness={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* Cap with gold top and dark body */
function Cap({ scrollProgress }: { scrollProgress: number }) {
  const capRef = useRef<THREE.Group>(null);
  const curr = useRef({ rot: 0, y: 0, z: 0 });

  useFrame(() => {
    if (!capRef.current) return;
    const targetRot = scrollProgress * -2.4;
    const targetY = scrollProgress * 2.8;
    const targetZ = scrollProgress * -1.0;

    curr.current.rot = lerp(curr.current.rot, targetRot, 0.06);
    curr.current.y = lerp(curr.current.y, targetY, 0.06);
    curr.current.z = lerp(curr.current.z, targetZ, 0.06);

    capRef.current.rotation.x = curr.current.rot;
    capRef.current.position.y = 1.2 + curr.current.y;
    capRef.current.position.z = curr.current.z;
  });

  return (
    <group ref={capRef} position={[0, 1.2, 0]}>
      {/* Cap body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.78, 0.76, 0.3, 64]} />
        <meshPhysicalMaterial
          color="#111111"
          roughness={0.25}
          metalness={0.8}
          clearcoat={0.5}
        />
      </mesh>
      {/* Gold top disc */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.72, 0.78, 0.02, 64]} />
        <meshStandardMaterial color="#c9961a" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Grip ridges */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i / 36) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.77, 0, Math.sin(angle) * 0.77]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.015, 0.26, 0.03]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

/* Golden particles that emerge when jar opens */
function GoldenParticles({ scrollProgress }: { scrollProgress: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 80;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.2 + Math.random() * 0.6;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = 1.5 + Math.random() * 2.5;
      pos[i * 3 + 2] = Math.sin(a) * r;
      spd[i] = 0.3 + Math.random() * 0.7;
    }
    return [pos, spd];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const show = scrollProgress > 0.15;
    ref.current.visible = show;
    if (!show) return;

    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.getElapsedTime();
    const intensity = Math.min(1, (scrollProgress - 0.15) / 0.35);

    for (let i = 0; i < count; i++) {
      arr[i * 3] = positions[i * 3] + Math.sin(t * speeds[i] + i) * 0.2;
      arr[i * 3 + 1] = positions[i * 3 + 1] + Math.sin(t * speeds[i] * 0.5 + i) * 0.6 * intensity;
      arr[i * 3 + 2] = positions[i * 3 + 2] + Math.cos(t * speeds[i] + i) * 0.2;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = intensity * 0.9;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
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
    // Slow continuous rotation + extra rotation on scroll
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15 + scrollProgress * 1.2;
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#fff5e0" castShadow />
      <directionalLight position={[-4, 3, -5]} intensity={0.4} color="#d4a053" />
      <pointLight position={[0, 4, 0]} intensity={scrollProgress * 3} color="#d4a053" distance={6} />
      <spotLight position={[0, 7, 4]} angle={0.35} penumbra={0.6} intensity={1.8} color="#fff8e7" castShadow />

      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
        <group ref={groupRef}>
          <JarBody />
          <JarContent />
          <JarLabel />
          <Cap scrollProgress={scrollProgress} />
          <GoldenParticles scrollProgress={scrollProgress} />
        </group>
      </Float>

      <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={8} blur={2.5} far={4} />
      <Environment preset="studio" />
    </>
  );
}

export default function JarScene() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = document.getElementById("jar-experience");
    sectionRef.current = section;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const viewH = window.innerHeight;

      // Progress: 0 when section top hits viewport bottom, 1 when section bottom hits viewport top
      const progress = 1 - (rect.bottom - viewH * 0.3) / (sectionHeight + viewH * 0.4);
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="jar-experience"
      className="relative min-h-[80vh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-card to-background py-20"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, hsl(var(--gold)), transparent 70%)" }}
        />
      </div>

      {/* Section Header */}
      <div className="relative z-10 text-center mb-4 md:mb-8 px-4">
        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-3">
          Discover the <span className="text-gradient-gold">Essence</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
          Scroll to unveil the pure Himalayan Shilajit within
        </p>
      </div>

      {/* 3D Canvas */}
      <div className="relative z-10 w-full max-w-lg h-[500px] md:h-[650px]">
        <Canvas
          camera={{ position: [0, 0.5, 5.5], fov: 35 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Scene scrollProgress={scrollProgress} />
        </Canvas>
      </div>

      {/* Scroll hint */}
      <div className="relative z-10 mt-4 text-center">
        <p className="text-xs text-muted-foreground animate-bounce-subtle">
          {scrollProgress < 0.5 ? "↓ Scroll down to open" : "↑ Scroll up to close"}
        </p>
      </div>
    </section>
  );
}
