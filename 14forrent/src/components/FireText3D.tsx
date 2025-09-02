
import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// Fire shader
const fireFragmentShader = `
uniform float time;
varying vec2 vUv;

void main() {
  float strength = 1.0 - smoothstep(0.4, 0.5, length(vUv - 0.5));
  float flame = sin(time * 2.0 + vUv.y * 10.0 + vUv.x * 5.0) * 0.5 + 0.5;
  float intensity = strength * flame * 2.0;
  
  // More vibrant fire colors
  vec3 orange = vec3(1.0, 0.4, 0.0);
  vec3 yellow = vec3(1.0, 1.0, 0.3);
  vec3 red = vec3(1.0, 0.2, 0.0);
  
  // Create color gradient based on flame intensity
  vec3 color = mix(red, orange, flame);
  color = mix(color, yellow, flame * flame);
  
  gl_FragColor = vec4(color * intensity, intensity);
}
`;

const fireVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function FireTextMesh({ text = "HOT DEALS" }) {
  const mesh = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
    }
    
    // Add subtle floating animation
    if (mesh.current) {
      mesh.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <Text
      ref={mesh}
      fontSize={1.8}
      letterSpacing={0.1}
      font="/fonts/BebasNeue-Regular.ttf"
      anchorX="center"
      anchorY="middle"
      position={[0, 0, 0]}
    >
      {text}
      <shaderMaterial
        ref={materialRef}
        attach="material"
        vertexShader={fireVertexShader}
        fragmentShader={fireFragmentShader}
        uniforms={{
          time: { value: 0 }
        }}
        transparent={true}
        blending={THREE.AdditiveBlending}
      />
    </Text>
  );
}

export default function FireText3D() {
  return (
    <div 
      className="w-full h-20 md:h-24 flex justify-center items-center mb-4"
      style={{ background: "transparent" }}
    >
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 60 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <FireTextMesh text="HOT DEALS" />
      </Canvas>
    </div>
  );
}
