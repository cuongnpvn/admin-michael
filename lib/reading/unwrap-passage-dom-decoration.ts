/** Unwrap a decorated wrapper (mark/span) back into its parent, safe during React unmount. */
export function unwrapPassageDomDecoration(element: Element): void {
	const parent = element.parentNode;
	if (!parent || !parent.contains(element)) {
		return;
	}

	try {
		while (element.firstChild) {
			parent.insertBefore(element.firstChild, element);
		}
		if (element.parentNode === parent) {
			parent.removeChild(element);
		}
		parent.normalize();
	} catch {
		// Node may already be detached when React tears down the passage subtree.
	}
}
