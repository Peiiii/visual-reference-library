// Motion Prompt marks the shared source and each individual entry in its pack files.
export function selectMotionSource(source, number) {
  const markers = [...source.matchAll(/^ {2}\/\/ @(kit|shared|end|element (\d{2}))\r?$/gm)];
  const selected = markers.filter(marker => marker[2] === number);
  if (markers[0]?.[1] !== 'kit' || markers.at(-1)?.[1] !== 'end' || selected.length !== 1) {
    throw new Error('Motion Prompt reference blocks are missing or invalid');
  }
  const sections = markers.map((marker, index) => {
    if (marker[2] && marker[2] !== number) return '';
    return source.slice(marker.index, markers[index + 1]?.index);
  });
  return source.slice(0, markers[0].index) + sections.join('');
}
