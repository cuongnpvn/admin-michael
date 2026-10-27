function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

/** 16-bit PCM WAV. Channels are equal-length Float32 samples in -1..1. */
export function encodeWavPcm(
  channels: Float32Array[],
  sampleRate: number,
): ArrayBuffer {
  const channelCount = channels.length;
  const sampleCount = channels[0]?.length ?? 0;
  const blockAlign = channelCount * 2;
  const dataSize = sampleCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const raw = channels[channel]?.[sample] ?? 0;
      const clamped = Math.max(-1, Math.min(1, raw));
      view.setInt16(
        offset,
        clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return buffer;
}

async function renderToFormat(
  buffer: AudioBuffer,
  sampleRate: number,
  channelCount: number,
): Promise<AudioBuffer> {
  const length = Math.max(1, Math.ceil(buffer.duration * sampleRate));
  const offline = new OfflineAudioContext(channelCount, length, sampleRate);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0);
  return offline.startRendering();
}

function joinBuffers(buffers: AudioBuffer[]): AudioBuffer {
  const channelCount = buffers[0]?.numberOfChannels ?? 1;
  const sampleRate = buffers[0]?.sampleRate ?? 44100;
  const length = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const output = new AudioBuffer({
    length: Math.max(length, 1),
    numberOfChannels: channelCount,
    sampleRate,
  });

  let offset = 0;
  for (const buffer of buffers) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sourceChannel = Math.min(channel, buffer.numberOfChannels - 1);
      output.getChannelData(channel).set(buffer.getChannelData(sourceChannel), offset);
    }
    offset += buffer.length;
  }

  return output;
}

/** Decode clips in order and return one WAV file. A single clip is returned unchanged. */
export async function concatAudioFiles(files: File[]): Promise<File> {
  if (files.length <= 1) {
    const only = files[0];
    if (!only) throw new Error("Chọn ít nhất một file audio.");
    return only;
  }

  const context = new AudioContext();
  try {
    const decoded = await Promise.all(
      files.map(async (file) =>
        context.decodeAudioData(await file.arrayBuffer()),
      ),
    );
    const sampleRate = decoded[0]?.sampleRate ?? 44100;
    const channelCount = Math.max(
      1,
      ...decoded.map((buffer) => buffer.numberOfChannels),
    );
    const rendered = await Promise.all(
      decoded.map((buffer) =>
        renderToFormat(buffer, sampleRate, channelCount),
      ),
    );
    const joined = joinBuffers(rendered);
    const channels = Array.from({ length: joined.numberOfChannels }, (_, index) =>
      joined.getChannelData(index),
    );
    const wav = encodeWavPcm(channels, joined.sampleRate);
    return new File([wav], "combined.wav", { type: "audio/wav" });
  } finally {
    await context.close();
  }
}
