// The building itself: every clay box (floors, shadow gaps, window panels, pads, kerb) is one instanced
// mesh, roofs another, ghost floors and hatched over-limit parts one each. A whole model is 4 draw calls.
import Instances, { unitRoof } from './Instances.jsx';

export default function Model({ engine, materials }) {
  return (
    <>
      <Instances engine={engine} kind="box" material={materials.clay} tones={materials.tones} capacity={9000} castShadow />
      <Instances engine={engine} kind="roof" geometry={unitRoof} material={materials.clay} tones={materials.tones} capacity={4000} castShadow />
      <Instances engine={engine} kind="hatch" material={materials.hatch} capacity={96} castShadow />
      <Instances engine={engine} kind="ghost" material={materials.ghost} capacity={40} receiveShadow={false} renderOrder={1} />
    </>
  );
}
