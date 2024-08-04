function createAudioBufferFromWAV(wavArrayBuffer, audioContext) {
  const wavData = new DataView(wavArrayBuffer);
  const numChannels = wavData.getUint16(22, true);
  const sampleRate = wavData.getUint32(24, true);
  const bitsPerSample = wavData.getUint16(34, true);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;

  // Locate the 'data' chunk
  let offset = 12;
  while (true) {
    const chunkId = wavData.getUint32(offset, false);
    const chunkSize = wavData.getUint32(offset + 4, true);
    if (chunkId === 0x64617461) {
      // "data" chunk
      break;
    }
    offset += 8 + chunkSize;
  }
  const dataSize = wavData.getUint32(offset + 4, true);
  offset += 8;

  const pcmData = new Float32Array(dataSize / (bitsPerSample / 8));

  for (let i = 0; i < pcmData.length; i++) {
    if (bitsPerSample === 16) {
      pcmData[i] = wavData.getInt16(offset, true) / 0x8000;
    } else if (bitsPerSample === 32) {
      pcmData[i] = wavData.getInt32(offset, true) / 0x80000000;
    }
    offset += bitsPerSample / 8;
  }

  const audioBuffer = audioContext.createBuffer(
    numChannels,
    pcmData.length / numChannels,
    sampleRate
  );
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = pcmData[i * numChannels + channel];
    }
  }

  return audioBuffer;
}

let context = null;

export async function decodeMP3(mp3Data, context) {
  const ffmpeg = window.yinsudaClient.ffmpeg;
  await ffmpeg.writeFile("input1.mp3", mp3Data),
    console.time("exec"),
    await ffmpeg.exec(["-i", "input1.mp3", "output.wav"]),
    console.timeEnd("exec");
  const rawBytes = await ffmpeg.readFile("output.wav");
  //   saveByteArrayToFile(rawBytes,"test111.wav","audio/mpeg");

  const audioBuffer = await createAudioBufferFromWAV(rawBytes.buffer, context);

  console.log("AudioBuffer:", audioBuffer);
  return audioBuffer
}

function saveByteArrayToFile(
  byteArray,
  fileName,
  mimeType = "application/octet-stream"
) {
  // 创建一个 Blob 对象
  const blob = new Blob([byteArray], { type: mimeType });

  // 创建一个 URL 对象
  const url = URL.createObjectURL(blob);

  // 创建一个隐藏的 <a> 元素
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;

  // 将 <a> 元素添加到文档中
  document.body.appendChild(a);

  // 触发点击事件以启动下载
  a.click();

  // 移除 <a> 元素
  document.body.removeChild(a);

  // 释放 URL 对象
  URL.revokeObjectURL(url);
}
