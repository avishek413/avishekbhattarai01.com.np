import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Center, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

const NAV = [
  { letter: "A", title: "About", kicker: "01 / ABOUT", body: "I’m Avishek — a curious creator building useful digital experiences at the intersection of design, code, visuals and technology." },
  { letter: "V", title: "Video / Visuals", kicker: "02 / VISUALS", body: "A space for cinematic experiments, motion pieces, edits, reels and visual storytelling. Replace these cards with your latest work." },
  { letter: "I", title: "Interactive / Innovations", kicker: "03 / INNOVATIONS", body: "Creative coding, interactive experiments and ambitious product ideas live here. This portfolio itself is one of the experiments." },
  { letter: "S", title: "Skills", kicker: "04 / SKILLS", body: "React • JavaScript • HTML • CSS • Three.js • UI/UX • Creative Coding • Video Editing • Problem Solving." },
  { letter: "H", title: "Highlights / Honors", kicker: "05 / HIGHLIGHTS", body: "Show your strongest achievements, milestones, client work, certificates, audience metrics and projects you are proud of." },
  { letter: "E", title: "Experience / Education", kicker: "06 / EXPERIENCE", body: "Build a visual timeline of education, work, internships, freelance projects and the moments that shaped your direction." },
  { letter: "K", title: "Knock / Kontak", kicker: "07 / CONTACT", body: "Have an idea, collaboration or opportunity? Send a message and let’s build something memorable." }
];
const WIRE_HEIGHT = 3.5;
const MOBILE_LETTER_GAP = 3;
const MOBILE_FIRST_LETTER_Y = 0;
const MOBILE_CAMERA_START_INSET = 4;
const MOBILE_CAMERA_END_INSET = 3.5;

function CameraRig({ target, onArrive }) {
  const { camera, size } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 14));
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));
  const done = useRef(false);

  useFrame((state, delta) => {
    const mx = state.pointer.x * 0.55;
    const my = state.pointer.y * 0.35;

    if (!target) {
      const isMobile = size.width <= 760;
      const scrollRange = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const scrollProgress = isMobile
        ? THREE.MathUtils.clamp(window.scrollY / scrollRange, 0, 1)
        : 0;
      const mobileChainLength = MOBILE_LETTER_GAP * (NAV.length - 1);
      const mobileCameraStartY = MOBILE_FIRST_LETTER_Y - MOBILE_CAMERA_START_INSET;
      const mobileCameraEndY = MOBILE_FIRST_LETTER_Y
        - mobileChainLength
        + MOBILE_CAMERA_END_INSET;
      const mobileCameraY = THREE.MathUtils.lerp(
        mobileCameraStartY,
        mobileCameraEndY,
        scrollProgress
      );
      const desired = new THREE.Vector3(
        mx,
        isMobile ? mobileCameraY + my : my,
        14
      );
      camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
      camera.lookAt(0, isMobile ? mobileCameraY : 0, 0);
      return;
    }

    targetPos.current.set(target[0], target[1], target[2] + 4.5);
    lookAt.current.set(target[0], target[1], target[2]);

    camera.position.lerp(targetPos.current, 1 - Math.pow(0.0008, delta));
    camera.lookAt(lookAt.current);

    if (!done.current && camera.position.distanceTo(targetPos.current) < 0.12) {
      done.current = true;
      onArrive?.();
    }
  });

  return null;
}

function Particles() {
  return (
    <Sparkles
      count={280}
      scale={[18, 11, 12]}
      size={1.15}
      speed={0.18}
      opacity={0.48}
    />
  );
}

