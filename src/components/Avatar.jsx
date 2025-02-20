import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader, useGraph } from "@react-three/fiber";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useControls, Leva } from "leva";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";

// Mapeo de valores para los morph targets
const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

export function Avatar(props) {
  // Controles de Leva para ajustar parámetros en tiempo real
  const {
    playAudio,
    script,
    headFollow,
    smoothMorphTarget,
    morphTargetSmoothing,
  } = useControls({
    playAudio: false,
    headFollow: true,
    smoothMorphTarget: true,
    morphTargetSmoothing: 0.5,
    script: {
      value: "speak",
      options: ["welcome", "pizzas", "speak"],
    },
  });

  // Audio y archivo JSON con la información de lipsync
  const audio = useMemo(() => new Audio(`/audios/${script}.mp3`), [script]);
  const jsonFile = useLoader(THREE.FileLoader, `audios/${script}.json`);
  const lipsync = JSON.parse(jsonFile);

  // Carga del nuevo modelo
  const gltf = useGLTF("/models/679e3b34e3a5fc25a96509f8.glb");
  // Se clona la escena para evitar efectos secundarios con animaciones
  const clone = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const { nodes, materials } = useGraph(clone);

  // Estado para manejar la animación actual
  const [animation, setAnimation] = useState("Calm");
  // Referencia al grupo principal para animar
  const group = useRef();

  // Carga de animaciones en formato FBX
  const { animations: calmAnimation } = useFBX("/animations/calm.fbx");
  const { animations: speakAnimation } = useFBX("/animations/speak.fbx");
  // const { animations: idleAnimation } = useFBX("/animations/Idle.fbx");
  const { animations: angryAnimation } = useFBX(
    "/animations/Angry Gesture.fbx"
  );
  const { animations: greetingAnimation } = useFBX(
    "/animations/Standing Greeting.fbx"
  );

  // Asignamos nombres a las animaciones para luego seleccionarlas
  // idleAnimation[0].name = "Idle";
  angryAnimation[0].name = "Angry";
  greetingAnimation[0].name = "Greeting";
  calmAnimation[0].name = "Calm";
  speakAnimation[0].name = "Speak";

  const { actions } = useAnimations(
    [
      angryAnimation[0],
      greetingAnimation[0],
      calmAnimation[0],
      speakAnimation[0],
    ],
    group
  );

  // Manejo de la transición entre animaciones
  useEffect(() => {
    actions[animation].reset().fadeIn(0.5).play();
    return () => actions[animation].fadeOut(0.5);
  }, [animation]);

  // Actualización en cada frame
  useFrame((state) => {
    const currentAudioTime = audio.currentTime;
    if (audio.paused || audio.ended) {
      setAnimation("Calm");
      return;
    }

    // Reinicia o interpola los morph targets según el parámetro smoothMorphTarget
    Object.values(corresponding).forEach((value) => {
      if (!smoothMorphTarget) {
        nodes.Wolf3D_Head.morphTargetInfluences[
          nodes.Wolf3D_Head.morphTargetDictionary[value]
        ] = 0;
        nodes.Wolf3D_Teeth.morphTargetInfluences[
          nodes.Wolf3D_Teeth.morphTargetDictionary[value]
        ] = 0;
      } else {
        nodes.Wolf3D_Head.morphTargetInfluences[
          nodes.Wolf3D_Head.morphTargetDictionary[value]
        ] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[value]
          ],
          0,
          morphTargetSmoothing
        );
        nodes.Wolf3D_Teeth.morphTargetInfluences[
          nodes.Wolf3D_Teeth.morphTargetDictionary[value]
        ] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[value]
          ],
          0,
          morphTargetSmoothing
        );
      }
    });

    // Actualiza los morph targets según la posición en el audio (lipsync)
    for (let i = 0; i < lipsync.mouthCues.length; i++) {
      const mouthCue = lipsync.mouthCues[i];
      if (
        currentAudioTime >= mouthCue.start &&
        currentAudioTime <= mouthCue.end
      ) {
        if (!smoothMorphTarget) {
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[
              corresponding[mouthCue.value]
            ]
          ] = 1;
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[
              corresponding[mouthCue.value]
            ]
          ] = 1;
        } else {
          nodes.Wolf3D_Head.morphTargetInfluences[
            nodes.Wolf3D_Head.morphTargetDictionary[
              corresponding[mouthCue.value]
            ]
          ] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Head.morphTargetInfluences[
              nodes.Wolf3D_Head.morphTargetDictionary[
                corresponding[mouthCue.value]
              ]
            ],
            1,
            morphTargetSmoothing
          );
          nodes.Wolf3D_Teeth.morphTargetInfluences[
            nodes.Wolf3D_Teeth.morphTargetDictionary[
              corresponding[mouthCue.value]
            ]
          ] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Teeth.morphTargetInfluences[
              nodes.Wolf3D_Teeth.morphTargetDictionary[
                corresponding[mouthCue.value]
              ]
            ],
            1,
            morphTargetSmoothing
          );
        }
        break;
      }
    }

    // Movimiento de la cabeza (headFollow)
    // if (headFollow && group.current) {
    //   const head = group.current.getObjectByName("Wolf3D_Head");
    //   if (head) {
    //     head.lookAt(state.camera.position);
    //   }
    // }
  });

  // Efecto para iniciar el audio y seleccionar la animación inicial
  useEffect(() => {
    // Configuración inicial del morph target (por ejemplo, usando "viseme_I")
    nodes.Wolf3D_Head.morphTargetInfluences[
      nodes.Wolf3D_Head.morphTargetDictionary["viseme_I"]
    ] = 1;
    nodes.Wolf3D_Teeth.morphTargetInfluences[
      nodes.Wolf3D_Teeth.morphTargetDictionary["viseme_I"]
    ] = 1;

    if (playAudio) {
      audio.play();
      if (script === "speak") {
        setAnimation("Speak");
      }
      if (script === "welcome") {
        setAnimation("Greeting");
      }
      if (script === "pizzas") {
        setAnimation("Angry");
      }
    } else {
      setAnimation("Calm");
      audio.pause();
    }
  }, [playAudio, script, nodes]);

  // const { nodes, materials } = useGLTF("/models/679e3b34e3a5fc25a96509f8.glb");
  // const { animations: idleAnimation } = useFBX("/animations/Idle.fbx");
  // const { animations: angryAnimation } = useFBX(
  //   "/animations/Angry Gesture.fbx"
  // );
  // const { animations: greetingAnimation } = useFBX(
  //   "/animations/Standing Greeting.fbx"
  // );

  // idleAnimation[0].name = "Idle";
  // angryAnimation[0].name = "Angry";
  // greetingAnimation[0].name = "Greeting";

  // const [animation, setAnimation] = useState("Idle");

  // // const group = useRef();
  // const { actions } = useAnimations(
  //   [idleAnimation[0], angryAnimation[0], greetingAnimation[0]],
  //   group
  // );

  // useEffect(() => {
  //   actions[animation].reset().fadeIn(0.5).play();
  //   return () => actions[animation].fadeOut(0.5);
  // }, [animation]);

  // // CODE ADDED AFTER THE TUTORIAL (but learnt in the portfolio tutorial ♥️)
  useFrame((state) => {
    if (headFollow) {
      group.current.getObjectByName("Head").lookAt(state.camera.position);
    }
  });

  return (
    <group {...props} dispose={null} ref={group}>
      {/* Oculta el panel de Leva */}
      {/* <Leva hidden /> */}

      {/* Estructura del nuevo modelo */}
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

// Pre-carga del modelo para optimizar la carga
useGLTF.preload("/models/679e3b34e3a5fc25a96509f8.glb");
