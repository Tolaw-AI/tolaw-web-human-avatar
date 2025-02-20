import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Avatar } from "./Avatar";
import { Model } from "./Avatar2";

export const Experience = () => {
  const texture = useTexture("textures/youtubeBackground.jpg");
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      <OrbitControls
        // enabled={false}
        enableZoom={false}
        enableRotate={false}
        // enablePan={false}
        // makeDefault
      />
      <Avatar position={[0, -3.59, 6.6]} scale={2.2} />
      {/* <Model position={[0, -3, 5]} scale={2.1} /> */}

      <Environment preset="sunset" />
      {/* <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh> */}
    </>
  );
};
