import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

function Chamber({ position, color, label }: { position: [number, number, number], color: string, label: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            if (hovered) {
                meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1.1, 0.1);
                meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1.1, 0.1);
                meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1.1, 0.1);
            } else {
                meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1);
                meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1, 0.1);
                meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1, 0.1);
            }
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <sphereGeometry args={[0.8, 32, 32]} />
            <meshStandardMaterial color={hovered ? 'hotpink' : color} transparent opacity={0.8} />
            <Html distanceFactor={10}>
                <div className="bg-black/50 text-white px-2 py-1 rounded text-xs select-none">
                    {label}
                </div>
            </Html>
        </mesh>
    );
}

export default function HeartModel() {
    return (
        <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs">
                Interactive 3D Heart
            </div>

            <Canvas camera={{ position: [0, 0, 6] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <OrbitControls enableZoom={true} />

                {/* Right Atrium - Top Left (Viewer's Left) */}
                <Chamber position={[-1, 1, 0]} color="#3b82f6" label="Right Atrium" />

                {/* Left Atrium - Top Right */}
                <Chamber position={[1, 1, 0]} color="#ef4444" label="Left Atrium" />

                {/* Right Ventricle - Bottom Left */}
                <Chamber position={[-1, -1, 0]} color="#1d4ed8" label="Right Ventricle" />

                {/* Left Ventricle - Bottom Right */}
                <Chamber position={[1, -1, 0]} color="#b91c1c" label="Left Ventricle" />

                {/* Connections (Mocked as Cylinders) */}
                <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <cylinderGeometry args={[0.2, 0.2, 4]} />
                    <meshStandardMaterial color="#888" opacity={0.3} transparent />
                </mesh>
                <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
                    <cylinderGeometry args={[0.2, 0.2, 4]} />
                    <meshStandardMaterial color="#888" opacity={0.3} transparent />
                </mesh>

            </Canvas>
        </div>
    );
}
