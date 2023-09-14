import React, { useRef, useEffect } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TextureLoader } from "three";
import * as THREE from "three";

const NEOVisualizer = ({ neoData }: { neoData: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    let hoveredNeo: THREE.Mesh | null = null;

    function onMouseClick(event: MouseEvent) {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;

      const mouse = {
        x: (clientX / innerWidth) * 2 - 1,
        y: -(clientY / innerHeight) * 2 + 1,
      };

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);

      const intersects = raycaster.intersectObjects(scene.children);

      if (intersects.length > 0) {
        const { object } = intersects[0];
        const { type, details } = object.userData;

        if (type === "NEO_BOUNDING") {
          const {
            name,
            estimated_diameter,
            close_approach_data,
            miss_distance,
          } = details;

          const diameter =
            estimated_diameter.meters.estimated_diameter_max.toFixed(2);
          const relativeSpeed = Number(
            close_approach_data[0].relative_velocity.kilometers_per_hour
          ).toFixed(2);
          const closestApproach =
            close_approach_data[0].close_approach_date_full;
          const distanceFromEarth = Number(
            close_approach_data[0].miss_distance.kilometers
          ).toFixed(2);

          alert(
            `Name: ${name}\nDiameter: ${diameter} meters\nRelative Speed: ${relativeSpeed} km/h\nClosest Approach: ${closestApproach}\nDistance from Earth: ${distanceFromEarth} km`
          );
        }
      }
    }

    window.addEventListener("click", onMouseClick, false);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current?.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);

    const textureLoader = new TextureLoader();
    textureLoader.load("/earth_texture.jpg", (texture) => {
      const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
      const earthMaterial = new THREE.MeshBasicMaterial({ map: texture });
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);
    });

    const neosForDate = neoData.near_earth_objects["2023-09-01"];
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
      scene.add(neoSphere);

      const boundingSphereSize = scaleDiameter * 10;
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
      scene.add(boundingSphere);
    });

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      const intersects = raycaster.intersectObjects(scene.children);

      if (intersects.length > 0) {
        const firstIntersection = intersects[0];
        const object = firstIntersection.object;

        if (object.userData.type === "NEO_BOUNDING") {
          if (hoveredNeo) {
            const hoveredNeoMaterial =
              hoveredNeo.material as THREE.MeshBasicMaterial;
            hoveredNeoMaterial.color.set(hoveredNeo.userData.originalColor);
          }

          hoveredNeo = object.userData.associatedNeo;

          if (hoveredNeo) {
            const hoveredNeoMaterial =
              hoveredNeo.material as THREE.MeshBasicMaterial;
            hoveredNeo.userData.originalColor =
              hoveredNeoMaterial.color.getHex();
            hoveredNeoMaterial.color.set(0xffff00);
          }
        }
      } else if (hoveredNeo) {
        const hoveredNeoMaterial =
          hoveredNeo.material as THREE.MeshBasicMaterial;
        hoveredNeoMaterial.color.set(hoveredNeo.userData.originalColor);
        hoveredNeo = null;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("click", onMouseClick);
    };
  }, [neoData]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "500px" }}></div>
  );
};

export default NEOVisualizer;
