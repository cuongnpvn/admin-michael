"use client";

import {
	useEffect,
	useRef,
	useState,
	type ChangeEvent,
	type CompositionEvent,
	type FormEvent,
	type KeyboardEvent,
} from "react";

const IME_SETTLE_MS = 200;

export function useTutorComposer() {
	const [message, setMessage] = useState("");
	const [inputKey, setInputKey] = useState(0);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const composingRef = useRef(false);
	const ignoreChangeRef = useRef(false);
	const resetTimerRef = useRef(0);

	useEffect(() => {
		return () => window.clearTimeout(resetTimerRef.current);
	}, []);

	function resetNode() {
		const node = inputRef.current;
		if (node) node.value = "";
		setMessage("");
	}

	function clearComposer() {
		ignoreChangeRef.current = true;
		composingRef.current = false;
		inputRef.current?.blur();
		resetNode();
		setInputKey((key) => key + 1);
		window.clearTimeout(resetTimerRef.current);
		resetTimerRef.current = window.setTimeout(() => {
			resetNode();
			ignoreChangeRef.current = false;
			inputRef.current?.focus();
		}, IME_SETTLE_MS);
	}

	function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
		if (ignoreChangeRef.current) {
			event.target.value = "";
			return;
		}
		setMessage(event.target.value);
	}

	function handleBeforeInput(event: FormEvent<HTMLTextAreaElement>) {
		if (!ignoreChangeRef.current) return;
		event.preventDefault();
	}

	function handleInput(event: FormEvent<HTMLTextAreaElement>) {
		if (!ignoreChangeRef.current) return;
		event.currentTarget.value = "";
		setInputKey((key) => key + 1);
	}

	function handleCompositionStart() {
		if (ignoreChangeRef.current) return;
		composingRef.current = true;
	}

	function handleCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>) {
		composingRef.current = false;
		if (ignoreChangeRef.current) {
			event.currentTarget.value = "";
			setInputKey((key) => key + 1);
			return;
		}
		setMessage(event.currentTarget.value);
	}

	function handleKeyDown(
		event: KeyboardEvent<HTMLTextAreaElement>,
		submit: (text: string) => void,
	) {
		if (
			ignoreChangeRef.current ||
			composingRef.current ||
			event.nativeEvent.isComposing ||
			event.keyCode === 229
		) {
			return;
		}
		if (event.key !== "Enter" || event.shiftKey) return;
		event.preventDefault();
		event.stopPropagation();
		submit(message);
	}

	return {
		message,
		inputKey,
		inputRef,
		clearComposer,
		composerProps: {
			value: message,
			onChange: handleChange,
			onBeforeInput: handleBeforeInput,
			onInput: handleInput,
			onCompositionStart: handleCompositionStart,
			onCompositionEnd: handleCompositionEnd,
		},
		onComposerKeyDown: handleKeyDown,
	};
}
