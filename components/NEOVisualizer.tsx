import React, { useRef, useEffect, useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TextureLoader } from "three";
import * as THREE from "three";

const NEOVisualizer = ({ neoData }: { neoData: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  useEffect(() => {
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x000000);
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current?.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(cameraRef.current, renderer.domElement);

    cameraRef.current.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (sceneRef.current && cameraRef.current) {
        renderer.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      renderer.domElement.removeEventListener("click", onMouseClick);
    };
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;

    rendererRef.current.domElement.addEventListener(
      "click",
      onMouseClick,
      false
    );

    const textureLoader = new TextureLoader();
    textureLoader.load("/earth_texture.jpg", (texture) => {
      const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
      const earthMaterial = new THREE.MeshBasicMaterial({ map: texture });
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      if (sceneRef.current) {
        sceneRef.current.add(earth);
      }
    });

    const dateKeys = Object.keys(neoData.near_earth_objects);
    const dateKey = dateKeys[0];
    const neosForDate = neoData.near_earth_objects[dateKey];
    if (!neosForDate || !Array.isArray(neosForDate)) {
      return;
    }

    const EARTH_DIMETER = 12742;
    const NEO_SCALING_FACTOR = 100;
    const MIN_NEO_SIZE = 0.5;
    const neoTexture = textureLoader.load("/neo_texture.jpg");

    neosForDate.forEach((neo: any) => {
      const neoDiameter =
        neo.estimated_diameter.meters.estimated_diameter_max / 1000;
      const scaleDiameter = Math.max(
        (neoDiameter / EARTH_DIMETER) * NEO_SCALING_FACTOR,
        MIN_NEO_SIZE
      );
      const neoGeometry = new THREE.SphereGeometry(scaleDiameter / 2, 32, 32);
      const neoColor = neo.is_potentially_hazardous_asteroid
        ? 0xff0000
        : 0x00ff00;
      const neoMaterial = new THREE.MeshBasicMaterial({
        map: neoTexture,
        color: neoColor,
      });
      const neoSphere = new THREE.Mesh(neoGeometry, neoMaterial);
      neoSphere.userData = {
        type: "NEO",
        details: neo,
      };

      const distanceFromEarth =
        neo.close_approach_data[0].miss_distance.kilometers / 1000000;
      const randomTheta = 2 * Math.PI * Math.random();
      const randomPhi = Math.acos(2 * Math.random() - 1);
      const x = distanceFromEarth * Math.sin(randomPhi) * Math.cos(randomTheta);
      const y = distanceFromEarth * Math.sin(randomPhi) * Math.sin(randomTheta);
      const z = distanceFromEarth * Math.cos(randomPhi);

      neoSphere.position.set(x, y, z);
      if (sceneRef.current) {
        sceneRef.current.add(neoSphere);
      }

      const boundingSphereSize = scaleDiameter * 2;
      const boundingSphere = new THREE.Mesh(
        new THREE.SphereGeometry(boundingSphereSize, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0x0000ff,
          transparent: true,
          opacity: 0.0,
        })
      );
      boundingSphere.position.set(x, y, z);
      boundingSphere.userData = {
        type: "NEO_BOUNDING",
        associatedNeo: neoSphere,
        details: neo,
      };
      if (sceneRef.current) {
        sceneRef.current.add(boundingSphere);
      }
    });

    return () => {
      rendererRef.current?.domElement.removeEventListener(
        "click",
        onMouseClick
      );
    };
  }, [neoData]);

  function onMouseClick(event: MouseEvent) {
    event.preventDefault();

    const rect = rendererRef.current?.domElement.getBoundingClientRect();

    if (!rect) return;

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (cameraRef.current) {
      raycaster.setFromCamera(mouse, cameraRef.current);
    }

    const intersects = raycaster.intersectObjects(
      sceneRef.current ? sceneRef.current.children : []
    );

    for (let intersect of intersects) {
      const { object } = intersect;
      const { type, details } = object.userData;

      if (type === "NEO_BOUNDING") {
        const { name, estimated_diameter, close_approach_data, miss_distance } =
          details;

        const diameter =
          estimated_diameter.meters.estimated_diameter_max.toFixed(2);
        const relativeSpeed = Number(
          close_approach_data[0].relative_velocity.kilometers_per_hour
        ).toFixed(2);
        const closestApproach = close_approach_data[0].close_approach_date_full;
        const distanceFromEarth = Number(
          close_approach_data[0].miss_distance.kilometers
        ).toFixed(2);

        alert(
          `Name: ${name}\nDiameter: ${diameter} meters\nRelative Speed: ${relativeSpeed} km/h\nClosest Approach: ${closestApproach}\nDistance from Earth: ${distanceFromEarth} km`
        );
        break;
      }
    }
  }
  return (
    <div ref={containerRef} style={{ width: "100%", height: "500px" }}></div>
  );
};

export default NEOVisualizer;