function Letter({ item, index, position, active, onHover, onClick, fontSize }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(t * 0.75 + index * 0.9) * 0.28;
    ref.current.rotation.y = Math.sin(t * 0.35 + index) * 0.08;
    ref.current.rotation.x = Math.cos(t * 0.3 + index) * 0.035;
    const s = hovered ? 1.12 : active ? 1.05 : 1;
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 0.14);
  });

  return (
    <group
      ref={ref}
      position={position}
      onPointerEnter={() => { setHovered(true); onHover(item.title); }}
      onPointerLeave={() => { setHovered(false); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onClick(item, position); }}
    >
      <Center>
        <Text
          fontSize={fontSize}
          maxWidth={2}
          anchorX="center"
          anchorY="middle"
          outlineWidth={hovered ? 0.035 : 0.02}
          outlineColor={hovered ? "#a994ff" : "#4b4b78"}
          color={hovered ? "#ffffff" : "#c2c7ff"}
          material-toneMapped={false}
        >
          {item.letter}
          <meshStandardMaterial
            color={hovered ? "#ffffff" : "#b8c0ff"}
            emissive={hovered ? "#7d5cff" : "#161b38"}
            emissiveIntensity={hovered ? 2.5 : 0.75}
            metalness={0.7}
            roughness={0.2}
          />
        </Text>
      </Center>
      {hovered && (
        <group position={[0, 1.65, 0]}>
          <Text fontSize={0.19} color="#ffffff" anchorX="center" anchorY="middle">
            {item.title.toUpperCase()}
          </Text>
        </group>
      )}
    </group>
  );
}

function WireField({ positions, isMobile }) {
  const springs = useRef([]);
  const springGeometry = useMemo(() => {
    const points = Array.from({ length: 49 }, (_, index) => {
      const t = index / 48;
      const angle = t * Math.PI * (isMobile ? 6 : 12);
      const radius = (isMobile ? 0.075 : 0.045) * Math.sin(Math.PI * t);
      return new THREE.Vector3(Math.cos(angle) * radius, -t, Math.sin(angle) * radius);
    });
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      96,
      isMobile ? 0.02 : 0.012,
      5,
      false
    );
  }, [isMobile]);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: isMobile ? "#d9dcff" : "#9ba2bd",
      metalness: 0.82,
      roughness: 0.3,
      emissive: isMobile ? "#555b82" : "#181b2b",
      emissiveIntensity: isMobile ? 0.8 : 0.35
    }),
    [isMobile]
  );
  const wireGeometry = useMemo(() => new THREE.CylinderGeometry(0.018, 0.018, 1, 8), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    positions.forEach((position, index) => {
      const spring = springs.current[index];
      if (!spring) return;
      const bob = Math.sin(time * 0.75 + index * 0.9) * 0.28;
      if (isMobile) {
        const previousBob = index === 0
          ? 0
          : Math.sin(time * 0.75 + (index - 1) * 0.9) * 0.28;
        const top = index === 0
          ? MOBILE_FIRST_LETTER_Y + 1.25
          : positions[index - 1][1] + previousBob - 0.48;
        const bottom = position[1] + bob + 0.48;
        spring.position.set(position[0], top, position[2] - 0.4);
        spring.scale.y = Math.max(0.05, top - bottom);
      } else {
        spring.scale.y = WIRE_HEIGHT - position[1] - bob - 1.25;
      }
    });
  });

  return (
    <group>
      {!isMobile && (
        <mesh
          position={[0, WIRE_HEIGHT, -0.4]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[1, 14, 1]}
          geometry={wireGeometry}
          material={material}
        />
      )}
      {positions.map((position, index) => (
        <mesh
          key={index}
          ref={(mesh) => { springs.current[index] = mesh; }}
          position={[
            position[0],
            isMobile ? MOBILE_FIRST_LETTER_Y + 1.25 : WIRE_HEIGHT,
            position[2] - 0.4
          ]}
          geometry={springGeometry}
          material={material}
        />
      ))}
    </group>
  );
}

function LetterField({ active, onHover, onSelect }) {
  const { size } = useThree();
  const isMobile = size.width <= 760;
  const positions = useMemo(() => isMobile
    ? NAV.map((_, index) => [
      1.35,
      MOBILE_FIRST_LETTER_Y - index * MOBILE_LETTER_GAP,
      0
    ])
    : [
      [-6.0,  1.7,  0.0],
      [-3.9, -1.5,  0.4],
      [-1.8,  1.8, -0.2],
      [ 0.2, -1.4,  0.0],
      [ 2.2,  1.7,  0.3],
      [ 4.2, -1.3, -0.1],
      [ 6.2,  1.4,  0.2]
    ], [isMobile]);

  return (
    <>
      <WireField positions={positions} isMobile={isMobile} />
      {NAV.map((item, i) => (
        <Letter
          key={item.letter}
          item={item}
          index={i}
          position={positions[i]}
          active={active?.letter === item.letter}
          fontSize={isMobile ? 1.65 : 2.65}
          onHover={onHover}
          onClick={onSelect}
        />
      ))}
    </>
  );
}

