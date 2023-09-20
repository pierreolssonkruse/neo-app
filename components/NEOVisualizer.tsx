import React, { useRef, useEffect, useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TextureLoader } from "three";
import * as THREE from "three";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

const NEOVisualizer = ({ neoData }: { neoData: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedNEO, setSelectedNEO] = useState<any>(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const handleOpen = (neo: any) => {
    setSelectedNEO(neo);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  useEffect(() => {
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x000000);
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

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

    rendererRef.current.domElement.addEventListener("click", onMouseClick, false);

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
      const neoDiameter = neo.estimated_diameter.meters.estimated_diameter_max / 1000;
      const scaleDiameter = Math.max((neoDiameter / EARTH_DIMETER) * NEO_SCALING_FACTOR, MIN_NEO_SIZE);
      const neoGeometry = new THREE.SphereGeometry(scaleDiameter / 2, 32, 32);
      const neoColor = neo.is_potentially_hazardous_asteroid ? 0xff0000 : 0x00ff00;
      const neoMaterial = new THREE.MeshBasicMaterial({
        map: neoTexture,
        color: neoColor,
      });
      const neoSphere = new THREE.Mesh(neoGeometry, neoMaterial);
      neoSphere.userData = {
        type: "NEO",
        details: neo,
      };

      const distanceFromEarth = neo.close_approach_data[0].miss_distance.kilometers / 1000000;
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
      rendererRef.current?.domElement.removeEventListener("click", onMouseClick);
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

    const intersects = raycaster.intersectObjects(sceneRef.current ? sceneRef.current.children : []);

    for (let intersect of intersects) {
      const { object } = intersect;
      const { type, details } = object.userData;

      if (type === "NEO_BOUNDING") {
        handleOpen(details);
        break;
      }
    }
  }

  return (
    <div>
      <div ref={containerRef} style={{ width: "100%", height: "500px" }}></div>
      <Modal open={open} onClose={handleClose} aria-labelledby="neo-details-title" aria-describedby="neo-details-description">
        <Box sx={modalStyle}>
          <Typography id="neo-details-title" variant="h6">
            {selectedNEO?.name}
          </Typography>
          <Typography id="neo-details-description">
            <div>
              <div>Diameter: {selectedNEO?.estimated_diameter.meters.estimated_diameter_max.toFixed(2)} meters</div>
              <div>Relative Speed: {Number(selectedNEO?.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(2)} km/h</div>
              <div>Closest Approach: {selectedNEO?.close_approach_data[0].close_approach_date_full}</div>
              <div>Distance from Earth: {Number(selectedNEO?.close_approach_data[0].miss_distance.kilometers).toFixed(2)} km</div>
              <Tooltip title="Absolute Magnitude represents an asteroid's brightness if it were 150 million kilometers away from Earth. A lower value means the asteroid is brighter. Only very large asteroids with values well below 10 might be visible to the naked eye when close to Earth.">
                <span>Absolute Magnitude: {selectedNEO?.absolute_magnitude_h}</span>
              </Tooltip>
            </div>
          </Typography>
        </Box>
      </Modal>
    </div>
  );
};

export default NEOVisualizer;
