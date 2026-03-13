import { basic as a } from "@/source/basic";
const o = { jaf_grass: { sex: "none", hp: 3, maxHp: 3, skills: ["jaf_vitality", "jaf_pyrophobia"], vegetation: !0 } };
for (const e in o) ((o[e].group = "jaf_dream"), (o[e].img = `${a.extensionDirectoryPath}/assets/image/character/${e}.jpg`));
export default o;
