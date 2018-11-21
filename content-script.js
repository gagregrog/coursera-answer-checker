const state = {
	regex: null,
	textPair: [],
};

const prom = (fn) => (...args) => new Promise((resolve) => {
	fn(...args, (data) => resolve(data));
});

const setPattern = ({ pattern }) => {
	try {
		const regex = new RegExp(pattern, 'g');
		state.regex = regex;
		console.log('SETTING REGEX', pattern);
	} catch (e) {
		console.error('Pattern set failed', e.message, pattern);
	}
};

const updatePattern = () =>
	prom(chrome.storage.sync.get)('pattern')
		.then(setPattern);

const getSelectedText = () => {
	if (window.getSelection) {
		return window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
		return document.selection.createRange().text;
		}
};

const stripText = text =>  text.replace(state.regex, '');

const findDifferenceIndex = (shorter, longer) => {
	let idx = 0;

	shorter.split('').some((char, i) => {
		idx = i;

		return (char !== longer[i]);
	});

	return idx;
}

const checkTextPair = () => {
	const { textPair } = state;

	const stripped = textPair.map(stripText);

	const rawResults = {
		'First Raw': textPair[0],
		'Second Raw': textPair[1],
		'First Adjusted': stripped[0],
		'Second Adjusted': stripped[1],
	};
	console.table(rawResults);
	
	const [shorter, longer] = stripped;
	const areEqual = (shorter === longer);
	const verdictText = '%c' + (areEqual ? '' : 'Not ') + 'Equal';
	const verdictColor = 'color: ' + (areEqual ? 'green' : 'red');
	console.log('Verdict: ' + verdictText, verdictColor);

	if (!areEqual) {
		const idx = findDifferenceIndex(shorter, longer);
		console.log(`${shorter.slice(0, idx)}%c${shorter.slice(idx)}`, 'color: red');
		console.log(`${longer.slice(0, idx)}%c${longer.slice(idx)}`, 'color: red');
	}
}

const handleTextSelected = () => {
	const grabbedText = getSelectedText();

	if (grabbedText) {
		console.clear();
		const { textPair, regex } = state;

		if (textPair.length < 1) {
			textPair.push(grabbedText);
			console.log('Select another item to compare...');
		} else {
			if (textPair.length === 1) textPair.push(grabbedText);
			else state.textPair = [textPair[1], grabbedText];

			if (regex) checkTextPair();
			else console.log('Regex not ready...');
		}
  }
}

updatePattern()
	.then(() => {
		window.addEventListener('mouseup', handleTextSelected);
	});