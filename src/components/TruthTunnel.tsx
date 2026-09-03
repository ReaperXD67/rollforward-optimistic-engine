import { useEffect, useMemo, useRef } from 'react';
import type { Release } from '../../shared/contracts';
import { stages } from '../../shared/stages';
import type { MutationRecord } from '../domain/engine';

interface TunnelData {
  confirmed: Release[];
  projected: Release[];
  mutations: MutationRecord[];
  online: boolean;
}

interface TruthTunnelProps extends TunnelData {
  className?: string;
}

const activeStatuses = new Set<MutationRecord['status']>(['queued', 'in_flight', 'retry_wait']);

function differs(confirmed: Release | undefined, projected: Release): boolean {
  return !confirmed || confirmed.stage !== projected.stage || confirmed.progress !== projected.progress;
}

export function TruthTunnel({
  confirmed,
  projected,
  mutations,
  online,
  className = '',
}: TruthTunnelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLElement>(null);
  const dataRef = useRef<TunnelData>({ confirmed, projected, mutations, online });

  useEffect(() => {
    dataRef.current = { confirmed, projected, mutations, online };
  }, [confirmed, projected, mutations, online]);

  const activeCount = mutations.filter((mutation) => activeStatuses.has(mutation.status)).length;
  const divergenceCount = projected.filter((release) =>
    differs(confirmed.find((item) => item.id === release.id), release),
  ).length;
  const highestVersion = Math.max(0, ...confirmed.map((release) => release.version));
  const latestMutation = mutations.find((mutation) => activeStatuses.has(mutation.status));
  const liveState = !online
    ? 'outbox holding intent'
    : divergenceCount
      ? 'truths diverged'
      : 'canonical lock';

  const releaseReadout = useMemo(
    () => projected.slice(0, 3).map((release) => ({
      id: release.id,
      service: release.service,
      stage: release.stage,
      pending: differs(confirmed.find((item) => item.id === release.id), release),
    })),
    [confirmed, projected],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    let cancelled = false;
    let animationFrame = 0;
    let dispose = () => undefined;

    void import('three').then((THREE) => {
      if (cancelled) return;

      try {
        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
        renderer.setClearColor(0x050607, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050607, 0.055);
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
        camera.position.set(0, 1.35, 10.5);
        camera.lookAt(0, 0, -4.8);

        const world = new THREE.Group();
        world.rotation.x = -0.11;
        scene.add(world);

        scene.add(new THREE.AmbientLight(0x9db8ff, 0.85));
        const keyLight = new THREE.PointLight(0xffffff, 35, 24);
        keyLight.position.set(-2.5, 4, 5);
        scene.add(keyLight);
        const cobaltLight = new THREE.PointLight(0x3f66ff, 48, 20);
        cobaltLight.position.set(3.4, -0.5, -3);
        scene.add(cobaltLight);

        const gateMaterial = new THREE.MeshBasicMaterial({
          color: 0x76819a,
          transparent: true,
          opacity: 0.17,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        stages.forEach((_stage, index) => {
          const gate = new THREE.Mesh(
            new THREE.TorusGeometry(3.25 - index * 0.055, 0.012, 4, 96),
            gateMaterial,
          );
          gate.position.z = 2.3 - index * 2.8;
          gate.scale.y = 0.54;
          world.add(gate);
        });

        const makeRail = (x: number, color: number) => {
          const points = [new THREE.Vector3(x, 0, 3), new THREE.Vector3(x, 0, -15)];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
          });
          const rail = new THREE.Line(geometry, material);
          world.add(rail);
          return { geometry, material };
        };

        const rails = [makeRail(-0.92, 0xaab1c0), makeRail(0.92, 0x4169ff)];
        const nodeGeometry = new THREE.IcosahedronGeometry(0.16, 2);
        const haloGeometry = new THREE.TorusGeometry(0.27, 0.016, 6, 48);
        const nodeColors = [0xeef2ff, 0x7f93ff, 0xffae67];

        const slots = [0, 1, 2].map((slot) => {
          const y = (slot - 1) * 0.42;
          const confirmedMaterial = new THREE.MeshStandardMaterial({
            color: 0xd5d9e2,
            emissive: 0x20242c,
            roughness: 0.32,
            metalness: 0.72,
          });
          const projectedMaterial = new THREE.MeshStandardMaterial({
            color: nodeColors[slot],
            emissive: 0x274fff,
            emissiveIntensity: 1.2,
            roughness: 0.22,
            metalness: 0.48,
          });
          const confirmedNode = new THREE.Mesh(nodeGeometry, confirmedMaterial);
          const projectedNode = new THREE.Mesh(nodeGeometry, projectedMaterial);
          confirmedNode.position.set(-0.92, y, 2.3);
          projectedNode.position.set(0.92, y, 2.3);

          const haloMaterial = new THREE.MeshBasicMaterial({
            color: nodeColors[slot],
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const halo = new THREE.Mesh(haloGeometry, haloMaterial);
          halo.position.copy(projectedNode.position);

          const linkGeometry = new THREE.BufferGeometry().setFromPoints([
            confirmedNode.position,
            projectedNode.position,
          ]);
          const linkMaterial = new THREE.LineBasicMaterial({
            color: nodeColors[slot],
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
          });
          const link = new THREE.Line(linkGeometry, linkMaterial);

          world.add(confirmedNode, projectedNode, halo, link);
          return {
            y,
            confirmedNode,
            projectedNode,
            projectedMaterial,
            halo,
            haloMaterial,
            linkGeometry,
            linkMaterial,
          };
        });

        const particleCount = 240;
        const particlePositions = new Float32Array(particleCount * 3);
        for (let index = 0; index < particleCount; index += 1) {
          const seed = (index * 9301 + 49297) % 233280;
          particlePositions[index * 3] = ((seed / 233280) - 0.5) * 7;
          particlePositions[index * 3 + 1] = ((((seed * 17) % 233280) / 233280) - 0.5) * 4;
          particlePositions[index * 3 + 2] = 3 - (((seed * 29) % 233280) / 233280) * 20;
        }
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        const particleMaterial = new THREE.PointsMaterial({
          color: 0xbcc7e9,
          size: 0.025,
          transparent: true,
          opacity: 0.44,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        world.add(particles);

        const pointer = { x: 0, y: 0 };
        const onPointerMove = (event: PointerEvent) => {
          const bounds = frame.getBoundingClientRect();
          pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
          pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
        };
        const onPointerLeave = () => {
          pointer.x = 0;
          pointer.y = 0;
        };
        frame.addEventListener('pointermove', onPointerMove);
        frame.addEventListener('pointerleave', onPointerLeave);

        const resize = () => {
          const { width, height } = frame.getBoundingClientRect();
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
          renderer.setSize(Math.max(1, width), Math.max(1, height), false);
          camera.aspect = Math.max(1, width) / Math.max(1, height);
          camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(frame);
        resize();

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const startedAt = performance.now();

        const render = () => {
          const elapsed = (performance.now() - startedAt) / 1000;
          const current = dataRef.current;
          const activeIds = new Set(
            current.mutations
              .filter((mutation) => activeStatuses.has(mutation.status))
              .map((mutation) => mutation.command.releaseId),
          );

          slots.forEach((slot, index) => {
            const projectedRelease = current.projected[index];
            const confirmedRelease = projectedRelease
              ? current.confirmed.find((release) => release.id === projectedRelease.id)
              : undefined;
            const visible = Boolean(projectedRelease && confirmedRelease);
            slot.confirmedNode.visible = visible;
            slot.projectedNode.visible = visible;
            slot.halo.visible = visible;
            slot.linkGeometry.setDrawRange(0, visible ? 2 : 0);
            if (!projectedRelease || !confirmedRelease) return;

            const confirmedStage = stages.indexOf(confirmedRelease.stage);
            const projectedStage = stages.indexOf(projectedRelease.stage);
            const confirmedZ = 2.3 - confirmedStage * 2.8 - confirmedRelease.progress * 0.003;
            const projectedZ = 2.3 - projectedStage * 2.8 - projectedRelease.progress * 0.003;
            const lerp = reducedMotion ? 1 : 0.075;
            slot.confirmedNode.position.lerp(new THREE.Vector3(-0.92, slot.y, confirmedZ), lerp);
            slot.projectedNode.position.lerp(new THREE.Vector3(0.92, slot.y, projectedZ), lerp);
            slot.halo.position.copy(slot.projectedNode.position);

            const isActive = activeIds.has(projectedRelease.id);
            const diverged = differs(confirmedRelease, projectedRelease);
            slot.projectedMaterial.emissiveIntensity = isActive ? 2.5 : diverged ? 1.75 : 0.72;
            slot.haloMaterial.opacity = isActive ? 0.95 : diverged ? 0.58 : 0.18;
            slot.halo.scale.setScalar(reducedMotion ? 1 : 1 + Math.sin(elapsed * 4 + index) * (isActive ? 0.2 : 0.06));
            slot.linkMaterial.opacity = diverged ? 0.82 : 0.1;

            const position = slot.linkGeometry.getAttribute('position');
            position.setXYZ(0, slot.confirmedNode.position.x, slot.confirmedNode.position.y, slot.confirmedNode.position.z);
            position.setXYZ(1, slot.projectedNode.position.x, slot.projectedNode.position.y, slot.projectedNode.position.z);
            position.needsUpdate = true;
          });

          if (!reducedMotion) {
            const positions = particleGeometry.getAttribute('position');
            const speed = current.mutations.some((mutation) => activeStatuses.has(mutation.status)) ? 0.075 : 0.026;
            for (let index = 0; index < particleCount; index += 1) {
              const z = positions.getZ(index) + speed;
              positions.setZ(index, z > 4 ? -17 : z);
            }
            positions.needsUpdate = true;
            camera.position.x += (pointer.x * 0.3 - camera.position.x) * 0.025;
            camera.position.y += (1.35 - pointer.y * 0.18 - camera.position.y) * 0.025;
            world.rotation.z = Math.sin(elapsed * 0.15) * 0.008;
          }

          renderer.render(scene, camera);
          animationFrame = window.requestAnimationFrame(render);
        };
        render();

        dispose = () => {
          window.cancelAnimationFrame(animationFrame);
          observer.disconnect();
          frame.removeEventListener('pointermove', onPointerMove);
          frame.removeEventListener('pointerleave', onPointerLeave);
          slots.forEach((slot) => {
            slot.confirmedNode.material.dispose();
            slot.projectedNode.material.dispose();
            slot.haloMaterial.dispose();
            slot.linkGeometry.dispose();
            slot.linkMaterial.dispose();
          });
          rails.forEach((rail) => {
            rail.geometry.dispose();
            rail.material.dispose();
          });
          nodeGeometry.dispose();
          haloGeometry.dispose();
          gateMaterial.dispose();
          particleGeometry.dispose();
          particleMaterial.dispose();
          renderer.dispose();
        };
      } catch {
        canvas.dataset.unavailable = 'true';
      }
    });

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return (
    <figure className={`truth-tunnel-shell ${className}`} ref={frameRef}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="tunnel-vignette" aria-hidden="true" />
      <figcaption className="sr-only">
        Live three-dimensional comparison of projected release state and confirmed server state.
      </figcaption>

      <div className="tunnel-header">
        <span>Dual-reality engine</span>
        <span className="live-lock"><i /> {liveState}</span>
      </div>

      <div className="lane-label lane-label-canonical">
        <span>Canonical</span>
        <strong>v{highestVersion || '—'}</strong>
      </div>
      <div className="lane-label lane-label-projected">
        <span>Projected</span>
        <strong>{divergenceCount ? `+${divergenceCount}` : 'locked'}</strong>
      </div>

      <div className="tunnel-readout" aria-live="polite">
        <div>
          <span>transport</span>
          <strong>{online ? 'attached' : 'offline'}</strong>
        </div>
        <div>
          <span>active intent</span>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <span>precondition</span>
          <strong>{latestMutation ? `v${latestMutation.expectedVersion}` : 'armed'}</strong>
        </div>
      </div>

      <ol className="tunnel-release-list" aria-label="Live projected release state">
        {releaseReadout.map((release) => (
          <li key={release.id} className={release.pending ? 'is-diverged' : ''}>
            <span>{release.service}</span>
            <strong>{release.stage}</strong>
          </li>
        ))}
      </ol>
    </figure>
  );
}
