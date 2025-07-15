export const createRandomDocId = () => {
	return Math.random().toString(36).substring(2, 10);
};
