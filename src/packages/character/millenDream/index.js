import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import characterFilters from "./characterFilter.js";
import characterTitles from "./characterTitle.js";
import dynamicTranslates from "./dynamicTranslate.js";
import characterIntros from "./intro.js";
import perfectPairs from "./perfectPair.js";
import pinyins from "./pinyin.js";
import skills from "./skill.js";
import translates from "./translate.js";
import { characterSort, characterSortTranslate } from "./sort.js";
import voices from "./voice.js";

export default {
	name: "millenDream",
	connect: true,
	character: { ...characters },
	characterSort: {
		millenDream: characterSort,
	},
	characterFilter: { ...characterFilters },
	characterTitle: { ...characterTitles },
	dynamicTranslate: { ...dynamicTranslates },
	characterIntro: { ...characterIntros },
	skill: { ...skills },
	perfectPair: { ...perfectPairs },
	translate: { ...translates, ...voices, ...characterSortTranslate },
	pinyins: { ...pinyins },
};
