import React, { useRef, useEffect } from "react";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextureLoader } from 'three';
import * as THREE from "three";

const NEOVisualizer = ({ neoData }: { neoData: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current?.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);

    const textureLoader = new TextureLoader();
    textureLoader.load('/earth_texture.jpg', (texture) => {
        const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
        const earthMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);
    });

    const neosForDate = neoData.near_earth_objects["2023-09-12"];
    if (!neosForDate || !Array.isArray(neosForDate)) {
        return;
    }

    const EARTH_DIMETER = 12742;
    const NEO_SCALING_FACTOR = 100;
    const MIN_NEO_SIZE = 0.5;
    const neoTexture = textureLoader.load('/neo_texture.jpg');

    neosForDate.forEach((neo: any) => {
      const neoDiameter = neo.estimated_diameter.meters.estimated_diameter_max / 1000;
      const scaleDiameter = Math.max((neoDiameter / EARTH_DIMETER) * NEO_SCALING_FACTOR, MIN_NEO_SIZE);
      const neoGeometry = new THREE.SphereGeometry(scaleDiameter / 2, 32, 32);
      const neoColor = neo.is_potentially_hazardous_asteroid
        ? 0xff0000
        : 0x00ff00;
      const neoMaterial = new THREE.MeshBasicMaterial({ map: neoTexture });
      const neoSphere = new THREE.Mesh(neoGeometry, neoMaterial);
      const distanceFromEarth = neo.close_approach_data[0].miss_distance.kilometers / 1000000;
      const randomTheta = 2 * Math.PI * Math.random();
      const randomPhi = Math.acos(2 * Math.random() - 1);
      const x = distanceFromEarth * Math.sin(randomPhi) * Math.cos(randomTheta);
      const y = distanceFromEarth * Math.sin(randomPhi) * Math.sin(randomTheta);
      const z = distanceFromEarth * Math.cos(randomPhi);

      neoSphere.position.set(x, y, z);
      scene.add(neoSphere);
    });

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
  }, [neoData]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "500px" }}></div>
  );
};

export default NEOVisualizer;
