import { basic } from "@/source/basic";

/** @type { importCharacterConfig['character'] } */
const characters = {
	jaf_youth: {
		sex: "male",
		hp: 4,
		maxHp: 4,
		skills: ["jaf_realMe"],
	},
	jaf_grass: {
		sex: "none",
		hp: 3,
		maxHp: 3,
		skills: ["jaf_vitality", "jaf_pyrophobia"],
		vegetation: true,
	},
	jaf_smallFish: {
		sex: "none",
		hp: 2,
		maxHp: 2,
		skills: ["jaf_slippery"],
	},
	jaf_scarecrow: {
		sex: "none",
		hp: 2,
		maxHp: 2,
		skills: ["jaf_tricky"],
	},
	jaf_dragonfly: {
		sex: "none",
		hp: 2,
		maxHp: 2,
		skills: ["jaf_fly"],
	},
};
for (const name in characters) {
	characters[name].group = "jaf_dream";
	characters[name].img = `${basic.extensionDirectoryPath}/assets/image/character/${name}.jpg`;
}

export default characters;
