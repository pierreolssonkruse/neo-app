import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const NEOVisualizer = ({ neoData }: { neoData: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current?.appendChild(renderer.domElement);

    const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
    const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x0000FF });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // TODO: Add NEOs based on neoData

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();
  }, [neoData]);

  return <div ref={containerRef}></div>;
};

export default NEOVisualizer;