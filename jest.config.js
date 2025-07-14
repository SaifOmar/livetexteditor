import {createDefaultPreset} from "ts-jest";

/** @type {import('jest').Config} */
export default {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	extensionsToTreatAsEsm: [".ts"],
	transform: {
		...createDefaultPreset({useESM: true}).transform,
	},
	globals: {
		"ts-jest": {
			useESM: true,
		},
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1", // removes ".js" extension mapping bug in ESM
	},
};