function Scene({ active, onHover, onSelect, cameraTarget, onArrive }) {
  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 6, 5]} intensity={2.2} castShadow />
      <pointLight position={[-5, 1, 3]} intensity={28} distance={14} color="#625cff" />
      <pointLight position={[5, -2, 2]} intensity={22} distance={12} color="#00d9ff" />
      <Particles />
      <LetterField active={active} onHover={onHover} onSelect={onSelect} />
      <CameraRig target={cameraTarget} onArrive={onArrive} />
      <EffectComposer multisampling={4}>
        <Bloom luminanceThreshold={0.45} mipmapBlur intensity={1.2} />
        <Noise opacity={0.065} />
        <Vignette eskil={false} offset={0.12} darkness={0.72} />
      </EffectComposer>
    </>
  );
}

function Modal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <div className="drawer-index">{item.kicker}</div>
        <div className="drawer-letter">{item.letter}</div>
        <h2>{item.title}</h2>
        <p>{item.body}</p>

        {item.letter === "S" && (
          <div className="skill-grid">
            {["React", "JavaScript", "Three.js", "HTML/CSS", "Creative UI", "Video", "Git", "Problem Solving"].map(x =>
              <span key={x}>{x}</span>
            )}
          </div>
        )}

        {item.letter === "E" && (
          <div className="timeline">
            <div><b>NOW</b><span>Creative developer / portfolio building</span></div>
            <div><b>2025</b><span>Projects, learning and visual experiments</span></div>
            <div><b>2024</b><span>Foundations in web development</span></div>
          </div>
        )}

        {item.letter === "K" && (
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <input placeholder="Your name" />
            <input placeholder="Email" type="email" />
            <textarea placeholder="Tell me about the idea..." rows="5" />
            <span>Contact on <a href="mailto:info@khagendrabhattarai01.com.np">info@khagendrabhattarai01.com.np</a></span>
            <button type="submit">SEND MESSAGE ↗</button>
          </form>
        )}

        {!["S", "E", "K"].includes(item.letter) && (
          <div className="placeholder-card">CLASS 12 COMPUTER STUDENT <span>↗</span></div>
        )}
      </aside>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [cameraTarget, setCameraTarget] = useState(null);

  const select = (item, position) => {
    setActive(item);
    setCameraTarget(position);
  };

  const close = () => {
    setActive(null);
    setCameraTarget(null);
  };

  return (
    <main className={`app ${active ? "is-transitioning" : ""}`}>
      <header className="topbar">
        <div className="brand">AVISHEK<span>.</span></div>
        <div className="status"><i /> AVAILABLE FOR CREATIVE WORK</div>
      </header>

      <section className="hero-copy">
        <p className="eyebrow">CREATIVE DEVELOPER / VISUAL EXPLORER</p>
        <h1>INTERACT<br /><em>WITH MY NAME.</em></h1>
        <p className="hint">Hover a letter to explore · Click to enter</p>
      </section>

      {hovered && <div className="hover-label">{hovered} <span>↗</span></div>}

      <div className="canvas-wrap">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0, 14], fov: 48 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene
            active={active}
            onHover={setHovered}
            onSelect={select}
            cameraTarget={cameraTarget}
          />
        </Canvas>
      </div>

      <footer>
        <span>© 2026 AVISHEK</span>
        <span>SCROLL / MOVE TO NAVIGATE</span>
        <div className="footer-location">
          <span>NEPAL · WORLDWIDE</span>
          <a href="mailto:info@khagendrabhattarai01.com.np">info@khagendrabhattarai01.com.np</a>
        </div>
      </footer>

      <Modal item={active} onClose={close} />
    </main>
  );
}